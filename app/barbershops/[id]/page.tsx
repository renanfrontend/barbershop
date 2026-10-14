import { notFound } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import BarbershopInfo from "./_components/barbershop-info";
import ServiceItem from "./_components/service-item";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";


interface BarbershopDetailsPageProps {
  params: Promise<{ id: string }>;
}

const BarbershopDetailsPage = async ({ params }: BarbershopDetailsPageProps) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!id) {
    notFound();
  }

  const barbershop = await db.barbershop.findUnique({
    where: {
      id: id,
    },
    include: {
      services: { where: { active: true } },
      staff: { where: { active: true }, select: { id: true, name: true } },
    },
  });

  if (!barbershop || !barbershop.active) {
    notFound();
  }
  const { services, staff, ...shop } = barbershop;

  return (
    <div>
      <BarbershopInfo barbershop={shop} />

      <div className="px-5 flex flex-col gap-4 py-6">
        {services.map((service) => (
          <ServiceItem key={service.id} barbershop={shop} service={{ ...service, price: Number(service.price) }} staff={staff} isAuthenticated={!!session?.user} />
        ))}
      </div>
    </div>
  );
};

export default BarbershopDetailsPage;
