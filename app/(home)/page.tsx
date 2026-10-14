import { format } from "date-fns";
import Header from "../_components/header";
import { ptBR } from "date-fns/locale";
import Search from "./_components/search";
import BookingItem from "../_components/booking-item";
import { db } from "../_lib/prisma";
import BarbershopItem from "./_components/barbershop-item";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  const [barbershops, confirmedBookings] = await Promise.all([
    db.barbershop.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    session?.user
      ? db.booking.findMany({
          where: { status: "CONFIRMED", userId: (session.user as { id: string }).id, date: { gte: new Date() } },
          include: { service: true, barbershop: true },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <Header />

      <div className="px-5 pt-5">
        <h2 className="text-xl font-bold">
          {session?.user ? `Olá, ${session.user.name?.split(" ")[0]}!` : "Olá! Vamos agendar um corte hoje?"}
        </h2>
        <p className="capitalize text-sm">
          {format(new Date(), "EEEE',' dd 'de' MMMM", {
            locale: ptBR,
          })}
        </p>
      </div>

      <div className="px-5 mt-6">
        <Search />
      </div>

      <div className="mt-6">
        {confirmedBookings.length > 0 && (
          <>
            <h2 className="pl-5 text-xs mb-3 uppercase text-gray-400 font-bold">Agendamentos</h2>
            <div className="px-5 flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          </>
        )}
      </div>

      <section className="mt-6 mb-16 px-5" aria-labelledby="shops-title">
        <h2 id="shops-title" className="text-xs mb-3 uppercase text-gray-400 font-bold">Barbearias</h2>
        {barbershops.length === 0 && <p className="text-sm text-gray-400">Nenhuma barbearia disponível no momento.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {barbershops.map((barbershop) => <BarbershopItem key={barbershop.id} barbershop={barbershop} />)}
        </div>
      </section>
    </div>
  );
}
