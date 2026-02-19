# Instalação e Requisitos - Feature de Disponibilidade

## ✅ Pré-requisitos Já Instalados

O projeto Easyfy já possui todos os pacotes necessários:

```json
{
  "dependencies": {
    "next": "^14.2.20",
    "@prisma/client": "^5.22.0",
    "zod": "^3.x",
    "react": "^19.x",
    "date-fns": "^2.x",
    "lucide-react": "^latest"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "prisma": "^5.22.0",
    "tailwindcss": "^latest"
  }
}
```

## 🚀 Instalação (Já Incluída)

### 1. Database Migration

A migration foi criada automaticamente:

```bash
# Executada automaticamente ao rodar:
cd packages/database
pnpm db:migrate

# Ou manualmente:
pnpm db:generate  # Gerar tipos
```

### 2. Verificar Tipos Prisma

Se encontrar problemas de tipos:

```bash
# Regenerar Prisma Client:
pnpm install
pnpm db:generate

# Ou fazer limpeza completa:
rm -rf node_modules
pnpm install
```

## 📦 Estrutura de Arquivos Criados

```
easyfy/
├── packages/database/
│   ├── prisma/
│   │   ├── schema.prisma (ATUALIZADO)
│   │   └── migrations/
│   │       └── 20260218171029_crud_booking/ (NOVO)
│   └── src/
│       └── client.ts (ATUALIZADO)
│
├── apps/web/
│   └── src/
│       ├── app/
│       │   ├── actions/
│       │   │   └── availability.ts (NOVO)
│       │   └── dashboard/settings/
│       │       └── page.tsx (ATUALIZADO)
│       └── components/
│           └── availability/ (NOVO)
│               ├── availability-config.tsx
│               ├── availability-config-server.tsx
│               ├── working-hours-form.tsx
│               ├── break-time-form.tsx
│               ├── unavailable-days-section.tsx
│               └── index.ts
│
├── docs/
│   └── AVAILABILITY_FEATURE.md (NOVO)
│
└── (documentação vária)
```

## 🔄 Processo de Deploy

### Stage 1: Desenvolvimento Local
```bash
# 1. Pull das mudanças
git pull origin feature/crud-booking

# 2. Instalar dependências
pnpm install

# 3. Aplicar migration
pnpm db:migrate

# 4. Rodar servidor local
pnpm dev

# 5. Testar em http://localhost:3000/dashboard/settings
```

### Stage 2: Staging
```bash
# A migration é aplicada automaticamente via CI/CD
# Validar em https://staging.easyfy.com/dashboard/settings
```

### Stage 3: Produção
```bash
# Merge para main
# Pipeline automático aplica migration
# Feature disponível para todos os usuários
```

## 🗄️ Alterações no DB (PostgreSQL)

### Tabelas Criadas

```sql
-- Enum
CREATE TYPE "DayOfWeek" AS ENUM (
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 
  'FRIDAY', 'SATURDAY', 'SUNDAY'
);

-- Tabela working_hours
CREATE TABLE "working_hours" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"(id) ON DELETE CASCADE,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "is_working" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP,
  UNIQUE("organization_id", "dayOfWeek")
);

-- Tabela break_times
CREATE TABLE "break_times" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL UNIQUE REFERENCES "organizations"(id) ON DELETE CASCADE,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP
);

-- Tabela unavailable_days
CREATE TABLE "unavailable_days" (
  "id" UUID PRIMARY KEY,
  "organization_id" UUID NOT NULL REFERENCES "organizations"(id) ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("organization_id", date)
);
```

## 🔍 Verificação Pós-Deploy

### Checklist

- [ ] Migration aplicada sem erros
- [ ] Tabelas criadas no DB
- [ ] Tipos TypeScript gerados corretamente
- [ ] Página `/dashboard/settings` carrega
- [ ] Seção "Disponibilidade de Agendamentos" visível
- [ ] Formulários carregam dados corretamente
- [ ] Salvar horários funciona
- [ ] Adicionar/remover dias indisponíveis funciona
- [ ] Mensagens de sucesso/erro aparecem

### SQL para Validação

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('working_hours', 'break_times', 'unavailable_days');

-- Verificar dados de exemplo
SELECT * FROM working_hours LIMIT 7;
SELECT * FROM break_times LIMIT 1;
SELECT * FROM unavailable_days LIMIT 10;

-- Verificar índices
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('working_hours', 'break_times', 'unavailable_days');
```

## 🐛 Troubleshooting

### Erro: "Property 'workingHours' does not exist"

**Solução:**
```bash
# Regenerar tipos Prisma
rm -rf node_modules/.prisma
pnpm install
pnpm db:generate
```

### Erro: "Cannot find module './working-hours-form'"

**Solução:**
```bash
# Verificar se arquivo existe em src/components/availability/
ls apps/web/src/components/availability/

# Se não existir, recreate usando os comandos de criação acima
```

### Erro: "Migration not found"

**Solução:**
```bash
# Renovar migração
cd packages/database
pnpm db:migrate

# Ou resetar (⚠️ CUIDADO EM PRODUÇÃO):
pnpm prisma migrate reset  # Só em dev!
```

### Componente não renderiza

**Debug:**
```tsx
// Adicione um console.log no arquivo:
// src/components/availability/availability-config-server.tsx

export async function AvailabilityConfigServer() {
  console.log("AvailabilityConfigServer rendering");
  // ...
}
```

## 📊 Monitoramento

### Métricas de Performance

```bash
# Ver queries executadas
# Em development, Prisma loga todas as queries
# Procure por mensagens como:
# prisma:query SELECT...

# Contar registros por tabela
SELECT COUNT(*) FROM working_hours;
SELECT COUNT(*) FROM break_times;
SELECT COUNT(*) FROM unavailable_days;
```

### Logs Importantes

- `/pages/dashboard/settings` - acesso à pagina
- `server.log` - operações de banco de dados
- `client.log` - erros no navegador (F12)

## 🔐 Variáveis de Ambiente

Nenhuma variável nova é necessária. O sistema usa:

```env
# Já existentes
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

## 📚 Referências Úteis

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod Validation](https://zod.dev)
- [date-fns](https://date-fns.org)

## ✅ Checklist Final

- [x] Schema Prisma criado
- [x] Migration aplicada
- [x] Componentes criados
- [x] Server actions criadas
- [x] Integração no settings
- [x] Testes manuais OK
- [x] Documentação completa
- [x] Pronto para produção
