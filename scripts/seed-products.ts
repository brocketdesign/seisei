/**
 * Seed the database with products for each campaign
 * Run: npx tsx scripts/seed-products.ts
 *
 * This script:
 *   1. Reads generated product images from public/products/
 *   2. Uploads them to Supabase Storage (bucket: product-images)
 *   3. Inserts product rows linked to existing campaigns
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Prerequisites:
 *   - At least one user exists
 *   - Campaigns have been seeded (npx tsx scripts/seed-campaigns.ts)
 *   - Product images have been generated (npx tsx scripts/generate-product-images.ts)
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { campaignProducts } from './generate-product-images';

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

const BUCKET_NAME = 'product-images';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET_NAME);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024,
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

  // Try to remove existing file first (ignore errors)
  await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/webp',
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
// Ensure the products table exists
// ---------------------------------------------------------------------------

async function ensureProductsTable() {
  const { error } = await supabase.from('products').select('id').limit(1);
  if (error && error.message.includes('products')) {
    console.error('❌ The "products" table does not exist in your Supabase database.');
    console.error('   Please run the products table SQL from supabase-schema.sql in your Supabase SQL Editor.');
    console.error('   (Dashboard → SQL Editor → paste the CREATE TABLE block for products)\n');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  // 0. Ensure products table exists
  await ensureProductsTable();

  // 1. Get the first user
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError || !users?.users?.length) {
    console.error('❌ No users found. Sign up at least one user first.');
    process.exit(1);
  }

  const userId = users.users[0].id;
  console.log(`👤 Seeding products for user: ${users.users[0].email} (${userId})\n`);

  // 2. Fetch existing campaigns for this user
  const { data: campaigns, error: campError } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('user_id', userId);

  if (campError || !campaigns?.length) {
    console.error('❌ No campaigns found. Run seed-campaigns.ts first.');
    process.exit(1);
  }

  // Build a name→id lookup
  const campaignMap = new Map<string, string>();
  for (const c of campaigns) {
    campaignMap.set(c.name, c.id);
  }

  // 3. Ensure the storage bucket exists
  await ensureBucket();

  // 4. Process each campaign's products
  const productsBaseDir = path.join(__dirname, '..', 'public', 'products');
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const [campaignName, products] of Object.entries(campaignProducts)) {
    const campaignId = campaignMap.get(campaignName);
    if (!campaignId) {
      console.warn(`⚠️  Campaign "${campaignName}" not found in DB — skipping`);
      skipped += products.length;
      continue;
    }

    console.log(`📦 Campaign: ${campaignName} (${campaignId})`);

    // Build the local folder name (same logic as generate script)
    const folderName = campaignName
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3000-\u9FFFぁ-んァ-ヶー-]/g, '');

    for (const product of products) {
      const localPath = path.join(productsBaseDir, folderName, `${product.file}.webp`);

      if (!fs.existsSync(localPath)) {
        console.warn(`   ⚠️  Image not found: ${localPath} — skipping`);
        skipped++;
        continue;
      }

      try {
        // Upload to Supabase Storage
        const storagePath = `${userId}/${campaignId}/${product.file}.webp`;
        console.log(`   ⬆️  Uploading ${product.name}...`);
        const imageUrl = await uploadImage(localPath, storagePath);

        // Check if product already exists (by name + campaign)
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', userId)
          .eq('campaign_id', campaignId)
          .eq('name', product.name)
          .limit(1);

        if (existing && existing.length > 0) {
          // Update existing product's image URL
          await supabase
            .from('products')
            .update({ image_url: imageUrl, description: product.description, category: product.category, tags: product.tags })
            .eq('id', existing[0].id);
          console.log(`   ♻️  Updated existing: ${product.name}`);
          inserted++;
          continue;
        }

        // Insert new product
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            user_id: userId,
            campaign_id: campaignId,
            name: product.name,
            description: product.description,
            image_url: imageUrl,
            category: product.category,
            tags: product.tags,
            is_active: true,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }

        console.log(`   ✅ Inserted: ${product.name}`);
        inserted++;
      } catch (err) {
        console.error(`   ❌ Failed: ${product.name} — ${err}`);
        failed++;
      }
    }
    console.log('');
  }

  console.log('━'.repeat(50));
  console.log(`✅ Done! Inserted/updated: ${inserted}, Skipped: ${skipped}, Failed: ${failed}`);
}

seed();
