# 🧪 Guia de Testes - Easyfy

Exemplos práticos para testar cada funcionalidade do sistema.

## Pré-requisitos

```bash
# Variáveis de ambiente para os testes
$EVOLUTION_URL = "http://localhost:8080"
$API_KEY = "sua-api-key"
$APP_URL = "http://localhost:3000"
$ORG_SLUG = "clinica-exemplo"  # ou seu slug
```

---

## 1. Testar Evolution API

### 1.1. Verificar se está online
```powershell
curl "$EVOLUTION_URL/" | ConvertFrom-Json
# Deve retornar versão da API
```

### 1.2. Listar instâncias
```powershell
curl "$EVOLUTION_URL/instance/fetchInstances" `
  -H "apikey: $API_KEY" | ConvertFrom-Json
```

### 1.3. Verificar conexão WhatsApp
```powershell
curl "$EVOLUTION_URL/instance/connectionState/easyfy" `
  -H "apikey: $API_KEY" | ConvertFrom-Json
# Esperado: {"state": "open"}
```

### 1.4. Enviar mensagem teste
```powershell
$body = @{
  number = "5511999999999"
  textMessage = @{
    text = "🧪 Teste Easyfy"
  }
} | ConvertTo-Json

curl "$EVOLUTION_URL/message/sendText/easyfy" `
  -Method POST `
  -H "apikey: $API_KEY" `
  -H "Content-Type: application/json" `
  -Body $body
```

---

## 2. Testar Banco de Dados

### 2.1. Abrir Prisma Studio
```bash
pnpm db:studio
# Acesse: http://localhost:5555
```

### 2.2. Query SQL direto no Supabase
```sql
-- Verificar organizações
SELECT id, name, slug, whatsapp_number 
FROM organizations;

-- Verificar serviços ativos
SELECT s.name, s.price, s.duration_minutes, o.name as org_name
FROM services s
JOIN organizations o ON o.id = s.organization_id
WHERE s.active = true;

-- Últimos bookings
SELECT 
  b.cliente_nome,
  b.cliente_phone,
  b.status,
  b.whatsapp_sent,
  b.start_time,
  s.name as service,
  o.name as organization
FROM bookings b
JOIN services s ON s.id = b.service_id
JOIN organizations o ON o.id = b.organization_id
ORDER BY b.created_at DESC
LIMIT 10;
```

### 2.3. Verificar RLS
```sql
-- Ver policies ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 3. Testar API Routes do Next.js

### 3.1. Health check webhook
```powershell
curl "$APP_URL/api/webhook/whatsapp" | ConvertFrom-Json
# Esperado: {"status": "ok", "service": "easyfy-whatsapp-webhook"}
```

### 3.2. Buscar slots disponíveis
```powershell
# Ajuste orgId e serviceId baseado no seu banco
$params = @{
  orgId = "uuid-da-org"
  serviceId = "uuid-do-servico"
  date = "2026-02-20"  # Data futura
}
$query = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"

curl "$APP_URL/api/slots?$query" | ConvertFrom-Json
```

### 3.3. Simular webhook Evolution API
```powershell
$webhookBody = @{
  event = "messages.upsert"
  instance = "easyfy"
  data = @{
    key = @{
      remoteJid = "5511999999999@s.whatsapp.net"
      fromMe = $false
      id = "test123"
    }
    message = @{
      conversation = "sim"
    }
  }
} | ConvertTo-Json -Depth 5

curl "$APP_URL/api/webhook/whatsapp" `
  -Method POST `
  -H "apikey: $API_KEY" `
  -H "Content-Type: application/json" `
  -Body $webhookBody
```

---

## 4. Testar Server Actions

### 4.1. Via Chrome DevTools

1. Abra: http://localhost:3000/agendar/seu-slug
2. F12 → Console
3. Execute:

```javascript
// Simular criação de booking
async function testBooking() {
  const response = await fetch('/agendar/clinica-exemplo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: 'uuid-da-org',
      serviceId: 'uuid-do-servico',
      clientName: 'João Teste',
      clientPhone: '5511999999999',
      clientEmail: 'joao@teste.com',
      startTime: new Date('2026-02-20T10:00:00').toISOString(),
      notes: 'Teste via DevTools'
    })
  });
  
  const result = await response.json();
  console.log('Resultado:', result);
}

testBooking();
```

---

## 5. Testar Fluxo Completo (E2E Manual)

### Teste 1: Novo Usuário → Primeiro Booking

```bash
# 1. Criar conta
# Navegador: http://localhost:3000/register
# Preencha: nome, email, senha, nome do negócio

# 2. Verificar no banco
# Prisma Studio → users, organizations, organization_members

# 3. Criar serviço (via Prisma Studio)
# services → Add Record:
# - organization_id: (copie da tabela organizations)
# - name: "Consulta"
# - price: 100
# - duration_minutes: 30
# - active: true

# 4. Testar agendamento
# http://localhost:3000/agendar/seu-slug
# Selecione serviço → data → horário → preencha dados
# ⚠️ Use WhatsApp REAL para receber mensagem

