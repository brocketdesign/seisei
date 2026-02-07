/**
 * Seed the database with initial campaign data
 * Run: npx tsx scripts/seed-campaigns.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env file manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const campaigns = [
  { name: '春コレクション 2026', status: 'active', description: '楽天市場 · 2026-02-01 ~ 2026-03-31' },
  { name: 'バレンタイン特集', status: 'active', description: 'Instagram · 2026-02-01 ~ 2026-02-14' },
  { name: '新作デニムライン', status: 'scheduled', description: 'ZOZOTOWN · 2026-03-01 ~ 2026-04-30' },
  { name: '冬セール最終', status: 'completed', description: 'Amazon · 2026-01-01 ~ 2026-01-31' },
  { name: 'Summer 2026', status: 'draft', description: '夏向け新作コレクション' },
];

async function seed() {
  // Get the first user in the system to assign campaigns to
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError || !users?.users?.length) {
    console.error('❌ No users found. Sign up at least one user first.');
    process.exit(1);
  }

  const userId = users.users[0].id;
  console.log(`👤 Seeding campaigns for user: ${users.users[0].email} (${userId})`);

  // Check for existing campaigns
  const { data: existing } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId);

  if (existing && existing.length > 0) {
    console.log(`⚠️  User already has ${existing.length} campaign(s). Skipping duplicates...`);
  }

  // Insert campaigns
  const rows = campaigns.map(c => ({
    user_id: userId,
    name: c.name,
    status: c.status,
    description: c.description,
  }));

  const { data, error } = await supabase
    .from('campaigns')
    .insert(rows)
    .select();

  if (error) {
    console.error('❌ Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Seeded ${data.length} campaigns:`);
  data.forEach(c => {
    console.log(`   • ${c.name} [${c.status}]`);
  });
}

seed();
