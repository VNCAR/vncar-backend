const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres.eklxlsyqvxvqziwmiqab:Tptgk2026%40%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres' });
  await client.connect();
  await client.query('DROP FUNCTION IF EXISTS public.create_booking CASCADE;');
  await client.query('DROP TABLE IF EXISTS public.bookings CASCADE;');
  await client.end();
  console.log('Done');
}

main().catch(console.error);
