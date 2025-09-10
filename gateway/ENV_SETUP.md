# 环境变量配置说明

## 快速开始

1. 复制环境变量模板文件：
   ```bash
   cp ../env.example .env
   ```

2. 编辑 `.env` 文件，填入你的实际配置：
   ```bash
   nano .env
   ```

3. 验证环境变量配置：
   ```bash
   npm run check-env
   ```

## 必需的环境变量

### OpenAI API 配置
- `OPENAI_API_KEY`: OpenAI API 密钥
- `OPENAI_MODEL`: 使用的 OpenAI 模型 (默认: gpt-4o-mini)

### AO 网络配置
- `AO_WALLET_JSON`: AO 钱包私钥的 JSON 格式
- `MEMORY_PROCESS_ID`: 内存进程 ID
- `MARKET_PROCESS_ID`: 市场进程 ID

## 可选的环境变量

### 本地服务配置
- `OLLAMA_URL`: Ollama 服务地址 (默认: http://localhost:11434)
- `WEAVIATE_URL`: Weaviate 向量数据库地址 (默认: http://localhost:8080)
- `WEAVIATE_API_KEY`: Weaviate API 密钥 (如果需要)
- `PORT`: 服务器端口 (默认: 8787)

## 示例配置

```env
# OpenAI API 配置
OPENAI_API_KEY=sk-proj-xxx...
OPENAI_MODEL=gpt-4o-mini

# Ollama 配置
OLLAMA_URL=http://localhost:11434

# Weaviate 配置
WEAVIATE_URL=http://localhost:8080

# AO 配置
AO_WALLET_JSON={"kty":"RSA","n":"xxx..."}
MEMORY_PROCESS_ID=pqv5D0p8bmWfTG6oLRDzLlFl63QR29UOB8YOWFP5rIw
MARKET_PROCESS_ID=another_process_id

# 服务器配置
PORT=8787
```

## 安全注意事项

- ⚠️ 永远不要将 `.env` 文件提交到版本控制系统
- ⚠️ 确保 `AO_WALLET_JSON` 中的私钥安全
- ⚠️ 不要在公共场所分享你的 API 密钥

## 环境变量验证

使用内置的检查工具验证你的配置：

```bash
cd gateway
npm run check-env
```

这个命令会：
- ✅ 检查所有必需的环境变量是否设置
- 🔧 显示可选环境变量的当前值或默认值
- 📝 验证 JSON 格式的环境变量（如 `AO_WALLET_JSON`）
- 💡 提供具体的修复建议

## 故障排除

如果遇到环境变量相关的错误：

1. **运行环境检查**：`npm run check-env`
2. **检查文件位置**：确保 `.env` 文件在 `gateway/` 目录中
3. **验证 JSON 格式**：特别是 `AO_WALLET_JSON` 必须是有效的 JSON
4. **检查服务依赖**：确保 Ollama 和 Weaviate 服务正在运行
5. **重启服务**：重启 Gateway 服务以重新加载环境变量

### 常见错误

#### `Missing required env vars` 错误
```bash
# 运行检查找出缺失的变量
npm run check-env

# 参考模板文件
cp ../env.example .env
```

#### `Invalid JSON response` 错误
```bash
# 检查 AO_WALLET_JSON 格式
echo $AO_WALLET_JSON | jq .
```

#### 连接超时错误
```bash
# 检查 Ollama 服务
curl http://localhost:11434/api/tags

# 检查 Weaviate 服务  
curl http://localhost:8080/v1/meta
```
