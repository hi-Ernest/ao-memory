#!/usr/bin/env node

// 测试环境变量和前端页面的脚本
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

console.log("🚀 开始环境检测...\n");

// 1. 检测环境变量
console.log("=== 环境变量检测 ===");
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "AO_WALLET_JSON",
  "MEMORY_PROCESS_ID",
  "MARKET_PROCESS_ID",
];

const optionalEnvVars = ["OLLAMA_URL", "WEAVIATE_URL", "PORT"];

console.log("📋 必需环境变量:");
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  const status = value ? "✅" : "❌";
  const display = value
    ? varName === "OPENAI_API_KEY"
      ? `${value.substring(0, 8)}...`
      : varName === "AO_WALLET_JSON"
      ? "JSON已配置"
      : value
    : "未配置";
  console.log(`  ${status} ${varName}: ${display}`);
});

console.log("\n📋 可选环境变量:");
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  const status = value ? "✅" : "⚠️";
  console.log(`  ${status} ${varName}: ${value || "使用默认值"}`);
});

// 2. 测试前端页面
console.log("\n=== 前端页面检测 ===");

async function testFrontend() {
  try {
    console.log("🌐 测试 http://localhost:5173/ ...");

    const response = await fetch("http://localhost:5173/");

    if (response.ok) {
      const html = await response.text();
      console.log("✅ 前端页面响应正常");
      console.log(`📊 状态码: ${response.status}`);
      console.log(`📄 页面大小: ${html.length} 字符`);

      // 检查关键元素
      const hasRoot = html.includes('id="root"');
      const hasVite = html.includes("@vite/client");
      const hasTitle = html.includes("<title>");

      console.log("\n📋 页面结构检查:");
      console.log(`  ${hasRoot ? "✅" : "❌"} Root元素存在`);
      console.log(`  ${hasVite ? "✅" : "❌"} Vite客户端脚本存在`);
      console.log(`  ${hasTitle ? "✅" : "❌"} 页面标题存在`);
    } else {
      console.log(`❌ 前端页面响应异常: ${response.status}`);
    }
  } catch (error) {
    console.log("❌ 前端页面无法访问:", error.message);
    console.log('💡 请运行 "npm run dev" 启动前端服务');
  }
}

// 3. 测试Gateway API
console.log("\n=== Gateway API检测 ===");

async function testGateway() {
  try {
    console.log("🌐 测试 http://localhost:8787/health ...");

    const response = await fetch("http://localhost:8787/health");

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Gateway API响应正常");
      console.log(`📊 状态码: ${response.status}`);
      console.log(`📄 响应数据:`, data);
    } else {
      console.log(`❌ Gateway API响应异常: ${response.status}`);
    }
  } catch (error) {
    console.log("❌ Gateway API无法访问:", error.message);
    console.log("💡 请检查Gateway服务是否启动");
  }
}

// 运行所有测试
async function runAllTests() {
  await testFrontend();
  await testGateway();

  console.log("\n=== 总结 ===");
  console.log("✅ 环境变量检测完成");
  console.log("✅ 前端页面检测完成");
  console.log("✅ Gateway API检测完成");
  console.log(
    "\n💡 如果前端页面显示空白，请检查浏览器开发者工具的Console和Network选项卡"
  );
}

runAllTests().catch(console.error);
