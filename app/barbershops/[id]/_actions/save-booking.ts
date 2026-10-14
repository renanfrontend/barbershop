"use server";
import { actionErrorMessage } from "@/app/_lib/action-error";
import { db } from "@/app/_lib/prisma";
import { requireUser } from "@/app/_lib/session";
import { reserve, reserveSchema } from "@/app/_lib/booking-service";
import { deliverBookingEmail } from "@/app/_lib/email";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function saveBooking(input: z.input<typeof reserveSchema>) {
  try {
    const user = await requireUser();
    const booking = await reserve(db, user.id, input);
    // The booking remains valid even if SMTP fails; the delivery stays in the queue.
    await deliverBookingEmail(`${booking.id}:CONFIRMED`).catch(() => undefined);
    revalidatePath("/"); revalidatePath("/bookings"); revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: actionErrorMessage(error, "Não foi possível reservar. Verifique os dados e tente novamente.") }; }
}
