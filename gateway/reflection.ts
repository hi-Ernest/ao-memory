import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

// 反思数据接口
interface ReflectionData {
  context_tags: string[];
  conversation_summary: string;
  what_worked: string;
  what_to_avoid: string;
}

// 错误处理的 JSON 解析器
class RobustJsonParser extends JsonOutputParser {
  async parse(text: string): Promise<any> {
    try {
      // 尝试提取第一个完整JSON对象
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      if (start === -1 || end === 0) {
        throw new Error('No JSON object found');
      }
      const jsonStr = text.substring(start, end);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn('JSON 解析失败，返回错误信息:', e);
      return {
        error: `解析失败: ${e instanceof Error ? e.message : String(e)}`,
        raw: text,
        // 提供默认值避免系统崩溃
        context_tags: ['parsing_error'],
        conversation_summary: 'Failed to parse reflection data',
        what_worked: 'N/A',
        what_to_avoid: 'Improve reflection prompt or LLM response format'
      };
    }
  }
}

// 创建反思提示模板
export function createReflectionPrompt(apiKey: string, model: string = 'gpt-4o-mini') {
  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    temperature: 0.1, // 降低温度确保更一致的输出
  });

  const reflectionPromptTemplate = `You are analyzing conversations about research papers to create memories that will help guide future interactions. Your task is to extract key elements that would be most helpful when encountering similar academic discussions in the future.

Review the conversation and create a memory reflection following these rules:

1. For any field where you don't have enough information or the field isn't relevant, use "N/A"
2. Be extremely concise - each string should be one clear, actionable sentence
3. Focus only on information that would be useful for handling similar future conversations
4. Context_tags should be specific enough to match similar situations but general enough to be reusable

Output valid JSON in exactly this format:
{{
    "context_tags": [              // 2-4 keywords that would help identify similar future conversations
        string,                    // Use field-specific terms like "deep_learning", "methodology_question", "results_interpretation"
        ...
    ],
    "conversation_summary": string, // One sentence describing what the conversation accomplished
    "what_worked": string,         // Most effective approach or strategy used in this conversation
    "what_to_avoid": string        // Most important pitfall or ineffective approach to avoid
}}

Examples:
- Good context_tags: ["transformer_architecture", "attention_mechanism", "methodology_comparison"]
- Bad context_tags: ["machine_learning", "paper_discussion", "questions"]

- Good conversation_summary: "Explained how the attention mechanism in the BERT paper differs from traditional transformer architectures"
- Bad conversation_summary: "Discussed a machine learning paper"

- Good what_worked: "Using analogies from matrix multiplication to explain attention score calculations"
- Bad what_worked: "Explained the technical concepts well"

- Good what_to_avoid: "Diving into mathematical formulas before establishing user's familiarity with linear algebra fundamentals"
- Bad what_to_avoid: "Used complicated language"

Additional examples for different research scenarios:

Context tags examples:
- ["experimental_design", "control_groups", "methodology_critique"]
- ["statistical_significance", "p_value_interpretation", "sample_size"]
- ["research_limitations", "future_work", "methodology_gaps"]

Conversation summary examples:
- "Clarified why the paper's cross-validation approach was more robust than traditional hold-out methods"
- "Helped identify potential confounding variables in the study's experimental design"

What worked examples:
- "Breaking down complex statistical concepts using visual analogies and real-world examples"
- "Connecting the paper's methodology to similar approaches in related seminal papers"

What to avoid examples:
- "Assuming familiarity with domain-specific jargon without first checking understanding"
- "Over-focusing on mathematical proofs when the user needed intuitive understanding"

Do not include any text outside the JSON object in your response.

Here is the prior conversation:

{conversation}`;

  const reflectionPrompt = ChatPromptTemplate.fromTemplate(reflectionPromptTemplate);
  return reflectionPrompt.pipe(llm).pipe(new RobustJsonParser());
}

