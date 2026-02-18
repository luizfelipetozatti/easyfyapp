# Componentes de Compartilhamento de URL

Este diretório contém componentes reutilizáveis para exibir e compartilhar URLs públicas com melhor UX e acessibilidade.

## Componentes

### `PublicUrlSection`

Componente completo para exibir uma URL pública com opções de copiar e compartilhar. Ideal para páginas de configuração ou destaques.

**Props:**
- `url` (string, obrigatório): URL a ser exibida e compartilhada
- `label` (string, opcional): Título da seção. Padrão: "URL de Agendamento"
- `description` (string, opcional): Descrição informativa. Padrão: "Compartilhe esta URL com seus clientes para que eles possam agendar diretamente"

**Exemplo de uso:**

```tsx
import { PublicUrlSection } from "@/components/public-url-section";

export function MyComponent() {
  return (
    <PublicUrlSection
      url="https://exemplo.com/agendar/meu-negocio"
      label="URL Pública de Agendamento"
      description="Compartilhe esta URL com seus clientes"
    />
  );
}
```

### `PublicUrlBadge`

Componente compacto para exibir URL com botão de copiar. Ideal para cards, headers ou contextos com espaço limitado.

**Props:**
- `url` (string, obrigatório): URL a ser exibida
- `compact` (boolean, opcional): Modo compacto (inline badge). Padrão: false

**Exemplo de uso:**

```tsx
import { PublicUrlBadge } from "@/components/public-url-badge";

// Modo normal
<PublicUrlBadge url="https://exemplo.com/agendar/meu-negocio" />

// Modo compacto (inline badge)
<PublicUrlBadge url="https://exemplo.com/agendar/meu-negocio" compact />
```

### `ShareMenu`

Componente de menu dropdown com múltiplas opções de compartilhamento (WhatsApp, Email, Twitter/X, LinkedIn, Copiar Link).

**Props:**
- `url` (string, obrigatório): URL a ser compartilhada
- `title` (string, opcional): Título para o compartilhamento. Padrão: "Agende comigo"
- `text` (string, opcional): Texto descritivo. Padrão: "Clique para agendar"

**Exemplo de uso:**

```tsx
import { ShareMenu } from "@/components/share-menu";

export function MyComponent() {
  return (
    <ShareMenu
      url="https://exemplo.com/agendar/meu-negocio"
      title="Agende comigo"
      text="Clique para agendar um horário"
    />
  );
}
```

## Funcionalidades

- ✅ **Copiar para Clipboard**: Copia a URL com feedback visual (toast)
- ✅ **Compartilhar em Redes Sociais**: WhatsApp, Email, Twitter/X, LinkedIn
- ✅ **Design Responsivo**: Adapta-se a diferentes tamanhos de tela
- ✅ **Dark Mode**: Suporte completo a tema escuro
- ✅ **Acessibilidade**: ARIA labels e semantância adequada
- ✅ **Feedback Visual**: Transições suaves e confirmação de ações
- ✅ **Fechar ao Clicar Fora**: Menu dropdown fecha automaticamente

## Integração Atual

Esses componentes foram integrados ao formulário de organização em:
- `apps/web/src/app/dashboard/settings/organization-form.tsx`

O componente `PublicUrlSection` aparece automaticamente exibindo a URL pública com todas as opções de compartilhamento.

## Melhorias de UX/Design

### PublicUrlSection
1. **Destaque Visual**: Seção com background azul (light/dark mode aware)
2. **Card Design**: Borda e padding adequados para destaque
3. **Ícone Intuitivo**: Link icon para identificar função
4. **Monospace Font**: URL em fonte monospace para melhor readability
5. **Responsive**: Botões adaptam texto para mobile (icon-only no small)
6. **Dica Útil**: Emoji tip ao final para orientar o usuário

### PublicUrlBadge  
1. **Modo Inline**: Versão compacta para contextos com espaço limitado
2. **Color Coding**: Cor azul identifica URLs públicas
3. **Auto-truncate**: Ajusta-se a diferentes tamanhos
4. **Hover State**: Feedback visual ao passar mouse
5. **Tooltip**: Exibe URL completa no hover (compact mode)

### ShareMenu
1. **Menu Dropdown**: Não poluí a UI, esconde opções adicionais
2. **Ícones Intuitivos**: Cada rede social com ícone próprio
3. **Separador Visual**: Linha divide copiar link das redes

## Clean Code Principles

- **Separation of Concerns**: Cada componente tem responsabilidade única
- **Reusability**: Componentes reutilizáveis em múltiplos contextos
- **Type Safety**: Props bem tipados com TypeScript
- **Accessibility**: ARIA labels e boas práticas de a11y
- **Performance**: State minimal, sem re-renders desnecessários
- **Error Handling**: Try-catch para operações de clipboard
- **User Feedback**: Toasts informativos para cada ação

