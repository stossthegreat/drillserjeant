#!/bin/bash
set -e

echo "🚀 Running Prisma migrations..."
npx prisma migrate dev --name init

echo "🌱 Seeding database..."
node scripts/seed.js

echo "✅ Migration and seeding complete!"
