"use server";
import { z } from "zod";
import { ActionError, actionErrorMessage } from "../_lib/action-error";
import { revalidatePath } from "next/cache";
import { db } from "../_lib/prisma";
import { requireUser, requireShopOwner, isPlatformAdmin } from "../_lib/session";
import { serializable } from "../_lib/booking-service";
import { deliverBookingEmail } from "../_lib/email";
import { displayBookingDate } from "../_lib/scheduling";
import { fromZonedTime } from "date-fns-tz";

export type ActionResult = { ok: boolean; message: string };
function field(form: FormData, key: string) { return String(form.get(key) ?? ""); }
async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try { await fn(); revalidatePath("/admin"); revalidatePath("/"); revalidatePath("/barbershops", "layout"); revalidatePath("/bookings"); return { ok: true, message: "Alterações salvas." }; }
  catch (error) { return { ok: false, message: actionErrorMessage(error, "Não foi possível salvar. Tente novamente.") }; }
}
const imageSchema = z.string().refine(s => { if(s.startsWith("/") && !s.startsWith("//")) return true; try {const u=new URL(s);return u.protocol==="https:"&&["utfs.io","images.unsplash.com"].includes(u.hostname);}catch{return false;} }, "Use uma imagem local ou HTTPS em utfs.io/images.unsplash.com.");
const text = z.string().trim().min(2, "Preencha o nome.").max(160);
export async function saveShop(form: FormData) {
  return run(async () => {
    const shopId = field(form,"shopId");
    const data = z.object({ name: text, address: z.string().trim().min(5).max(240), description: z.string().max(1000), phone: z.string().regex(/^[+\d ()-]{0,25}$/, "Telefone inválido."), imageUrl: imageSchema, openingMinute: z.coerce.number().int().min(0).max(1425), closingMinute: z.coerce.number().int().min(15).max(1440), minimumNoticeMinutes: z.coerce.number().int().min(15).max(10080), cancellationNoticeMinutes: z.coerce.number().int().min(0).max(10080), workingDays: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Selecione pelo menos um dia."), active: z.boolean() }).refine(d => d.closingMinute > d.openingMinute, "Fechamento deve ser depois da abertura.").parse({ name: field(form,"name"), address: field(form,"address"), description: field(form,"description"), phone: field(form,"phone"), imageUrl: field(form,"imageUrl"), openingMinute: field(form,"openingMinute"), closingMinute: field(form,"closingMinute"), minimumNoticeMinutes: field(form,"minimumNoticeMinutes"), cancellationNoticeMinutes: field(form,"cancellationNoticeMinutes"), workingDays: form.getAll("workingDays"), active: form.has("active") });
    if (shopId) { await requireShopOwner(shopId); await db.barbershop.update({ where: { id: shopId }, data }); }
    else {
      const user = await requireUser(); if (!isPlatformAdmin(user.email)) throw new ActionError("Apenas o administrador da plataforma pode cadastrar uma barbearia.");
      const ownerEmail = z.string().email().parse(field(form,"ownerEmail").trim().toLowerCase());
      const owner = await db.user.findFirst({ where: { email: { equals: ownerEmail, mode: "insensitive" } } });
      if (!owner) throw new ActionError("O proprietário precisa entrar uma vez com Google antes do cadastro.");
      await db.barbershop.create({ data: { ...data, ownerId: owner.id, staff: { create: { name: "Equipe principal" } } } });
    }
  });
}
export async function assignOwner(form: FormData) {
  return run(async () => {
    const user = await requireUser(); if (!isPlatformAdmin(user.email)) throw new ActionError("Acesso restrito ao administrador da plataforma.");
    const email = z.string().email().parse(field(form,"ownerEmail").trim());
    const owner = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!owner) throw new ActionError("O proprietário precisa entrar com Google primeiro.");
    await db.barbershop.update({ where: { id: field(form,"shopId") }, data: { ownerId: owner.id } });
  });
}
export async function saveService(form: FormData) {
  return run(async () => {
    const shopId = field(form,"shopId"); await requireShopOwner(shopId);
    const data = z.object({ name: text, description: z.string().trim().min(2).max(1000), price: z.coerce.number().min(0).max(100000), durationMinutes: z.coerce.number().int().min(15).max(480), imageUrl: imageSchema, active: z.boolean() }).parse({ name: field(form,"name"), description: field(form,"description"), price: field(form,"price"), durationMinutes: field(form,"durationMinutes"), imageUrl: field(form,"imageUrl"), active: form.has("active") });
    const id = field(form,"serviceId");
    if (id) { const result = await db.service.updateMany({ where: { id, barbershopId: shopId }, data }); if (!result.count) throw new ActionError("Serviço não encontrado."); }
    else await db.service.create({ data: { ...data, barbershopId: shopId } });
  });
}
export async function saveStaff(form: FormData) {
  return run(async () => {
    const shopId = field(form,"shopId"); await requireShopOwner(shopId);
    const data = { name: text.parse(field(form,"name")), active: form.has("active") }; const id = field(form,"staffId");
    if (id) { const result = await db.staff.updateMany({ where: { id, barbershopId: shopId }, data }); if (!result.count) throw new ActionError("Profissional não encontrado."); }
    else await db.staff.create({ data: { ...data, barbershopId: shopId } });
  });
}
export async function addBlock(form: FormData) {
  return run(async () => {
    const shopId = field(form,"shopId"); const { shop } = await requireShopOwner(shopId);
    const staffId = field(form,"staffId"); const start = fromZonedTime(field(form,"start"), shop.timezone), end = fromZonedTime(field(form,"end"), shop.timezone);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start || end.getTime() - start.getTime() > 366 * 86400000) throw new ActionError("Informe um período válido de até um ano.");
    const reason = z.string().trim().min(2).max(160).parse(field(form,"reason"));
    await serializable(db, async tx => {
      if (!await tx.staff.findFirst({ where: { id: staffId, barbershopId: shopId } })) throw new ActionError("Profissional não encontrado.");
      const booking = await tx.booking.findFirst({ where: { staffId, status: "CONFIRMED", date: { lt: end }, endDate: { gt: start } } });
      if (booking) throw new ActionError("Existem reservas nesse período. Resolva esses agendamentos antes de bloquear.");
      await tx.scheduleBlock.create({ data: { staffId, start, end, reason } });
    });
  });
}
export async function removeBlock(form: FormData) {
  return run(async () => { const shopId = field(form,"shopId"); await requireShopOwner(shopId); const result = await db.scheduleBlock.deleteMany({ where: { id: field(form,"blockId"), staff: { barbershopId: shopId } } }); if (!result.count) throw new ActionError("Bloqueio não encontrado."); });
}
export async function updateBookingStatus(form: FormData) {
  return run(async () => {
    const shopId = field(form,"shopId"); await requireShopOwner(shopId);
    const id = field(form,"bookingId"); const status = z.enum(["CANCELLED","COMPLETED","NO_SHOW"]).parse(field(form,"status"));
    await serializable(db, async tx => {
      const booking = await tx.booking.findFirst({ where: { id, barbershopId: shopId, status: "CONFIRMED" }, include: { user: true, barbershop: true } });
      if (!booking) throw new ActionError("Reserva não encontrada ou já finalizada.");
      if (status !== "CANCELLED" && booking.endDate > new Date()) throw new ActionError("Aguarde o término do horário para concluir ou marcar falta.");
      await tx.booking.update({ where: { id }, data: { status, cancelledAt: status === "CANCELLED" ? new Date() : undefined } });
      if (status === "CANCELLED" && booking.user.email) await tx.emailDelivery.create({ data: { eventKey: `${id}:CANCELLED`, recipient: booking.user.email, subject: `Reserva cancelada — ${booking.barbershop.name}`, body: `A barbearia cancelou sua reserva de ${booking.serviceName} em ${displayBookingDate(booking.date, booking.barbershop.timezone)}. Entre em contato para combinar um novo horário: ${booking.barbershop.phone}.` } });
    });
    if (status === "CANCELLED") await deliverBookingEmail(`${id}:CANCELLED`).catch(() => undefined);
  });
}
export async function retryEmail(form: FormData) {
  return run(async () => {
    const shopId = field(form,"shopId"); await requireShopOwner(shopId);
    const id = field(form,"bookingId"); if (!await db.booking.findFirst({ where: { id, barbershopId: shopId } })) throw new ActionError("Reserva não encontrada.");
    const event = z.enum(["CONFIRMED","CANCELLED"]).parse(field(form,"event"));
    await deliverBookingEmail(`${id}:${event}`);
  });
}
