import express from 'express';
import * as crypto from 'node:crypto';
const Arweave = require('arweave');
import weaviate, { WeaviateClient } from 'weaviate-client';
import { message, result, createDataItemSigner } from '@permaweb/aoconnect';
import OpenAI from 'openai';

// Env
const {
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o-mini',
  OLLAMA_URL = 'http://localhost:11434',
  WEAVIATE_URL = 'http://localhost:8080',
  WEAVIATE_API_KEY,
  AO_WALLET_JSON,
  MEMORY_PROCESS_ID,
  MARKET_PROCESS_ID
} = process.env as Record<string, string | undefined>;

if (!OPENAI_API_KEY || !AO_WALLET_JSON || !MEMORY_PROCESS_ID || !MARKET_PROCESS_ID) {
  throw new Error('Missing required env vars: OPENAI_API_KEY, AO_WALLET_JSON, MEMORY_PROCESS_ID, MARKET_PROCESS_ID');
}

// Clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const aoWallet = JSON.parse(AO_WALLET_JSON!);

let wclient: any;

async function initWeaviate() {
  wclient = await weaviate.connectToLocal({
    host: WEAVIATE_URL!.replace(/^https?:\/\//, ''),
    port: WEAVIATE_URL!.includes(':') ? parseInt(WEAVIATE_URL!.split(':').pop()!) : 8080,
    headers: WEAVIATE_API_KEY ? { 'Authorization': `Bearer ${WEAVIATE_API_KEY}` } : undefined,
  });
}

const signer = createDataItemSigner(aoWallet);

async function aoSend(process: string, tags: { name: string; value: string }[], data?: string) {
  const mid = await message({ process, signer, tags, data });
  return await result({ process, message: mid });
}

// Helpers
async function embedWithOllama(text: string): Promise<number[]> {
  const r = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text })
  });
  if (!r.ok) throw new Error(`Ollama embeddings failed: ${r.status}`);
  const j: any = await r.json();
  if (!j || !j.embedding) throw new Error('Ollama embeddings missing field');
  return j.embedding as number[];
}

async function weaviateTopK(queryText: string, k = 5) {
  const memory = wclient.collections.get('Memory');
  return await memory.query.hybrid(queryText, {
    alpha: 0.5,
    limit: k,
    returnMetadata: ['score']
  });
}

async function weaviateUpsertFromChat(conversation: string, previous: string, worked: string, avoid: string) {
  const vec = await embedWithOllama(conversation);
  const memory = wclient.collections.get('Memory');
  await memory.data.insert({
    conversation, 
    previous, 
    what_worked: worked, 
    what_to_avoid: avoid
  }, { vector: vec });
}

function encryptGCM(plaintext: Buffer, key: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, enc, tag };
}

// HTTP
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Chat: RAG + LLM + AO save + Weaviate sync
app.post('/chat', async (req, res) => {
  try {
    const { wallet, user_input } = req.body as { wallet: string; user_input: string };
    if (!wallet || !user_input) return res.status(400).json({ error: 'wallet,user_input required' });

    const hits = await weaviateTopK(user_input, 5);
    const objects = hits.objects || [];

    const previous_convos = objects.map(o => o.properties.previous).filter(Boolean);
    const what_worked = objects.map(o => o.properties.what_worked).filter(Boolean);
    const what_to_avoid = objects.map(o => o.properties.what_to_avoid).filter(Boolean);
    const conversation_hit = objects[0]?.properties?.conversation || '';

    const episodic_memory_prompt = `You are a helpful AI Assistant. Answer the user's questions to the best of your ability.\nYou recall similar conversations with the user, here are the details:\n\nCurrent Conversation Match: ${conversation_hit}\nPrevious Conversations: ${previous_convos.join(' | ')}\nWhat has worked well: ${what_worked.join(' ')}\nWhat to avoid: ${what_to_avoid.join(' ')}\n\nUse these memories as context for your response to the user.`;

    const chat = await openai.chat.completions.create({
      model: OPENAI_MODEL!,
      messages: [
        { role: 'system', content: episodic_memory_prompt },
        { role: 'user', content: user_input }
      ]
    });
    const answer = chat.choices?.[0]?.message?.content || '';

    // Save to AO
    const savePayload = {
      input: user_input,
      answer,
      topk: objects.length,
      summary: objects.slice(0, 3).map(o => o.properties.conversation).join(' | ')
    };
    const saved = await aoSend(MEMORY_PROCESS_ID!, [
      { name: 'Action', value: 'Mem.Save' },
      { name: 'Wallet', value: wallet },
      { name: 'Topic', value: 'chat' }
    ], JSON.stringify(savePayload));

    // Sync write to Weaviate (bring-your-own vectors)
    const conversation_doc = `${user_input}\n---\n${answer}`;
    const previous_doc = previous_convos.join(' | ');
    const worked_doc = what_worked.join(' ');
    const avoid_doc = what_to_avoid.join(' ');
    await weaviateUpsertFromChat(conversation_doc, previous_doc, worked_doc, avoid_doc);

    return res.json({ answer, saved: saved.Messages?.[0] ?? null });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// Export: check → snapshot → encrypt → Arweave
app.post('/export', async (req, res) => {
  try {
    const { wallet } = req.body as { wallet: string };
    if (!wallet) return res.status(400).json({ error: 'wallet required' });

    const check = await aoSend(MARKET_PROCESS_ID!, [
      { name: 'Action', value: 'Export.Check' },
      { name: 'Wallet', value: wallet }
    ]);
    const ok = check.Messages?.[0]?.Tags?.find((t: any) => t.name === 'Ok')?.value === 'true';
    if (!ok) return res.status(402).json({ error: 'not authorized, please purchase export' });

    const snapRes = await aoSend(MEMORY_PROCESS_ID!, [{ name: 'Action', value: 'Mem.Export' }]);
    const snapshot = snapRes.Messages?.[0]?.Data || '';
    const key = crypto.randomBytes(32);
    const { iv, enc, tag } = encryptGCM(Buffer.from(snapshot, 'utf8'), key);

    // Concatenate iv|tag|enc; production may include a small header for versioning
    const payload = Buffer.concat([iv, tag, enc]);
    const tx = await arweave.createTransaction({ data: payload });
    await arweave.transactions.sign(tx, aoWallet);
    const resp = await arweave.transactions.post(tx);
    if (resp.status !== 200 && resp.status !== 202) throw new Error(`Arweave upload failed: ${resp.status}`);

    await aoSend(MARKET_PROCESS_ID!, [
      { name: 'Action', value: 'Export.Consume' },
      { name: 'Wallet', value: wallet }
    ]);

    return res.json({ arweave_tx: tx.id, key_b64: key.toString('base64') });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 8787;

// Initialize and start server
async function start() {
  await initWeaviate();
  app.listen(Number(PORT), () => console.log(`Gateway on :${PORT}`));
}

start().catch(console.error);

