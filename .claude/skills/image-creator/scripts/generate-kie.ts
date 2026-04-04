#!/usr/bin/env npx tsx
/**
 * Image Generation via Kie.ai API
 * Usage: npx tsx generate-kie.ts --prompt "description" [--model ideogram/v3-text-to-image] [--output path.png] [--size square_hd] [--speed TURBO] [--style AUTO]
 *
 * Models disponibles:
 *   ideogram/v3-text-to-image    ($0.0175 TURBO / $0.035 BALANCED / $0.05 QUALITY)
 *   grok/imagine                 ($0.003 por 6 imagenes)
 *   nano-banana-2/text-to-image  ($0.04 1K / $0.06 2K / $0.09 4K)
 *   seedream/5.0-lite            ($0.0275)
 *   google/imagen4-fast          ($0.02)
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
}

const prompt = getArg("prompt");
const model = getArg("model") || "ideogram/v3-text-to-image";
const outputPath = getArg("output");
const imageSize = getArg("size") || "square_hd";
const speed = getArg("speed") || "TURBO";
const style = getArg("style") || "AUTO";
const maxWait = parseInt(getArg("wait") || "120", 10); // max seconds to wait

if (!prompt) {
  console.error("Usage: npx tsx generate-kie.ts --prompt 'description'");
  console.error("Options:");
  console.error("  --prompt    Text description (REQUIRED)");
  console.error("  --model     Model ID (default: ideogram/v3-text-to-image)");
  console.error("  --output    Output path (default: generated/content/img-{ts}.png)");
  console.error("  --size      Image size: square, square_hd, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9");
  console.error("  --speed     Rendering speed: TURBO, BALANCED, QUALITY (default: TURBO)");
  console.error("  --style     Style: AUTO, GENERAL, REALISTIC, DESIGN (default: AUTO)");
  console.error("  --wait      Max seconds to wait for result (default: 120)");
  process.exit(1);
}

function loadApiKey(): string {
  const envPaths = [".env.local", ".env"];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const match = content.match(/KIE_API_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  }
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY;
  console.error("ERROR: KIE_API_KEY not found in .env.local, .env, or environment");
  process.exit(1);
}

const apiKey = loadApiKey();
const BASE_URL = "https://api.kie.ai/api/v1/jobs";

async function createTask(): Promise<string> {
  console.error(`Creating task with ${model}...`);
  console.error(`Prompt: ${prompt}`);
  console.error(`Size: ${imageSize} | Speed: ${speed} | Style: ${style}`);

  const body: Record<string, unknown> = {
    model,
    input: {
      prompt,
      rendering_speed: speed,
      style,
      expand_prompt: true,
      image_size: imageSize,
      negative_prompt: "",
    },
  };

  const response = await fetch(`${BASE_URL}/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ERROR: Kie.ai API returned ${response.status}`);
    console.error(errorText);
    process.exit(1);
  }

  const data = (await response.json()) as { code: number; msg: string; data: { taskId: string } };

  if (data.code !== 200) {
    console.error(`ERROR: ${data.msg}`);
    process.exit(1);
  }

  console.error(`Task created: ${data.data.taskId}`);
  return data.data.taskId;
}

async function pollTask(taskId: string): Promise<string> {
  const startTime = Date.now();
  const maxMs = maxWait * 1000;

  while (Date.now() - startTime < maxMs) {
    const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.error(`ERROR: Poll returned ${response.status}`);
      process.exit(1);
    }

    const data = (await response.json()) as {
      code: number;
      data: {
        state: string;
        resultJson: string | null;
        failMsg: string | null;
        costTime: number | null;
      };
    };

    const { state, resultJson, failMsg, costTime } = data.data;

    if (state === "success" && resultJson) {
      const result = JSON.parse(resultJson) as { resultUrls: string[] };
      if (costTime) console.error(`Generation took ${(costTime / 1000).toFixed(1)}s`);
      return result.resultUrls[0];
    }

    if (state === "fail") {
      console.error(`ERROR: Task failed: ${failMsg}`);
      process.exit(1);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    process.stderr.write(`\rWaiting... ${elapsed}s (state: ${state})`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.error(`\nERROR: Timeout after ${maxWait}s`);
  process.exit(1);
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`ERROR: Failed to download image: ${response.status}`);
    process.exit(1);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const taskId = await createTask();
  console.error("");
  const imageUrl = await pollTask(taskId);
  console.error(`\nImage URL: ${imageUrl}`);

  const timestamp = Date.now();
  const outDir = outputPath
    ? path.dirname(path.resolve(outputPath))
    : path.resolve("generated/content");
  const outFile = outputPath
    ? path.resolve(outputPath)
    : path.join(outDir, `img-${timestamp}.png`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const buffer = await downloadImage(imageUrl);
  fs.writeFileSync(outFile, buffer);

  console.log(`IMAGE:${outFile}`);
  console.error(`\nImage saved to: ${outFile}`);
  console.error(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("ERROR:", err.message || err);
  process.exit(1);
});
