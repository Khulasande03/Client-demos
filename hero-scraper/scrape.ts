/**
 * 21st.dev Hero Scraper + Framer Motion Injector
 *
 * Pipeline:
 *   1. Clone/pull serafimcloud/21st (GitHub, MIT license)
 *   2. Find all hero .tsx files
 *   3. OpenRouter (Gemini 2.0 Flash free) → inject Framer Motion
 *   4. Write animated .tsx to ./components/heroes/
 *
 * Usage:
 *   npm run scrape                             — animate all heroes
 *   npm run scrape -- --file path/to/hero.tsx  — single file
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/khulasande03/client-demos',
    'X-Title': 'Hero Scraper',
  },
});

const MODEL = 'google/gemini-2.0-flash-exp:free';
const OUT_DIR = './components/heroes';
const REPO_DIR = '/tmp/21st-repo';
const REPO_URL = 'https://github.com/serafimcloud/21st.git';

const SYSTEM_PROMPT = `You are an expert React/Framer Motion developer. Add Framer Motion animations to hero components.

Rules:
- Add "use client" at top (if not present)
- Add imports: { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
- Headline (h1/h2): wrap in motion.h1/h2, initial={{opacity:0,y:32}}, animate={{opacity:1,y:0}}, transition={{duration:0.6,ease:[0.16,1,0.3,1]}}
- Subtext/p: motion.p, initial={{opacity:0,y:20}}, animate={{opacity:1,y:0}}, transition={{delay:0.15,duration:0.5,ease:[0.16,1,0.3,1]}}
- CTA button container: motion.div, initial={{opacity:0,scale:0.95}}, animate={{opacity:1,scale:1}}, transition={{delay:0.3,type:"spring",stiffness:300,damping:24}}
- Badge/eyebrow: motion.div, initial={{opacity:0,y:-12}}, animate={{opacity:1,y:0}}, transition={{duration:0.4}}
- List items: staggerChildren:0.08 on parent motion.div + each child initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}
- Hero background/image: useScroll + useTransform parallax — const {scrollY}=useScroll(); const bgY=useTransform(scrollY,[0,500],[0,-120]); style={{y:bgY}}
- Accessibility: const prefersReduced=useReducedMotion(); wrap all transitions: transition={prefersReduced?{duration:0}:{...actual}}
- Keep ALL original props, classes, styles, imports, and logic unchanged
- Return ONLY complete .tsx code, no markdown fences, no explanation`;

// ── Step 1: clone/update repo ────────────────────────────────────────────────
async function ensureRepo(): Promise<void> {
  try {
    await fs.access(path.join(REPO_DIR, '.git'));
    console.log('📦 Updating 21st.dev repo...');
    execSync(`git -C ${REPO_DIR} pull --quiet`, { stdio: 'pipe' });
  } catch {
    console.log('📦 Cloning 21st.dev repo...');
    execSync(`git clone --depth=1 --filter=blob:none ${REPO_URL} ${REPO_DIR}`, { stdio: 'pipe' });
  }
}

// ── Step 2: find hero tsx files ───────────────────────────────────────────────
async function findHeroFiles(): Promise<string[]> {
  const result = execSync(
    `find ${REPO_DIR} -name "*.tsx" | xargs grep -li "hero" 2>/dev/null || true`,
    { encoding: 'utf8' }
  );
  return result.trim().split('\n').filter(Boolean);
}

// ── Step 3: inject Framer Motion via OpenRouter ──────────────────────────────
async function injectFramerMotion(source: string, componentName: string): Promise<string> {
  console.log(`  ✨ Animating: ${componentName}`);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Add Framer Motion animations to this hero component:\n\n${source}` },
    ],
    max_tokens: 4096,
  });

  let text = response.choices[0]?.message?.content ?? source;
  text = text.replace(/^```(?:tsx?|jsx?)?\n?/, '').replace(/\n?```$/, '').trim();
  return text;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function toComponentName(filePath: string): string {
  return path.basename(filePath, '.tsx')
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY missing in .env');
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const fileFlag = process.argv.indexOf('--file');
  let heroFiles: string[] = [];

  if (fileFlag !== -1 && process.argv[fileFlag + 1]) {
    heroFiles = [process.argv[fileFlag + 1]];
    console.log(`Single file mode: ${heroFiles[0]}`);
  } else {
    await ensureRepo();
    heroFiles = await findHeroFiles();
    console.log(`Found ${heroFiles.length} hero file(s)\n`);
  }

  if (!heroFiles.length) {
    console.error('No hero files found.');
    process.exit(1);
  }

  const results: { name: string; file: string; status: string }[] = [];

  for (const heroPath of heroFiles) {
    const name = toComponentName(heroPath);
    const outFile = path.join(OUT_DIR, `${name}Animated.tsx`);

    try {
      const source = await fs.readFile(heroPath, 'utf8');
      if (source.length < 50) { results.push({ name, file: '', status: 'too small' }); continue; }

      // Skip already animated
      try {
        await fs.access(outFile);
        console.log(`  ⏭  Skip ${name} (already exists)`);
        results.push({ name, file: outFile, status: 'skipped' });
        continue;
      } catch {}

      const animated = await injectFramerMotion(source, name);
      await fs.writeFile(outFile, animated, 'utf8');
      console.log(`  ✅ ${outFile}`);
      results.push({ name, file: outFile, status: 'ok' });

      await new Promise(r => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      results.push({ name, file: '', status: `error: ${err.message}` });
    }
  }

  console.log('\n── Summary ─────────────────────────────────────');
  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : r.status === 'skipped' ? '⏭ ' : '❌';
    console.log(`${icon} ${r.name}: ${r.status === 'ok' ? r.file : r.status}`);
  }
  const ok = results.filter(r => r.status === 'ok').length;
  console.log(`\n${ok} hero(es) animated → ${path.resolve(OUT_DIR)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
