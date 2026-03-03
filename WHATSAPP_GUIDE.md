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

## Pré-requisitos da Evolution API

> ⚠️ A Evolution API v2 **requer** PostgreSQL e Redis para funcionar corretamente em produção.
> Sem eles, as sessões WhatsApp são perdidas a cada restart do servidor.

### PostgreSQL
A Evolution API usa PostgreSQL (via Prisma) para persistir instâncias, mensagens e contatos.
Variáveis necessárias **no servidor da Evolution API**:

```env
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:senha@localhost:5432/evolution?schema=public
DATABASE_CONNECTION_CLIENT_NAME=evolution_easyfy
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true
```

### Redis
O Redis é usado como cache para melhorar o desempenho e armazenar estado das conexões.
Variáveis necessárias **no servidor da Evolution API**:

```env
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://localhost:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_SAVE_INSTANCES=false
CACHE_LOCAL_ENABLED=false
```

> 📌 **Importante**: essas variáveis são para o processo da Evolution API, NÃO para o `.env.local` do Easyfy.
> O Easyfy só precisa de `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE`.

---

## Instalação e Setup

### Opção 1: Docker Compose (Recomendado — inclui PostgreSQL e Redis)

Crie um arquivo `docker-compose.yml` em um diretório separado (ex: `~/evolution-api/`):

```yaml
version: "3.9"

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - evolution-postgres
      - evolution-redis
    environment:
      # Autenticação
      AUTHENTICATION_API_KEY: "sua-chave-forte-aqui"
      DEL_INSTANCE: "false"

      # PostgreSQL
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution_pass@evolution-postgres:5432/evolution?schema=public"
      DATABASE_CONNECTION_CLIENT_NAME: "evolution_easyfy"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "true"
      DATABASE_SAVE_MESSAGE_UPDATE: "true"
      DATABASE_SAVE_DATA_CONTACTS: "true"
      DATABASE_SAVE_DATA_CHATS: "true"
      DATABASE_SAVE_DATA_LABELS: "true"
      DATABASE_SAVE_DATA_HISTORIC: "true"

      # Redis
      CACHE_REDIS_ENABLED: "true"
      CACHE_REDIS_URI: "redis://evolution-redis:6379/6"
      CACHE_REDIS_PREFIX_KEY: "evolution"
      CACHE_REDIS_SAVE_INSTANCES: "false"
      CACHE_LOCAL_ENABLED: "false"

  evolution-postgres:
    image: postgres:15
    container_name: evolution-postgres
    restart: always
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution_pass
      POSTGRES_DB: evolution
    volumes:
      - evolution_pg_data:/var/lib/postgresql/data

  evolution-redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: always
    volumes:
      - evolution_redis_data:/data

volumes:
  evolution_pg_data:
  evolution_redis_data:
```

Subir os serviços:

```bash
docker-compose up -d
```

Acesse: http://localhost:8080/manager

> ✅ Com este setup, sessões e dados persistem mesmo após reiniciar os containers.

### Opção 2: Railway (Cloud - Grátis para começar)

1. Acesse https://railway.app
2. Login com GitHub
3. New Project → Deploy from GitHub
4. Selecione: https://github.com/EvolutionAPI/evolution-api-railway
5. No mesmo projeto, adicione os serviços de banco via **+ New → Database**:
   - Adicione **PostgreSQL**
   - Adicione **Redis**
