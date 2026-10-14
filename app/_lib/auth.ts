import { db } from "@/app/_lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const managed = await db.barbershop.count({ where: { ownerId: user.id } });
      const platformAdmin = (process.env.ADMIN_EMAILS ?? "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean).includes(user.email?.toLowerCase() ?? "");
      session.user = { ...session.user, id: user.id, canManage: managed > 0 || platformAdmin } as {
        canManage: boolean;
        id: string;
        name: string;
        email: string;
      };

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.NEXT_AUTH_SECRET,
  pages: { signIn: "/login", error: "/login" },
};
