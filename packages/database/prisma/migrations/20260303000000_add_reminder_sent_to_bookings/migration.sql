-- Migration: add reminder_sent to bookings
-- Permite rastrear se o lembrete de 24h foi enviado para cada agendamento

ALTER TABLE "bookings" ADD COLUMN "reminder_sent" BOOLEAN NOT NULL DEFAULT false;
