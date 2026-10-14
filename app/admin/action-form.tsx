"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../_components/ui/button";
import type { ActionResult } from "./actions";
export default function ActionForm({ action, children, label = "Salvar", confirm }: { action: (form: FormData) => Promise<ActionResult>; children: React.ReactNode; label?: string; confirm?: string }) {
  const [pending, setPending] = useState(false), [result, setResult] = useState<ActionResult>(); const router = useRouter();
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); if (pending || (confirm && !window.confirm(confirm))) return;
    const form = new FormData(event.currentTarget); setPending(true); setResult(undefined);
    try { const response = await action(form); setResult(response); if (response.ok) router.refresh(); }
    catch { setResult({ ok: false, message: "Falha de conexão. Tente novamente." }); }
    finally { setPending(false); }
  }}><fieldset className="space-y-4" disabled={pending}>{children}<Button type="submit" disabled={pending}>{pending ? "Salvando…" : label}</Button></fieldset>{result && <p role="status" className={result.ok ? "text-sm text-primary" : "text-sm text-red-400"}>{result.message}</p>}</form>;
}
