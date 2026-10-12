// Generates game sound effects with ElevenLabs from sfx/sounds.json.
// Usage: npm run sfx [-- <id>] [-- --force]
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const root = new URL("..", import.meta.url);
const outDir = new URL("assets/audio/", root);
const sounds = JSON.parse(readFileSync(new URL("sfx/sounds.json", root), "utf8"));

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyId = args.find((a) => !a.startsWith("--"));

if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set. Add it to the environment and try again.");
  process.exit(1);
}

const selected = onlyId ? sounds.filter((s) => s.id === onlyId) : sounds;
if (onlyId && selected.length === 0) {
  console.error(`No sound with id "${onlyId}" in sfx/sounds.json.`);
  process.exit(1);
}

const elevenlabs = new ElevenLabsClient();
mkdirSync(outDir, { recursive: true });

for (const { id, text, durationSeconds, promptInfluence } of selected) {
  const outFile = new URL(`${id}.mp3`, outDir);
  if (existsSync(outFile) && !force) {
    console.log(`skip  ${id} (exists, use --force to regenerate)`);
    continue;
  }
  console.log(`gen   ${id}: "${text}"`);
  const audio = await elevenlabs.textToSoundEffects.convert({ text, durationSeconds, promptInfluence });
  await pipeline(Readable.fromWeb(audio), createWriteStream(outFile));
  console.log(`saved assets/audio/${id}.mp3`);
}
