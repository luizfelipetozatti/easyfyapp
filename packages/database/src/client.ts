import { PrismaClient, Prisma } from "./generated/prisma";

declare global {
  var __prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  global.__prisma = prisma;
}

// Re-export types using Prisma namespace
export type User = Prisma.UserGetPayload<object>;
export type Organization = Prisma.OrganizationGetPayload<object>;
export type OrganizationMember = Prisma.OrganizationMemberGetPayload<object>;
export type Service = Prisma.ServiceGetPayload<object>;
export type Booking = Prisma.BookingGetPayload<object>;

// Re-export enums as const objects
export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;

export const BookingStatus = {
  PENDENTE: "PENDENTE",
  CONFIRMADO: "CONFIRMADO",
  CANCELADO: "CANCELADO",
  CONCLUIDO: "CONCLUIDO",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

// Re-export Prisma namespace and PrismaClient
export type { Prisma };
export { PrismaClient };
