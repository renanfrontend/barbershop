"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../_components/ui/button";
import { Card, CardContent } from "../_components/ui/card";
export default function LoginPage() { return <main className="max-w-md mx-auto px-5 py-16"><Card><CardContent className="p-6 space-y-6"><Image src="/logo_v2.png" alt="RENANHARD Barber" width={160} height={24} /><h1 className="text-2xl font-bold">Entre na sua conta</h1><p className="text-sm text-gray-400">Use sua conta Google ou Gmail para agendar e acompanhar seus serviços. Se a tentativa anterior falhou, confira a conta escolhida e tente novamente.</p><Button className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>Continuar com Google</Button><p className="text-xs text-gray-400">Usamos nome, e-mail e foto para identificar sua conta. O login não dá acesso à sua caixa de entrada.</p><Link href="/" className="block text-sm text-primary">Voltar ao início</Link></CardContent></Card></main>; }
