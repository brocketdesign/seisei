/**
 * Generate background preview images for the generation settings panel
 * Run: npx tsx scripts/generate-background-images.ts
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.SEGMIND_API_KEY || 'SG_7729d35bb02bab18';
const API_URL = 'https://api.segmind.com/v1/z-image-turbo';

const backgrounds = [
  {
    name: 'studio',
    label: 'スタジオ（白背景）',
    prompt: 'Empty professional photography studio with pure white cyclorama background, soft diffused studio lighting, clean minimal space, no people, commercial product photography environment, light grey floor, softboxes visible, 8k quality, photorealistic',
  },
  {
    name: 'street',
    label: 'ストリート（昼）',
    prompt: 'Beautiful urban street scene in Tokyo during daytime, no people, trendy Omotesando tree-lined boulevard, modern architecture, natural sunlight, clean sidewalk, stylish storefronts, warm afternoon light, fashion district atmosphere, 8k quality, photorealistic',
  },
  {
    name: 'cafe',
    label: 'カフェ（屋内）',
    prompt: 'Stylish modern Japanese cafe interior, no people, warm ambient lighting, wooden furniture, exposed brick wall, hanging pendant lights, latte art on counter, cozy atmosphere, natural light from large windows, aesthetic minimalist design, 8k quality, photorealistic',
  },
  {
    name: 'nature',
    label: '自然光',
    prompt: 'Beautiful outdoor nature scene with soft golden hour sunlight, no people, lush green park with trees, dappled light through leaves, flower garden path, serene natural setting, dreamy bokeh background, warm golden tones, 8k quality, photorealistic',
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
      steps: 8,
      guidance_scale: 1,
      seed: -1,
      width: 512,
      height: 512,
      image_format: 'webp',
      quality: 85,
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
  const outDir = path.join(__dirname, '..', 'public', 'backgrounds');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const bg of backgrounds) {
    console.log(`Generating: ${bg.name} (${bg.label})...`);
    try {
      const buffer = await generateImage(bg.prompt);
      const filePath = path.join(outDir, `${bg.name}.webp`);
      fs.writeFileSync(filePath, buffer);
      console.log(`  ✓ Saved ${filePath} (${(buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
    }
  }
  console.log('\nDone! Images saved to public/backgrounds/');
}

main();