6. Clique no serviço **Redis** → aba **Variables** → copie o valor de `REDIS_URL` (ex: `redis://default:SENHA@junction.proxy.rlwy.net:PORT`)
7. Clique no serviço **PostgreSQL** → aba **Variables** → copie o valor de `DATABASE_URL`
8. Vá em **Variables** do serviço `evolution-api` e configure:

   ```
   AUTHENTICATION_API_KEY=sua-chave-forte

   # PostgreSQL (cole a DATABASE_URL do serviço PostgreSQL)
   DATABASE_ENABLED=true
   DATABASE_PROVIDER=postgresql
   DATABASE_CONNECTION_URI=postgresql://postgres:SENHA@HOST:PORT/railway
   DATABASE_CONNECTION_CLIENT_NAME=evolution_easyfy
   DATABASE_SAVE_DATA_INSTANCE=true
   DATABASE_SAVE_DATA_NEW_MESSAGE=true
   DATABASE_SAVE_MESSAGE_UPDATE=true
   DATABASE_SAVE_DATA_CONTACTS=true
   DATABASE_SAVE_DATA_CHATS=true
   DATABASE_SAVE_DATA_LABELS=true
   DATABASE_SAVE_DATA_HISTORIC=true

   # Redis (cole a REDIS_URL do serviço Redis, SEM /6 no final)
   CACHE_REDIS_ENABLED=true
   CACHE_REDIS_URI=redis://default:SENHA@HOST:PORT
   CACHE_REDIS_PREFIX_KEY=evolution
   CACHE_REDIS_SAVE_INSTANCES=false
   CACHE_LOCAL_ENABLED=false
   ```

   > ⚠️ **Cole os valores reais** copiados nas etapas 6 e 7 — não use as variáveis de referência `${{Redis.REDIS_URL}}` concatenadas com `/6`. O Railway expande referências, mas concatenar um path pode gerar URL inválida dependendo da versão.

   > ⚠️ **`CACHE_REDIS_URI` sem `/6`**: o pacote `redis` (node-redis v4) usado pela Evolution API aceita URLs sem o índice de banco — ele usa o banco `0` por padrão, o que funciona corretamente. Adicionar `/6` só é necessário se você precisar isolar dados em um banco específico.

   > ⚠️ **TLS (`rediss://`)**: Se o Railway fornecer uma URL com `rediss://` (dois `s`), a Evolution API v2.3.7 suporta automaticamente via node-redis v4 — não é necessário ajuste adicional.

9. Aguarde novo deploy (3-5 min)
10. Copie a URL pública gerada (ex: `https://evolution-api-production-xxxx.up.railway.app`)

> ✅ Com PostgreSQL e Redis configurados corretamente, as sessões WhatsApp persistem entre deployments.

#### Verificando se o Redis conectou

Nos logs do serviço `evolution-api` no Railway, procure por:
```
# ✅ Sucesso:
[Redis] redis ready

# ❌ Falha (URL errada ou Redis inacessível):
[Redis] redis disconnected
```

Se aparecer `redis disconnected`, verifique:
1. `CACHE_REDIS_URI` está preenchido com o valor real (não vazio, não com variável de referência não expandida)
2. O serviço Redis está rodando (aba **Deployments** do serviço Redis no Railway)
3. A URL começa com `redis://` ou `rediss://`

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
    "instanceName": "easyfy",
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
  "instance": "easyfy",
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

### ❌ WhatsApp desconectou sozinho (ou após restart)

**Causa 1**: PostgreSQL ou Redis não configurados na Evolution API

> Sem banco de dados, a Evolution API usa armazenamento local efêmero. Ao reiniciar o container, toda a sessão é perdida.

**Solução**: Verifique se a Evolution API está rodando com PostgreSQL e Redis (veja seção "Pré-requisitos da Evolution API" acima). Use o docker-compose recomendado.

```bash
# Verificar se as variáveis de banco estão ativas nos logs do container
docker logs evolution-api | grep -i "database\|redis"
```

**Causa 2**: Sessão expirada ou WhatsApp deslogado no celular

**Solução**:
```bash
# Verificar estado
curl -X GET "$EVOLUTION_URL/instance/connectionState/easyfy" \
  -H "apikey: $API_KEY"

# Se "close", reconectar
curl -X GET "$EVOLUTION_URL/instance/connect/easyfy" \
  -H "apikey: $API_KEY"
# Escaneie novo QR Code
```

### ❌ Erro: `[Redis] redis disconnected` nos logs

**Causa**: A variável `CACHE_REDIS_URI` está vazia, com formato inválido ou a conexão está sendo recusada.

Este erro vem do handler `client.on('error', ...)` do node-redis v4 — qualquer falha de conexão dispara esse log.

**Checklist de diagnóstico:**

1. **Verifique se a variável está realmente preenchida no ambiente:**
   ```bash
   # No container Docker:
   docker exec evolution-api env | grep CACHE_REDIS
   
   # No Railway: Settings → Variables → confirme que CACHE_REDIS_URI não está vazio
   ```

2. **Formato correto da URL:**
   ```
   # ✅ Correto (sem /6 é aceito, usa banco 0 por padrão):
   redis://default:SENHA@HOST:PORT

   # ✅ Correto com TLS (Railway public URL):
   rediss://default:SENHA@HOST:PORT

   # ❌ Errado (variável de referência não expandida):
   ${{Redis.REDIS_URL}}

   # ❌ Errado (host/porta incorretos):
   redis://localhost:6379
   ```

3. **No Railway**: copie o valor de `REDIS_URL` diretamente do serviço Redis (aba Variables) e cole como valor literal em `CACHE_REDIS_URI` no serviço evolution-api.

4. **Confirme que o serviço Redis está ativo** no Railway (aba Deployments do serviço Redis deve mostrar "Active").

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
