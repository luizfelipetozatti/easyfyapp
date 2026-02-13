-- ============================================================
-- AgendaZap - Supabase Row Level Security (RLS)
-- Execute este SQL no Supabase SQL Editor após prisma db push
-- ============================================================

-- ============================================================
-- 1. Habilitar RLS em todas as tabelas
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Helper function: obter organization_ids do usuário atual
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF uuid AS $$
  SELECT om.organization_id
  FROM organization_members om
  INNER JOIN users u ON u.id = om.user_id
  WHERE u.supabase_id = auth.uid()::text
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. Helper function: verificar se é membro de uma organização
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    INNER JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
      AND om.organization_id = org_id
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. Helper function: verificar se é OWNER/ADMIN
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    INNER JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
      AND om.organization_id = org_id
      AND om.role IN ('OWNER', 'ADMIN')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 5. Policies: ORGANIZATIONS
-- ============================================================

-- Membros podem ver suas organizações
CREATE POLICY "org_select_member" ON organizations
  FOR SELECT
  USING (id IN (SELECT public.user_organization_ids()));

-- Apenas owners/admins podem atualizar
CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE
  USING (public.is_org_admin(id));

-- Qualquer usuário autenticado pode criar organização
CREATE POLICY "org_insert_authenticated" ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 6. Policies: USERS
-- ============================================================

-- Usuário pode ver apenas seu próprio perfil
CREATE POLICY "user_select_self" ON users
  FOR SELECT
  USING (supabase_id = auth.uid()::text);

-- Usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "user_update_self" ON users
  FOR UPDATE
  USING (supabase_id = auth.uid()::text);

-- ============================================================
-- 7. Policies: ORGANIZATION_MEMBERS
-- ============================================================

-- Membros podem ver outros membros da mesma org
CREATE POLICY "member_select" ON organization_members
  FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Apenas admins podem adicionar membros
CREATE POLICY "member_insert_admin" ON organization_members
  FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

-- Apenas admins podem remover membros
CREATE POLICY "member_delete_admin" ON organization_members
  FOR DELETE
  USING (public.is_org_admin(organization_id));

-- ============================================================
-- 8. Policies: SERVICES
-- ============================================================

-- Membros podem ver serviços da sua org
CREATE POLICY "service_select_member" ON services
  FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Público pode ver serviços ativos (para página de booking)
CREATE POLICY "service_select_public" ON services
  FOR SELECT
  USING (active = true);

-- Admins podem criar/atualizar/deletar serviços
CREATE POLICY "service_insert_admin" ON services
  FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "service_update_admin" ON services
  FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "service_delete_admin" ON services
  FOR DELETE
  USING (public.is_org_admin(organization_id));

-- ============================================================
-- 9. Policies: BOOKINGS
-- ============================================================

-- Membros podem ver bookings da sua org
CREATE POLICY "booking_select_member" ON bookings
  FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Público pode criar bookings (página de agendamento)
CREATE POLICY "booking_insert_public" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Admins podem atualizar status dos bookings
CREATE POLICY "booking_update_admin" ON bookings
  FOR UPDATE
  USING (public.is_org_admin(organization_id));

-- Admins podem deletar bookings
CREATE POLICY "booking_delete_admin" ON bookings
  FOR DELETE
  USING (public.is_org_admin(organization_id));

-- ============================================================
-- 10. Índices adicionais para performance com RLS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user_org
  ON organization_members(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_users_supabase_id
  ON users(supabase_id);

CREATE INDEX IF NOT EXISTS idx_bookings_org_start
  ON bookings(organization_id, start_time);

CREATE INDEX IF NOT EXISTS idx_services_org_active
  ON services(organization_id, active);
