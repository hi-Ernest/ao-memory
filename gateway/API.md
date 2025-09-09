# Gateway API 文档

这个 Gateway 服务提供了与 Weaviate 向量数据库交互的 API 端点，用于保存和查询对话记忆。

## 🔗 基础信息

- **服务地址**: `http://localhost:8787`
- **数据格式**: JSON
- **内容类型**: `application/json`

## 📋 API 端点

### 1. 健康检查

**GET** `/health`

检查服务是否正常运行。

**响应示例:**
```json
{
  "ok": true
}
```

---

### 2. 聊天对话（集成 RAG）

**POST** `/chat`

与 AI 进行对话，自动检索相关记忆并保存新的对话。

**请求体:**
```json
{
  "wallet": "用户钱包地址",
  "user_input": "用户输入的问题"
}
```

**响应示例:**
```json
{
  "answer": "AI 生成的回答",
  "saved": {
    "messageId": "ao-message-id",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. 保存记忆到向量数据库

**POST** `/api/memory/save`

保存新的对话记忆到 Weaviate 向量数据库。

**请求体:**
```json
{
  "conversation": "完整的对话内容 (必需)",
  "context_tags": ["tag1", "tag2", "tag3"],
  "conversation_summary": "对话摘要",
  "what_worked": "有效的方法或策略",
  "what_to_avoid": "需要避免的内容"
}
```

**注意:** 只有 `conversation` 是必需的。如果没有提供其他字段，系统会自动生成反思数据。

**响应示例:**
```json
{
  "success": true,
  "id": "weaviate-object-uuid",
  "reflection": {
    "context_tags": ["react", "hooks", "frontend"],
    "conversation_summary": "解释了 React hooks 的基本用法...",
    "what_worked": "Provided helpful information based on context",
    "what_to_avoid": "Avoid repeating the same information unnecessarily"
  }
}
```

**cURL 示例:**
```bash
curl -X POST http://localhost:8787/api/memory/save \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": "HUMAN: How do React hooks work?\nAI: React hooks are functions that let you use state and lifecycle features in functional components...",
    "context_tags": ["react", "hooks", "frontend"],
    "conversation_summary": "Explained React hooks basics and usage patterns",
    "what_worked": "Step-by-step examples with code snippets",
    "what_to_avoid": "Too much theoretical explanation without examples"
  }'
```

---

### 4. 查询相关记忆

**POST** `/api/memory/query`

根据查询文本检索相关的对话记忆。

**请求体:**
```json
{
  "query": "查询文本 (必需)",
  "limit": 5
}
```

**响应示例:**
```json
{
  "success": true,
  "count": 3,
  "memories": [
    {
      "id": "uuid-1",
      "score": 0.95,
      "conversation": "HUMAN: How do React hooks work?\nAI: React hooks are...",
      "context_tags": ["react", "hooks", "frontend"],
      "conversation_summary": "Explained React hooks basics",
      "what_worked": "Step-by-step examples with code snippets",
      "what_to_avoid": "Too much theoretical explanation"
    },
    {
      "id": "uuid-2",
      "score": 0.78,
      "conversation": "HUMAN: What is useState?\nAI: useState is a hook...",
      "context_tags": ["react", "usestate", "state"],
      "conversation_summary": "Explained useState hook usage",
      "what_worked": "Clear examples with state updates",
      "what_to_avoid": "Complex state management initially"
    }
  ]
}
```

**cURL 示例:**
```bash
curl -X POST http://localhost:8787/api/memory/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I use React components?",
    "limit": 3
  }'
```

---

### 5. 高级记忆保存（支持 LangChain 消息格式）

**POST** `/api/memory/save-advanced`

使用 LangChain 消息格式保存对话记忆，支持 LLM 驱动的高质量反思生成。

**请求体:**
```json
{
  "user_id": "用户唯一标识 (可选，默认 'default_user')",
  "messages": [
    {
      "type": "system",
      "content": "系统消息内容"
    },
    {
      "type": "human",
      "content": "用户消息内容"
    },
    {
      "type": "ai",
      "content": "AI 回复内容"
    }
  ]
}
```

**支持的消息类型:**
- `system` / `human` / `user` / `ai` / `assistant`

**响应示例:**
```json
{
  "success": true,
  "id": "weaviate-object-uuid",
  "user_id": "test_user_123",
  "reflection": {
    "context_tags": ["transformer_architecture", "attention_mechanism", "deep_learning"],
    "conversation_summary": "Explained transformer attention mechanisms and compared with RNN-based approaches",
    "what_worked": "Using mathematical formulas and step-by-step comparisons to clarify complex concepts",
    "what_to_avoid": "Assuming prior knowledge of linear algebra without verification"
  }
}
```

**cURL 示例:**
```bash
curl -X POST http://localhost:8787/api/memory/save-advanced \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "researcher_001",
    "messages": [
      {
        "type": "human",
        "content": "How does transformer attention work?"
      },
      {
        "type": "ai", 
        "content": "Transformer attention uses scaled dot-product attention..."
      }
    ]
  }'