# 5. Verificar WhatsApp recebido
# Abra WhatsApp e confirme mensagem chegou

# 6. Responder "sim"
# Verifique no dashboard: status mudou para CONFIRMADO
```

### Teste 2: Conflito de Horário

```bash
# 1. Crie booking para amanhã 10:00
# 2. Tente criar outro para 10:00 (mesmo serviço de 30min)
# Esperado: ❌ Erro "Este horário já está ocupado"

# 3. Tente 10:30 (após o primeiro)
# Esperado: ✅ Sucesso
```

### Teste 3: Auto-confirmação via WhatsApp

```bash
# 1. Crie booking com seu WhatsApp
# 2. Aguarde mensagem chegar
# 3. Responda: "confirmo"
# 4. Verifique dashboard: 
#    - Status mudou para CONFIRMADO
#    - Veja logs no terminal: "[Webhook] Booking xxx confirmed"

# 5. Teste cancelamento
# - Crie novo booking
# - Responda: "cancelar"
# - Verifique status: CANCELADO
```

---

## 6. Testes de Performance

### 6.1. Criar múltiplos bookings

```powershell
# Script para stress test (cuidado: usa quota do WhatsApp!)
$serviceId = "uuid-do-servico"
$orgId = "uuid-da-org"

1..10 | ForEach-Object {
  $phone = "55119999$($_.ToString('D5'))"
  $hour = 8 + $_
  
  # Criar via curl (adapte para seu endpoint)
  Write-Host "Criando booking #$_ para ${hour}:00"
  Start-Sleep -Seconds 2
}
```

### 6.2. Verificar tempos de resposta

```powershell
Measure-Command {
  curl "$APP_URL/agendar/$ORG_SLUG"
}
# Esperado: < 500ms (primeira request pode ser mais lenta)
```

---

## 7. Testes de Segurança

### 7.1. RLS funcionando?

```sql
-- Execute no Supabase SQL Editor

-- Como usuário anônimo (deve retornar 0)
SET LOCAL ROLE anon;
SELECT count(*) FROM bookings;
-- Esperado: 0

-- Reset
RESET ROLE;
```

### 7.2. Tentar acessar org de outro usuário

```javascript
// No console do navegador (logado como User A)
fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId: 'uuid-de-outra-org',  // Org do User B
    // ... outros campos
  })
}).then(r => r.json()).then(console.log);

// Esperado: Erro 403 ou booking não criado
```

### 7.3. Verificar headers sensíveis

```powershell
# Service Role Key não deve aparecer no browser
curl "$APP_URL/agendar/$ORG_SLUG" -I | Select-String "service"
# Esperado: Nada relacionado a keys
```

---

## 8. Testes de UI/UX

### Checklist Manual:

- [ ] Landing page carrega em < 2s
- [ ] Botões têm hover states
- [ ] Mobile responsivo (F12 → Toggle device)
- [ ] Calendário funciona no touch (celular)
- [ ] Formulário valida campos antes de enviar
- [ ] Mensagens de erro são claras
- [ ] Loading states aparecem (spinners, disable buttons)
- [ ] Dark mode funciona (se implementado)
- [ ] Links estão corretos (sem 404)
- [ ] Imagens carregam (se houver)

---

## 9. Monitoramento em Produção

### 9.1. Logs Vercel

```bash
# Instalar CLI
npm i -g vercel

# Ver logs em tempo real
vercel logs --follow
```

### 9.2. Supabase Logs

1. Dashboard → Logs → API
2. Filtrar por: `method:POST path:/rest/v1/bookings`
3. Verificar erros 4xx/5xx

### 9.3. Evolution API Logs

```bash
# Docker
docker logs -f evolution-api --tail 100

# PM2
pm2 logs evolution-api
```

---

## 10. Rollback / Disaster Recovery

### Reverter schema do banco

```bash
# Criar backup antes de mudanças
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Reverter Prisma
git log -- packages/database/prisma/schema.prisma
git checkout <commit-hash> -- packages/database/prisma/schema.prisma
pnpm db:push --force-reset  # ⚠️ CUIDADO: Reseta dados!
```

### Reverter deploy

```bash
# Vercel
vercel rollback
```

---

## Comandos Úteis de Debug

```powershell
# Ver variáveis de ambiente carregadas
Get-Content apps/web/.env.local

# Verificar porta em uso
netstat -ano | findstr :3000

# Limpar cache Next.js
Remove-Item -Recurse apps/web/.next

# Rebuild completo
pnpm clean
pnpm install
pnpm db:generate
pnpm build
```

---

## Onde Buscar Ajuda

1. **Logs do terminal** - Sempre primeiro lugar
2. **Browser DevTools** - Console, Network tab
3. **Prisma Studio** - Ver dados reais no banco
4. **Supabase Logs** - Erros de RLS/Auth
5. **Evolution API Dashboard** - Status da conexão
6. **CHECKLIST.md** - Validar setup passo a passo
7. **WHATSAPP_GUIDE.md** - Troubleshooting específico

---

**Bons testes! 🚀**
