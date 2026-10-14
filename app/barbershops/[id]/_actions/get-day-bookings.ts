"use server";
import { db } from "@/app/_lib/prisma";
import { getAvailability } from "@/app/_lib/booking-service";
import { z } from "zod";
import { daySchema } from "@/app/_lib/scheduling";
export async function getAvailableTimes(input: { serviceId: string; staffId: string; day: string }) {
  try {
    const parsed = z.object({ serviceId: z.string().min(1), staffId: z.string().min(1), day: daySchema }).parse(input);
    const { slots } = await getAvailability(db, parsed);
    return { slots, error: null };
  } catch { return { slots: [], error: "Não foi possível consultar a agenda. Tente novamente." }; }
}
