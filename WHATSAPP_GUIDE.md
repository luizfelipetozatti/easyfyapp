# 📱 Guia Completo: Integração WhatsApp com Evolution API

## Índice
1. [O que é Evolution API](#o-que-é-evolution-api)
2. [Instalação e Setup](#instalação-e-setup)
3. [Configuração no Easyfy](#configura%C3%A7%C3%A3o-no-easyfy)
4. [Templates de Mensagem](#templates-de-mensagem)
5. [Webhook e Eventos](#webhook-e-eventos)
6. [Troubleshooting](#troubleshooting)

---

## O que é Evolution API

Evolution API é uma API REST para integração com WhatsApp via WhatsApp Web Protocol (Baileys). Permite:
- Enviar mensagens de texto, imagens, documentos
- Receber mensagens via webhook
- Gerenciar múltiplas conexões/instâncias
- Status de leitura e entrega

**Alternativas**: Twilio API, Meta Business API, WAHA, Baileys direto (mais complexo)

---

## Instalação e Setup

### Opção 1: Docker (Recomendado para Desenvolvimento)

```bash
# Baixar e rodar container
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-forte-aqui \
  -e DEL_INSTANCE=false \
  atendai/evolution-api:latest
```

Acesse: http://localhost:8080/manager

### Opção 2: Railway (Cloud - Grátis para começar)

1. Acesse https://railway.app
2. Login com GitHub
3. New Project → Deploy from GitHub
4. Selecione: https://github.com/EvolutionAPI/evolution-api-railway
5. Configure variável:
   - `AUTHENTICATION_API_KEY`: sua-chave-forte
6. Aguarde deploy (3-5 min)
7. Copie URL gerada (ex: `https://evolution-api-production-xxxx.up.railway.app`)

### Opção 3: VPS/Servidor Próprio

```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configurar .env
cp .env.example .env
nano .env  # Edite AUTHENTICATION_API_KEY

# Instalar e rodar
npm install
npm run build
npm run start:prod

# (Opcional) PM2 para manter rodando
npm install -g pm2
pm2 start dist/src/main.js --name evolution-api
pm2 save
```

---

## Configuração no Easyfy

### Passo 1: Criar Instância WhatsApp

```bash
# Substitua os valores
EVOLUTION_URL="http://localhost:8080"
API_KEY="sua-chave-aqui"

curl -X POST "$EVOLUTION_URL/instance/create" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "easyfy",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta esperada:**
```json
{
  "instance": {
    "instanceName": "agendazap",
    "status": "created"
  },
  "qrcode": {
    "base64": "data:image/png;base64,..."
  }
}
```

### Passo 2: Conectar WhatsApp

**Opção A: Via Browser (mais fácil)**
1. Acesse: `http://localhost:8080/instance/connect/easyfy`
2. Abra WhatsApp no celular
3. Toque em **⋮** (menu) → **Aparelhos conectados** → **Conectar aparelho**
4. Escaneie QR Code mostrado no browser
5. Aguarde "Connected"

**Opção B: Salvar QR Code e escanear**
```bash
# Buscar QR code novamente
curl -X GET "$EVOLUTION_URL/instance/qrcode/easyfy" \
  -H "apikey: $API_KEY" | jq -r '.qrcode.base64' | base64 -d > qrcode.png
```

### Passo 3: Verificar Conexão

```bash
curl -X GET "$EVOLUTION_URL/instance/connectionState/easyfy" \
  -H "apikey: $API_KEY"
```

**Resposta esperada:**
```json
{
  "instance": "easyfy",
  "state": "open"
}
```

Status possíveis:
- `open` ✅ - Conectado
- `connecting` ⏳ - Conectando
- `close` ❌ - Desconectado

### Passo 4: Configurar Webhook

```bash
# Produção: Use sua URL vercel/railway
# Desenvolvimento: Use ngrok (veja abaixo)
WEBHOOK_URL="https://seu-dominio.vercel.app/api/webhook/whatsapp"

curl -X POST "$EVOLUTION_URL/webhook/set/easyfy" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'"$WEBHOOK_URL"'",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE"
    ]
  }'
```

#### Usando ngrok para desenvolvimento local:

```bash
# Instalar ngrok: https://ngrok.com/download
# Rodar projeto: pnpm dev
# Em outro terminal:
ngrok http 3000

# Copie URL gerada (ex: https://abc123.ngrok.io)
# Use no webhook: https://abc123.ngrok.io/api/webhook/whatsapp
```

### Passo 5: Configurar .env.local

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-aqui
EVOLUTION_INSTANCE=easyfy
```

---

## Templates de Mensagem

Localização: `apps/web/src/lib/whatsapp.ts`

### Template de Confirmação
```typescript
export function buildBookingConfirmationMessage(data: BookingMessageData): string {
  return [
    `Olá ${data.clientName}! 👋`,
    ``,
    `Seu agendamento para *${data.serviceName}* na data *${formattedDate}* foi recebido!`,
    ``,
    `📍 *${data.organizationName}*`,
    `💰 Valor: ${priceFormatted}`,
    ``,
    `Pague o PIX para confirmar sua reserva.`,
    ``,
    `_Mensagem automática - Easyfy_`,
  ].join("\n");
}
```

### Personalizar Mensagens

Edite as funções em `whatsapp.ts`:
- `buildBookingConfirmationMessage()` - Enviada ao criar booking
- `buildBookingCancellationMessage()` - Enviada ao cancelar
- `buildBookingReminderMessage()` - Enviada 24h antes (implementar cronjob)

---

## Webhook e Eventos

### Como Funciona

1. Cliente envia mensagem no WhatsApp
2. Evolution API recebe e envia POST para `/api/webhook/whatsapp`
3. Easyfy processa e responde automaticamente

### Payload do Webhook

```json
{
  "event": "messages.upsert",
  "instance": "agendazap",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0..."
    },
    "message": {
      "conversation": "sim"
    }
  }
}
```

### Lógica de Auto-Confirmação

Código em: `apps/web/src/app/api/webhook/whatsapp/route.ts`

```typescript
const confirmKeywords = ["sim", "confirmo", "ok", "confirmar"];
const cancelKeywords = ["cancelar", "cancela", "não", "nao"];

if (confirmKeywords.some((kw) => text.includes(kw))) {
  // Atualiza status para CONFIRMADO
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMADO" }
  });
}
```

**Adicionar mais keywords:**
- Para confirmação: adicione em `confirmKeywords`
- Para cancelamento: adicione em `cancelKeywords`

---

## Troubleshooting

### ❌ Erro: "Connection refused" ao enviar mensagem

**Causa**: Evolution API não está rodando ou URL incorreta

**Solução**:
```bash
# Verificar se está rodando
docker ps | grep evolution
# ou
curl http://localhost:8080/

# Reiniciar
docker restart evolution-api
```

### ❌ WhatsApp desconectou sozinho

**Causa**: Sessão expirada ou WhatsApp deslogado no celular

**Solução**:
```bash
# Verificar estado
curl -X GET "$EVOLUTION_URL/instance/connectionState/agendazap" \
  -H "apikey: $API_KEY"

# Se "close", reconectar
curl -X GET "$EVOLUTION_URL/instance/connect/easyfy" \
  -H "apikey: $API_KEY"
# Escaneie novo QR Code
```

### ❌ Mensagem não está sendo enviada

**Debug passo a passo:**

1. **Verificar logs do Next.js**
```bash
# Procure por [WhatsApp] no terminal
# Deve aparecer: "[WhatsApp] Message sent to 5511999999999"
```

2. **Testar envio manual**
```bash
curl -X POST "$EVOLUTION_URL/message/sendText/easyfy" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "textMessage": {
      "text": "Teste manual"
    }
  }'
```

3. **Verificar formato do número**
- ✅ Correto: `5511999999999` (código país + DDD + número)
- ❌ Errado: `11999999999`, `+55 11 99999-9999`

4. **Verificar variáveis de ambiente**
```bash
# No terminal do Next.js, adicione console.log
console.log({
  url: process.env.EVOLUTION_API_URL,
  key: process.env.EVOLUTION_API_KEY ? '***SET***' : 'MISSING',
  instance: process.env.EVOLUTION_INSTANCE
});
```

### ❌ Webhook não está recebendo eventos

**Causa**: Firewall, URL incorreta, ou webhook não configurado

**Solução**:

1. **Verificar webhook configurado**
```bash
curl -X GET "$EVOLUTION_URL/webhook/find/easyfy" \
  -H "apikey: $API_KEY"
```

2. **Testar endpoint manualmente**
```bash
# Simular evento
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "easyfy",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false
      },
      "message": {"conversation": "teste"}
    }
  }'

