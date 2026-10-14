"use server";
import { actionErrorMessage } from "@/app/_lib/action-error";
import { revalidatePath } from "next/cache";
import { db } from "../_lib/prisma";
import { requireUser } from "../_lib/session";
import { cancelCustomerBooking } from "../_lib/booking-service";
import { deliverBookingEmail } from "../_lib/email";
export async function cancelBooking(bookingId: string) {
  try {
    const user = await requireUser();
    await cancelCustomerBooking(db, user.id, bookingId);
    await deliverBookingEmail(`${bookingId}:CANCELLED`).catch(() => undefined);
    revalidatePath("/"); revalidatePath("/bookings"); revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: actionErrorMessage(error, "Não foi possível cancelar a reserva.") }; }
}
