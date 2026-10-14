import nodemailer from "nodemailer";
import { db } from "./prisma";

export function mailConfigured() { return process.env.MAIL_ENABLED === "true" && !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD && !!process.env.MAIL_FROM; }
/** Queued deliveries survive SMTP outages. No email is sent unless explicitly enabled. */
export async function deliverBookingEmail(eventKey: string) {
  if (!mailConfigured()) return;
  const delivery = await db.emailDelivery.findUnique({ where: { eventKey } });
  if (!delivery) return;
  const stale = delivery.state === "SENDING" && !!delivery.lastAttemptAt && delivery.lastAttemptAt.getTime() < Date.now() - 15 * 60000;
  if (!["PENDING", "FAILED"].includes(delivery.state) && !stale) return;
  const claimed = await db.emailDelivery.updateMany({ where: { id: delivery.id, OR: [{ state: { in: ["PENDING", "FAILED"] } }, { state: "SENDING", lastAttemptAt: { lt: new Date(Date.now() - 15 * 60000) } }] }, data: { state: "SENDING", attempts: { increment: 1 }, lastAttemptAt: new Date() } });
  if (!claimed.count) return;
  try {
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 465), secure: (process.env.SMTP_PORT ?? "465") === "465", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000, disableFileAccess: true, disableUrlAccess: true });
    await transport.sendMail({ from: process.env.MAIL_FROM, to: delivery.recipient, subject: delivery.subject, text: delivery.body, messageId: `<${delivery.id}@barbershop.local>` });
    await db.emailDelivery.update({ where: { id: delivery.id }, data: { state: "SENT", sentAt: new Date(), lastError: null } });
  } catch {
    await db.emailDelivery.update({ where: { id: delivery.id }, data: { state: "FAILED", lastError: "Falha na entrega SMTP. Verifique as credenciais e tente novamente." } });
  }
}
