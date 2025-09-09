# Weaviate 测试指南

这个测试文件用于验证 Weaviate 向量数据库的插入和查询功能。

## 前置条件

1. **启动 Docker 服务**
   ```bash
   # 在项目根目录
   cd /Users/chenhuarui/github/hackathon/apus-chat-attestation-example
   docker-compose up -d
   ```

2. **等待服务启动**
   - Weaviate: http://localhost:8080
   - Ollama: http://localhost:11434
   - 等待 Ollama 下载 `mxbai-embed-large` 模型（首次启动需要几分钟）

3. **检查服务状态**
   ```bash
   # 检查容器状态
   docker-compose ps
   
   # 查看 Ollama 日志，确认模型下载完成
   docker-compose logs ollama
   
   # 测试 Weaviate API
   curl http://localhost:8080/v1/meta
   
   # 测试 Ollama API
   curl http://localhost:11434/api/tags
   ```

## 运行测试

```bash
cd gateway
npm run test:weaviate
```

或者直接运行：

```bash
cd gateway
npx ts-node test-weaviate.ts
```

## 测试内容

测试会依次执行以下步骤：

### 1. 连接测试
- 测试与 Weaviate 的连接
- 验证客户端初始化

### 2. 集合创建
- 创建 `Memory` 集合（如果不存在）
- 定义属性结构：
  - `conversation` - 对话内容
  - `previous` - 之前的内容
  - `what_worked` - 有效的方法
  - `what_to_avoid` - 需要避免的内容

### 3. 数据插入测试
- 插入 3 条测试记录
- 每条记录包含对话内容和相关元数据
- 使用 Ollama 生成嵌入向量

### 4. 向量查询测试
- 使用查询文本："How do I use React components?"
- 执行相似度搜索
- 返回最相关的 3 个结果
- 显示相似度距离和完整内容

### 5. 统计信息
- 获取集合中的对象总数
- 验证数据已正确存储

## 预期输出

成功运行时，你应该看到类似这样的输出：

```
🚀 开始 Weaviate 测试...

✅ Weaviate 连接成功
✅ Memory 集合已存在

🔄 测试插入数据...
✅ 获取嵌入向量成功, 维度: 1024
✅ 插入数据 1: abc12345-def6-7890-abcd-ef1234567890
✅ 获取嵌入向量成功, 维度: 1024
✅ 插入数据 2: def67890-abc1-2345-def6-789012345abc
✅ 获取嵌入向量成功, 维度: 1024
✅ 插入数据 3: ghi12345-jkl6-7890-mno1-234567890pqr
🎉 所有测试数据插入成功

⏳ 等待数据同步...

🔍 测试查询数据...
查询文本: "How do I use React components?"
✅ 获取嵌入向量成功, 维度: 1024

📊 找到 3 个相关结果:

--- 结果 1 ---
相似度距离: 0.234
对话内容: User asked about React hooks, I explained useState and useEffect
之前内容: Previous discussion about JavaScript fundamentals
有效方法: Step-by-step examples with code snippets
避免内容: Too much theoretical explanation without examples

📈 获取集合统计信息...
✅ Memory 集合统计:
- 总对象数: 3

🎉 所有测试完成！Weaviate 工作正常
```

## 故障排除

### 1. 连接失败
```
❌ Weaviate 连接失败: Error: connect ECONNREFUSED 127.0.0.1:8080
```
**解决方案**: 检查 Docker 容器是否运行：`docker-compose ps`

### 2. Ollama 模型未下载
```
❌ 获取嵌入向量失败: Ollama API 错误: 404
```
**解决方案**: 等待 Ollama 完成模型下载：`docker-compose logs ollama`

### 3. 权限错误
```
❌ 创建集合失败: 403 Forbidden
```
**解决方案**: 检查 Weaviate 配置，确保匿名访问已启用

## 清理数据

如果需要重置测试数据：

```bash
# 停止并删除容器和数据卷
docker-compose down -v

# 重新启动
docker-compose up -d
```

## 集成到应用

测试成功后，你可以在应用中使用相同的模式：

1. 使用 `initWeaviate()` 初始化客户端
2. 使用 `embedWithOllama()` 生成嵌入向量
3. 使用向量搜索进行语义查询
4. 结合 AO 进程进行数据持久化
