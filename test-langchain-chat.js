#!/usr/bin/env node

// 测试LangChain聊天API的脚本
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const GATEWAY_URL = "http://localhost:8787";

// 测试数据
const testMessages = [
  {
    message: "Hello, can you help me with memory techniques?",
    conversation_history: [],
  },
  {
    message: "What is the memory palace technique?",
    conversation_history: [
      {
        role: "user",
        content: "Hello, can you help me with memory techniques?",
      },
      {
        role: "assistant",
        content:
          "Absolutely! I specialize in memory techniques. Memory enhancement involves various proven methods.",
      },
    ],
  },
  {
    message: "How can I remember names better?",
    conversation_history: [
      { role: "user", content: "What is the memory palace technique?" },
      {
        role: "assistant",
        content: "The memory palace technique is a spatial memory method.",
      },
    ],
  },
];

async function testSimpleChat(testData) {
  try {
    console.log(
      "🧪 Testing message:",
      testData.message.substring(0, 50) + "..."
    );

    const response = await fetch(`${GATEWAY_URL}/api/simple-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log("✅ Success!");
      console.log("📝 Response:", data.response.substring(0, 200) + "...");
      console.log("🕒 Timestamp:", new Date(data.timestamp).toLocaleString());
      console.log("🤖 Model:", data.model);
      console.log("");
      return true;
    } else {
      console.log("❌ Failed:", data.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.log("💡 Make sure Gateway service is running on port 8787");
    }
    return false;
  }
}

async function testHealthCheck() {
  try {
    console.log("🔍 Testing health check...");
    const response = await fetch(`${GATEWAY_URL}/health`);
    const data = await response.json();
    console.log("✅ Health check:", data.ok ? "OK" : "Failed");
    return data.ok;
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Testing LangChain Chat API\n");

  // Test health check first
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log("❌ Gateway service is not running. Please start it first.");
    return;
  }

  console.log("");

  // Test all message scenarios
  let successCount = 0;
  for (let i = 0; i < testMessages.length; i++) {
    console.log(`--- Test ${i + 1}/${testMessages.length} ---`);
    const success = await testSimpleChat(testMessages[i]);
    if (success) successCount++;
    console.log("");
  }

  console.log("📊 Test Summary:");
  console.log(`✅ Successful: ${successCount}/${testMessages.length}`);
  console.log(
    `❌ Failed: ${testMessages.length - successCount}/${testMessages.length}`
  );

  if (successCount === testMessages.length) {
    console.log(
      "🎉 All tests passed! LangChain integration is working correctly."
    );
  } else {
    console.log(
      "⚠️ Some tests failed. Check the Gateway service logs for details."
    );
  }
}

main().catch(console.error);
