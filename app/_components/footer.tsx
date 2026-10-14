import Link from "next/link";
import { GithubIcon, LinkedinIcon, MailIcon } from "lucide-react";

const contacts = [
  { label: "E-mail", value: "contato@renanaugusto.com.br", href: "mailto:contato@renanaugusto.com.br", icon: MailIcon },
  { label: "GitHub", value: "renanfrontend", href: "https://github.com/renanfrontend/barbershop", icon: GithubIcon },
  { label: "LinkedIn", value: "Renan Augusto", href: "https://www.linkedin.com/in/renan-augusto-santos/", icon: LinkedinIcon },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-secondary/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <p className="font-bold text-foreground">RENANHARD Barber</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Agendamentos de barbearia com praticidade para clientes e gestão para profissionais.
          </p>
          <a className="mt-3 inline-block text-sm text-primary hover:underline" href="https://www.renanaugusto.com.br/pt-BR/projetos/barbershop" target="_blank" rel="noopener noreferrer">
            Conheça o projeto no portfólio <span className="sr-only">(abre em nova aba)</span>
          </a>
        </div>

        <nav aria-label="Links do aplicativo">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Navegação</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link className="hover:text-primary" href="/">Início</Link></li>
            <li><Link className="hover:text-primary" href="/barbershops">Barbearias</Link></li>
            <li><Link className="hover:text-primary" href="/bookings">Meus agendamentos</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contato comercial</h2>
          <p className="mt-3 text-sm text-muted-foreground">Quer uma versão para sua barbearia? Fale com o desenvolvedor.</p>
          <ul className="mt-4 space-y-3">
            {contacts.map(({ label, value, href, icon: Icon }) => (
              <li key={label}>
                <a className="flex items-center gap-2 text-sm text-foreground hover:text-primary" href={href} {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 break-all">{value}</span>
                  <span className="sr-only">{label}{href.startsWith("https://") ? " (abre em nova aba)" : ""}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Renan Augusto dos Santos. Projeto RENANHARD Barber.
      </div>
    </footer>
  );
}
