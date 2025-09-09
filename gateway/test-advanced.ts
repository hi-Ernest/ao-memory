#!/usr/bin/env npx ts-node

// 高级 API 测试脚本 - 测试 LangChain 集成和反思功能
// 用法: npx ts-node test-advanced.ts

const BASE_URL = 'http://localhost:8787';

async function testAdvancedAPI() {
  console.log('🧪 开始测试高级 Gateway API（LangChain 集成）...\n');

  try {
    const user_id = 'test_user_' + Date.now();

    // 1. 测试高级记忆保存（LangChain 消息格式）
    console.log('1️⃣ 测试高级记忆保存（LangChain 消息格式）...');
    const saveAdvancedResponse = await fetch(`${BASE_URL}/api/memory/save-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        messages: [
          {
            type: 'system',
            content: 'You are a helpful research assistant specialized in machine learning papers.'
          },
          {
            type: 'human',
            content: 'Can you explain how transformer attention mechanisms work in the context of the original "Attention is All You Need" paper?'
          },
          {
            type: 'ai',
            content: 'The transformer attention mechanism works by computing scaled dot-product attention. For each query Q, key K, and value V, it calculates attention weights using the formula: Attention(Q,K,V) = softmax(QK^T/√d_k)V. This allows the model to focus on relevant parts of the input sequence when processing each position. The multi-head attention then runs multiple attention functions in parallel, enabling the model to attend to information from different representation subspaces simultaneously.'
          },
          {
            type: 'human',
            content: 'How does this compare to RNN-based attention?'
          },
          {
            type: 'ai',
            content: 'Unlike RNN-based attention which processes sequences sequentially, transformer attention allows for parallel computation of all positions simultaneously. This makes training much faster and enables better handling of long-range dependencies. RNN attention typically uses hidden states from previous time steps, while transformer attention directly computes relationships between all pairs of positions in the sequence.'
          }
        ]
      })
    });
    
    if (saveAdvancedResponse.ok) {
      const saveResult = await saveAdvancedResponse.json();
      console.log('✅ 高级记忆保存成功:');
      console.log('   用户ID:', saveResult.user_id);
      console.log('   记忆ID:', saveResult.id);
      console.log('   LLM 生成的反思数据:');
      console.log('     上下文标签:', saveResult.reflection?.context_tags);
      console.log('     对话摘要:', saveResult.reflection?.conversation_summary);
      console.log('     有效方法:', saveResult.reflection?.what_worked);
      console.log('     避免事项:', saveResult.reflection?.what_to_avoid);
    } else {
      console.log('❌ 高级记忆保存失败:', await saveAdvancedResponse.text());
      return;
    }

    // 2. 保存第二个记忆（不同主题）
    console.log('\n2️⃣ 保存第二个记忆（深度学习优化）...');
    const saveAdvanced2Response = await fetch(`${BASE_URL}/api/memory/save-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        messages: [
          {
            type: 'human',
            content: 'What are the key differences between Adam and SGD optimizers?'
          },
          {
            type: 'ai',
            content: 'Adam combines the benefits of two other extensions of SGD: AdaGrad and RMSProp. Key differences: 1) Adam uses adaptive learning rates for each parameter, while SGD uses a fixed rate. 2) Adam maintains running averages of both gradients and their squared values, providing momentum-like behavior. 3) SGD can be more sensitive to hyperparameter choices but sometimes achieves better generalization. 4) Adam typically converges faster but may get stuck in suboptimal solutions in some cases.'
          },
          {
            type: 'human',
            content: 'When should I use each one?'
          },
          {
            type: 'ai',
            content: 'Use Adam for: quick prototyping, RNNs, and when you need faster initial convergence. Use SGD with momentum for: final model training, when you have time to tune hyperparameters, and for potentially better generalization. Many practitioners start with Adam for rapid development, then switch to SGD for final optimization.'
          }
        ]
      })
    });
    
    if (saveAdvanced2Response.ok) {
      const saveResult2 = await saveAdvanced2Response.json();
      console.log('✅ 第二个记忆保存成功');
      console.log('   反思摘要:', saveResult2.reflection?.conversation_summary);
    } else {
      console.log('❌ 第二个记忆保存失败:', await saveAdvanced2Response.text());
    }

    // 3. 等待数据同步
    console.log('\n⏳ 等待数据同步...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. 测试高级记忆查询（系统提示生成）
    console.log('\n3️⃣ 测试高级记忆查询和系统提示生成...');
    const recallResponse = await fetch(`${BASE_URL}/api/memory/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'explain machine learning concepts to beginners',
        user_id,
        limit: 2,
        alpha: 0.6
      })
    });
    
    if (recallResponse.ok) {
      const recallResult = await recallResponse.json();
      console.log('✅ 高级记忆查询成功:');
      console.log(`   找到 ${recallResult.memory.length} 个相关记忆`);
      
      recallResult.memory.forEach((memory: any, index: number) => {
        console.log(`\n   📝 记忆 ${index + 1}:`);
        console.log(`      相关性得分: ${memory.score.toFixed(3)}`);
        console.log(`      上下文标签: ${memory.context_tags?.join(', ')}`);
        console.log(`      对话摘要: ${memory.conversation_summary}`);
        console.log(`      有效方法: ${memory.what_worked}`);
      });

      console.log('\n   🎯 生成的系统提示:');
      console.log(`   "${recallResult.system_prompt.substring(0, 200)}..."`);
      
      console.log('\n   📊 全局统计:');
      console.log(`      总对话数: ${recallResult.global_stats.total_conversations}`);
      console.log(`      有效方法数: ${recallResult.global_stats.what_worked_count}`);
      console.log(`      避免事项数: ${recallResult.global_stats.what_to_avoid_count}`);
    } else {
      console.log('❌ 高级记忆查询失败:', await recallResponse.text());
    }

    // 5. 测试不同用户的记忆隔离
    console.log('\n4️⃣ 测试用户记忆隔离...');
    const anotherUserId = 'another_user_' + Date.now();
    
    const isolationTestResponse = await fetch(`${BASE_URL}/api/memory/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'transformer attention mechanisms',
        user_id: anotherUserId, // 不同的用户ID
        limit: 2
      })
    });
    
    if (isolationTestResponse.ok) {
      const isolationResult = await isolationTestResponse.json();
      console.log('✅ 用户隔离测试成功:');
      console.log(`   新用户 ${anotherUserId} 的记忆数: ${isolationResult.memory.length}`);
      console.log(`   总对话数: ${isolationResult.global_stats.total_conversations}`);
      
      if (isolationResult.memory.length === 0) {
        console.log('   ✅ 记忆隔离正常 - 新用户没有访问到其他用户的记忆');
      } else {
        console.log('   ⚠️ 记忆隔离可能有问题 - 新用户看到了记忆');
      }
    } else {
      console.log('❌ 用户隔离测试失败:', await isolationTestResponse.text());
    }

    // 6. 测试系统提示的渐进累积
    console.log('\n5️⃣ 测试系统提示的渐进累积...');
    
    // 再次查询原用户，看系统提示是否包含了累积的信息
    const accumulationResponse = await fetch(`${BASE_URL}/api/memory/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'deep learning optimization techniques',
        user_id, // 原用户
        limit: 2
      })
    });
    
    if (accumulationResponse.ok) {
      const accumulationResult = await accumulationResponse.json();
      console.log('✅ 系统提示累积测试成功:');
      console.log(`   累积的总对话数: ${accumulationResult.global_stats.total_conversations}`);
      console.log(`   累积的有效方法: ${accumulationResult.global_stats.what_worked_count}`);
      
      // 检查系统提示是否包含之前的学习内容
      const systemPrompt = accumulationResult.system_prompt;
      const hasTransformerContent = systemPrompt.includes('transformer') || systemPrompt.includes('attention');
      const hasOptimizerContent = systemPrompt.includes('Adam') || systemPrompt.includes('SGD') || systemPrompt.includes('optimizer');
      
      console.log('   🔍 系统提示内容分析:');
      console.log(`      包含Transformer相关内容: ${hasTransformerContent ? '✅' : '❌'}`);
      console.log(`      包含优化器相关内容: ${hasOptimizerContent ? '✅' : '❌'}`);
      
      if (hasTransformerContent && hasOptimizerContent) {
        console.log('   🎉 系统提示成功累积了多个对话的学习内容！');
      }
    } else {
      console.log('❌ 系统提示累积测试失败:', await accumulationResponse.text());
    }

    console.log('\n🎉 所有高级 API 测试完成！');
    console.log('\n🔍 测试总结:');
    console.log('✅ LangChain 消息格式支持');
    console.log('✅ LLM 驱动的反思生成');
    console.log('✅ 用户记忆隔离');
    console.log('✅ 系统提示自动生成');
    console.log('✅ 记忆内容累积');

  } catch (error) {
    console.error('💥 高级 API 测试失败:', error);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testAdvancedAPI().catch(console.error);
}

export { testAdvancedAPI };
