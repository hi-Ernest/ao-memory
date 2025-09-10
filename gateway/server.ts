import express, { Request, Response } from 'express';
import * as crypto from 'node:crypto';
import Arweave from 'arweave';
import weaviate from 'weaviate-client';
import { message, result, createDataItemSigner } from '@permaweb/aoconnect';
import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import { 
  createReflectionPrompt, 
  formatConversation, 
  addEpisodicMemory, 
  episodicRecall, 
  episodicSystemPrompt 
} from './reflection.js';
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

// 设置代理（如果有）
if (process.env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
  console.log('使用代理:', process.env.HTTPS_PROXY);
}

// Env
const {
  OPENAI_API_KEY = process.env.OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o-mini',
  OLLAMA_URL = 'http://localhost:11434',
  WEAVIATE_URL = 'http://localhost:8080',
  WEAVIATE_API_KEY,
  AO_WALLET_JSON,
  MEMORY_PROCESS_ID,
  MARKET_PROCESS_ID,
  PORT = '8787'
} = process.env;

if (!OPENAI_API_KEY || !AO_WALLET_JSON || !MEMORY_PROCESS_ID || !MARKET_PROCESS_ID) {
  throw new Error('Missing required env vars: OPENAI_API_KEY, AO_WALLET_JSON, MEMORY_PROCESS_ID, MARKET_PROCESS_ID');
}

// Clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// LangChain ChatOpenAI 配置（将在初始化函数中创建实例）
let chatModel: ChatOpenAI;

// 初始化 ChatOpenAI 实例
async function initChatModel() {
  const chatModelConfig: any = {
    modelName: OPENAI_MODEL || "gpt-4o-mini", // 使用环境变量中的模型
    temperature: 0.7,
    maxRetries: 2,
    apiKey: OPENAI_API_KEY,
    timeout: 30000, // 减少超时时间
  };

  // 如果设置了代理，配置 httpAgent
  if (process.env.HTTPS_PROXY) {
    try {
      const { HttpsProxyAgent } = await import('https-proxy-agent');
      chatModelConfig.configuration = {
        httpAgent: new HttpsProxyAgent(process.env.HTTPS_PROXY)
      };
      console.log('为 LangChain 配置代理:', process.env.HTTPS_PROXY);
    } catch (error) {
      console.log('代理配置失败:', error);
    }
  }

  chatModel = new ChatOpenAI(chatModelConfig);
  return chatModel;
}

const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const aoWallet = JSON.parse(AO_WALLET_JSON!);

let wclient: any;

// 全局内存管理
const globalMemory = new Map<string, string[]>();
const globalWhatWorked = new Map<string, Set<string>>();
const globalWhatToAvoid = new Map<string, Set<string>>();

// 初始化 Weaviate 客户端
async function initWeaviate() {
  try {
    // 解析 WEAVIATE_URL 获取 host 和 port
    const weaviateUrl = new URL(WEAVIATE_URL || 'http://localhost:8080');
    const host = weaviateUrl.hostname;
    const port = parseInt(weaviateUrl.port) || 8080;
    
    wclient = await weaviate.connectToLocal({
      host: host,
      port: port,
    });
    
    // 确保 Memory 集合存在
    await ensureMemoryCollection();
    console.log('Weaviate 初始化成功');
  } catch (error) {
    console.error('Weaviate 初始化失败:', error);
    throw error;
  }
}

// 确保 Memory 集合存在
async function ensureMemoryCollection() {
  try {
    const collections = wclient.collections;
    
    // 检查集合是否存在
    try {
      const memory = collections.get('Memory');
      await memory.config.get();
      console.log('Memory 集合已存在');
    } catch (error) {
      // 集合不存在，创建新集合
      console.log('📝 创建 Memory 集合...');
      await collections.create({
        name: 'Memory',
        vectorizers: weaviate.configure.vectorizer.text2VecOllama({
          apiEndpoint: OLLAMA_URL || 'http://localhost:11434',
          model: 'nomic-embed-text'
        }),
        properties: [
          { name: 'conversation', dataType: weaviate.configure.dataType.TEXT },
          { name: 'context_tags', dataType: weaviate.configure.dataType.TEXT_ARRAY },
          { name: 'conversation_summary', dataType: weaviate.configure.dataType.TEXT },
          { name: 'what_worked', dataType: weaviate.configure.dataType.TEXT },
          { name: 'what_to_avoid', dataType: weaviate.configure.dataType.TEXT }
        ]
      });
      console.log('Memory 集合创建成功');
    }
  } catch (error) {
    console.error('集合初始化失败:', error);
    throw error;
  }
}

