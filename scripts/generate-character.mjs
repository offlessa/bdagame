/**
 * Gerador automático de variações do personagem via Leonardo.ai API
 *
 * Uso:
 *   node scripts/generate-character.mjs SUA_API_KEY
 *
 * Pega a API key em: https://app.leonardo.ai/settings → API Keys
 *
 * As imagens são salvas em: scripts/output/{categoria}/{nome}.png
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Configuração (mesmos valores que geraram o personagem bom) ────────────

const API_KEY   = process.argv[2] ?? 'YOUR_API_KEY';
const BASE_URL  = 'https://cloud.leonardo.ai/api/rest/v2';
const MODEL     = 'lucid-origin';
const SEED      = 771112067;
const STYLE_ID  = '111dc692-d470-4eec-b791-3475abac4c46';

const NEGATIVE  = 'realistic, photo, 3D, shading, shadow, gradient, texture, ' +
                  'skin pores, detailed lighting, chibi, kawaii, baby face, ' +
                  'watermark, background, multiple characters';

// Prompt base — o que gerou o personagem aprovado
const BASE = `Black male rapper cartoon character, dark skin, dreadlocks,
thick bold black outlines, FLAT COLORS ONLY, zero shading, zero gradients,
zero rendering, cel animation style, simple geometric shapes for clothing,
front view full body, hand drawn cartoon illustration,
Adventure Time character design style, white background,
2D vector cartoon, graphic and bold, looks drawn by hand`;

// ─── Todas as variações a gerar ──────────────────────────────────────────────

const VARIATIONS = [
  // Expressões
  { cat: 'expression', name: 'confiante',  add: 'baggy black hoodie, cargo pants, black sneakers, confident slight smile, relaxed eyebrows' },
  { cat: 'expression', name: 'desafiador', add: 'baggy black hoodie, cargo pants, black sneakers, stern challenging expression, heavy furrowed brows, slight smirk' },
  { cat: 'expression', name: 'focado',     add: 'baggy black hoodie, cargo pants, black sneakers, focused serious face, straight horizontal mouth, determined eyes' },
  { cat: 'expression', name: 'rindo',      add: 'baggy black hoodie, cargo pants, black sneakers, laughing expression, closed happy eyes, wide open smile, rosy cheeks' },
  { cat: 'expression', name: 'surpreso',   add: 'baggy black hoodie, cargo pants, black sneakers, shocked surprised face, wide open eyes, open O-shaped mouth, raised eyebrows' },

  // Chapéus (corpo padrão, só troca o chapéu)
  { cat: 'hat', name: 'bone-preto',    add: 'wearing black snapback cap, black hoodie, black cargo pants, black sneakers, confident expression' },
  { cat: 'hat', name: 'bone-ouro',     add: 'wearing gold snapback cap, black hoodie, black cargo pants, black sneakers, confident expression' },
  { cat: 'hat', name: 'bone-azul',     add: 'wearing blue snapback cap, black hoodie, black cargo pants, black sneakers, confident expression' },
  { cat: 'hat', name: 'bone-vermelho', add: 'wearing red snapback cap, black hoodie, black cargo pants, black sneakers, confident expression' },
  { cat: 'hat', name: 'bandana',       add: 'wearing red bandana tied on head, black hoodie, black cargo pants, black sneakers, confident expression' },
  { cat: 'hat', name: 'touca',         add: 'wearing black winter beanie hat, black hoodie, black cargo pants, black sneakers, confident expression' },
  { cat: 'hat', name: 'sem',           add: 'no hat showing full dreadlocks hair, black hoodie, black cargo pants, black sneakers, confident expression' },

  // Moletons (sem chapéu pra isolar a variação)
  { cat: 'hoodie', name: 'preto',    add: 'black hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'hoodie', name: 'cinza',    add: 'gray hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'hoodie', name: 'azul',     add: 'blue hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'hoodie', name: 'vermelho', add: 'red hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'hoodie', name: 'verde',    add: 'green hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'hoodie', name: 'laranja',  add: 'orange hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'hoodie', name: 'roxo',     add: 'purple hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'hoodie', name: 'branco',   add: 'white hoodie with FLOW text, black cargo pants, black sneakers, no hat, confident expression' },

  // Calças
  { cat: 'pants', name: 'cargo-verde', add: 'black hoodie, green cargo pants with side pockets, black sneakers, no hat, confident expression' },
  { cat: 'pants', name: 'jeans',       add: 'black hoodie, dark blue denim jeans, black sneakers, no hat, confident expression' },
  { cat: 'pants', name: 'cargo-preto', add: 'black hoodie, black cargo pants with side pockets, black sneakers, no hat, confident expression' },
  { cat: 'pants', name: 'camuflado',   add: 'black hoodie, green camouflage cargo pants, black sneakers, no hat, confident expression' },
  { cat: 'pants', name: 'branco',      add: 'black hoodie, white pants, black sneakers, no hat, confident expression' },
  { cat: 'pants', name: 'vinho',       add: 'black hoodie, dark burgundy red pants, black sneakers, no hat, confident expression' },

  // Tênis
  { cat: 'shoes', name: 'tenis',   add: 'black hoodie, black cargo pants, black and white converse sneakers, no hat, confident expression' },
  { cat: 'shoes', name: 'bota',    add: 'black hoodie, black cargo pants, brown leather combat boots, no hat, confident expression' },
  { cat: 'shoes', name: 'casual',  add: 'black hoodie, black cargo pants, dark casual loafer shoes, no hat, confident expression' },
  { cat: 'shoes', name: 'chinelo', add: 'black hoodie, black cargo pants, blue flip flop sandals, no hat, confident expression' },

  // Acessórios
  { cat: 'accessory', name: 'corrente',  add: 'black hoodie, black cargo pants, black sneakers, thick gold chain necklace, no hat, confident expression' },
  { cat: 'accessory', name: 'relogio',   add: 'black hoodie, black cargo pants, black sneakers, gold luxury watch on wrist, no hat, confident expression' },
  { cat: 'accessory', name: 'oculos',    add: 'black hoodie, black cargo pants, black sneakers, black rectangular sunglasses, no hat, confident expression' },
  { cat: 'accessory', name: 'microfone', add: 'black hoodie, black cargo pants, black sneakers, holding black microphone in right hand, no hat, confident expression' },
  { cat: 'accessory', name: 'sem',       add: 'black hoodie, black cargo pants, black sneakers, no accessories, no hat, confident expression' },
];

// ─── Utilitários ─────────────────────────────────────────────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'cloud.leonardo.ai',
      path: `/api/rest/v2${path}`,
      method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${API_KEY}`,
        ...(data ? { 'content-length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      // Segue redirect se necessário
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function pollUntilDone(generationId) {
  for (let i = 0; i < 60; i++) {
    await sleep(4000);
    const res = await request('GET', `/generations/${generationId}`);
    const status = res?.generations_by_pk?.status;
    if (status === 'COMPLETE') return res.generations_by_pk.generated_images;
    if (status === 'FAILED')   throw new Error(`Geração falhou: ${generationId}`);
    process.stdout.write('.');
  }
  throw new Error('Timeout aguardando geração');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (API_KEY === 'YOUR_API_KEY') {
    console.error('❌  Passa a API key como argumento: node scripts/generate-character.mjs SUA_KEY');
    process.exit(1);
  }

  // Cria pastas de output
  const OUTPUT = path.join(__dirname, 'output');
  for (const cat of ['expression', 'hat', 'hoodie', 'pants', 'shoes', 'accessory']) {
    fs.mkdirSync(path.join(OUTPUT, cat), { recursive: true });
  }

  console.log(`🎨  Gerando ${VARIATIONS.length} variações...\n`);

  for (let i = 0; i < VARIATIONS.length; i++) {
    const v = VARIATIONS[i];
    const dest = path.join(OUTPUT, v.cat, `${v.name}.png`);

    // Pula se já existe
    if (fs.existsSync(dest)) {
      console.log(`⏭️   [${i+1}/${VARIATIONS.length}] ${v.cat}/${v.name} já existe, pulando`);
      continue;
    }

    process.stdout.write(`⏳  [${i+1}/${VARIATIONS.length}] ${v.cat}/${v.name} `);

    try {
      const body = {
        model: MODEL,
        public: false,
        parameters: {
          height: 1024,
          width: 1024,
          prompt_enhance: 'OFF',
          quantity: 1,
          seed: SEED,
          style_ids: [STYLE_ID],
          negative_prompt: NEGATIVE,
          prompt: `${BASE}, ${v.add}`,
        },
      };

      const res = await request('POST', '/generations', body);
      const generationId = res?.sdGenerationJob?.generationId;
      if (!generationId) throw new Error(`Resposta inesperada: ${JSON.stringify(res)}`);

      const images = await pollUntilDone(generationId);
      const imageUrl = images[0]?.url;
      if (!imageUrl) throw new Error('Nenhuma imagem retornada');

      await download(imageUrl, dest);
      console.log(` ✅  salvo`);

    } catch (err) {
      console.log(` ❌  erro: ${err.message}`);
    }

    // Pausa entre requisições pra não estourar rate limit
    if (i < VARIATIONS.length - 1) await sleep(1500);
  }

  console.log(`\n✅  Concluído! Imagens em: scripts/output/`);
  console.log(`\nPróximo passo:`);
  console.log(`  1. Abra as imagens e veja quais ficaram boas`);
  console.log(`  2. As boas vão pro Rive como layers`);
  console.log(`  3. As ruins rode o script de novo — ele pula as que já existem`);
}

main();
