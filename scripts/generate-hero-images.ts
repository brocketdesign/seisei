/**
 * Script to generate hero showcase images via Segmind API (Seedream 4.5)
 * Run: npx tsx scripts/generate-hero-images.ts
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.SEGMIND_API_KEY || 'SG_7729d35bb02bab18';
const API_URL = 'https://api.segmind.com/v1/seedream-4.5';

const prompts = [
  {
    name: 'hero-runway',
    prompt: 'A stunning Japanese female model walking on a minimalist white runway, wearing an elegant black oversized blazer and wide-leg trousers, editorial fashion photography, dramatic studio lighting, full body shot, ultra high resolution, vogue editorial, clean white background, sharp focus, 8k quality, professional fashion magazine',
    width: 768,
    height: 1024,
  },
  {
    name: 'hero-editorial',
    prompt: 'A beautiful Japanese female model in a luxurious cream cashmere knit sweater, posing in a bright airy white studio, soft natural window light, editorial fashion photography, upper body portrait, sharp focus, high-end fashion brand campaign, professional studio lighting, vogue japan, 8k quality',
    width: 768,
    height: 1024,
  },
  {
    name: 'hero-street',
    prompt: 'A stylish young Japanese female model wearing trendy streetwear, oversized denim jacket and white designer t-shirt, standing in modern Tokyo with soft bokeh background, street style fashion photography, confident pose, editorial quality, golden hour natural daylight, sharp focus, 8k, professional photo',
    width: 768,
    height: 1024,
  },
  {
    name: 'garment-input',
    prompt: 'A luxurious black oversized tailored blazer jacket laid flat on a pure white background, professional e-commerce product photography, perfectly lit, no model, just the single garment, clean minimal composition, high resolution, sharp focus, studio lighting, 8k',
    width: 768,
    height: 768,
  },
];

async function generateImage(prompt: string, width: number, height: number): Promise<Buffer> {
  const aspectRatio = width === height ? '1:1' : width > height ? '4:3' : '3:4';
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      size: '2K',
      width,
      height,
      aspect_ratio: aspectRatio,
      max_images: 1,
      sequential_image_generation: 'disabled',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'hero');
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
  console.log('\nDone! All images regenerated.');
}

main();