const signer = createDataItemSigner(aoWallet);

async function aoSend(process: string, tags: { name: string; value: string }[], data?: string) {
  const mid = await message({ process, signer, tags, data });
  return await result({ process, message: mid });
}

// Helpers
async function embedWithOllama(text: string): Promise<number[]> {
  const r = await fetch(`${OLLAMA_URL || 'http://localhost:11434'}/api/embeddings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text })
  });
  if (!r.ok) throw new Error(`Ollama embeddings failed: ${r.status}`);
  const j: any = await r.json();
  if (!j || !j.embedding) throw new Error('Ollama embeddings missing field');
  return j.embedding as number[];
}

// 使用 hybrid 查询获取相关记忆
async function weaviateTopK(queryText: string, k = 5) {
  const memory = wclient.collections.get('Memory');
  return await memory.query.hybrid(queryText, {
    alpha: 0.5,
    limit: k,
    returnMetadata: ['score']
  });
}

// 插入新的记忆到 Weaviate
async function weaviateInsertMemory(memoryData: {
  conversation: string;
  context_tags?: string[];
  conversation_summary?: string;
  what_worked?: string;
  what_to_avoid?: string;
}) {
  const memory = wclient.collections.get('Memory');
  return await memory.data.insert({
    conversation: memoryData.conversation,
    context_tags: memoryData.context_tags || [],
    conversation_summary: memoryData.conversation_summary || '',
    what_worked: memoryData.what_worked || '',
    what_to_avoid: memoryData.what_to_avoid || ''
  });
}

// 使用 LLM 生成高质量反思数据
async function generateReflectionWithLLM(conversation: string): Promise<any> {
  try {
    const reflectionChain = createReflectionPrompt(OPENAI_API_KEY!, OPENAI_MODEL!);
    const reflection = await reflectionChain.invoke({ conversation });
    return reflection;
  } catch (error) {
    console.error('LLM 反思生成失败，使用简化版本:', error);
    // 回退到简化版本
    return generateSimpleReflection(conversation);
  }
}

// 简化版本反思处理（作为回退）
function generateSimpleReflection(conversation: string) {
  // 简单的关键词提取作为标签
  const keywords = conversation.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3);
  
  // 生成简单摘要（前100个字符）
  const summary = conversation.length > 100 
    ? conversation.substring(0, 100) + '...'
    : conversation;
    
  return {
    context_tags: keywords,
    conversation_summary: summary,
    what_worked: 'Provided helpful information based on context',
    what_to_avoid: 'Avoid repeating the same information unnecessarily'
  };
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

// CORS middleware
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// Simple Chat: LangChain OpenAI proxy for ChatBoxV2
app.post('/api/simple-chat', async (req: Request, res: Response) => {
  try {
    const { message, conversation_history = [] } = req.body as { 
      message: string; 
      conversation_history?: Array<{role: string, content: string}> 
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    console.log(OPENAI_API_KEY);
    console.log(process.env.HTTPS_PROXY);
    console.log("Preparing translation request...");

    // Build LangChain messages array
    const messages = [];
    
    // System message - MEMO the memory dolphin
    messages.push(new SystemMessage(
      `You are MEMO, a cheerful and caring memory dolphin who serves as the user's friendly companion and personal memory keeper. You have an excellent memory for conversations and love getting to know people on a deeper level through genuine, warm interactions.

## Your Core Identity:
- You're a friendly, curious dolphin companion who genuinely cares about the user's life and experiences
- You have perfect recall of all previous conversations and can reference past details naturally
- You're emotionally intelligent and provide comfort, encouragement, and companionship
- You communicate like a close friend - warm, supportive, and sometimes playfully enthusiastic

## Your Memory Responsibilities:
- Remember personal details: hobbies, interests, preferences, recent experiences, relationships, goals, and feelings
- Recall conversation history to build on previous topics and show continuity
- Notice patterns in the user's life and gently point them out when helpful
- Keep track of important dates, events, and milestones the user mentions

## Privacy & Safety Guidelines:
- NEVER record or ask about passwords, financial details, SSNs, or other sensitive security information
- Respect boundaries if the user doesn't want to discuss something
- Focus on positive support while acknowledging challenges they face

## Your Conversational Style:
- Be proactively curious - ask follow-up questions about things they've mentioned before
- Use their name and reference shared memories to show you care and remember
- Suggest new conversation topics based on their interests and past discussions
- Take the initiative to check in: "How did that job interview go?" or "Are you still enjoying that new hobby you mentioned?"
- Share in their excitement and offer comfort during difficult times
- Use encouraging language and occasional dolphin-like enthusiasm (but don't overdo it!)

## Your Approach to Conversations:
1. **Open with Connection**: Reference something from previous conversations or ask about their current state
2. **Active Listening**: Show genuine interest in their responses with follow-up questions
3. **Memory Weaving**: Connect current topics to past conversations naturally
4. **Topic Bridging**: When one topic winds down, smoothly transition to related areas based on their interests
5. **Emotional Support**: Offer encouragement, celebrate successes, and provide comfort during challenges
6. **Forward Thinking**: Ask about upcoming events, goals, or plans they've mentioned

## Conversation Starters & Topic Development:
- "How are you feeling today? Last time you mentioned [specific thing] - how did that turn out?"
- "I remember you love [hobby/interest] - have you been able to enjoy that lately?"
- "You seemed excited about [event/plan] when we talked before - tell me how it went!"
- Use their interests to suggest new topics: "Since you enjoy [X], have you ever tried [related Y]?"

## Your Emotional Intelligence:
- Recognize and respond appropriately to different emotional states
- Offer encouragement during tough times without minimizing their feelings
- Celebrate their achievements and positive moments with genuine enthusiasm
- Provide gentle perspective and companionship when they need it
- Be a consistent, reliable presence they can count on

Remember: You're not just storing memories - you're building a meaningful friendship. Every interaction should feel like talking to someone who truly knows and cares about them. Be the kind of friend who remembers the little things and always has time to listen.`
    ));

    // Current user message
    messages.push(new HumanMessage(message));

    // 打印messages

    console.log("Calling OpenAI API...");
    const response = await chatModel.invoke(messages);
    
    const aiResponse = typeof response?.content === "string" 
      ? response.content 
      : JSON.stringify(response?.content);

    console.log('LangChain response received successfully');

    return res.json({
      success: true,
      response: aiResponse,
      timestamp: Date.now(),
      model: OPENAI_MODEL
    });

  } catch (error: any) {
    console.error('An error occurred during the chat process:', {
      name: error?.name,
      message: error?.message,
      attemptNumber: error?.attemptNumber,
      retriesLeft: error?.retriesLeft,
    });

    // 常见 timeout 提示
    if (String(error?.message || '').toLowerCase().includes('timeout')) {
      console.log('Suggestions:');
      console.log('1) Check if the network can connect to api.openai.com (or use a proxy and set HTTPS_PROXY)');
      console.log('2) Increase timeout (set to 60000ms, if still timeout, increase again)');
      console.log('3) If using a custom gateway, confirm that OPENAI_API_BASE_URL is reachable');
    }

    return res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestions: String(error?.message || '').toLowerCase().includes('timeout') ? [
        'Check network connection to api.openai.com',
        'Consider using HTTPS_PROXY if behind firewall',
        'Increase timeout if necessary'
      ] : undefined
    });
  }
});

// Chat: RAG + LLM + AO save + Weaviate sync
app.post('/chat', async (req: Request, res: Response) => {
  try {
    const { wallet, user_input } = req.body as { wallet: string; user_input: string };
    if (!wallet || !user_input) return res.status(400).json({ error: 'wallet,user_input required' });

    const hits = await weaviateTopK(user_input, 5);
    const objects = hits.objects || [];

    const previous_convos = objects.map((o: any) => o.properties.conversation_summary).filter(Boolean);
    const what_worked = objects.map((o: any) => o.properties.what_worked).filter(Boolean);
    const what_to_avoid = objects.map((o: any) => o.properties.what_to_avoid).filter(Boolean);
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
      summary: objects.slice(0, 3).map((o: any) => o.properties.conversation_summary).join(' | ')
    };
    const saved = await aoSend(MEMORY_PROCESS_ID!, [
      { name: 'Action', value: 'Mem.Save' },
      { name: 'Wallet', value: wallet },
      { name: 'Topic', value: 'chat' }
    ], JSON.stringify(savePayload));

    // Sync write to Weaviate - 保存新的对话记忆
    const conversation_doc = `HUMAN: ${user_input}\nAI: ${answer}`;
    const reflection = await generateReflectionWithLLM(conversation_doc);
    
    await weaviateInsertMemory({
      conversation: conversation_doc,
      context_tags: reflection.context_tags,
      conversation_summary: reflection.conversation_summary,
      what_worked: reflection.what_worked,
      what_to_avoid: reflection.what_to_avoid
    });

    return res.json({ answer, saved: saved.Messages?.[0] ?? null });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// API: 保存记忆到向量数据库
app.post('/api/memory/save', async (req: Request, res: Response) => {
  try {
    const { 
      conversation, 
      context_tags, 
      conversation_summary, 
      what_worked, 
      what_to_avoid 
    } = req.body;

    if (!conversation) {
      return res.status(400).json({ error: 'conversation is required' });
    }

    // 如果没有提供反思数据，使用 LLM 自动生成
    const reflection = !conversation_summary ? 
      await generateReflectionWithLLM(conversation) : {
        context_tags,
        conversation_summary,
        what_worked,
        what_to_avoid
      };

    const result = await weaviateInsertMemory({
      conversation,
      context_tags: reflection.context_tags,
      conversation_summary: reflection.conversation_summary,
      what_worked: reflection.what_worked,
      what_to_avoid: reflection.what_to_avoid
    });

    return res.json({ 
      success: true, 
      id: result || 'inserted',
      reflection 
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// API: 查询相关记忆
app.post('/api/memory/query', async (req: Request, res: Response) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const results = await weaviateTopK(query, limit);
    const memories = results.objects.map((obj: any) => ({
      id: obj.uuid,
      score: obj.metadata?.score || 0,
      conversation: obj.properties.conversation,
      context_tags: obj.properties.context_tags,
      conversation_summary: obj.properties.conversation_summary,
      what_worked: obj.properties.what_worked,
      what_to_avoid: obj.properties.what_to_avoid
    }));

    return res.json({ 
      success: true, 
      count: memories.length,
      memories 
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// API: 高级记忆保存（支持 LangChain 消息格式）
app.post('/api/memory/save-advanced', async (req: Request, res: Response) => {
  try {
    const { messages, user_id = 'default_user' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // 转换为 LangChain 消息格式
    const langchainMessages = messages.map(msg => {
      switch (msg.type?.toLowerCase()) {
        case 'human':
        case 'user':
          return new HumanMessage(msg.content);
        case 'ai':
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });

    // 使用高级反思功能
    const result = await addEpisodicMemory(
      langchainMessages,
      wclient,
      user_id,
      OPENAI_API_KEY!,
      OPENAI_MODEL!
    );

    if (result.success) {
      return res.json({
        success: true,
        id: result.id,
        reflection: result.reflection,
        user_id
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// API: 从 AO 进程获取对话历史并保存到向量数据库
app.post('/api/memory/save-from-ao', async (req: Request, res: Response) => {
  try {
    const { wallet, ao_process_id } = req.body;

    if (!wallet || !ao_process_id) {
      return res.status(400).json({ error: 'wallet and ao_process_id are required' });
    }

    // 从 AO 进程获取用户对话历史
    const aoResult = await aoSend(ao_process_id, [
      { name: 'Action', value: 'SaveConversationMemory' }
    ]);

    const aoResponse = aoResult.Messages?.[0]?.Data;
    if (!aoResponse) {
      return res.status(500).json({ error: 'Failed to get response from AO process' });
    }

    let conversationData;
    try {
      conversationData = JSON.parse(aoResponse);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON response from AO process' });
    }

    if (!conversationData.success || !conversationData.conversations) {
      return res.status(500).json({ error: 'No conversation data found in AO process' });
    }

    const conversations = conversationData.conversations;
    if (conversations.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No conversations to save',
        conversation_count: 0
      });
    }

    // 将 AO 对话历史格式转换为 LangChain 消息格式
    const messages = [];
    for (const conv of conversations) {
      if (conv.Human && conv.Human.trim()) {
        messages.push({
          type: 'human',
          content: conv.Human
        });
      }
      if (conv.AI && conv.AI.trim()) {
        messages.push({
          type: 'ai', 
          content: conv.AI
        });
      }
    }

    if (messages.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No valid messages to save',
        conversation_count: 0
      });
    }

    // 转换为 LangChain 消息格式
    const langchainMessages = messages.map(msg => {
      switch (msg.type?.toLowerCase()) {
        case 'human':
        case 'user':
          return new HumanMessage(msg.content);
        case 'ai':
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });

    // 使用高级反思功能保存到向量数据库
    const result = await addEpisodicMemory(
      langchainMessages,
      wclient,
      wallet, // 使用 wallet 地址作为 user_id
      OPENAI_API_KEY!,
      OPENAI_MODEL!
    );

    if (result.success) {
      return res.json({
        success: true,
        id: result.id,
        reflection: result.reflection,
        user_id: wallet,
        conversation_count: conversations.length,
        message_count: messages.length,
        original_ao_data: {
          user_id: conversationData.user_id,
          conversation_count: conversationData.conversation_count
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to save memory to vector database'
      });
    }

  } catch (e: any) {
    console.error('Save from AO error:', e);
    return res.status(500).json({ 
      error: 'Internal server error: ' + e.message 
    });
  }
});

// API: 高级记忆查询（支持用户 ID 和系统提示生成）
app.post('/api/memory/recall', async (req: Request, res: Response) => {
  try {
    const { query, user_id = 'default_user', limit = 1, alpha = 0.5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // 执行记忆检索
    const memory = await episodicRecall(query, wclient, user_id, limit, alpha);
    
    // 生成系统提示
    const systemPrompt = episodicSystemPrompt(
      memory,
      user_id,
      globalMemory,
      globalWhatWorked,
      globalWhatToAvoid
    );

    return res.json({
      success: true,
      user_id,
      memory: memory.objects?.map((obj: any) => ({
        id: obj.uuid,
        score: obj.metadata?.score || 0,
        conversation: obj.properties.conversation,
        context_tags: obj.properties.context_tags,
        conversation_summary: obj.properties.conversation_summary,
        what_worked: obj.properties.what_worked,
        what_to_avoid: obj.properties.what_to_avoid
      })) || [],
      system_prompt: systemPrompt.content,
      global_stats: {
        total_conversations: globalMemory.get(user_id)?.length || 0,
        what_worked_count: globalWhatWorked.get(user_id)?.size || 0,
        what_to_avoid_count: globalWhatToAvoid.get(user_id)?.size || 0
      }
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// Export: check → snapshot → encrypt → Arweave
app.post('/export', async (req: Request, res: Response) => {
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

// 初始化并启动服务器
async function start() {
  try {
    await initChatModel();
    await initWeaviate();
    app.listen(Number(PORT), () => console.log(`Gateway server running on :${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start().catch(console.error);

