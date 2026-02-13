# ✅ Checklist de Validação - AgendaZap

Use este checklist para garantir que tudo está configurado corretamente.

## 1. Instalação Base

- [ ] Node.js 20+ instalado (`node -v`)
- [ ] pnpm instalado (`pnpm -v`)
- [ ] Dependências instaladas (`pnpm install` sem erros)
- [ ] Build TypeScript funcionando (`pnpm type-check` em apps/web)

## 2. Supabase

- [ ] Projeto criado no Supabase
- [ ] Email Auth habilitado (Settings → Authentication → Providers)
- [ ] Credenciais copiadas para `.env.local`
- [ ] Connection strings configuradas (DATABASE_URL e DIRECT_URL)

## 3. Banco de Dados

- [ ] Schema Prisma gerado (`pnpm db:generate`)
- [ ] Tabelas criadas no Supabase (`pnpm db:push`)
- [ ] RLS policies aplicadas (executou `rls-policies.sql` no SQL Editor)
- [ ] Seed executado (opcional: `pnpm --filter @agendazap/database db:seed`)

### Validar RLS:
```sql
-- Execute no Supabase SQL Editor para verificar policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Deve retornar policies para: `bookings`, `organizations`, `organization_members`, `services`, `users`

## 4. Evolution API (WhatsApp)

- [ ] Evolution API rodando e acessível
- [ ] Instância `agendazap` criada
- [ ] QR Code escaneado (WhatsApp conectado)
- [ ] Webhook configurado apontando para `/api/webhook/whatsapp`
- [ ] Variáveis configuradas no `.env.local`:
  - `EVOLUTION_API_URL`
  - `EVOLUTION_API_KEY`
  - `EVOLUTION_INSTANCE`

### Validar WhatsApp:
```bash
# Testar conexão com a API
curl -X GET https://sua-evolution-api.com/instance/connectionState/agendazap \
  -H "apikey: sua-api-key"

# Deve retornar: {"state": "open"}
```

## 5. Aplicação Next.js

- [ ] App rodando sem erros (`pnpm dev`)
- [ ] Landing page carregando (http://localhost:3000)
- [ ] Não há erros no console do navegador
- [ ] Tailwind CSS aplicado corretamente

## 6. Fluxo de Autenticação

- [ ] Página de registro acessível (/register)
- [ ] Consegue criar nova conta
- [ ] Email de confirmação recebido (se habilitado)
- [ ] Login funciona (/login)
- [ ] Middleware redireciona corretamente (login → dashboard, dashboard → login)
- [ ] Dashboard carrega após login (/dashboard)

### Validar no Supabase:
- [ ] Usuário aparece em Authentication → Users
- [ ] Registro criado na tabela `users` (SQL Editor ou Table Editor)
- [ ] Organização criada na tabela `organizations`
- [ ] Membership criado em `organization_members` com role OWNER

## 7. Agendamento Público

- [ ] Identifique o slug da sua organização (Supabase → organizations.slug)
- [ ] Acesse /agendar/[seu-slug]
- [ ] Página carrega com serviços listados
- [ ] Calendário renderiza corretamente
- [ ] Consegue selecionar data e horário
- [ ] Formulário valida campos obrigatórios
- [ ] Ao submeter, booking é criado no banco

### Validar no banco:
```sql
-- Verificar últimos bookings
SELECT 
  b.id,
  b.cliente_nome,
  b.cliente_phone,
  b.status,
  b.whatsapp_sent,
  s.name as service_name,
  o.name as org_name
FROM bookings b
JOIN services s ON s.id = b.service_id
JOIN organizations o ON o.id = b.organization_id
ORDER BY b.created_at DESC
LIMIT 5;
```

## 8. WhatsApp Automático

- [ ] Após criar booking, mensagem é enviada no WhatsApp do cliente
- [ ] Cliente recebe confirmação com dados do agendamento
- [ ] Flag `whatsapp_sent` é atualizada para `true` no banco
- [ ] Responder "sim" confirma o booking (status PENDENTE → CONFIRMADO)
- [ ] Responder "cancelar" cancela o booking (status → CANCELADO)

### Debugging WhatsApp:
- [ ] Verificar logs no terminal do Next.js (`[WhatsApp]` prefixo)
- [ ] Verificar logs na Evolution API (dashboard ou container logs)
- [ ] Webhook está recebendo eventos (check nos logs)

## 9. Dashboard Administrativo

- [ ] Visão geral mostra KPIs corretos
- [ ] Página de bookings lista todos os agendamentos
- [ ] Consegue confirmar/cancelar bookings manualmente
- [ ] Página de serviços lista serviços configurados
- [ ] Página de configurações mostra dados da organização
- [ ] Logout funciona

## 10. Testes Críticos

### Teste A: Agendamento Completo
1. Acesse /agendar/seu-slug
2. Selecione serviço
3. Escolha data futura e horário disponível
4. Preencha formulário (WhatsApp válido: 5511999999999)
5. Confirme
6. **Resultado esperado**: 
   - ✅ Mensagem "Agendamento realizado"
   - ✅ WhatsApp recebido no celular
   - ✅ Booking aparece no dashboard com status PENDENTE

### Teste B: Conflito de Horário
1. Crie um booking para amanhã às 10:00 (30min)
2. Tente criar outro para o mesmo horário
3. **Resultado esperado**: ❌ Erro "horário já ocupado"

### Teste C: Confirmação via WhatsApp
1. Cliente responde "sim" na mensagem recebida
2. **Resultado esperado**: 
   - ✅ Status muda para CONFIRMADO no dashboard
   - ✅ Log no terminal: `[Webhook] Booking xxx confirmed via WhatsApp`

## 11. Performance e Segurança

- [ ] RLS impede acesso a dados de outras organizações
- [ ] Service Role Key não está exposto no frontend
- [ ] Middleware protege rotas /dashboard/*
- [ ] Server Actions validam inputs com Zod
- [ ] Não há credenciais hardcoded no código

## 12. Deploy (Produção)

- [ ] Build produção funciona (`pnpm build`)
- [ ] Vercel/Railway configurado
- [ ] Variáveis de ambiente definidas no provider
- [ ] DATABASE_URL usa connection pooling (port 6543)
- [ ] NEXT_PUBLIC_APP_URL aponta para domínio correto
- [ ] Webhook Evolution API atualizado com URL de produção
- [ ] SSL/HTTPS ativo

---

## Troubleshooting Rápido

### ❌ Erro: "Cannot find module @prisma/client"
```bash
pnpm db:generate
```

### ❌ RLS negando acesso
Execute novamente `rls-policies.sql` no Supabase SQL Editor

### ❌ WhatsApp não envia
1. Verifique estado da conexão Evolution API
2. Confirme que variáveis EVOLUTION_* estão corretas
3. Teste manualmente via curl (veja SETUP.md)

### ❌ Horários não aparecem
Verifique:
- Service existe e está `active: true`
- Data selecionada é futura
- Não é domingo (desabilitado por padrão)

### ❌ Login não funciona
1. Verifique se usuário foi criado no Supabase Auth
2. Confirme que senha atende requisitos mínimos (6 chars)
3. Check logs do middleware no terminal

---

**Se todos os checkboxes estão marcados: 🎉 Parabéns! AgendaZap está operacional!**
