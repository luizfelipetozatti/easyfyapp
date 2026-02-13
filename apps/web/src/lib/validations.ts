import { z } from "zod";

// ============================================================
// Booking Validation
// ============================================================

export const createBookingSchema = z.object({
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid(),
  clientName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100),
  clientPhone: z
    .string()
    .regex(
      /^55\d{10,11}$/,
      "Telefone deve estar no formato: 5511999999999"
    ),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  startTime: z.string().datetime({ message: "Data/hora inválida" }),
  notes: z.string().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ============================================================
// Service Validation
// ============================================================

export const createServiceSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 8 horas"),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

// ============================================================
// Organization Validation
// ============================================================

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens"
    ),
  whatsappNumber: z
    .string()
    .regex(/^55\d{10,11}$/, "Número WhatsApp inválido")
    .optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
