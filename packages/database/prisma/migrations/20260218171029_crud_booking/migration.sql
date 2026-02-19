-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "working_hours" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_working" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "break_times" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "break_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unavailable_days" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unavailable_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "working_hours_organization_id_idx" ON "working_hours"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_organization_id_dayOfWeek_key" ON "working_hours"("organization_id", "dayOfWeek");

-- CreateIndex
CREATE INDEX "break_times_organization_id_idx" ON "break_times"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "break_times_organization_id_key" ON "break_times"("organization_id");

-- CreateIndex
CREATE INDEX "unavailable_days_organization_id_idx" ON "unavailable_days"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "unavailable_days_organization_id_date_key" ON "unavailable_days"("organization_id", "date");

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "break_times" ADD CONSTRAINT "break_times_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unavailable_days" ADD CONSTRAINT "unavailable_days_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
