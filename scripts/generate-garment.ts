import fs from 'fs';

const API_KEY = 'SG_7729d35bb02bab18';
const API_URL = 'https://api.segmind.com/v1/z-image-turbo';

async function main() {
  console.log('Generating garment flat-lay...');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'A luxurious black oversized blazer laid flat on a pure white background, product photography, e-commerce style, minimal, perfectly lit, no model, just the garment, high resolution',
      negative_prompt: 'person, model, mannequin, low quality, blurry',
      samples: 1,
      scheduler: 'DPM++ 2M SDE',
      num_inference_steps: 20,
      guidance_scale: 7,
      seed: 42,
      img_width: 768,
      img_height: 768,
    }),
  });
  if (!response.ok) throw new Error(await response.text());
  const buf = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync('public/hero/garment-input.png', buf);
  console.log('Done!');
}
main();
