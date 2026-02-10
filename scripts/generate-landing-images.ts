/**
 * Script to generate landing page images for Mercari sellers
 * Run: npx tsx scripts/generate-landing-images.ts
 */
import fs from 'fs';
import path from 'path';

const API_KEY = 'SG_7729d35bb02bab18';
const API_URL = 'https://api.segmind.com/v1/z-image-turbo';

const prompts = [
  {
    name: 'before-amateur',
    prompt: 'Amateur smartphone photo of a casual floral dress placed messily on a bed with poor lighting and wrinkles, realistic everyday Japanese home setting, cluttered background, low quality photo, natural indoor lighting, unorganized, typical user photo for second-hand selling',
    width: 768,
    height: 1024,
  },
  {
    name: 'after-professional',
    prompt: 'Beautiful young Japanese woman model in her 20s wearing a floral casual dress, natural elegant pose, clean minimalist white-gray studio background, professional fashion photography style, high resolution, bright and appealing, perfect lighting, premium quality product photo',
    width: 768,
    height: 1024,
  },
  {
    name: 'model-dress',
    prompt: 'Beautiful Japanese woman in her late 20s wearing an elegant floral summer dress, standing gracefully in soft natural light, pale gray background, clean and premium fashion catalog style, high detail, realistic skin and fabric texture, perfect for Mercari product listing, attractive and sellable image',
    width: 768,
    height: 1024,
  },
  {
    name: 'model-bag',
    prompt: 'Stylish Japanese female model holding a luxury-looking leather shoulder bag, casual street fashion pose, urban minimalist background with soft bokeh, professional product photo, bright and clean, appealing for second-hand selling on Mercari, high resolution',
    width: 768,
    height: 1024,
  },
  {
    name: 'model-casual',
    prompt: 'Beautiful Japanese model wearing casual jeans and trendy white top, relaxed natural pose, clean white studio background, bright professional fashion photography, perfect for e-commerce listing, high quality, sharp focus',
    width: 768,
    height: 1024,
  },
  {
    name: 'model-coat',
    prompt: 'Elegant Japanese female model in fashionable beige trench coat, sophisticated pose, soft gray backdrop, professional fashion catalog photography, high-end product image for online marketplace, clean and premium aesthetic',
    width: 768,
    height: 1024,
  },
  {
    name: 'model-sneakers',
    prompt: 'Close-up shot of stylish white sneakers on Japanese model feet, casual street style, clean minimalist background, professional product photography for footwear listing, sharp detail, bright natural lighting',
    width: 1024,
    height: 768,
  },
  {
    name: 'model-accessories',
    prompt: 'Japanese model hand wearing elegant silver watch and bracelets, close-up product shot, soft neutral background, professional jewelry photography, clean and premium for online selling, natural skin tone, high detail',
    width: 1024,
    height: 768,
  },
];

async function generateImage(prompt: string, width: number, height: number): Promise<Buffer> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      steps: 8,
      guidance_scale: 1,
      seed: -1,
      width,
      height,
      image_format: 'webp',
      quality: 95,
      base_64: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'landing');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const item of prompts) {
    console.log(`Generating: ${item.name} (${item.width}x${item.height})...`);
    try {
      const buffer = await generateImage(item.prompt, item.width, item.height);
      const filePath = path.join(outDir, `${item.name}.webp`);
      fs.writeFileSync(filePath, buffer);
      console.log(`  ✓ Saved to ${filePath} (${(buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
    }
  }
  console.log('\nDone! All landing page images generated.');
}

main();
