#!/bin/sh
set -e

# Run database schema push on first start
echo "Running database schema push..."
npx drizzle-kit push --force 2>&1 || echo "Schema push failed or already up to date"

# Run seed if DB is empty (check if roles table has data)
echo "Checking if seed is needed..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM roles').then(r => {
  if (parseInt(r.rows[0].count) === 0) {
    console.log('DB empty, running seed...');
    process.exit(1);
  } else {
    console.log('DB already seeded, skipping.');
    process.exit(0);
  }
}).catch(() => {
  console.log('Roles table not found or error, running seed...');
  process.exit(1);
});
" || npx tsx scripts/seed.ts 2>&1 || echo "Seed failed or not needed"

echo "Starting application..."
exec "$@"
