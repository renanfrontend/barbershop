"use server";
import { db } from "@/app/_lib/prisma";
import { authOptions } from "@/app/_lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const bookingSchema = z.object({
  barbershopId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.date().refine(date => date.getTime() > Date.now(), "Escolha uma data futura."),
});

export const saveBooking = async (input: z.infer<typeof bookingSchema>) => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Faça login para reservar.");
  const params = bookingSchema.parse(input);
  await db.$transaction(async tx => {
    const service = await tx.service.findFirst({ where: { id: params.serviceId, barbershopId: params.barbershopId } });
    if (!service) throw new Error("Serviço indisponível nesta barbearia.");
    const existing = await tx.booking.findFirst({ where: { barbershopId: params.barbershopId, date: params.date } });
    if (existing) throw new Error("Horário indisponível. Escolha outro.");
    await tx.booking.create({ data: { ...params, userId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/");
  revalidatePath("/bookings");
};
