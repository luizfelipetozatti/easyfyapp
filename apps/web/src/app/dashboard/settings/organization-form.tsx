"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Button,
  PhoneInput,
} from "@easyfyapp/ui";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrganization } from "@/app/actions/organization";
import { PublicUrlSection } from "@/components/public-url-section";

interface OrganizationFormProps {
  organization: {
    name: string;
    slug: string;
    whatsappNumber: string | null;
  };
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: organization.name,
    slug: organization.slug,
    whatsappNumber: organization.whatsappNumber ?? "",
  });

  // URL base da aplicação
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'https://easyfyapp-web.vercel.app');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("slug", formData.slug);
        formDataToSend.append("whatsappNumber", formData.whatsappNumber);

        const result = await updateOrganization(formDataToSend);

        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error("Erro inesperado. Tente novamente.");
        console.error("Erro ao salvar:", error);
      }
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      // Auto-gerar slug apenas se ainda não foi manualmente editado
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(newName) : prev.slug,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Organização</CardTitle>
        <CardDescription>
          Dados principais do seu negócio
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Nome do negócio"
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL de agendamento)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                /agendar/
              </span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, slug: e.target.value }))
                }
                placeholder="meu-negocio"
                disabled={isPending}
                required
              />
            </div>
          </div>
          <PublicUrlSection
            url={`${appUrl}/agendar/${formData.slug}`}
            label="URL Pública de Agendamento"
            description="Compartilhe esta URL com seus clientes para que eles possam agendar diretamente"
          />
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número WhatsApp</Label>
            <PhoneInput
              id="whatsapp"
              value={formData.whatsappNumber}
              onChange={(value) =>
                setFormData(prev => ({ ...prev, whatsappNumber: value }))
              }
              disabled={isPending}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
