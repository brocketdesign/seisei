/**
 * Seed the database with AI model data and upload avatar images
 * Run: npx tsx scripts/seed-models.ts
 *
 * This script:
 *   1. Reads model avatar images from public/models/
 *   2. Uploads them to Supabase Storage (bucket: model-avatars)
 *   3. Inserts/updates ai_models rows with public avatar URLs
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Prerequisites:
 *   - At least one user exists (sign up first)
 *   - The ai_models table exists (run supabase-schema.sql)
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------
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

const BUCKET_NAME = 'model-avatars';

// ---------------------------------------------------------------------------
// Model definitions (matches src/types/models.ts initialModels)
// ---------------------------------------------------------------------------

const models = [
  {
    name: 'Yuki',
    file: 'yuki.jpg',
    type: 'preset',
    bodyType: 'Slim',
    age: 22,
    ethnicity: 'Japanese',
    tags: ['Cute', 'Casual'],
    isActive: true,
    isLocked: true,
  },
  {
    name: 'Aoi',
    file: 'aoi.jpg',
    type: 'preset',
    bodyType: 'Athletic',
    age: 25,
    ethnicity: 'Japanese',
    tags: ['Cool', 'Street'],
    isActive: false,
    isLocked: false,
  },
  {
    name: 'Rina',
    file: 'rina.jpg',
    type: 'preset',
    bodyType: 'Curvy',
    age: 28,
    ethnicity: 'Japanese',
    tags: ['Elegant', 'Formal'],
    isActive: true,
    isLocked: true,
  },
  {
    name: 'Hana',
    file: 'hana.jpg',
    type: 'preset',
    bodyType: 'Slim',
    age: 20,
    ethnicity: 'Japanese',
    tags: ['Modern', 'Vibrant'],
    isActive: true,
    isLocked: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET_NAME);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });
    if (error) {
      console.error('❌ Failed to create bucket:', error.message);
      process.exit(1);
    }
    console.log(`🪣 Created storage bucket: ${BUCKET_NAME}`);
  }
}

async function uploadImage(
  localPath: string,
  storagePath: string,
): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);

  // Remove existing file first (ignore errors)
  await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

// ---------------------------------------------------------------------------
// Ensure the ai_models table exists
// ---------------------------------------------------------------------------

async function ensureAiModelsTable() {
  const { error } = await supabase.from('ai_models').select('id').limit(1);
  if (error && error.message.includes('ai_models')) {
    console.error('❌ The "ai_models" table does not exist in your Supabase database.');
    console.error('   Please run the ai_models table SQL from supabase-schema.sql in your Supabase SQL Editor.');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  // 0. Ensure ai_models table exists
  await ensureAiModelsTable();

  // 1. Get the first user
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError || !users?.users?.length) {
    console.error('❌ No users found. Sign up at least one user first.');
    process.exit(1);
  }

  const userId = users.users[0].id;
  console.log(`👤 Seeding AI models for user: ${users.users[0].email} (${userId})\n`);

  // 2. Ensure the storage bucket exists
  await ensureBucket();

  // 3. Process each model
  const modelsDir = path.join(__dirname, '..', 'public', 'models');
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const model of models) {
    const localPath = path.join(modelsDir, model.file);

    if (!fs.existsSync(localPath)) {
      console.warn(`⚠️  Avatar image not found: ${localPath} — skipping ${model.name}`);
      failed++;
      continue;
    }

    try {
      // Upload avatar to Supabase Storage
      const storagePath = `${userId}/${model.file}`;
      console.log(`⬆️  Uploading ${model.name}'s avatar...`);
      const thumbnailUrl = await uploadImage(localPath, storagePath);
      console.log(`   📎 URL: ${thumbnailUrl}`);

      // Build model_data JSONB
      const modelData = {
        bodyType: model.bodyType,
        age: model.age,
        ethnicity: model.ethnicity,
        tags: model.tags,
        isActive: model.isActive,
        isLocked: model.isLocked,
      };

      // Check if model already exists (by name + user)
      const { data: existing } = await supabase
        .from('ai_models')
        .select('id')
        .eq('user_id', userId)
        .eq('name', model.name)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing model
        const { error: updateError } = await supabase
          .from('ai_models')
          .update({
            thumbnail_url: thumbnailUrl,
            type: model.type,
            model_data: modelData,
          })
          .eq('id', existing[0].id);

        if (updateError) throw new Error(updateError.message);
        console.log(`♻️  Updated: ${model.name}`);
        updated++;
      } else {
        // Insert new model
        const { error: insertError } = await supabase
          .from('ai_models')
          .insert({
            user_id: userId,
            name: model.name,
            type: model.type,
            thumbnail_url: thumbnailUrl,
            model_data: modelData,
          });

        if (insertError) throw new Error(insertError.message);
        console.log(`✅ Inserted: ${model.name}`);
        inserted++;
      }
    } catch (err) {
      console.error(`❌ Failed: ${model.name} — ${err}`);
      failed++;
    }

    console.log('');
  }

  console.log('━'.repeat(50));
  console.log(`✅ Done! Inserted: ${inserted}, Updated: ${updated}, Failed: ${failed}`);
}

seed();
