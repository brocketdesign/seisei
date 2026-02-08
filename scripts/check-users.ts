/**
 * Check users in the database
 * Run: npx tsx scripts/check-users.ts
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    process.exit(1);
  }

  const users = data.users;
  console.log(`\nFound ${users.length} user(s):\n`);

  for (const user of users) {
    console.log(`  ID:         ${user.id}`);
    console.log(`  Email:      ${user.email ?? '(none)'}`);
    console.log(`  Created:    ${user.created_at}`);
    console.log(`  Last login: ${user.last_sign_in_at ?? 'never'}`);
    console.log(`  Provider:   ${user.app_metadata?.provider ?? 'unknown'}`);
    console.log('');
  }
}

main();
