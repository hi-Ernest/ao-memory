import weaviate from 'weaviate-client';

// 测试配置
const WEAVIATE_URL = 'http://localhost:8080';
const OLLAMA_URL = 'http://localhost:11434';

let wclient: any;

// 初始化 Weaviate 客户端
async function initWeaviate() {
  try {
    wclient = await weaviate.connectToLocal({
      host: 'localhost',
      port: 8080,
    });
    console.log('✅ Weaviate 连接成功');
    return true;
  } catch (error) {
    console.error('❌ Weaviate 连接失败:', error);
    return false;
  }
}

// 获取嵌入向量
async function embedWithOllama(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        model: 'nomic-embed-text', 
        prompt: text 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API 错误: ${response.status} - ${errorText}`);
    }
    
    const result: any = await response.json();
    if (!result || !result.embedding) {
      console.log('Ollama 响应:', result);
      throw new Error('Ollama 返回的嵌入向量格式错误');
    }
    
    console.log(`✅ 获取嵌入向量成功, 维度: ${result.embedding.length}`);
    return result.embedding as number[];
  } catch (error) {
    console.error('❌ 获取嵌入向量失败:', error);
    throw error;
  }
}

// 创建集合 (如果不存在)
async function createMemoryCollection() {
  try {
    const collections = wclient.collections;
    
    // 删除现有集合（如果存在）并重新创建
    try {
      await collections.delete('Memory');
      console.log('🗑️ 删除现有 Memory 集合');
    } catch (error) {
      // 集合不存在，忽略错误
    }
    
    console.log('📝 创建新的 Memory 集合...');

    await collections.create({
      name: 'Memory',
      vectorizers: weaviate.configure.vectorizer.text2VecOllama({
        apiEndpoint: 'http://ollama:11434',
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
    
    console.log('✅ Memory 集合创建成功');
    return true;
  } catch (error) {
    console.error('❌ 创建集合失败:', error);
    return false;
  }
}

// 测试插入数据
async function testInsert() {
  try {
    console.log('\n🔄 测试插入数据...');
    
    const testData = [
      {
        conversation: 'HUMAN: Can you explain React hooks?\nAI: React hooks are functions that let you use state and other React features in functional components. The most common ones are useState for state management and useEffect for side effects.\nHUMAN: How do I use useState?\nAI: You call useState with an initial value and it returns an array with the current state and a setter function.',
        context_tags: ['react_hooks', 'frontend_development', 'state_management'],
        conversation_summary: 'Explained React hooks basics and useState implementation to help user understand functional component state management',
        what_worked: 'Step-by-step examples with code snippets and clear function signature explanations',
        what_to_avoid: 'Too much theoretical explanation without examples'
      },
      {
        conversation: 'HUMAN: I need help with Python data analysis\nAI: I can help you with pandas for data manipulation. What specific task are you trying to accomplish?\nHUMAN: How do I read a CSV file?\nAI: You can use pandas.read_csv("filename.csv") to load your data into a DataFrame.',
        context_tags: ['python_pandas', 'data_analysis', 'csv_processing'],
        conversation_summary: 'Guided user through pandas basics for CSV file processing and data manipulation',
        what_worked: 'Interactive examples with real data and immediate practical solutions',
        what_to_avoid: 'Abstract concepts without practical application'
      },
      {
        conversation: 'HUMAN: What are Docker containers?\nAI: Docker containers are lightweight, portable packages that include everything needed to run an application.\nHUMAN: How do I create one?\nAI: You start by writing a Dockerfile that defines your application environment and dependencies.',
        context_tags: ['docker_containers', 'containerization', 'devops_basics'],
        conversation_summary: 'Introduced Docker container concepts and basic Dockerfile creation for application packaging',
        what_worked: 'Visual diagrams and hands-on commands with practical examples',
        what_to_avoid: 'Complex orchestration before understanding basics'
      }
    ];

    const memory = wclient.collections.get('Memory');
    
    for (let i = 0; i < testData.length; i++) {
      const data = testData[i];
      
      // 不需要手动生成向量，Weaviate 会自动通过 Ollama 生成
      const result = await memory.data.insert({
        conversation: data.conversation,
        context_tags: data.context_tags,
        conversation_summary: data.conversation_summary,
        what_worked: data.what_worked,
        what_to_avoid: data.what_to_avoid
      });
      
      console.log(`✅ 插入数据 ${i + 1}: ${result || 'success'}`);
    }
    
    console.log('🎉 所有测试数据插入成功');
    return true;
  } catch (error) {
    console.error('❌ 插入数据失败:', error);
    return false;
  }
}

// 测试查询数据
async function testQuery() {
  try {
    console.log('\n🔍 测试查询数据...');
    
    const queryText = 'How do I use React components?';
    console.log(`查询文本: "${queryText}"`);
    
    const memory = wclient.collections.get('Memory');
    
    // 使用 hybrid 查询（语义 + BM25）
    const results = await memory.query.hybrid(queryText, {
      alpha: 0.5, // 0.5 表示语义搜索和关键词搜索各占一半
      limit: 3,
      returnMetadata: ['score']
    });
    
    console.log('查询结果调试:', results);
    console.log(`\n📊 找到 ${results.objects?.length || 0} 个相关结果:`);
    
    results.objects.forEach((obj: any, index: number) => {
      console.log(`\n--- 结果 ${index + 1} ---`);
      console.log(`相关性得分: ${obj.metadata?.score || 'N/A'}`);
      console.log(`对话摘要: ${obj.properties.conversation_summary}`);
      console.log(`上下文标签: ${obj.properties.context_tags?.join(', ') || 'N/A'}`);
      console.log(`有效方法: ${obj.properties.what_worked}`);
      console.log(`避免内容: ${obj.properties.what_to_avoid}`);
      console.log(`完整对话: ${obj.properties.conversation.substring(0, 100)}...`);
    });
    
    return results.objects.length > 0;
  } catch (error) {
    console.error('❌ 查询数据失败:', error);
    return false;
  }
}

// 测试获取集合统计信息
async function testStats() {
  try {
    console.log('\n📈 获取集合统计信息...');
    
    const memory = wclient.collections.get('Memory');
    
    // 尝试获取所有对象来计算数量
    const allObjects = await memory.query.fetchObjects({
      limit: 1000
    });
    
    console.log(`✅ Memory 集合统计:`);
    console.log(`- 总对象数: ${allObjects.objects.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始 Weaviate 测试...\n');
  
  // 测试连接
  const connected = await initWeaviate();
  if (!connected) {
    console.log('❌ 无法连接到 Weaviate，请确保 Docker 容器正在运行');
    process.exit(1);
  }
  
  // 创建集合
  const collectionCreated = await createMemoryCollection();
  if (!collectionCreated) {
    console.log('❌ 无法创建集合');
    process.exit(1);
  }
  
  // 测试插入
  const insertSuccess = await testInsert();
  if (!insertSuccess) {
    console.log('❌ 插入测试失败');
    process.exit(1);
  }
  
  // 等待一下让数据同步
  console.log('\n⏳ 等待数据同步...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试查询
  const querySuccess = await testQuery();
  if (!querySuccess) {
    console.log('❌ 查询测试失败');
    process.exit(1);
  }
  
  // 测试统计
  await testStats();
  
  console.log('\n🎉 所有测试完成！Weaviate 工作正常');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('💥 测试运行失败:', error);
    process.exit(1);
  });
}

export { initWeaviate, embedWithOllama, testInsert, testQuery };
