/**
 * Setup Demo Account
 * 
 * This script:
 *   1. Deletes ALL existing users and their data from the database
 *   2. Creates a demo@seisei.me account
 *   3. Seeds campaigns, models, and products linked to that account
 *
 * Run: npx tsx scripts/setup-demo.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
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

const DEMO_EMAIL = 'demo@seisei.me';
const DEMO_PASSWORD = 'demo1234';

// ---------------------------------------------------------------------------
// Campaign definitions
// ---------------------------------------------------------------------------
const campaigns = [
  { name: '春コレクション 2026', status: 'active', description: '楽天市場 · 2026-02-01 ~ 2026-03-31' },
  { name: 'バレンタイン特集', status: 'active', description: 'Instagram · 2026-02-01 ~ 2026-02-14' },
  { name: '新作デニムライン', status: 'scheduled', description: 'ZOZOTOWN · 2026-03-01 ~ 2026-04-30' },
  { name: '冬セール最終', status: 'completed', description: 'Amazon · 2026-01-01 ~ 2026-01-31' },
  { name: 'Summer 2026', status: 'draft', description: '夏向け新作コレクション' },
];

// ---------------------------------------------------------------------------
// Model definitions
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
    sex: 'female' as const,
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
    sex: 'female' as const,
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
    sex: 'female' as const,
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
    sex: 'female' as const,
  },
];

// ---------------------------------------------------------------------------
// Product definitions (imported inline to avoid cross-dependency)
// ---------------------------------------------------------------------------
const campaignProducts: Record<string, { file: string; name: string; category: string; description: string; tags: string[] }[]> = {
  '春コレクション 2026': [
    { file: 'spring-blouse', name: '花柄シフォンブラウス', category: 'トップス', description: '軽やかなシフォン素材に春らしい花柄をあしらったブラウス', tags: ['春', 'ブラウス', '花柄', 'シフォン'] },
    { file: 'spring-cardigan', name: 'パステルニットカーディガン', category: 'アウター', description: '淡いミントグリーンの軽量ニットカーディガン', tags: ['春', 'カーディガン', 'ニット', 'パステル'] },
    { file: 'spring-skirt', name: 'プリーツミディスカート', category: 'ボトムス', description: '上品なプリーツ加工のミディ丈スカート、ライトベージュ', tags: ['春', 'スカート', 'プリーツ', 'ミディ'] },
  ],
  'バレンタイン特集': [
    { file: 'valentine-dress', name: 'レッドサテンワンピース', category: 'ワンピース', description: '鮮やかなレッドのサテン素材ワンピース、バレンタインデートに', tags: ['バレンタイン', 'ワンピース', 'レッド', 'サテン'] },
    { file: 'valentine-knit', name: 'ハートモチーフニット', category: 'トップス', description: 'ハート柄の刺繍が可愛いピンクニットトップス', tags: ['バレンタイン', 'ニット', 'ハート', 'ピンク'] },
    { file: 'valentine-bag', name: 'ミニショルダーバッグ', category: 'バッグ', description: 'チェーンストラップのミニショルダーバッグ、ローズピンク', tags: ['バレンタイン', 'バッグ', 'ショルダー', 'ピンク'] },
  ],
  '新作デニムライン': [
    { file: 'denim-straight', name: 'ストレートデニム', category: 'ボトムス', description: 'クラシックなストレートシルエットのインディゴデニム', tags: ['デニム', 'ストレート', 'インディゴ'] },
    { file: 'denim-jacket', name: 'オーバーサイズデニムジャケット', category: 'アウター', description: 'トレンドのオーバーサイズシルエット、ライトウォッシュ', tags: ['デニム', 'ジャケット', 'オーバーサイズ'] },
    { file: 'denim-wide', name: 'ワイドレッグデニム', category: 'ボトムス', description: 'ゆったりワイドシルエットのダークウォッシュデニム', tags: ['デニム', 'ワイドレッグ', 'ダークウォッシュ'] },
  ],
  '冬セール最終': [
    { file: 'winter-coat', name: 'ウールロングコート', category: 'アウター', description: 'キャメルカラーの上質ウールロングコート', tags: ['冬', 'コート', 'ウール', 'キャメル'] },
    { file: 'winter-sweater', name: 'ケーブルニットセーター', category: 'トップス', description: 'ケーブル編みのクリームホワイトセーター', tags: ['冬', 'セーター', 'ケーブルニット', 'ホワイト'] },
    { file: 'winter-boots', name: 'レザーアンクルブーツ', category: 'シューズ', description: 'ブラックレザーのサイドジップアンクルブーツ', tags: ['冬', 'ブーツ', 'レザー', 'ブラック'] },
  ],
  'Summer 2026': [
    { file: 'summer-tee', name: 'オーガニックコットンTシャツ', category: 'トップス', description: 'シンプルなホワイトのオーガニックコットンTシャツ', tags: ['夏', 'Tシャツ', 'コットン', 'ホワイト'] },
    { file: 'summer-shorts', name: 'リネンショートパンツ', category: 'ボトムス', description: '涼しげなネイビーリネンのショートパンツ', tags: ['夏', 'ショートパンツ', 'リネン', 'ネイビー'] },
    { file: 'summer-sandals', name: 'レザーストラップサンダル', category: 'シューズ', description: 'タンカラーのレザーストラップフラットサンダル', tags: ['夏', 'サンダル', 'レザー', 'タン'] },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODEL_BUCKET = 'model-avatars';
const PRODUCT_BUCKET = 'product-images';

async function ensureBucket(bucketName: string, mimeTypes: string[]) {
  const { data } = await supabase.storage.getBucket(bucketName);
  if (!data) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: mimeTypes,
    });
    if (error && !error.message.includes('already exists')) {
      console.error(`❌ Failed to create bucket ${bucketName}:`, error.message);
    } else {
      console.log(`🪣 Bucket ready: ${bucketName}`);
    }
  }
}

async function uploadImage(bucket: string, localPath: string, storagePath: string, contentType: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  await supabase.storage.from(bucket).remove([storagePath]);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, { contentType, upsert: true });
  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return urlData.publicUrl;
}

// ---------------------------------------------------------------------------
// Step 1: Delete all users & data
// ---------------------------------------------------------------------------
async function deleteAllUsersAndData() {
  console.log('\n🗑️  Deleting all existing data...\n');

  // Delete all rows from tables (cascade will handle foreign keys from auth.users,
  // but we also clean up explicitly in case of orphaned data)
  for (const table of ['generations', 'products', 'ai_models', 'campaigns', 'profiles']) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.warn(`   ⚠️  Could not clean ${table}: ${error.message}`);
    } else {
      console.log(`   ✓ Cleaned table: ${table}`);
    }
  }

  // Delete all auth users
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('   ❌ Failed to list users:', usersError.message);
    return;
  }

  for (const user of usersData.users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.warn(`   ⚠️  Failed to delete user ${user.email}: ${error.message}`);
    } else {
      console.log(`   ✓ Deleted user: ${user.email}`);
    }
  }

  console.log('   ✅ All users and data deleted.\n');
}

// ---------------------------------------------------------------------------
// Step 2: Create demo account
// ---------------------------------------------------------------------------
async function createDemoAccount(): Promise<string> {
  console.log(`👤 Creating demo account: ${DEMO_EMAIL}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error('❌ Failed to create demo user:', error.message);
    process.exit(1);
  }

  const userId = data.user.id;
  console.log(`   ✅ Created: ${DEMO_EMAIL} (${userId})`);
  console.log(`   🔑 Password: ${DEMO_PASSWORD}\n`);

  // Update profile with brand info
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      brand_name: 'Seisei Demo',
      description: 'AIファッションモデル生成のデモアカウント',
      categories: ['アパレル', 'アクセサリー'],
      target_audience: ['20代', '30代', '女性'],
      price_range: '¥5,000〜¥30,000',
      styles: ['カジュアル', 'フォーマル', 'ストリート'],
      platforms: ['Instagram', 'ZOZOTOWN', '楽天市場'],
      plan: 'pro',
    })
    .eq('id', userId);

  if (profileError) {
    console.warn('   ⚠️  Could not update profile:', profileError.message);
  } else {
    console.log('   ✅ Profile updated with brand info.\n');
  }

  return userId;
}

// ---------------------------------------------------------------------------
// Step 3: Seed campaigns
// ---------------------------------------------------------------------------
async function seedCampaigns(userId: string): Promise<Map<string, string>> {
  console.log('📢 Seeding campaigns...');

  const rows = campaigns.map(c => ({
    user_id: userId,
    name: c.name,
    status: c.status,
    description: c.description,
  }));

  const { data, error } = await supabase.from('campaigns').insert(rows).select();

  if (error) {
    console.error('   ❌ Campaign insert failed:', error.message);
    process.exit(1);
  }

  const campaignMap = new Map<string, string>();
  for (const c of data) {
    campaignMap.set(c.name, c.id);
    console.log(`   ✅ ${c.name} [${c.status}]`);
  }
  console.log('');
  return campaignMap;
}

// ---------------------------------------------------------------------------
// Step 4: Seed models
// ---------------------------------------------------------------------------
async function seedModels(userId: string) {
  console.log('🧑‍🎤 Seeding AI models...');

  await ensureBucket(MODEL_BUCKET, ['image/png', 'image/jpeg', 'image/webp']);

  const modelsDir = path.join(__dirname, '..', 'public', 'models');

  for (const model of models) {
    const localPath = path.join(modelsDir, model.file);
    if (!fs.existsSync(localPath)) {
      console.warn(`   ⚠️  Avatar not found: ${localPath} — skipping ${model.name}`);
      continue;
    }

    try {
      const storagePath = `${userId}/${model.file}`;
      const thumbnailUrl = await uploadImage(MODEL_BUCKET, localPath, storagePath, 'image/jpeg');

      const modelData = {
        bodyType: model.bodyType,
        age: model.age,
        ethnicity: model.ethnicity,
        tags: model.tags,
        isActive: model.isActive,
        isLocked: model.isLocked,
        sex: model.sex,
      };

      const { error } = await supabase.from('ai_models').insert({
        user_id: userId,
        name: model.name,
        type: model.type,
        thumbnail_url: thumbnailUrl,
        model_data: modelData,
      });

      if (error) throw new Error(error.message);
      console.log(`   ✅ ${model.name}`);
    } catch (err) {
      console.error(`   ❌ ${model.name}: ${err}`);
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Step 5: Seed products
// ---------------------------------------------------------------------------
async function seedProducts(userId: string, campaignMap: Map<string, string>) {
  console.log('📦 Seeding products...');

  await ensureBucket(PRODUCT_BUCKET, ['image/png', 'image/jpeg', 'image/webp']);

  const productsBaseDir = path.join(__dirname, '..', 'public', 'products');

  for (const [campaignName, products] of Object.entries(campaignProducts)) {
    const campaignId = campaignMap.get(campaignName);
    if (!campaignId) {
      console.warn(`   ⚠️  Campaign "${campaignName}" not found — skipping`);
      continue;
    }

    const folderName = campaignName.replace(/\s+/g, '-').replace(/[^\w\u3000-\u9FFFぁ-んァ-ヶー-]/g, '');

    for (const product of products) {
      const localPath = path.join(productsBaseDir, folderName, `${product.file}.webp`);

      if (!fs.existsSync(localPath)) {
        console.warn(`   ⚠️  Image not found: ${localPath} — skipping`);
        continue;
      }

      try {
        const storagePath = `${userId}/${campaignId}/${product.file}.webp`;
        const imageUrl = await uploadImage(PRODUCT_BUCKET, localPath, storagePath, 'image/webp');

        const { error } = await supabase.from('products').insert({
          user_id: userId,
          campaign_id: campaignId,
          name: product.name,
          description: product.description,
          image_url: imageUrl,
          category: product.category,
          tags: product.tags,
          is_active: true,
        });

        if (error) throw new Error(error.message);
        console.log(`   ✅ ${product.name} → ${campaignName}`);
      } catch (err) {
        console.error(`   ❌ ${product.name}: ${err}`);
      }
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('━'.repeat(55));
  console.log('  🚀 Seisei Demo Account Setup');
  console.log('━'.repeat(55));

  // 1. Delete everything
  await deleteAllUsersAndData();

  // 2. Create demo account
  const userId = await createDemoAccount();

  // 3. Seed campaigns
  const campaignMap = await seedCampaigns(userId);

  // 4. Seed models
  await seedModels(userId);

  // 5. Seed products
  await seedProducts(userId, campaignMap);

  console.log('━'.repeat(55));
  console.log('  ✅ Demo setup complete!');
  console.log(`  📧 Email:    ${DEMO_EMAIL}`);
  console.log(`  🔑 Password: ${DEMO_PASSWORD}`);
  console.log('━'.repeat(55));
}

main();
