#!/bin/bash
# Script para corrigir tipos do Prisma

echo "Limpando cache do Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

echo "Regenerando Prisma Client..."
pnpm db:generate

echo "Instalando dependências novamente..."
pnpm install

echo "Feito! Os tipos do Prisma foram regenerados."
