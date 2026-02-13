#!/usr/bin/env pwsh
# AgendaZap - Script de Desenvolvimento (PowerShell)
# Execute: .\dev.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "🚀 AgendaZap - Comandos Disponíveis" -ForegroundColor Green
    Write-Host ""
    Write-Host "Desenvolvimento:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 install    - Instalar dependências"
    Write-Host "  .\dev.ps1 dev        - Rodar dev server"
    Write-Host "  .\dev.ps1 build      - Build produção"
    Write-Host ""
    Write-Host "Banco de Dados:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 db:setup   - Setup completo (generate + push)"
    Write-Host "  .\dev.ps1 db:gen     - Gerar cliente Prisma"
    Write-Host "  .\dev.ps1 db:push    - Push schema para banco"
    Write-Host "  .\dev.ps1 db:studio  - Abrir Prisma Studio"
    Write-Host "  .\dev.ps1 db:seed    - Popular dados de exemplo"
    Write-Host "  .\dev.ps1 db:reset   - Reset completo (CUIDADO!)"
    Write-Host ""
    Write-Host "Testes e Validação:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 check      - Type-check TypeScript"
    Write-Host "  .\dev.ps1 lint       - Rodar ESLint"
    Write-Host "  .\dev.ps1 format     - Formatar código com Prettier"
    Write-Host ""
    Write-Host "Limpeza:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 clean      - Limpar node_modules e .next"
    Write-Host ""
}

switch ($Command) {
    "install" {
        Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
        pnpm install
    }
    "dev" {
        Write-Host "🔥 Iniciando dev server..." -ForegroundColor Cyan
        pnpm dev
    }
    "build" {
        Write-Host "🏗️  Building para produção..." -ForegroundColor Cyan
        pnpm build
    }
    "db:setup" {
        Write-Host "🗄️  Setup completo do banco..." -ForegroundColor Cyan
        pnpm db:generate
        pnpm db:push
        Write-Host ""
        Write-Host "✅ Agora execute as RLS policies no Supabase SQL Editor:" -ForegroundColor Green
        Write-Host "   Arquivo: packages/database/prisma/rls-policies.sql"
    }
    "db:gen" {
        Write-Host "⚙️  Gerando cliente Prisma..." -ForegroundColor Cyan
        pnpm db:generate
    }
    "db:push" {
        Write-Host "⬆️  Pushing schema para banco..." -ForegroundColor Cyan
        pnpm db:push
    }
    "db:studio" {
        Write-Host "🎨 Abrindo Prisma Studio..." -ForegroundColor Cyan
        pnpm db:studio
    }
    "db:seed" {
        Write-Host "🌱 Populando banco com dados de exemplo..." -ForegroundColor Cyan
        pnpm --filter @agendazap/database db:seed
    }
    "db:reset" {
        Write-Host "⚠️  ATENÇÃO: Isso irá DELETAR todos os dados!" -ForegroundColor Red
        $confirm = Read-Host "Digite 'RESET' para confirmar"
        if ($confirm -eq "RESET") {
            pnpm db:push --force-reset
            Write-Host "✅ Banco resetado. Execute db:seed se quiser dados de exemplo." -ForegroundColor Green
        } else {
            Write-Host "❌ Operação cancelada." -ForegroundColor Yellow
        }
    }
    "check" {
        Write-Host "🔍 Verificando tipos TypeScript..." -ForegroundColor Cyan
        pnpm type-check
    }
    "lint" {
        Write-Host "🧹 Rodando ESLint..." -ForegroundColor Cyan
        pnpm lint
    }
    "format" {
        Write-Host "💅 Formatando código..." -ForegroundColor Cyan
        pnpm format
    }
    "clean" {
        Write-Host "🧹 Limpando diretórios..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/*/node_modules
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue packages/*/node_modules
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/web/.next
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .turbo
        Write-Host "✅ Limpo! Execute 'install' para reinstalar." -ForegroundColor Green
    }
    default {
        Show-Help
    }
}
