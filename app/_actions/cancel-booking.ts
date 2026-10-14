"use server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import { db } from "../_lib/prisma";

export const cancelBooking = async (bookingId: string) => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Faça login para cancelar uma reserva.");
  const result = await db.booking.deleteMany({ where: { id: bookingId, userId } });
  if (!result.count) throw new Error("Reserva não encontrada.");
  revalidatePath("/");
  revalidatePath("/bookings");
};