```

---

### 6. 高级记忆查询（支持系统提示生成）

**POST** `/api/memory/recall`

根据查询检索用户特定的记忆，并生成包含累积学习内容的系统提示。

**请求体:**
```json
{
  "query": "查询文本 (必需)",
  "user_id": "用户唯一标识 (可选)",
  "limit": 1,
  "alpha": 0.5
}
```

**参数说明:**
- `alpha`: 混合搜索权重 (0.0=纯关键词, 1.0=纯语义, 0.5=平衡)
- `limit`: 返回的记忆数量

**响应示例:**
```json
{
  "success": true,
  "user_id": "researcher_001",
  "memory": [
    {
      "id": "uuid",
      "score": 0.89,
      "conversation": "HUMAN: How does...\nAI: Transformer attention...",
      "context_tags": ["transformer", "attention"],
      "conversation_summary": "Explained transformer attention mechanisms",
      "what_worked": "Mathematical formulas with examples",
      "what_to_avoid": "Too much theory without context"
    }
  ],
  "system_prompt": "You are a helpful AI Assistant. You recall similar conversations with the user, here are the details:\n\nCurrent Conversation Match: HUMAN: How does...\nPrevious Conversations: ...\nWhat has worked well: Mathematical formulas with examples\nWhat to avoid: Too much theory without context\n\nUse these memories as context for your response to the user.",
  "global_stats": {
    "total_conversations": 5,
    "what_worked_count": 12,
    "what_to_avoid_count": 8
  }
}
```

**cURL 示例:**
```bash
curl -X POST http://localhost:8787/api/memory/recall \
  -H "Content-Type: application/json" \
  -d '{
    "query": "explain machine learning concepts",
    "user_id": "researcher_001",
    "limit": 2,
    "alpha": 0.6
  }'
```

---

### 7. 导出记忆数据

**POST** `/export`

导出加密的记忆快照到 Arweave。

**请求体:**
```json
{
  "wallet": "用户钱包地址"
}
```

**响应示例:**
```json
{
  "arweave_tx": "arweave-transaction-id",
  "key_b64": "base64-encoded-encryption-key"
}
```

---

## 🔧 环境变量

启动服务前需要设置以下环境变量：

```bash
# OpenAI API 配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# 向量数据库配置
OLLAMA_URL=http://localhost:11434
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=optional-api-key

# AO 区块链配置
AO_WALLET_JSON={"your":"wallet","json":"here"}
MEMORY_PROCESS_ID=ao-memory-process-id
MARKET_PROCESS_ID=ao-market-process-id

# 服务端口
PORT=8787
```

---

## 🚀 启动服务

1. **确保依赖服务运行:**
   ```bash
   # 启动 Docker 服务
   docker-compose up -d
   ```

2. **安装依赖:**
   ```bash
   cd gateway
   npm install
   ```

3. **启动服务:**
   ```bash
   # 开发模式
   npm run dev

   # 或直接运行
   npx ts-node server.ts
   ```

4. **验证服务:**
   ```bash
   curl http://localhost:8787/health
   ```

---

## 📊 数据结构

### Memory 对象结构

Weaviate 中的 Memory 集合包含以下字段：

```typescript
interface Memory {
  conversation: string;        // 完整的对话内容
  context_tags: string[];      // 上下文标签数组
  conversation_summary: string; // 对话摘要
  what_worked: string;         // 有效的方法
  what_to_avoid: string;       // 需要避免的内容
}
```

### 查询结果

每个查询结果包含：
- **id**: Weaviate 对象 UUID
- **score**: 相关性得分 (0-1, 越高越相关)
- **conversation**: 原始对话内容
- **context_tags**: 相关标签
- **conversation_summary**: 对话摘要
- **what_worked**: 有效策略
- **what_to_avoid**: 避免事项

---

## 🔍 使用示例

### 场景 1: 保存对话记忆

```javascript
const saveMemory = async () => {
  const response = await fetch('http://localhost:8787/api/memory/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation: 'HUMAN: 如何学习 JavaScript?\nAI: 建议从基础语法开始，然后逐步学习 DOM 操作...',
      context_tags: ['javascript', 'learning', 'programming'],
      conversation_summary: '提供了 JavaScript 学习路径建议',
      what_worked: '循序渐进的学习路径和实践建议',
      what_to_avoid: '一开始就学习复杂的框架'
    })
  });
  
  const result = await response.json();
  console.log('保存结果:', result);
};
```

### 场景 2: 查询相关记忆

```javascript
const queryMemories = async () => {
  const response = await fetch('http://localhost:8787/api/memory/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: '如何学习编程',
      limit: 3
    })
  });
  
  const result = await response.json();
  console.log('查询结果:', result.memories);
};
```

---

## ⚠️ 注意事项

1. **服务依赖**: 确保 Weaviate 和 Ollama 服务正常运行
2. **网络连接**: Weaviate 需要能访问 Ollama 服务 (`http://ollama:11434`)
3. **模型下载**: 首次运行需等待 Ollama 下载 `nomic-embed-text` 模型
4. **内存管理**: 大量数据插入时注意内存使用
5. **错误处理**: API 会返回详细的错误信息，便于调试

---

## 🔧 故障排除

### 常见问题

1. **Weaviate 连接失败**
   - 检查 Docker 容器是否运行：`docker-compose ps`
   - 验证端口映射：`curl http://localhost:8080/v1/meta`

2. **Ollama 模型未下载**
   - 查看容器日志：`docker-compose logs ollama`
   - 手动下载模型：`docker exec ollama ollama pull nomic-embed-text`

3. **向量化失败**
   - 确保 Weaviate 能访问 Ollama 容器网络
   - 检查 Ollama API 端点：`curl http://localhost:11434/api/tags`

4. **环境变量缺失**
   - 确保设置了所有必需的环境变量
   - 检查 AO 钱包 JSON 格式是否正确
