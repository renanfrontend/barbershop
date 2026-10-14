# ✂ Barber Shop

🇧🇷 **Português** · [English below](#english)

Aplicação de descoberta de barbearias e agendamento de serviços, desenvolvida a partir do projeto educacional Full Stack Week. Stack: **Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL e NextAuth**.

[Experimentar demonstração](https://renanaugusto.com.br/demos/barbershop/index.html) · [Portfólio](https://renanaugusto.com.br/pt-BR/projetos/barbershop) · [Código](https://github.com/renanfrontend/barbershop)

## Demonstração pública

A pasta `demo/` contém uma experiência estática independente com layout responsivo, busca por nome/bairro, filtros por serviço, seleção de data/horário e cancelamento. As barbearias são fictícias e as reservas ficam no localStorage do navegador: **não são agendamentos reais**. A demonstração é distribuída também em `public/demos/barbershop/` no portfólio; sincronize os três arquivos ao atualizar a interface.

```bash
python3 -m http.server 8080 --directory demo
```

## Aplicação completa

Requer Node.js, PostgreSQL e credenciais OAuth do Google.

```bash
npm ci
cp .env.example .env
# Preencha .env com suas credenciais locais.
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Cadastre `http://localhost:3000/api/auth/callback/google` como callback OAuth local. Em produção, use a URL HTTPS do ambiente. Gere um segredo aleatório para `NEXT_AUTH_SECRET`. Não publique credenciais.

A aplicação completa depende desses serviços externos; a demonstração não usa banco nem login. As reservas verificam a sessão no servidor, validam serviço e data futura e checam conflitos em uma transação serializável. Cancelamentos são restritos ao dono da reserva. Conflitos concorrentes podem exigir nova tentativa pelo usuário.

## Estrutura

- `app/(home)/`: página inicial e busca.
- `app/barbershops/`: listagem, detalhes e ações de reserva.
- `app/bookings/`: agendamentos do usuário.
- `app/_components/`: componentes compartilhados.
- `prisma/`: modelos, migrations e seed.
- `demo/`: demonstração pública independente.

## Validação

```bash
npx tsc --noEmit
npm run lint
npm run build
```

O build e a navegação completa precisam das variáveis e do banco configurados. A demo pode ser validada sem esses serviços.

## English

Barbershop discovery and booking application based on the Full Stack Week educational project, built with Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL and NextAuth.

The [public demo](https://renanaugusto.com.br/demos/barbershop/index.html) is a standalone responsive experience with search, service filters, date/time selection and cancellation. It uses fictional shops and browser-local simulated bookings. No real booking is submitted.

For the full application, install dependencies, copy `.env.example` to `.env`, configure PostgreSQL and Google OAuth, run Prisma migrations/seed and start the development server. Authentication and ownership are checked on the server. The demo is mirrored in the portfolio repository; keep its HTML, CSS and JavaScript files synchronized.
