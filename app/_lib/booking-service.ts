import { ActionError } from "./action-error";
import { Prisma, PrismaClient } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";
import { availableSlots, daySchema, displayBookingDate } from "./scheduling";

export const reserveSchema = z.object({ barbershopId: z.string().min(1), serviceId: z.string().min(1), staffId: z.string().min(1), date: z.coerce.date() });
export async function getAvailability(client: PrismaClient | Prisma.TransactionClient, input: { serviceId: string; staffId: string; day: string }) {
  daySchema.parse(input.day);
  const service = await client.service.findUnique({ where: { id: input.serviceId }, include: { barbershop: true } });
  const staff = await client.staff.findUnique({ where: { id: input.staffId } });
  if (!service?.active || !service.barbershop.active || !staff?.active || staff.barbershopId !== service.barbershopId) throw new ActionError("Serviço ou profissional indisponível.");
  const start = new Date(input.day + "T00:00:00Z"), end = new Date(start.getTime() + 2 * 86400000);
  const bookings = await client.booking.findMany({ where: { staffId: staff.id, status: { in: ["CONFIRMED", "COMPLETED"] }, date: { lt: end }, endDate: { gt: new Date(start.getTime() - 86400000) } }, select: { date: true, endDate: true } });
  const blocks = await client.scheduleBlock.findMany({ where: { staffId: staff.id, start: { lt: end }, end: { gt: new Date(start.getTime() - 86400000) } }, select: { start: true, end: true } });
  return { service, staff, slots: availableSlots(input.day, service.durationMinutes, service.barbershop, [...bookings.map(b => ({ start: b.date, end: b.endDate })), ...blocks]) };
}
export async function serializable<T>(db: PrismaClient, operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await db.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
    catch (error) { if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= 2) throw error; }
  }
}
export async function reserve(db: PrismaClient, userId: string, input: { barbershopId: string; serviceId: string; staffId: string; date: string | Date }) {
  const params = reserveSchema.parse(input);
  return serializable(db, async tx => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user?.email) throw new ActionError("Conta não encontrada.");
    const shop = await tx.barbershop.findUnique({ where: { id: params.barbershopId } });
    if (!shop?.active) throw new ActionError("Barbearia indisponível.");
    const day = formatInTimeZone(params.date, shop.timezone, "yyyy-MM-dd");
    const { service, staff, slots } = await getAvailability(tx, { ...params, day });
    if (service.barbershopId !== shop.id || !slots.some(s => s.date === params.date.toISOString())) throw new ActionError("Este horário não está mais disponível. Escolha outro.");
    const endDate = new Date(params.date.getTime() + service.durationMinutes * 60000);
    const ownOverlap = await tx.booking.findFirst({ where: { userId, status: "CONFIRMED", date: { lt: endDate }, endDate: { gt: params.date } } });
    if (ownOverlap) throw new ActionError("Você já possui uma reserva nesse período.");
    const booking = await tx.booking.create({ data: { ...params, userId, endDate, serviceName: service.name, price: service.price } });
    await tx.emailDelivery.create({ data: { eventKey: `${booking.id}:CONFIRMED`, recipient: user.email, subject: `Reserva confirmada — ${shop.name}`, body: `Olá, ${user.name ?? "cliente"}!\n\nSeu agendamento foi confirmado.\n${service.name} com ${staff.name}\n${displayBookingDate(booking.date, shop.timezone)} (${shop.timezone})\n${shop.name} — ${shop.address}\nValor: R$ ${service.price.toFixed(2)}\n\nConsulte ou cancele sua reserva no aplicativo, respeitando a antecedência mínima de ${shop.cancellationNoticeMinutes} minutos.` } });
    return booking;
  });
}
export async function cancelCustomerBooking(db: PrismaClient, userId: string, bookingId: string) {
  return serializable(db, async tx => {
    const booking = await tx.booking.findFirst({ where: { id: bookingId, userId }, include: { barbershop: true, user: true } });
    if (!booking) throw new ActionError("Reserva não encontrada.");
    if (booking.status !== "CONFIRMED") throw new ActionError("Esta reserva não pode ser cancelada.");
    if (booking.date.getTime() - Date.now() < booking.barbershop.cancellationNoticeMinutes * 60000) throw new ActionError(`Cancelamento permitido até ${booking.barbershop.cancellationNoticeMinutes} minutos antes. Entre em contato com a barbearia.`);
    await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    if (booking.user.email) await tx.emailDelivery.create({ data: { eventKey: `${booking.id}:CANCELLED`, recipient: booking.user.email, subject: `Reserva cancelada — ${booking.barbershop.name}`, body: `Sua reserva de ${booking.serviceName} em ${displayBookingDate(booking.date, booking.barbershop.timezone)} foi cancelada.` } });
    return booking.id;
  });
}
