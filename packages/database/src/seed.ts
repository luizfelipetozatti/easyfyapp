import { PrismaClient, UserRole } from "@prisma/client";
import { createSupabaseAdmin } from "./supabase";

const prisma = new PrismaClient();
const supabase = createSupabaseAdmin();

async function main() {
  console.log("🌱 Seeding database...");

  // Criar organização de exemplo
  const org = await prisma.organization.create({
    data: {
      name: "Clínica Exemplo",
      slug: "clinica-exemplo",
      whatsappNumber: "5511999999999",
      timezone: "America/Sao_Paulo",
    },
  });

  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // Criar usuário no Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: "admin@clinicaexemplo.com",
    password: "admin123",
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    console.error("❌ Error creating auth user:", authError);
    throw authError;
  }

  console.log(`✅ Auth user created: ${authUser.user.id}`);

  // Criar usuário no banco de dados
  const user = await prisma.user.create({
    data: {
      email: "admin@clinicaexemplo.com",
      name: "Dr. Admin",
      supabaseId: authUser.user.id,
    },
  });

  // Vincular user à org como OWNER
  await prisma.organizationMember.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: UserRole.OWNER,
    },
  });

  console.log(`✅ User created: ${user.email} (OWNER)`);

  // Criar serviços
  const services = await Promise.all([
    prisma.service.create({
      data: {
        organizationId: org.id,
        name: "Consulta Geral",
        description: "Consulta médica geral de 30 minutos",
        price: 150.0,
        durationMinutes: 30,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: org.id,
        name: "Consulta Especializada",
        description: "Consulta com especialista de 60 minutos",
        price: 280.0,
        durationMinutes: 60,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: org.id,
        name: "Retorno",
        description: "Consulta de retorno de 15 minutos",
        price: 0,
        durationMinutes: 15,
      },
    }),
  ]);

  console.log(`✅ ${services.length} services created`);

  // Criar organização coworking
  const coworking = await prisma.organization.create({
    data: {
      name: "CoWork Hub",
      slug: "cowork-hub",
      whatsappNumber: "5511888888888",
      timezone: "America/Sao_Paulo",
    },
  });

  await Promise.all([
    prisma.service.create({
      data: {
        organizationId: coworking.id,
        name: "Sala de Reunião - 1h",
        description: "Sala para até 6 pessoas",
        price: 80.0,
        durationMinutes: 60,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: coworking.id,
        name: "Sala de Reunião - 2h",
        description: "Sala para até 6 pessoas",
        price: 140.0,
        durationMinutes: 120,
      },
    }),
    prisma.service.create({
      data: {
        organizationId: coworking.id,
        name: "Day Use",
        description: "Acesso ao coworking por um dia inteiro",
        price: 60.0,
        durationMinutes: 480,
      },
    }),
  ]);

  console.log(`✅ CoWork Hub created with services`);
  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
