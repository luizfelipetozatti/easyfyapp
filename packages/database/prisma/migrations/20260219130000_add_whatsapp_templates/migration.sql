-- CreateEnum
CREATE TYPE "WhatsAppTemplateType" AS ENUM ('CONFIRMATION', 'CANCELLATION', 'REMINDER');

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "type" "WhatsAppTemplateType" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_templates_organization_id_type_key" ON "whatsapp_templates"("organization_id", "type");

-- CreateIndex
CREATE INDEX "whatsapp_templates_organization_id_idx" ON "whatsapp_templates"("organization_id");

-- AddForeignKey
ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
