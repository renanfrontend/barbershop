"use client";
import { Button } from "./_components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="p-8 mx-auto max-w-lg space-y-5"><h1 className="text-xl font-bold">Não foi possível carregar esta página</h1><p className="text-gray-400">Tente novamente em alguns instantes. Se você acabou de reservar, consulte seus agendamentos antes de repetir a operação.</p><Button onClick={reset}>Tentar novamente</Button></main>; }
