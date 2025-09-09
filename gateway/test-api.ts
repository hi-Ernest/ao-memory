#!/usr/bin/env npx ts-node

// API 测试脚本
// 用法: npx ts-node test-api.ts

const BASE_URL = 'http://localhost:8787';

async function testAPI() {
  console.log('🧪 开始测试 Gateway API...\n');

  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ 健康检查:', health);

    // 2. 测试保存记忆
    console.log('\n2️⃣ 测试保存记忆...');
    const saveResponse = await fetch(`${BASE_URL}/api/memory/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: 'HUMAN: 如何学习 TypeScript?\nAI: 建议先掌握 JavaScript 基础，然后学习 TypeScript 的类型系统。可以从简单的类型注解开始，逐步学习接口、泛型等高级特性。',
        context_tags: ['typescript', 'learning', 'programming'],
        conversation_summary: '提供了 TypeScript 学习建议和学习路径',
        what_worked: '循序渐进的学习方法，从基础到高级',
        what_to_avoid: '直接学习复杂的高级特性，跳过基础知识'
      })
    });
    
    if (saveResponse.ok) {
      const saveResult = await saveResponse.json();
      console.log('✅ 保存记忆成功:', saveResult);
    } else {
      console.log('❌ 保存记忆失败:', await saveResponse.text());
    }

    // 3. 再保存一个记忆
    console.log('\n3️⃣ 保存第二个记忆...');
    const saveResponse2 = await fetch(`${BASE_URL}/api/memory/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: 'HUMAN: React hooks 有什么优势?\nAI: React hooks 的主要优势包括：1) 让函数组件拥有状态管理能力，2) 更好的逻辑复用，3) 避免了类组件的复杂性，4) 更容易测试和理解。',
        context_tags: ['react', 'hooks', 'frontend'],
        conversation_summary: '解释了 React hooks 的优势和好处',
        what_worked: '列举具体优势点，结构清晰',
        what_to_avoid: '过于理论化，缺乏具体示例'
      })
    });
    
    if (saveResponse2.ok) {
      const saveResult2 = await saveResponse2.json();
      console.log('✅ 保存第二个记忆成功:', saveResult2);
    } else {
      console.log('❌ 保存第二个记忆失败:', await saveResponse2.text());
    }

    // 4. 等待一下让数据同步
    console.log('\n⏳ 等待数据同步...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. 测试查询记忆
    console.log('\n4️⃣ 测试查询记忆...');
    const queryResponse = await fetch(`${BASE_URL}/api/memory/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '如何学习前端技术',
        limit: 3
      })
    });
    
    if (queryResponse.ok) {
      const queryResult = await queryResponse.json();
      console.log('✅ 查询记忆成功:');
      console.log(`   找到 ${queryResult.count} 个相关记忆:`);
      
      queryResult.memories.forEach((memory: any, index: number) => {
        console.log(`\n   📝 记忆 ${index + 1}:`);
        console.log(`      相关性得分: ${memory.score}`);
        console.log(`      摘要: ${memory.conversation_summary}`);
        console.log(`      标签: ${memory.context_tags?.join(', ')}`);
        console.log(`      有效方法: ${memory.what_worked}`);
        console.log(`      对话内容: ${memory.conversation.substring(0, 100)}...`);
      });
    } else {
      console.log('❌ 查询记忆失败:', await queryResponse.text());
    }

    // 6. 测试自动反思生成
    console.log('\n5️⃣ 测试自动反思生成...');
    const autoResponse = await fetch(`${BASE_URL}/api/memory/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: 'HUMAN: 什么是机器学习?\nAI: 机器学习是人工智能的一个分支，它让计算机能够从数据中学习模式，无需被明确编程。主要包括监督学习、无监督学习和强化学习三大类。'
      })
      // 注意：没有提供反思数据，系统会自动生成
    });
    
    if (autoResponse.ok) {
      const autoResult = await autoResponse.json();
      console.log('✅ 自动反思生成成功:');
      console.log('   自动生成的反思数据:', autoResult.reflection);
    } else {
      console.log('❌ 自动反思生成失败:', await autoResponse.text());
    }

    console.log('\n🎉 所有 API 测试完成！');

  } catch (error) {
    console.error('💥 测试失败:', error);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI().catch(console.error);
}

export { testAPI };
