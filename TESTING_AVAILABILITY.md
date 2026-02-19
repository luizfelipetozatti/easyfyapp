# Guia de Testes - Feature de Disponibilidade

## 🧪 Testes Manuais

### Teste 1: Carregar Página de Configuração

**Passos:**
1. Acesse `http://localhost:3000/dashboard/settings`
2. Navegue até seção "Disponibilidade de Agendamentos"
3. Verifique se todos os componentes carregaram

**Validação:**
- [x] Seção "Horários de Trabalho" visível
- [x] 7 cards de dias da semana aparecem
- [x] Seção "Intervalo de Pausa" visível
- [x] Seção "Dias Indisponíveis" visível

**Screenshot esperado:**
```
┌─────────────────────────────────────────────────┐
│ ⚙️ Configurações da Organização                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📅 Disponibilidade de Agendamentos             │
│                                                 │
│  ┌─ Horários de Trabalho ────────────────────┐ │
│  │ ☐ Segunda-feira  08:00 - 17:00            │ │
│  │ ☐ Terça-feira    08:00 - 17:00            │ │
│  │ ☑ Quarta-feira   08:00 - 17:00            │ │
│  │ ☑ Quinta-feira   08:00 - 17:00            │ │
│  │ ☑ Sexta-feira    08:00 - 17:00            │ │
│  │ ☐ Sábado         [desabilitado]           │ │
│  │ ☐ Domingo        [desabilitado]           │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Intervalo de Pausa ──────────────────────┐ │
│  │ Início: 12:00    Fim: 13:00               │ │
│  │ [Salvar]                                  │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Dias Indisponíveis ──────────────────────┐ │
│  │ Data:     [2024-12-25]                    │ │
│  │ Motivo:   [Feriado Natal]                 │ │
│  │ [Adicionar] ✓ 25 de dez de 2024          │ │
│  │            - Feriado Natal         [❌]  │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Teste 2: Modificar Horários de Trabalho

**Setup:**
- Usuário autenticado como owner da organização

**Passos:**
1. Encontre "Horários de Trabalho"
2. Desmarque a checkbox de "Segunda-feira"
3. Mude o horário de "Quarta-feira" para "09:00 - 18:00"
4. Clique em "Salvar Horários"

**Validação:**
- [x] Mensagem "Horários atualizados com sucesso!" aparece (verde)
- [x] Dados persistem após recarregar a página
- [x] Toast desaparece após 3 segundos

**Expected response:**
```json
{
  "success": true,
  "message": "Horários atualizados com sucesso!",
  "data": [
    {
      "dayOfWeek": "MONDAY",
      "isWorking": false
    },
    {
      "dayOfWeek": "WEDNESDAY",
      "startTime": "09:00",
      "endTime": "18:00",
      "isWorking": true
    }
  ]
}
```

---

### Teste 3: Configurar Intervalo de Pausa

**Setup:**
- Página de configuração carregada

**Passos:**
1. Encontre "Intervalo de Pausa"
2. Mude início para "12:30"
3. Mude fim para "13:30"
4. Clique "Salvar Intervalo"

**Validação:**
- [x] Mensagem de sucesso "Intervalo de pausa atualizado!" (verde)
- [x] Valores salvos e persistem
- [x] Loading state apareceu durante envio

**Expected API response:**
```json
{
  "success": true,
  "message": "Intervalo de pausa atualizado!",
  "data": {
    "startTime": "12:30",
    "endTime": "13:30"
  }
}
```

---

### Teste 4: Adicionar Dias Indisponíveis

**Setup:**
- Organizacao com horários já configurados

**Passos:**
1. Vá para "Dias Indisponíveis"
2. Selecione data: 25/12/2024 (Natal)
3. Motivo: "Feriado Natal"
4. Clique em "Adicionar"

**Validação:**
- [x] Dia aparece na lista imediatamente (otimistic update)
- [x] Formatação: "25 de dez de 2024 - Feriado Natal"
- [x] Botão de deletar (❌) aparece ao lado
- [x] API é chamada e dia é persistido
- [x] Se salvar falhar, dia desaparece da lista

**Expected flow:**
```
1. User clicks "Adicionar"
   ↓
2. Date appears in list immediately (client-side)
   ↓
3. API call happens: POST /api/unavailable-days
   ↓
4. If success: Stay in list, show toast
   If error: Remove from list, show error toast
