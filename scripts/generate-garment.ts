import fs from 'fs';

const API_KEY = process.env.SEGMIND_API_KEY || 'SG_7729d35bb02bab18';
const API_URL = 'https://api.segmind.com/v1/seedream-4.5';

async function main() {
  console.log('Generating garment flat-lay...');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Professional flat-lay product photography of a luxurious black oversized blazer on a pure white background, e-commerce style, minimal, perfectly lit, no model, just the garment, high resolution, 8K quality',
      size: '2K',
      width: 2048,
      height: 2048,
      aspect_ratio: '1:1',
      max_images: 1,
      sequential_image_generation: 'disabled',
    }),
  });
  if (!response.ok) throw new Error(await response.text());
  const buf = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync('public/hero/garment-input.png', buf);
  console.log('Done!');
}
main();
