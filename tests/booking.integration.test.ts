import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { reserve, cancelCustomerBooking, getAvailability } from "../app/_lib/booking-service";
import { formatInTimeZone } from "date-fns-tz";

test("real database: ownership, overlap, immutable price, cancellations and outbox", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const db = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL! } } });
  const tag = `test-${Date.now()}`;
  const a = await db.user.create({ data: { email: `${tag}-a@example.test` } });
  const b = await db.user.create({ data: { email: `${tag}-b@example.test` } });
  const shop = await db.barbershop.create({ data: { name: tag, address: "Local test", imageUrl: "/barbershop-map.png", workingDays: [0,1,2,3,4,5,6], ownerId: a.id, staff: { create: { name: "Test barber" } }, services: { create: { name: "Test haircut", description: "Test only", imageUrl: "/barbershop-map.png", price: 60, durationMinutes: 60 } } }, include: { staff: true, services: true } });
  const otherShop = await db.barbershop.create({ data: { name: `${tag}-other`, address: "Local test", imageUrl: "/barbershop-map.png", staff: { create: { name: "Other barber" } } }, include: { staff: true } });
  const ids: string[]=[];
  try {
    const serviceId=shop.services[0].id,staffId=shop.staff[0].id;
    const day=formatInTimeZone(new Date(Date.now()+2*86400000),shop.timezone,"yyyy-MM-dd");
    const available=await getAvailability(db,{serviceId,staffId,day});
    assert.ok(available.slots.length>2);
    const input={barbershopId:shop.id,serviceId,staffId,date:available.slots[0].date};
    await assert.rejects(reserve(db,a.id,{...input,staffId:otherShop.staff[0].id}),/indisponível/);
    const booking=await reserve(db,a.id,input);ids.push(booking.id);
    await assert.rejects(reserve(db,b.id,input),/disponível/);
    await assert.rejects(reserve(db,b.id,{...input,date:available.slots[1].date}),/disponível/);
    await assert.rejects(cancelCustomerBooking(db,b.id,booking.id),/encontrada/);
    await db.service.update({where:{id:serviceId},data:{price:120,name:"Renamed service"}});
    const saved=await db.booking.findUniqueOrThrow({where:{id:booking.id}});
    assert.equal(Number(saved.price),60);assert.equal(saved.serviceName,"Test haircut");
    assert.equal(await db.emailDelivery.count({where:{eventKey:`${booking.id}:CONFIRMED`}}),1);
    await cancelCustomerBooking(db,a.id,booking.id);
    assert.equal((await db.booking.findUniqueOrThrow({where:{id:booking.id}})).status,"CANCELLED");
    const rebook=await reserve(db,b.id,input);ids.push(rebook.id);
    assert.equal(Number(rebook.price),120);
    await assert.rejects(reserve(db,a.id,{...input,date:new Date(0)}),/disponível/);
  } finally {
    await db.emailDelivery.deleteMany({where:{eventKey:{in:ids.flatMap(id=>[`${id}:CONFIRMED`,`${id}:CANCELLED`])}}});
    await db.booking.deleteMany({where:{barbershopId:shop.id}});
    await db.service.deleteMany({where:{barbershopId:shop.id}});
    await db.staff.deleteMany({where:{barbershopId:{in:[shop.id,otherShop.id]}}});
    await db.barbershop.deleteMany({where:{id:{in:[shop.id,otherShop.id]}}});
    await db.user.deleteMany({where:{id:{in:[a.id,b.id]}}});await db.$disconnect();
  }
});
