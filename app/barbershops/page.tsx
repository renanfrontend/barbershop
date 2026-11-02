import { redirect } from "next/navigation";
import BarbershopItem from "../(home)/_components/barbershop-item";
import Header from "../_components/header";
import { db } from "../_lib/prisma";
import Search from "../(home)/_components/search";

interface BarbershopsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
  const { search } = await searchParams;
  if (!search) {
    return redirect("/");
  }

  const barbershops = await db.barbershop.findMany({
    where: {
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
  });

  return (
    <>
      <Header />

      <div className="mx-auto max-w-6xl px-5 py-6 flex flex-col gap-6">
        <Search
          defaultValues={{
            search,
          }}
        />

        <h1 className="text-gray-400 font-bold text-xs uppercase">Resultados para &quot;{search}&quot;</h1>

        {barbershops.length === 0 && <p role="status" className="rounded-xl border p-6 text-gray-400">Nenhuma barbearia encontrada. Tente outro nome.</p>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {barbershops.map((barbershop) => (
            <div key={barbershop.id} className="w-full">
              <BarbershopItem barbershop={barbershop} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BarbershopsPage;
