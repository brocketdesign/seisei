/**
 * Generate style-specific preview images for onboarding step 3
 * Run: npx tsx scripts/generate-style-images.ts
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.SEGMIND_API_KEY || 'SG_7729d35bb02bab18';
const API_URL = 'https://api.segmind.com/v1/seedream-4.5';

const styles = [
  {
    name: 'minimal',
    prompt: 'A Japanese female model in a clean white minimalist outfit, simple elegant silhouette, standing in a pure white studio, soft diffused lighting, high-end understated fashion, muji-inspired aesthetic, clean composition, editorial fashion photography, sharp focus, 8k quality',
  },
  {
    name: 'street',
    prompt: 'A cool young Japanese woman in trendy Tokyo streetwear, oversized graphic hoodie, cargo pants, sneakers, standing in Harajuku with neon signs and urban backdrop, confident street style pose, dynamic angle, vibrant colors, street fashion photography, sharp focus, 8k quality',
  },
  {
    name: 'casual',
    prompt: 'A friendly Japanese woman in casual everyday clothes, relaxed linen shirt and jeans, walking through a sunny cafe terrace, warm natural light, approachable lifestyle fashion photography, soft warm tones, candid relaxed pose, sharp focus, 8k quality',
  },
  {
    name: 'luxury',
    prompt: 'An elegant Japanese woman in a luxurious black silk evening gown, standing in a grand marble hotel lobby with golden lighting, high fashion glamour, sophisticated pose, dramatic lighting, luxury brand campaign aesthetic, vogue editorial, sharp focus, 8k quality',
  },
  {
    name: 'mode',
    prompt: 'An avant-garde Japanese model in an architectural deconstructed black outfit, geometric shapes, standing in a stark concrete gallery space, dramatic shadows, high contrast lighting, comme des garcons aesthetic, experimental fashion, sharp focus, 8k quality',
  },
  {
    name: 'fem',
    prompt: 'A graceful Japanese woman in a flowing pastel pink chiffon dress, soft romantic lighting, flower garden background with cherry blossoms, feminine and delicate aesthetic, dreamy atmosphere, soft focus background, fashion editorial, sharp focus on model, 8k quality',
  },
];

async function generateImage(prompt: string): Promise<Buffer> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      size: '2K',
      width: 1024,
      height: 1536,
      aspect_ratio: '2:3',
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
  const outDir = path.join(__dirname, '..', 'public', 'styles');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const style of styles) {
    console.log(`Generating: ${style.name}...`);
    try {
      const buffer = await generateImage(style.prompt);
      const filePath = path.join(outDir, `${style.name}.webp`);
      fs.writeFileSync(filePath, buffer);
      console.log(`  ✓ Saved (${(buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
    }
  }
  console.log('\nDone!');
}

main();