```

---

### Teste 5: Remover Dias Indisponíveis

**Setup:**
- Dia indisponível já adicionado (ex: 25/12/2024)

**Passos:**
1. Encontre o dia na lista
2. Clique no botão "❌" de deletar
3. Observe o comportamento

**Validação:**
- [x] Dia desaparece imediatamente (otimistic update)
- [x] Toast "Dia removido com sucesso!" aparece
- [x] Se reverter, dia volta pra lista (rollback)

**Expected behavior:**
```
BEFORE: [25 dez 2024 - Feriado Natal] [❌]
↓ (click ❌)
OPTIMISTIC: Desaparece imediatamente
↓
API CALL: DELETE /api/unavailable-days/{id}
↓
SUCCESS: Fica removido, mostrar toast verde
FAILURE: Volta pra lista, mostrar toast vermelho
```

---

## 🔴 Testes de Validação (Error Cases)

### Teste 6: Validação - Horário Inválido

**Passos:**
1. Tente colocar start time = "18:00" e end time = "09:00" (hora final antes da inicial)
2. Clique salvar

**Validação:**
- [x] Apareça erro: "Hora final deve ser posterior à hora inicial"
- [x] Dados não sejam salvos
- [x] Toast vermelho com mensagem de erro

**Expected response:**
```json
{
  "success": false,
  "error": "Hora final deve ser posterior à hora inicial"
}
```

---

### Teste 7: Validação - Data no Passado

**Passos:**
1. Tente adicionar data: "01/01/2020" (passado)
2. Click "Adicionar"

**Validação:**
- [x] Erro: "Data deve ser futura"
- [x] Dia NÃO é adicionado
- [x] Toast vermelho

**Expected response:**
```json
{
  "success": false,
  "error": "Data deve ser futura"
}
```

---

### Teste 8: Validação - Dia Duplicado

**Passos:**
1. Já existe "25/12/2024" na lista
2. Tente adicionar novamente
3. Click "Adicionar"

**Validação:**
- [x] Erro: "Já existe um dia indisponível para esta data"
- [x] Dia não é duplicado
- [x] Toast vermelho

**Expected response:**
```json
{
  "success": false,
  "error": "Já existe um dia indisponível para esta data"
}
```

---

### Teste 9: Autorização - Acesso Negado

**Passos:**
1. Faça login como "member" (não-owner)
2. Tente acessar `GET /api/availability/config`
3. Tente fazer `POST` para atualizar

**Validação:**
- [x] Error 401 ou erro de autorização
- [x] Mensagem: "Sem permissão para acessar este recurso"

**Expected response:**
```json
{
  "success": false,
  "error": "Sem permissão para acessar este recurso"
}
```

---

## 📊 Testes de Integração

### Teste 10: Fluxo Completo

**Cenário:** Novo usuário configura disponibilidade do zero

**Passos:**
1. Acesse settings página
2. Desmarque sábado e domingo
3. Mude segunda de 08:00-17:00 para 09:00-12:00
4. Altere pausa de 12:00-13:00 para 12:30-13:30
5. Adicione alguns dias indisponíveis (25/12, 01/01, 07/09)
6. Recarregue a página (F5)

**Validação:**
- [x] Todos os dados persistem após reload
- [x] Segunda aparece como 09:00-12:00
- [x] Sábado/domingo desabilitados
- [x] 3 dias indisponíveis aparecem

**Expected state após reload:**
```
GET /api/availability/config → 200 OK
{
  "success": true,
  "data": {
    "workingHours": [
      { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "12:00", isWorking: true },
      { dayOfWeek: "SATURDAY", isWorking: false },
      { dayOfWeek: "SUNDAY", isWorking: false }
    ],
    "breakTime": {
      startTime: "12:30",
      endTime: "13:30"
    },
    "unavailableDays": [
      { date: "2024-12-25", reason: "Feriado Natal" },
      { date: "2025-01-01", reason: "Ano novo" },
      { date: "2025-09-07", reason: "Independência" }
    ]
  }
}
```

---

## 🚀 Testes de Performance

### Teste 11: Carregamento com Muitos Dados

**Setup:**
- Adicione 100+ dias indisponíveis

**Passos:**
1. Abra settings
2. Observe tempo de carregamento
3. Scroll pela lista de dias
4. Adicione mais um dia

**Validação:**
- [x] Página carrega em < 2 segundos
- [x] Lista não trava ao scroll
- [x] Adicionar novo dia é instantâneo (< 100ms)

**Performance targets:**
- Initial load: < 2000ms
- Scroll: 60fps (60 FPS)
- Add day: < 100ms
- Delete day: < 50ms

---

### Teste 12: Múltiplas Ações Simultâneas

**Passos:**
1. Clique "Salvar Horários"
2. Imediatamente clique "Salvar Intervalo"
3. Imediatamente clique "Adicionar" dia

**Validação:**
- [x] Todas as 3 requisições são processadas
- [x] Não há race conditions
- [x] Dados corretos são salvos

**Expected behavior:**
```
Request 1: updateWorkingHours → Pending
Request 2: updateBreakTime → Pending
Request 3: addUnavailableDay → Pending
  ↓
