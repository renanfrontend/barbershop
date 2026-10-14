import { ActionError } from "./action-error";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./prisma";

export function isPlatformAdmin(email?: string | null) {
  return !!email && (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
export async function requireUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) throw new ActionError("Faça login com sua conta Google para continuar.");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new ActionError("Sessão inválida. Entre novamente.");
  return user;
}
export async function requireShopOwner(shopId: string) {
  const user = await requireUser();
  const shop = await db.barbershop.findUnique({ where: { id: shopId } });
  if (!shop || (shop.ownerId !== user.id && !isPlatformAdmin(user.email))) throw new ActionError("Você não tem acesso a esta barbearia.");
  return { user, shop };
}
