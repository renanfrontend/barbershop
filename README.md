# RENANHARD Barber

🇧🇷 [Português](#português) · [English](#english)

## Português

Aplicação para encontrar barbearias, entrar com Google e reservar serviços. O aplicativo mantém sua **identidade original em tema escuro com detalhes roxos**. O painel comercial oferece gestão de unidades, profissionais, serviços, disponibilidade e agenda. O código evoluiu a partir de um projeto educacional Full Stack Week.

**Aplicativo original:** https://barbershop-seven-pi.vercel.app
**Portfólio:** https://www.renanaugusto.com.br/pt-BR/projetos/barbershop

### Fluxos

- Clientes entram com Google/Gmail, escolhem barbearia, serviço, profissional, dia e horário, acompanham o histórico e cancelam conforme a antecedência configurada.
- Proprietários acessam `/admin` para gerenciar seus próprios serviços, profissionais, horário semanal, pausas e reservas. Não podem acessar dados de outra unidade.
- Um administrador da plataforma, identificado por `ADMIN_EMAILS`, cadastra unidades e vincula o proprietário após a primeira entrada dele com Google. Proprietários não podem cadastrar outras unidades por conta própria.
- Preços e nome do serviço ficam registrados na reserva, preservando o histórico após mudanças no catálogo. Cancelamentos permanecem no histórico.
- E-mails de confirmação e cancelamento vão para uma fila persistida. Quando `MAIL_ENABLED=true` e SMTP estiver configurado, a aplicação tenta enviá-los e registra falhas para reenvio pela agenda.

Entrar com Google **não autoriza acesso à caixa de entrada** nem habilita envio de e-mails. O envio por Gmail/Google Workspace precisa de credenciais SMTP separadas. A aplicação não cobra pagamentos, não envia lembretes automáticos e não substitui uma política comercial/contrato com cada barbearia.

### Desenvolvimento

Requer Node.js 20.9+, PostgreSQL e credenciais OAuth do Google. Copie `.env.example` para `.env.local`, configure as variáveis localmente e nunca versione credenciais.

```bash
npm ci
npx prisma migrate deploy
npm run dev
```

Para OAuth local, autorize `http://localhost:3000/api/auth/callback/google` no Google Cloud e defina `NEXTAUTH_URL=http://localhost:3000`. Para produção, autorize `https://barbershop-seven-pi.vercel.app/api/auth/callback/google` e configure a URL/credenciais específicas do ambiente. `NEXTAUTH_SECRET` deve ser aleatório e privado; o nome anterior `NEXT_AUTH_SECRET` continua aceito para evitar interromper instalações existentes.

O banco local pode ser iniciado com `docker compose up -d` (ajuste a senha em `.env.local`). O seed de exemplo em `prisma/seed.ts` contém dados fictícios: **não execute seed em produção**. A migração `20261014160000_commercial_booking` adiciona campos e preserva agendamentos anteriores.

### E-mail por Gmail/Google Workspace

Configure `MAIL_ENABLED=true`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASSWORD` e `MAIL_FROM` como variáveis **privadas do servidor**. Para Gmail, use uma senha de app emitida para a conta com verificação em duas etapas; não use a senha principal. O endereço `MAIL_FROM` deve ser aceito pela conta SMTP. Faça um agendamento de teste autorizado e confira o estado de envio no painel antes de atender clientes. Serviços SMTP próprios podem ter limites de envio.

### Publicação segura

1. Faça backup do banco PostgreSQL de produção e confira qual projeto Vercel e qual `DATABASE_URL` ele usa. Utilize banco separado para deploys de Preview.
2. Confira `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (ou nome anterior), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `ADMIN_EMAILS` na Vercel. Nunca cole seus valores em conversa ou commit.
3. Execute `npx prisma migrate deploy` **contra o banco de produção confirmado**, verifique os registros antigos e faça o deploy do código. A migração tem backfill de duração, valor e profissional padrão para reservas existentes.
4. Confirme login, reserva, conflito de horário, cancelamento, acesso do proprietário e isolamento de outra unidade. Só então ative `MAIL_ENABLED` e teste uma entrega real.

O `next build` **não executa migrações**; isso evita modificar o banco como efeito colateral de um deploy de Preview. Publicar a branch sem migrar o banco causa erro nas consultas que usam as novas colunas.

### Verificações

```bash
npm run typecheck
npm run lint
npm test
DATABASE_URL="postgresql://..." npm run build
```

`tests/booking.integration.test.ts` roda com `TEST_DATABASE_URL` apontando para um banco descartável já migrado. Sem essa variável, ele é ignorado; os testes de horários continuam rodando. Não aponte o teste ao banco de produção.

### Estrutura

- `app/(home)`, `app/barbershops`, `app/bookings`: experiência do cliente.
- `app/login`, `app/_lib/auth`: login Google existente.
- `app/admin`: painel com permissões verificadas em cada ação no servidor.
- `app/_lib/booking-service.ts`, `scheduling.ts`, `email.ts`: regras de agenda, transações e entrega de avisos.
- `prisma/schema.prisma`, `prisma/migrations`: dados e evolução preservando reservas antigas.

## English

RENANHARD Barber retains its original dark and purple UI and Google sign-in. Customers discover barbershops, book a service with a selected professional, and view or cancel appointments. Owners manage their own shop, staff, service catalog, opening hours, time blocks and bookings in `/admin`. An explicitly configured platform administrator onboards owners. Confirmation and cancellation email requires separately configured SMTP credentials; Google sign-in alone does not grant Gmail inbox or sending access.

Run `npm ci`, configure `.env.local` from `.env.example`, run `npx prisma migrate deploy` against a local PostgreSQL database and start with `npm run dev`. For production, back up and inspect the database, migrate it before deploying code, verify bookings and ownership, then enable SMTP after a successful delivery test. The example seed is for local use only. Billing and automated reminders are outside the current application.