# Deve retornar: {"received": true}
```

3. **Ngrok expirou**
```bash
# URL gratuita do ngrok expira após 8h
# Reinicie ngrok e atualize webhook
ngrok http 3000
# Copie nova URL e execute novamente POST /webhook/set
```

### ❌ Erro: "Rate limit exceeded"

**Causa**: Muitas mensagens em pouco tempo

**Solução**:
- Evolution API tem limites do WhatsApp (não mais que ~5 msgs/seg)
- Adicione delay entre envios em produção
- Use queue system (Bull, BullMQ) para mensagens em lote

---

## Boas Práticas

### ✅ Segurança

1. **Nunca exponha API Key no frontend**
   - Use apenas em Server Actions ou API Routes
   - Rotacione key regularmente

2. **Valide webhook com API key**
   ```typescript
   const apiKey = request.headers.get("apikey");
   if (apiKey !== process.env.EVOLUTION_API_KEY) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

3. **Rate limiting**
   - Use middleware para limitar requisições ao webhook
   - Evite loops infinitos de mensagens

### ✅ Confiabilidade

1. **Fire-and-forget para não bloquear**
   ```typescript
   // ✅ Bom: não bloqueia criação do booking
   sendBookingConfirmation(data).catch(console.error);
   
   // ❌ Ruim: booking falha se WhatsApp falhar
   await sendBookingConfirmation(data);
   ```

