-- CreateTable
CREATE TABLE "fully_booked_days" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fully_booked_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fully_booked_days_organization_id_service_id_idx" ON "fully_booked_days"("organization_id", "service_id");

-- CreateIndex
CREATE INDEX "fully_booked_days_organization_id_date_idx" ON "fully_booked_days"("organization_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "fully_booked_days_organization_id_service_id_date_key" ON "fully_booked_days"("organization_id", "service_id", "date");

-- AddForeignKey
ALTER TABLE "fully_booked_days" ADD CONSTRAINT "fully_booked_days_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fully_booked_days" ADD CONSTRAINT "fully_booked_days_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