// 格式化消息为字符串
export function formatConversation(messages: BaseMessage[] | string[]): string {
  if (!messages || messages.length === 0) {
    return '';
  }

  const conversation: string[] = [];

  // 从索引1开始跳过第一个系统消息（如果存在）
  const startIndex = messages.length > 0 && 
    (messages[0] instanceof SystemMessage || 
     (typeof messages[0] === 'object' && 'type' in messages[0] && messages[0].type === 'system')) ? 1 : 0;

  for (let i = startIndex; i < messages.length; i++) {
    const message = messages[i];
    
    // 处理字符串类型
    if (typeof message === 'string') {
      conversation.push(message);
      continue;
    }
    
    // 处理 BaseMessage 类型
    if (message instanceof SystemMessage) {
      conversation.push(`SYSTEM: ${message.content}`);
    } else if (message instanceof HumanMessage) {
      conversation.push(`HUMAN: ${message.content}`);
    } else if (message instanceof AIMessage) {
      conversation.push(`AI: ${message.content}`);
    } else if (typeof message === 'object' && 'type' in message && 'content' in message) {
      // 处理类似对象
      const type = typeof message.type === 'string' ? message.type.toUpperCase() : 'UNKNOWN';
      conversation.push(`${type}: ${message.content}`);
    }
  }

  return conversation.join('\n');
}

// 使用 Ollama 生成嵌入向量
export async function embedText(text: string, ollamaUrl: string = 'http://localhost:11434'): Promise<number[]> {
  try {
    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        model: 'nomic-embed-text', 
        prompt: text // 使用 prompt 而不是 text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API 请求失败: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    const embedding = result.embedding;
    
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Ollama 返回的嵌入向量格式错误');
    }

    return embedding;
  } catch (error) {
    console.error('嵌入向量生成失败:', error);
    throw error;
  }
}

