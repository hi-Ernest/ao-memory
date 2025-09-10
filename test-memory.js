#!/usr/bin/env node

// 测试获取GlobalMemory信息的脚本
import { message, result } from "@permaweb/aoconnect";

const PROCESS_ID = "pqv5D0p8bmWfTG6oLRDzLlFl63QR29UOB8YOWFP5rIw";
const HYPERBEAM_URL = "http://72.46.85.207:8734";

// 方法1: 通过AO消息获取对话历史
async function getConversationHistory(walletSigner) {
  try {
    console.log("📨 发送GetConversationHistory消息...");

    const messageId = await message({
      process: PROCESS_ID,
      tags: [{ name: "Action", value: "GetConversationHistory" }],
      data: "",
      signer: walletSigner,
    });

    console.log("💌 消息ID:", messageId);

    // 获取结果
    const response = await result({
      message: messageId,
      process: PROCESS_ID,
    });

    console.log(
      "📋 对话历史:",
      response.Output?.data || response.Messages?.[0]?.Data
    );
    return response;
  } catch (error) {
    console.error("❌ 获取对话历史失败:", error);
  }
}

// 方法2: 通过Patch API获取记忆数据
async function getMemoryFromPatch(userWalletAddress = null) {
  try {
    const baseUrl = `${HYPERBEAM_URL}/${PROCESS_ID}~process@1.0/now/cache`;

    // 获取所有记忆或特定用户记忆
    const memoryUrl = userWalletAddress
      ? `${baseUrl}/memory/${userWalletAddress}/serialize~json@1.0`
      : `${baseUrl}/memory/serialize~json@1.0`;

    console.log("🌐 请求URL:", memoryUrl);

    const response = await fetch(memoryUrl);

    if (response.ok) {
      const memoryData = await response.json();
      console.log("🧠 记忆数据:", JSON.stringify(memoryData, null, 2));
      return memoryData;
    } else {
      console.log("⚠️ 无法获取记忆数据，状态码:", response.status);
      console.log("响应:", await response.text());
    }
  } catch (error) {
    console.error("❌ Patch API请求失败:", error);
  }
}

// 方法3: 通过Gateway API获取记忆
async function getMemoryFromGateway(
  query = "记忆",
  userWalletAddress = "test"
) {
  try {
    const response = await fetch("http://localhost:8787/api/memory/recall", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        user_id: userWalletAddress,
        limit: 10,
      }),
    });

    if (response.ok) {
      const memoryData = await response.json();
      console.log("🏠 Gateway记忆数据:", JSON.stringify(memoryData, null, 2));
      return memoryData;
    } else {
      console.log("⚠️ Gateway请求失败，状态码:", response.status);
      console.log("响应:", await response.text());
    }
  } catch (error) {
    console.error("❌ Gateway请求失败:", error);
  }
}

// 主函数
async function main() {
  console.log("🚀 开始测试获取GlobalMemory信息...\n");

  // 测试Patch API方式 (不需要钱包)
  console.log("=== 方法2: Patch API ===");
  await getMemoryFromPatch();

  console.log("\n=== 方法3: Gateway API ===");
  await getMemoryFromGateway();

  // 注意: 方法1需要钱包签名，需要实际的钱包配置
  console.log("\n=== 注意 ===");
  console.log("方法1 (AO消息) 需要钱包签名，请参考文档配置钱包后使用");
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { getConversationHistory, getMemoryFromPatch, getMemoryFromGateway };