2. **Logs detalhados**
   ```typescript
   console.log(`[WhatsApp] Sending to ${phone}: ${text.substring(0, 50)}...`);
   ```

3. **Retry logic**
   - Implemente retentativas com exponential backoff
   - Salve mensagens falhas em tabela `failed_messages`

### ✅ UX

1. **Confirmação visual**
   - Mostre status "WhatsApp enviado" no dashboard
   - Badge verde quando `whatsapp_sent = true`

2. **Fallback**
   - Se WhatsApp falhar, envie email como backup
   - Notifique admin no dashboard

3. **Templates claros**
   - Use emojis mas com moderação
   - Formate datas em português (date-fns com locale ptBR)
   - Inclua link para cancelar/reagendar

---

## Recursos Adicionais

- **Documentação Evolution API**: https://doc.evolution-api.com
- **Grupo WhatsApp Suporte**: (verificar docs oficiais)
- **GitHub Issues**: https://github.com/EvolutionAPI/evolution-api/issues
- **Discord Comunidade**: (link na doc oficial)

---

## Próximos Passos

- [ ] Implementar envio de imagens (logo da clínica)
- [ ] Adicionar botões interativos (WhatsApp Business API)
- [ ] Sistema de lembretes automáticos (cronjob)
- [ ] Histórico de mensagens no dashboard
- [ ] Multi-atendente (distribuir conversas)

---

**Precisa de ajuda?** Acesse CHECKLIST.md para validar cada etapa.