// 主要的情景记忆添加函数
export async function addEpisodicMemory(
  messages: BaseMessage[] | string[],
  wclient: any,
  userId: string = 'default_user',
  apiKey: string,
  model: string = 'gpt-4o-mini'
): Promise<{ success: boolean; reflection?: ReflectionData; id?: string; error?: string }> {
  try {
    // 获取集合名称
    const collectionName = getCollectionName(userId);
    
    // 确保集合存在
    await ensureUserCollection(wclient, userId);
    
    // 格式化对话
    const conversation = formatConversation(messages);
    if (!conversation.trim()) {
      throw new Error('对话内容为空');
    }

    // 生成反思数据
    const reflectionChain = createReflectionPrompt(apiKey, model);
    console.log('正在生成反思数据...');
    
    const reflectionRaw = await reflectionChain.invoke({ conversation });
    console.log('反思数据生成完成:', reflectionRaw);
    
    // 确保反思数据符合类型要求
    const reflection: ReflectionData = {
      context_tags: Array.isArray(reflectionRaw.context_tags) ? reflectionRaw.context_tags : [],
      conversation_summary: typeof reflectionRaw.conversation_summary === 'string' ? reflectionRaw.conversation_summary : '',
      what_worked: typeof reflectionRaw.what_worked === 'string' ? reflectionRaw.what_worked : '',
      what_to_avoid: typeof reflectionRaw.what_to_avoid === 'string' ? reflectionRaw.what_to_avoid : ''
    };

    // 获取集合并插入数据
    const episodicMemory = wclient.collections.get(collectionName);
    const result = await episodicMemory.data.insert({
      conversation,
      context_tags: reflection.context_tags || [],
      conversation_summary: reflection.conversation_summary || '',
      what_worked: reflection.what_worked || '',
      what_to_avoid: reflection.what_to_avoid || ''
    });

    return {
      success: true,
      reflection,
      id: result || 'inserted'
    };
  } catch (error) {
    console.error('添加情景记忆失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// 情景记忆检索
export async function episodicRecall(
  query: string,
  wclient: any,
  userId: string = 'default_user',
  limit: number = 1,
  alpha: number = 0.5
) {
  try {
    const collectionName = getCollectionName(userId);
    const episodicMemory = wclient.collections.get(collectionName);
    
    // 混合语义/BM25 检索
    const memory = await episodicMemory.query.hybrid(query, {
      alpha,
      limit,
      returnMetadata: ['score']
    });
    
    return memory;
  } catch (error) {
    console.error('情景记忆检索失败:', error);
    throw error;
  }
}

// 生成系统提示
export function episodicSystemPrompt(
  memory: any,
  userId: string,
  globalMemory: Map<string, string[]> = new Map(),
  globalWhatWorked: Map<string, Set<string>> = new Map(),
  globalWhatToAvoid: Map<string, Set<string>> = new Map()
): SystemMessage {
  if (!memory.objects || memory.objects.length === 0) {
    return new SystemMessage({
      content: "You are a helpful AI Assistant. Answer the user's questions to the best of your ability."
    });
  }

  const currentConversation = memory.objects[0].properties.conversation;

  // 使用正确的默认值初始化
  const conversations = globalMemory.get(userId) || [];
  const whatWorked = globalWhatWorked.get(userId) || new Set<string>();
  const whatToAvoid = globalWhatToAvoid.get(userId) || new Set<string>();

  if (!conversations.includes(currentConversation)) {
    conversations.push(currentConversation);
  }

  // 将新的内容添加到集合中
  const workedSentences = memory.objects[0].properties.what_worked?.split('. ') || [];
  const avoidSentences = memory.objects[0].properties.what_to_avoid?.split('. ') || [];
  
  workedSentences.forEach((sentence: string) => {
    if (sentence.trim()) whatWorked.add(sentence.trim());
  });
  
  avoidSentences.forEach((sentence: string) => {
    if (sentence.trim()) whatToAvoid.add(sentence.trim());
  });

  // 更新全局变量
  globalMemory.set(userId, conversations);
  globalWhatWorked.set(userId, whatWorked);
  globalWhatToAvoid.set(userId, whatToAvoid);

  // 获取最近的对话内容
  const previousConvos = conversations
    .slice(-4)
    .filter(conv => conv !== currentConversation)
    .slice(-3);

  // 创建包含累积历史的提示
  const episodicPrompt = `You are a helpful AI Assistant. Answer the user's questions to the best of your ability.
You recall similar conversations with the user, here are the details:

Current Conversation Match: ${memory.objects[0].properties.conversation}
Previous Conversations: ${previousConvos.join(' | ')}
What has worked well: ${Array.from(whatWorked).join(' ')}
What to avoid: ${Array.from(whatToAvoid).join(' ')}

Use these memories as context for your response to the user.`;

  return new SystemMessage({ content: episodicPrompt });
}

// 辅助函数：获取集合名称
function getCollectionName(userId: string): string {
  return `Memory_${userId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

// 辅助函数：确保用户集合存在
async function ensureUserCollection(wclient: any, userId: string): Promise<void> {
  const collectionName = getCollectionName(userId);
  const collections = wclient.collections;

  try {
    // 检查集合是否存在
    const collection = collections.get(collectionName);
    await collection.config.get();
    console.log(`✅ 集合 ${collectionName} 已存在`);
  } catch (error) {
    // 集合不存在，创建新集合
    console.log(`📝 创建集合 ${collectionName}...`);
    
    await collections.create({
      name: collectionName,
      vectorizers: wclient.configure?.vectorizer?.text2VecOllama?.({
        apiEndpoint: 'http://ollama:11434',
        model: 'nomic-embed-text'
      }) || null,
      properties: [
        { name: 'conversation', dataType: wclient.configure?.dataType?.TEXT || 'text' },
        { name: 'context_tags', dataType: wclient.configure?.dataType?.TEXT_ARRAY || 'text[]' },
        { name: 'conversation_summary', dataType: wclient.configure?.dataType?.TEXT || 'text' },
        { name: 'what_worked', dataType: wclient.configure?.dataType?.TEXT || 'text' },
        { name: 'what_to_avoid', dataType: wclient.configure?.dataType?.TEXT || 'text' }
      ]
    });
    
    console.log(`✅ 集合 ${collectionName} 创建成功`);
  }
}
