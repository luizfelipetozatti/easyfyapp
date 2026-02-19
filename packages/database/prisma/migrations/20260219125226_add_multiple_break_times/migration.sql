-- DropIndex
DROP INDEX "break_times_organization_id_key";

-- AlterTable
ALTER TABLE "break_times" ADD COLUMN     "label" TEXT;
