/**
 * Set a user as admin by email address.
 * Run: npx tsx scripts/set-admin.ts <email>
 *
 * Example: npx tsx scripts/set-admin.ts didier@hatoltd.com
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env
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
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const email = process.argv[2];
if (!email) {
    console.error('Usage: npx tsx scripts/set-admin.ts <email>');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    // Find the user by email in profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, plan')
        .eq('email', email)
        .single();

    if (profileError || !profile) {
        console.error(`User not found with email: ${email}`);
        if (profileError) console.error('Error:', profileError.message);
        process.exit(1);
    }

    console.log(`Found user:`);
    console.log(`  ID:    ${profile.id}`);
    console.log(`  Email: ${profile.email}`);
    console.log(`  Plan:  ${profile.plan}`);
    console.log(`  Role:  ${profile.role ?? '(none)'}`);

    if (profile.role === 'admin') {
        console.log(`\nUser is already an admin.`);
        return;
    }

    // Set role to admin
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', profile.id);

    if (updateError) {
        console.error(`Failed to update role:`, updateError.message);
        process.exit(1);
    }

    console.log(`\nSuccessfully set ${email} as admin.`);
}

main();
