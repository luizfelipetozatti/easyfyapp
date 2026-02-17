# 🚀 AgendaZap - Guia de Setup

## Pré-requisitos

- Node.js 20+ 
- pnpm 9+ (instale com: `npm install -g pnpm`)
- Conta no Supabase (https://supabase.com)
- Instância Evolution API rodando (https://evolution-api.com)

## 1. Instalação das Dependências

```bash
cd d:\Felipe\Projetos\agendazap
pnpm install
```

## 2. Configurar Supabase

### 2.1. Criar Projeto no Supabase
1. Acesse https://app.supabase.com
2. Crie um novo projeto
3. Anote as credenciais: Project URL e anon/public key

### 2.2. Habilitar Auth Email/Password
- Settings → Authentication → Providers
- Habilite "Email" provider
- Desabilite "Confirm email" para facilitar testes (ou configure SMTP)

## 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edite `apps/web/.env.local` com suas credenciais:

```env
# Supabase (pegue em Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...seu-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...seu-service-role-key

# Database (pegue em Settings → Database → Connection string → URI)
DATABASE_URL=postgresql://postgres.[projeto]:[senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[projeto]:[senha]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# Evolution API (configure depois)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=agendazap

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Configurar Banco de Dados

### 4.1. Gerar Cliente Prisma e Criar Tabelas
```bash
pnpm db:generate
pnpm db:push
```

### 4.2. Aplicar Row Level Security (RLS)
1. Acesse o Supabase Dashboard → SQL Editor
2. Copie e execute o conteúdo do arquivo: `packages/database/prisma/rls-policies.sql`
3. Aguarde "Success. No rows returned"

### 4.3. (Opcional) Popular Banco com Dados de Exemplo
```bash
pnpm --filter @easyfyapp/database db:seed
```

Isso cria:
- Clínica Exemplo (slug: `clinica-exemplo`)
- CoWork Hub (slug: `cowork-hub`)
- Serviços de exemplo
- Usuário: `admin@clinicaexemplo.com` (crie a senha no Supabase Auth)

## 5. Configurar Evolution API (WhatsApp)

### 5.1. Opções de Instalação

**Opção A: Docker (recomendado)**
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-segura \
  atendai/evolution-api:latest
```

**Opção B: Cloud providers**
- Railway: https://railway.app (deploy com 1 clique)
- Render: https://render.com
- DigitalOcean App Platform

### 5.2. Criar Instância
Após Evolution API rodando:

1. Criar instância via API:
```bash
curl -X POST https://sua-evolution-api.com/instance/create \
  -H "apikey: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "agendazap",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

2. Conectar WhatsApp:
   - Acesse: `https://sua-evolution-api.com/instance/connect/agendazap`
   - Escaneie QR Code com WhatsApp
   - Aguarde "Connected"

### 5.3. Configurar Webhook
```bash
curl -X POST https://sua-evolution-api.com/webhook/set/agendazap \
  -H "apikey: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-dominio.vercel.app/api/webhook/whatsapp",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE"
    ]
  }'
```

**Para desenvolvimento local**: Use ngrok para expor localhost:
```bash
ngrok http 3000
# Use URL gerada no webhook: https://abc123.ngrok.io/api/webhook/whatsapp
```

## 6. Rodar o Projeto

```bash
# Dev mode (hot reload)
pnpm dev

# Build produção
pnpm build
pnpm start
```

Acesse: http://localhost:3000

## 7. Testar Fluxo Completo

### 7.1. Criar Conta
1. http://localhost:3000/register
2. Preencha dados (nome, negócio, email, senha)
3. Confirme email (se habilitado) ou vá direto ao login

### 7.2. Criar Primeiro Serviço
1. Login → Dashboard → Serviços
2. (Por enquanto use seed ou crie direto no Prisma Studio: `pnpm db:studio`)

### 7.3. Testar Agendamento Público
1. Acesse: http://localhost:3000/agendar/seu-slug
2. Selecione serviço → data → horário
3. Preencha dados (importante: WhatsApp no formato `5511999999999`)
4. Confirme → Verifique WhatsApp

### 7.4. Gerenciar no Dashboard
1. Dashboard → Agendamentos
2. Confirme/Cancele bookings
3. Verifique envio automático de WhatsApp

## 8. Deploy em Produção

### Vercel (Recomendado)
```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure env variables no dashboard:
# - Todas as do .env.local
# - DATABASE_URL e DIRECT_URL do Supabase
```

### Configurações importantes:
- Build Command: `pnpm build`
- Output Directory: `apps/web/.next`
- Install Command: `pnpm install`
- Root Directory: `.` (monorepo root)

## 9. Troubleshooting

### Erro: "Cannot find module @prisma/client"
```bash
pnpm db:generate
```

### Erro: RLS negando acesso
- Verifique se executou `rls-policies.sql`
- Confirme que `users.supabase_id` está populado corretamente

### WhatsApp não está enviando
- Verifique logs: Evolution API dashboard → Instância → Logs
- Teste manualmente: `apps/web/src/lib/whatsapp.ts` (adicione console.logs)
- Confirme que `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE` estão corretos

### Horários duplicados/conflitos
- Verifique timezone no schema (`timezone: "America/Sao_Paulo"`)
- Server Actions em `apps/web/src/app/actions/booking.ts` validam conflitos

## 10. Próximos Passos

- [ ] Implementar autenticação completa (session management)
- [ ] CRUD de serviços no dashboard
- [ ] Configurar horários de funcionamento personalizados
- [ ] Adicionar pagamentos (PIX via Mercado Pago/Stripe)
- [ ] Sistema de notificações (lembretes 24h antes)
- [ ] Multi-usuários por organização (RBAC)
- [ ] Analytics e relatórios

## Estrutura de URLs

- Landing page: `/`
- Login: `/login`
- Registro: `/register`
- Agendamento público: `/agendar/:slug`
- Dashboard: `/dashboard`
- Bookings: `/dashboard/bookings`
- Serviços: `/dashboard/services`
- WhatsApp: `/dashboard/whatsapp`
- Config: `/dashboard/settings`

## Links Úteis

- Documentação Prisma: https://www.prisma.io/docs
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Evolution API: https://doc.evolution-api.com
- Next.js App Router: https://nextjs.org/docs/app
- Shadcn/UI: https://ui.shadcn.com

## Suporte

Para dúvidas:
- GitHub Issues: [seu-repo]/issues
- Discord da comunidade
- Email: contato@easyfy.com.br

---

**AgendaZap** - Agendamento inteligente com WhatsApp automático 🚀
