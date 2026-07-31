import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const logoPath = path.join(rootDir, "src/assets/Logo.jpeg");
const outputDir = path.join(rootDir, "src-tauri/icons");

const BRAND_NAVY = { r: 36, g: 32, b: 120 };

async function renderSquareIcon(size) {
  const padding = Math.round(size * 0.12);
  const inner = size - padding * 2;
  const logo = sharp(logoPath);
  const metadata = await logo.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read logo dimensions.");
  }

  const scale = Math.min(inner / metadata.width, inner / metadata.height);
  const width = Math.round(metadata.width * scale);
  const height = Math.round(metadata.height * scale);
  const left = Math.round((size - width) / 2);
  const top = Math.round((size - height) / 2);
  const resizedLogo = await logo.resize(width, height).toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BRAND_NAVY,
    },
  })
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toBuffer();
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const icon32 = await renderSquareIcon(32);
  const icon128 = await renderSquareIcon(128);
  const icon256 = await renderSquareIcon(256);

  await fs.writeFile(path.join(outputDir, "32x32.png"), icon32);
  await fs.writeFile(path.join(outputDir, "128x128.png"), icon128);
  await fs.writeFile(path.join(outputDir, "128x128@2x.png"), icon256);

  const icoBuffer = await toIco([icon32, icon128, icon256]);
  await fs.writeFile(path.join(outputDir, "icon.ico"), icoBuffer);

  console.log("Generated Tauri icons in src-tauri/icons");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
