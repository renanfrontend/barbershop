"use client";
import { Button } from "@/app/_components/ui/button";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/app/_components/ui/sheet";
import { Barbershop, Service, Staff } from "@prisma/client";
import { ptBR } from "date-fns/locale";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { saveBooking } from "../_actions/save-booking";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAvailableTimes } from "../_actions/get-day-bookings";
import { displayBookingDate } from "@/app/_lib/scheduling";

const Calendar = dynamic(() => import("@/app/_components/ui/calendar").then(module => module.Calendar), { ssr: false });
type Props = { barbershop: Barbershop; service: Omit<Service, "price"> & { price: number }; staff: Pick<Staff, "id" | "name">[]; isAuthenticated: boolean };
export default function ServiceItem({ service, barbershop, staff, isAuthenticated }: Props) {
  const [date, setDate] = useState<Date>();
  const [slot, setSlot] = useState("");
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ date: string; label: string }[]>([]);
  useEffect(() => {
    setSlot(""); setSlots([]); setError(null);
    if (!date || !staffId || !open) return;
    let cancelled = false;
    setLoading(true);
    getAvailableTimes({ serviceId: service.id, staffId, day: format(date, "yyyy-MM-dd") }).then(result => {
      if (!cancelled) { setSlots(result.slots); setError(result.error); }
    }).catch(() => { if (!cancelled) setError("Falha ao carregar horários. Tente novamente."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date, staffId, service.id, open, reload]);
  async function submit() {
    if (!slot || saving) return;
    setSaving(true);
    try {
      const result = await saveBooking({ serviceId: service.id, barbershopId: barbershop.id, staffId, date: new Date(slot) });
      if (!result.ok) { toast.error(result.error); setReload(v => v + 1); return; }
      toast.success("Reserva confirmada!", { description: displayBookingDate(slot, barbershop.timezone) });
      setOpen(false); setDate(undefined); setSlot("");
    } catch { toast.error("Falha de conexão. Consulte seus agendamentos antes de tentar novamente."); }
    finally { setSaving(false); }
  }
  const price = Number(service.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return <Card><CardContent className="p-3 w-full"><div className="flex gap-4 items-center w-full">
    <div className="relative h-[110px] w-[110px] shrink-0"><Image className="rounded-lg object-cover" src={service.imageUrl} fill alt={service.name} sizes="110px" /></div>
    <div className="flex flex-col w-full min-w-0"><h2 className="font-bold">{service.name}</h2><p className="text-sm text-gray-400">{service.description}</p><p className="text-xs text-gray-400 mt-1">{service.durationMinutes} minutos</p>
    <div className="flex items-center justify-between gap-2 mt-3"><p className="text-primary text-sm font-bold">{price}</p>
    <Sheet open={open} onOpenChange={value => { if (value && !isAuthenticated) { void signIn("google"); return; } setOpen(value); }}><SheetTrigger asChild><Button variant="secondary" disabled={!staff.length}>Reservar</Button></SheetTrigger>
    <SheetContent className="p-0 overflow-y-auto"><SheetHeader className="text-left px-5 py-6 border-b"><SheetTitle>Fazer Reserva</SheetTitle></SheetHeader>
      <div className="px-5 pt-5"><label htmlFor={`staff-${service.id}`} className="text-sm">Profissional</label><select id={`staff-${service.id}`} className="mt-2 w-full rounded-md border bg-background p-3" value={staffId} onChange={event => setStaffId(event.target.value)}>{staff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select><p className="text-xs text-gray-400 mt-2">Horários da barbearia: {barbershop.timezone}. Cancelamento até {barbershop.cancellationNoticeMinutes} minutos antes.</p></div>
      <div className="p-5"><Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} fromDate={new Date()} toDate={new Date(Date.now() + barbershop.bookingHorizonDays * 86400000)} /></div>
      <div className="px-5 pb-5" aria-live="polite">{loading ? <p className="text-sm">Consultando horários…</p> : error ? <><p role="alert" className="text-sm text-red-400">{error}</p><Button variant="outline" onClick={() => setReload(v => v + 1)}>Tentar novamente</Button></> : date && !slots.length ? <p className="text-sm text-gray-400">Sem horários disponíveis. Escolha outra data ou profissional.</p> : <div className="grid grid-cols-3 gap-2">{slots.map(item => <Button key={item.date} variant={slot === item.date ? "default" : "outline"} aria-pressed={slot === item.date} onClick={() => setSlot(item.date)}>{item.label}</Button>)}</div>}</div>
      <div className="px-5 py-5 border-t text-sm space-y-3"><div className="flex justify-between"><strong>{service.name}</strong><strong>{price}</strong></div><p>{barbershop.name}</p>{slot && <p>{displayBookingDate(slot, barbershop.timezone)}</p>}</div>
      <SheetFooter className="px-5 pb-6"><Button className="w-full" onClick={submit} disabled={!slot || loading || saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar reserva</Button></SheetFooter>
    </SheetContent></Sheet></div></div></div></CardContent></Card>;
}
