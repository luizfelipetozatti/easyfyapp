"use client";

import { useState, useRef, useTransition } from "react";
import {
  MessageCircle,
  XCircle,
  Bell,
  Pencil,
  X,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@easyfyapp/ui";
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_META,
  type TemplateType,
  type WhatsAppTemplateData,
} from "@/lib/whatsapp-constants";
import {
  upsertWhatsAppTemplate,
  resetWhatsAppTemplate,
} from "@/app/actions/whatsapp-templates";

// ============================================================
// CONSTANTS
// ============================================================

const SAMPLE_VARIABLES: Record<string, string> = {
  nome: "João Silva",
  serviço: "Corte de Cabelo",
  data: "25/02/2026 às 14:00",
  organização: "Salão Exemplo",
};

const TEMPLATE_ICONS: Record<TemplateType, React.ReactNode> = {
  CONFIRMATION: <CheckCircle2 className="h-5 w-5 text-whatsapp" />,
  CANCELLATION: <XCircle className="h-5 w-5 text-destructive" />,
  REMINDER: <Bell className="h-5 w-5 text-amber-500" />,
};

const MAX_CHARS = 1000;

// ============================================================
// HELPERS
// ============================================================

function renderPreview(content: string): string {
  // Substituir variáveis {{name}} pelos valores de exemplo
  const withVariables = Object.entries(SAMPLE_VARIABLES).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value),
    content
  );

  // Aplicar formatação WhatsApp: *negrito* e _itálico_
  return withVariables
    .split(/(\*[^*]+\*|_[^_]+_)/g)
    .map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return `<strong key="${i}">${part.slice(1, -1)}</strong>`;
      }
      if (part.startsWith("_") && part.endsWith("_")) {
        return `<em key="${i}">${part.slice(1, -1)}</em>`;
      }
      return part;
    })
    .join("");
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function WhatsAppBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="relative max-w-[85%] rounded-2xl rounded-br-sm bg-whatsapp-light px-4 py-3 text-xs leading-relaxed text-zinc-800 shadow-sm dark:bg-whatsapp-dark/30 dark:text-zinc-100">
        <div
          className="whitespace-pre-wrap font-[inherit]"
          dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
        />
        <span className="mt-1 block text-right text-[10px] text-zinc-500">
          Pré-visualização
        </span>
      </div>
    </div>
  );
}

function VariableChip({
  variable,
  onInsert,
}: {
  variable: string;
  onInsert: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onInsert(variable)}
      className="inline-flex items-center rounded-full border border-dashed border-whatsapp bg-whatsapp/10 px-2.5 py-0.5 text-xs font-medium text-whatsapp transition-colors hover:bg-whatsapp/20"
    >
      {variable}
    </button>
  );
}

// ============================================================
// TEMPLATE CARD
// ============================================================

function TemplateCard({
  template,
  onUpdate,
}: {
  template: WhatsAppTemplateData;
  onUpdate: (type: TemplateType, content: string, isCustom: boolean) => void;
}) {
  const meta = TEMPLATE_META[template.type];
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editContent, setEditContent] = useState(template.content);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = editContent.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isDirty = editContent !== template.content;

  function handleEdit() {
    setEditContent(template.content);
    setIsEditing(true);
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleCancel() {
    setEditContent(template.content);
    setIsEditing(false);
  }

  function insertVariable(variable: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue =
      editContent.substring(0, start) +
      variable +
      editContent.substring(end);

    setEditContent(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + variable.length,
        start + variable.length
      );
    }, 0);
  }

  function handleSave() {
    if (isOverLimit) return;

    startTransition(async () => {
      const result = await upsertWhatsAppTemplate({
        type: template.type,
        content: editContent,
      });

      if (result.success) {
        onUpdate(template.type, editContent, true);
        setIsEditing(false);
        toast.success("Template salvo com sucesso!");
        return;
      }
      toast.error(result.error ?? "Erro ao salvar template");
    });
  }

  function handleReset() {
    const defaultContent = DEFAULT_TEMPLATES[template.type];

    startTransition(async () => {
      const result = await resetWhatsAppTemplate(template.type);

      if (result.success) {
        onUpdate(template.type, defaultContent, false);
        setEditContent(defaultContent);
        setIsEditing(false);
        toast.success("Template restaurado ao padrão!");
        return;
      }
      toast.error(result.error ?? "Erro ao restaurar template");
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            {TEMPLATE_ICONS[template.type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{meta.label}</h4>
              {template.isCustom ? (
                <Badge className="bg-whatsapp/15 text-whatsapp hover:bg-whatsapp/20 border-0 text-[10px]">
                  Personalizado
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Padrão
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {meta.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="h-8 gap-1.5 text-xs"
            >
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={isExpanded ? "Recolher" : "Expandir"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t px-5 pb-5 pt-4 space-y-4">
          {!isEditing ? (
            /* Preview mode */
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Pré-visualização com dados de exemplo
              </p>
              <div className="rounded-xl border bg-[#e5ddd5] p-4 dark:bg-zinc-800/60">
                <WhatsAppBubble content={template.content} />
              </div>
            </div>
          ) : (
            /* Edit mode */
            <div className="space-y-4">
              {/* Variables reference */}
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Variáveis disponíveis (clique para inserir)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {meta.variables.map((variable) => (
                    <VariableChip
                      key={variable}
                      variable={variable}
                      onInsert={insertVariable}
                    />
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={10}
                  className={`w-full resize-y rounded-lg border bg-background px-3.5 py-3 font-mono text-sm leading-relaxed shadow-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isOverLimit ? "border-destructive focus:ring-destructive" : ""
                  }`}
                  placeholder="Digite o template da mensagem..."
                  disabled={isPending}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Use{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      *texto*
                    </code>{" "}
                    para negrito e{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      _texto_
                    </code>{" "}
                    para itálico (formatação WhatsApp)
                  </p>
                  <span
                    className={`text-xs tabular-nums ${
                      isOverLimit
                        ? "text-destructive"
                        : charCount > MAX_CHARS * 0.9
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {charCount}/{MAX_CHARS}
                  </span>
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-xl border bg-[#e5ddd5] p-4 dark:bg-zinc-800/60">
                <WhatsAppBubble content={editContent} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isPending || !template.isCustom}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar padrão
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="gap-1.5 text-xs"
                  >
                    <X className="h-3 w-3" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isPending || isOverLimit || !isDirty}
                    className="gap-1.5 bg-whatsapp text-white hover:bg-whatsapp/90 text-xs"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Salvando...
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Salvar template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface TemplateManagerProps {
  initialTemplates: WhatsAppTemplateData[];
}

export function TemplateManager({ initialTemplates }: TemplateManagerProps) {
  const [templates, setTemplates] =
    useState<WhatsAppTemplateData[]>(initialTemplates);

  function handleUpdate(type: TemplateType, content: string, isCustom: boolean) {
    setTemplates((prev) =>
      prev.map((t) => (t.type === type ? { ...t, content, isCustom } : t))
    );
  }

  const customCount = templates.filter((t) => t.isCustom).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-whatsapp" />
              Templates de Mensagem
            </CardTitle>
            <CardDescription className="mt-1">
              Personalize as mensagens automáticas enviadas aos clientes via
              WhatsApp. Use as variáveis disponíveis em cada template.
            </CardDescription>
          </div>
          {customCount > 0 && (
            <Badge className="shrink-0 bg-whatsapp/15 text-whatsapp hover:bg-whatsapp/20 border-0">
              {customCount} personalizado{customCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.type}
            template={template}
            onUpdate={handleUpdate}
          />
        ))}
      </CardContent>
    </Card>
  );
}
