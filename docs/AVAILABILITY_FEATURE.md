# Guia de Implementação - Disponibilidade de Agendamentos

## Visão Geral

A feature de **Disponibilidade de Agendamentos** permite que donos e membros da organização configurem:
- Dias e horários de funcionamento por dia da semana
- Intervalos de almoço (aplicados a todos os dias)
- Dias específicos de indisponibilidade (férias, feriados, etc.)

## Arquitetura

### 1. Modelo de Dados (Prisma)

Três novas tabelas foram criadas:

#### `WorkingHours`
```sql
- id: UUID (PK)
- organizationId: UUID (FK -> Organization)
- dayOfWeek: ENUM (MONDAY-SUNDAY)
- startTime: TEXT (HH:mm)
- endTime: TEXT (HH:mm)
- isWorking: BOOLEAN (default: true)
```

**Constraint**: `UNIQUE(organizationId, dayOfWeek)`

#### `BreakTime`
```sql
- id: UUID (PK)
- organizationId: UUID (FK -> Organization, UNIQUE)
- startTime: TEXT (HH:mm)
- endTime: TEXT (HH:mm)
```

#### `UnavailableDay`
```sql
- id: UUID (PK)
- organizationId: UUID (FK -> Organization)
- date: DATE
- reason: TEXT (nullable)
```

**Constraint**: `UNIQUE(organizationId, date)`

### 2. Server Actions

Arquivo: `src/app/actions/availability.ts`

#### `getAvailabilityConfig()`
- **Entrada**: Nenhuma (usa contexto do usuário)
- **Saída**: `{ success: true, data: { workingHours, breakTime, unavailableDays } }`
- **Descrição**: Busca toda a configuração de disponibilidade

#### `updateWorkingHours(prevState, formData)`
- **Entrada**: FormData com campos `{day}-isWorking`, `{day}-startTime`, `{day}-endTime` para cada dia
- **Validação**: Zod - valida horários e garante que término > início
- **Efeito**: UPSERT para cada dia da semana

#### `updateBreakTime(prevState, formData)`
- **Entrada**: FormData com `breakStartTime` e `breakEndTime`
- **Validação**: Zod - garante que término > início
- **Efeito**: UPSERT do intervalo único por organização

#### `addUnavailableDay(prevState, formData)`
- **Entrada**: FormData com `date` (format ISO) e `reason` (opcional)
- **Validação**: Zod + validação de data no passado
- **Efeito**: CREATE novo dia

#### `removeUnavailableDay(prevState, dayId)`
- **Entrada**: ID do dia não disponível
- **Validação**: Verifica propriedade da organização
- **Efeito**: DELETE dia

### 3. Componentes React

Arquivo: `src/components/availability/`

#### `AvailabilityConfig` (componente raiz)
- Coordena estado e transitions
- Renderiza os três formulários principais
- Gerencia toast messages

#### `WorkingHoursForm`
- 7 cards (um por dia da semana)
- Checkbox para "Trabalhando"
- Inputs de time (desabilitados se checkbox unchecked)
- Defaults: Segunda-Sexta (08:00-17:00), Sábado-Domingo desativado

#### `BreakTimeForm`
- Dois inputs de time (início e fim)
- Mensagem explicativa
- Hint para usuários

#### `UnavailableDaysSection`
- Formulário para adicionar dias
- Lista de dias já configurados
- Botão para remover dias
- Otimistic updates

### 4. Integração na UI

Localização: `src/app/dashboard/settings/page.tsx`

```tsx
<div>
  <h2 className="mb-4 text-xl font-semibold">Disponibilidade de Agendamentos</h2>
  <AvailabilityConfigServer />
</div>
```

## Padrões de Design Utilizados

### 1. Server Actions Pattern
- Separação clara entre lógica servidor e cliente
- Segurança: autenticação validada no servidor
- Validação com Zod no servidor

### 2. Form Action Pattern
- Uso de FormData para envio eficiente
- Transições com `useTransition` para feedback visual
- Revalidação automática com `revalidatePath`

### 3. Optimistic Updates
- Dias indisponíveis removem imediatamente da UI
- Se falhar, são restaurados
- Melhor UX

### 4. Component Composition
- AvailabilityConfig gerencia estado compartilhado
- Componentes filhos são dumb (recebem props)
- Fácil manutenção e teste

## Padrões UI/UX

### Design System
- Consistência com o design system Easyfy
- Cards para seções lógicas
- Badges para status
- Icons do lucide-react
- Cores: success (green), error (red), info (blue)

### Acessibilidade
- Labels associados aos inputs
- Inputs desabilitados quando não aplicável
- Mensagens de erro claras
- Confirmações de sucesso visíveis

### Responsividade
- Grid `grid-cols-1 md:grid-cols-2` para formulários
- Elementos adaptáveis em mobile
- Overflow handling correto

## Configuração Padrão

Ao criar uma organização, os WorkingHours são criados com:
```
Monday-Friday: 08:00-17:00 (isWorking: true)
Saturday-Sunday: 08:00-17:00 (isWorking: false)
```

BreakTime: 12:00-13:00

## Segurança

1. **Autenticação**: Via `getCurrentUserOrgId()`
2. **Autorização**: Validação de propriedade da org em todas as operações
3. **Validação**: Zod schemas em todas as entradas
4. **Sanitização**: Não há entrada direta de HTML

## Performance

1. **Queries Paralelos**: Usa Promise.all em getAvailabilityConfig
2. **Índices**: `organizationId` indexado em todos os modelos
3. **Unique Constraints**: Previne duplicatas
4. **Transições**: useTransition para UI responsiva

## Mudanças Futuras Recomendadas

1. **Recorrência de Indisponibilidade**: Suportar padrões como "todo dia X de cada mês"
2. **Múltiplos Períodos de Trabalho**: Permitir dois períodos diferentes (ex: 08:00-12:00 e 14:00-18:00)
3. **Regras por Serviço**: Disponibilidade diferentes por tipo de serviço
4. **Timezones**: Suportar múltiplos fusos horários
5. **Validação de Slot Dinâmica**: Integração com booking system para validação em tempo real

## Testes Recomendados

1. Validação de horários (fim > início)
2. Criação de duplicatas de dias indisponíveis
3. Remoção de dias indisponíveis incorretos
4. Autenticação em diferentes roles (owner vs member)
5. Integração com calendar picker para melhor UX