All resolve
  ↓
Show 3 toasts (ou consolidar em 1)
```

---

## 🧬 Testes de Banco de Dados

### Teste 13: Verificação de Constraints

**Comandos SQL:**
```sql
-- Verificar que não há duplicatas
SELECT organization_id, day_of_week, COUNT(*) 
FROM working_hours 
GROUP BY organization_id, day_of_week 
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 linhas

-- Verificar unique constraint em unavailable_days
SELECT organization_id, date, COUNT(*) 
FROM unavailable_days 
GROUP BY organization_id, date 
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 linhas

-- Verificar que break_time é única por org
SELECT organization_id, COUNT(*) 
FROM break_times 
GROUP BY organization_id 
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 linhas
```

---

### Teste 14: Verificação de Cascata DELETE

**Passos:**
1. Delete uma organização do banco
2. Verifique se dados de availability foram deletados

**Expected behavior:**
```sql
-- Antes
SELECT COUNT(*) FROM working_hours WHERE organization_id = '123';
-- Resultado: 7

DELETE FROM organizations WHERE id = '123';

-- Depois
SELECT COUNT(*) FROM working_hours WHERE organization_id = '123';
-- Resultado: 0 (deletado em cascata)
```

---

## 🔧 Testes Automatizados (Código)

### Exemplo de Teste com Jest/Vitest

```typescript
// __tests__/availability.test.ts
import { updateWorkingHours, updateBreakTime, addUnavailableDay } from '@/app/actions/availability';
import { prisma } from '@/lib/prisma';

describe('Availability Actions', () => {
  let organizationId: string;

  beforeEach(async () => {
    // Setup: criar org de teste
    const org = await prisma.organization.create({
      data: { name: 'Test Org' }
    });
    organizationId = org.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.organization.delete({
      where: { id: organizationId }
    });
  });

  describe('updateWorkingHours', () => {
    it('should update working hours for a day', async () => {
      const formData = new FormData();
      formData.append('MONDAY', 'on');
      formData.append('MONDAY_start', '08:00');
      formData.append('MONDAY_end', '17:00');

      const result = await updateWorkingHours(
        { success: false, error: '' },
        formData
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.[0].dayOfWeek).toBe('MONDAY');
    });

    it('should reject when end time is before start time', async () => {
      const formData = new FormData();
      formData.append('MONDAY', 'on');
      formData.append('MONDAY_start', '17:00');
      formData.append('MONDAY_end', '08:00');

      const result = await updateWorkingHours(
        { success: false, error: '' },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('posterior');
    });
  });

  describe('addUnavailableDay', () => {
    it('should add an unavailable day', async () => {
      const formData = new FormData();
      formData.append('date', '2024-12-25');
      formData.append('reason', 'Feriado Natal');

      const result = await addUnavailableDay(
        { success: false, error: '' },
        formData
      );

      expect(result.success).toBe(true);
      expect(result.data?.date).toEqual(new Date('2024-12-25'));
    });

    it('should reject past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const formData = new FormData();
      formData.append('date', pastDate.toISOString().split('T')[0]);

      const result = await addUnavailableDay(
        { success: false, error: '' },
        formData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('futura');
    });
  });
});
```

---

## ✅ Checklist de Validação Final

- [ ] Teste 1: Carregar página OK
- [ ] Teste 2: Modificar horários OK
- [ ] Teste 3: Intervalo de pausa OK
- [ ] Teste 4: Adicionar dias OK
- [ ] Teste 5: Remover dias OK
- [ ] Teste 6: Validação horário inválido OK
- [ ] Teste 7: Validação data passado OK
- [ ] Teste 8: Validação duplicado OK
- [ ] Teste 9: Autorização OK
- [ ] Teste 10: Fluxo completo OK
- [ ] Teste 11: Performance OK
- [ ] Teste 12: Múltiplas ações OK
- [ ] Teste 13: Database constraints OK
- [ ] Teste 14: CASCADE delete OK

---

## 📝 Relatório de Teste

```markdown
# Teste de Disponibilidade - Relatório Final

**Data:** 2024-12-18
**Testador:** [Seu Nome]
**Ambiente:** Local / Staging / Produção

## Resumo
- ✅ Testes passaram: 14/14
- ❌ Testes falharam: 0/14
- ⚠️ Problemas encontrados: 0

## Notas
- Feature está pronta para produção
- Performance está dentro dos limites
- Sem problemas de segurança identificados

## Assinatura
_________________________________
```
