# Guia do Usuário - Disponibilidade de Agendamentos

## Onde Acessar

1. Faça login no Easyfy
2. Vá para **Dashboard → Configurações**
3. Role a página até encontrar a seção **"Disponibilidade de Agendamentos"**

## Funcionalidades

### 1️⃣ Horários de Trabalho

Cada dia da semana pode ser configurado:

#### Como usar:
- **Marque "Trabalhando"** para ativar o dia
- **Configure a Hora de Início** (ex: 08:00)
- **Configure a Hora de Término** (ex: 17:00)

#### Exemplos:
- 📅 **Segunda a Sexta**: 08:00 - 17:00 (ativado)
- 📅 **Sábado**: desativado
- 📅 **Domingo**: desativado

#### Dicas:
- Os horários só são salvos se o dia estiver marcado como "Trabalhando"
- Se desativar um dia, os horários serão ignorados
- Clique em "Salvar Horários" para aplicar as mudanças

---

### 2️⃣ Intervalo de Almoço

Configure o horário de pausa para o almoço:

#### Como usar:
- **Horário de Início**: 12:00
- **Horário de Término**: 13:00

#### O que acontece:
- ⏸️ Durante esse período, seus clientes NÃO conseguirão agendar
- 📅 O intervalo é aplicado para todos os dias em que você trabalha
- 💾 Clique em "Salvar Intervalo" para confirmar

#### Exemplo Real:
Se você trabalha 08:00-17:00 com intervalo 12:00-13:00:
```
Manhã:  08:00 - 12:00 (disponível)
Almoço: 12:00 - 13:00 (indisponível)
Tarde:  13:00 - 17:00 (disponível)
```

---

### 3️⃣ Dias Indisponíveis

Marque datas específicas quando não estará disponível:

#### Como usar:

**Adicionar um dia indisponível:**
1. Clique no campo "Data"
2. Selecione a data (exemplo: 25 de dezembro)
3. Digite um motivo (opcional): "Férias", "Feriado", "Evento"
4. Clique em "Adicionar Dia"

**Remover um dia indisponível:**
1. Encontre o dia na lista "Dias Configurados"
2. Clique no botão 🗑️ (lixeira) na direita

#### Exemplos de Uso:
```
📅 25/12 - Natal
📅 01/01 - Ano Novo
📅 10/03 a 20/03 - Férias
📅 30/05 - Evento pessoal
```

#### Importante:
- ⚠️ Só é possível marcar datas futuras
- 📅 Você recebe uma confirmação ao adicionar ou remover
- 🔄 As mudanças são salvas automaticamente

---

## Validações

O sistema verifica:
- ✅ A hora de término deve ser **posterior à hora de início**
- ✅ As datas devem ser **futuras** (não passadas)
- ✅ Cada data só pode ser marcada **uma vez** como indisponível
- ✅ Um único intervalo de almoço por organização

## Mensagens de Erro

| Erro | Solução |
|------|---------|
| "A hora de término deve ser posterior à hora de início" | Verifique se a hora final é maior que a inicial |
| "Esta data já foi adicionada como indisponível" | Escolha uma data diferente |
| "Não é possível adicionar uma data no passado" | Selecione uma data futura |

## Cenários Comuns

### Cenário 1: Consultório Médico
```
Segunda a Sexta: 08:00 - 12:00 e 14:00 - 18:00
Intervalo: 12:00 - 14:00 (almoço + pausa)
Sábado: Fechado
Domingo: Fechado
```

### Cenário 2: Salão de Beleza
```
Segunda a Sábado: 09:00 - 19:00
Intervalo: 13:00 - 14:00 (almoço)
Domingo: Fechado
Dias indisponíveis: Feriados
```

### Cenário 3: Freelancer
```
Segunda a Sexta: 09:00 - 18:00
Intervalo: 12:00 - 13:00
Sábado-Domingo: Fechado
Dias indisponíveis: Férias planejadas
```

---

## Perguntas Frequentes

**P: Meus clientes veem essa configuração?**
A: Sim! Eles só conseguem agendar nos horários que você marcou como disponível.

**P: Posso ter diferentes horários para diferentes serviços?**
A: Não nesta versão. Todos os serviços usam os mesmos horários. Isso pode ser adicionado no futuro.

**P: O intervalo de almoço é obrigatório?**
A: Não, mas recomendamos configurar. Se não quiser, deixe as mesmas horas (ex: 12:00-12:00).

**P: Posso mudar os horários frequentemente?**
A: Sim! Você pode editar quantas vezes quiser. As mudanças são salvas em tempo real.

**P: E se eu trabalhar dois períodos diferentes?**
A: Atualmente, o sistema suporta apenas um período por dia. Você pode simular usando o intervalo de almoço.

**P: Os clientes veem o motivo do dia indisponível?**
A: Não, eles apenas veem que o dia não está disponível para agendar.

---

## Status e Confirmações

✅ **Verde com checkmark**: Ação realizada com sucesso  
❌ **Vermelho com alerta**: Algo deu errado (leia a mensagem)  
💾 **Botão "Salvar"**: Toda mudança em horários deve ser salva  

---

## Suporte

Tem dúvida ou encontrou um problema?
- 📧 Entre em contato via email
- 💬 Use a aba de suporte no seu painel
- 📱 Nos envie uma mensagem

Estamos aqui para ajudar!
