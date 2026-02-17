#!/usr/bin/env bash
set -e

# Build script para Vercel que gera o Prisma Client corretamente
echo "🔧 Step 1: Generating Prisma Client with all necessary engines..."

cd packages/database
pnpm prisma generate
cd ../.. 

echo "📦 Step 2: Building Next.js application..."
pnpm turbo build --filter=@easyfyapp/web

echo "📋 Step 3: Copying Prisma engine files to output..."
cd apps/web
node scripts/copy-prisma.js

echo "✅ Build completed successfully for Vercel deployment"