# RENANHARD Barber ✂️

🇧🇷 [Português](#português) · [English](#english)

## Português

Aplicação de descoberta de barbearias e agendamento de serviços, baseada no projeto educacional Full Stack Week. A interface original usa tema escuro e detalhes roxos. O cliente pode entrar com Google, escolher um serviço, reservar um horário e acompanhar seus agendamentos.

| Link | Destino |
| --- | --- |
| Aplicativo | [barbershop-seven-pi.vercel.app](https://barbershop-seven-pi.vercel.app) |
| Portfólio | [Conheça o projeto](https://www.renanaugusto.com.br/pt-BR/projetos/barbershop) |
| Código | [github.com/renanfrontend/barbershop](https://github.com/renanfrontend/barbershop) |

> A página antiga `/demos/barbershop/` do portfólio redireciona para o aplicativo original. A pasta `demo/` deste repositório é um protótipo estático legado com dados simulados; não envia reservas reais.

### Tecnologias e funcionalidades

Next.js (App Router) · React · TypeScript · Tailwind CSS · NextAuth (Google) · Prisma · PostgreSQL · Vercel.

- Busca e listagem de barbearias, serviços e página de detalhes.
- Entrada com conta Google, reserva e consulta dos agendamentos do usuário.
- Verificação de sessão e autoria da reserva no servidor.
- Protótipo estático legado em `demo/`, independente do banco e do login.

### Executar localmente

Requer Node.js, PostgreSQL e credenciais OAuth do Google. Configure as variáveis locais em `.env` a partir de `.env.example`, sem versionar segredos.

```bash
npm ci
npx prisma migrate deploy
npm run dev
```

Autorize `http://localhost:3000/api/auth/callback/google` como callback OAuth local; em produção, use a URL HTTPS do aplicativo. Configure `NEXT_AUTH_SECRET` e os dados do banco. O seed em `prisma/seed.ts` é de exemplo e deve ser usado somente em desenvolvimento.

### Estrutura e validação

- `app/(home)/`: início e busca; `app/barbershops/`: listagem, detalhes e reservas.
- `app/bookings/`: histórico do usuário; `app/_components/`: interface compartilhada.
- `prisma/`: modelos, migrações e seed; `demo/`: protótipo estático legado.

```bash
npx tsc --noEmit
npm run lint
npm run build
```

### Evolução comercial

A versão em desenvolvimento na [PR #2](https://github.com/renanfrontend/barbershop/pull/2) mantém a identidade visual e adiciona gestão de unidades, profissionais, disponibilidade, painel do proprietário e avisos por e-mail. **Esses recursos ainda não estão no aplicativo publicado.** A migração do banco e as configurações de produção devem ser verificadas antes da publicação.

### Contato e autoria

Desenvolvimento e evolução: **Renan Augusto dos Santos**. Para adaptar o aplicativo a uma barbearia ou conversar sobre implantação, escreva para [contato@renanaugusto.com.br](mailto:contato@renanaugusto.com.br). Outros canais: [GitHub](https://github.com/renanfrontend/barbershop) e [LinkedIn](https://www.linkedin.com/in/renan-augusto-santos/). Para dúvidas sobre uma reserva, procure o contato da própria barbearia exibido no aplicativo.

O projeto partiu de um exercício educacional Full Stack Week. Bibliotecas e materiais de terceiros conservam seus respectivos direitos e licenças.

## English

RENANHARD Barber is a dark and purple barbershop discovery and booking application based on a Full Stack Week educational project. Customers can sign in with Google, browse services, make a booking and see their appointments. Built with Next.js, React, TypeScript, Tailwind CSS, NextAuth, Prisma and PostgreSQL.

**Links:** [Live application](https://barbershop-seven-pi.vercel.app) · [Portfolio](https://www.renanaugusto.com.br/pt-BR/projetos/barbershop) · [Source](https://github.com/renanfrontend/barbershop). The old portfolio demo redirects to the live application; the local `demo/` folder is a legacy static prototype with simulated data.

To run locally, use `npm ci`, configure `.env` from `.env.example`, run `npx prisma migrate deploy` against a local PostgreSQL database and start with `npm run dev`. Configure the Google OAuth callback and `NEXT_AUTH_SECRET`. Sample seed data is for development only.

The commercial features in [PR #2](https://github.com/renanfrontend/barbershop/pull/2) are under development and are not live until the production database migration and deployment checks are complete.

**Contact:** Renan Augusto dos Santos · [contato@renanaugusto.com.br](mailto:contato@renanaugusto.com.br) · [GitHub](https://github.com/renanfrontend/barbershop) · [LinkedIn](https://www.linkedin.com/in/renan-augusto-santos/). For an existing booking, contact the relevant barbershop. Third-party materials retain their own licenses.
