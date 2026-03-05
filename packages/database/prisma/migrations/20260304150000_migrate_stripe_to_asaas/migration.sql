-- ============================================================
-- Migration: Migrate payment gateway from Stripe to Asaas
-- Renomeia campos stripe_* para asaas_* e adapta o modelo de assinatura
-- ============================================================

-- ============================================================
-- 1. organizations: stripe_customer_id → asaas_customer_id
-- ============================================================

-- Remover índice e constraint únicos do Stripe
DROP INDEX IF EXISTS "organizations_stripe_customer_id_key";

-- Renomear coluna
ALTER TABLE "organizations" RENAME COLUMN "stripe_customer_id" TO "asaas_customer_id";

-- Recriar constraint único com novo nome
CREATE UNIQUE INDEX "organizations_asaas_customer_id_key" ON "organizations"("asaas_customer_id");

-- ============================================================
-- 2. subscriptions: renomear/substituir colunas Stripe
-- ============================================================

-- 2a. stripe_subscription_id → asaas_subscription_id
DROP INDEX IF EXISTS "subscriptions_stripe_subscription_id_key";
DROP INDEX IF EXISTS "subscriptions_stripe_subscription_id_idx";

ALTER TABLE "subscriptions" RENAME COLUMN "stripe_subscription_id" TO "asaas_subscription_id";

CREATE UNIQUE INDEX "subscriptions_asaas_subscription_id_key" ON "subscriptions"("asaas_subscription_id");
CREATE INDEX "subscriptions_asaas_subscription_id_idx" ON "subscriptions"("asaas_subscription_id");

-- 2b. stripe_customer_id → asaas_customer_id
DROP INDEX IF EXISTS "subscriptions_stripe_customer_id_idx";

ALTER TABLE "subscriptions" RENAME COLUMN "stripe_customer_id" TO "asaas_customer_id";

CREATE INDEX "subscriptions_asaas_customer_id_idx" ON "subscriptions"("asaas_customer_id");

-- 2c. stripe_price_id → billing_value (DOUBLE PRECISION)
--     Adicionar nova coluna e remover a antiga
ALTER TABLE "subscriptions" ADD COLUMN "billing_value" DOUBLE PRECISION NOT NULL DEFAULT 97.0;
ALTER TABLE "subscriptions" DROP COLUMN "stripe_price_id";

-- 2d. stripe_product_id → billing_cycle (TEXT)
ALTER TABLE "subscriptions" ADD COLUMN "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "subscriptions" DROP COLUMN "stripe_product_id";

-- ============================================================
-- 3. Remove colunas defaults usadas apenas para a migração
-- ============================================================
ALTER TABLE "subscriptions" ALTER COLUMN "billing_value" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "billing_cycle" DROP DEFAULT;
