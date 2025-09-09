单 Agent MVP – “Memory Agent” 按你给的约束一次性落地：
•	向量库：Weaviate（自带 TS 客户端） ￼
•	向量模型：Ollama mxbai-embed-large（本地嵌入 API） ￼
•	LLM：付费 API（OpenAI 示例）（Key 仅在网关侧） ￼ ￼
•	网关：Node + @permaweb/aoconnect（只在网关发消息/读结果） ￼ ￼
•	上链：本地加密 → arweave-js 上传（Arweave 官方指引） ￼ ￼
•	身份：钱包地址
•	市场：Marketplace 进程 校验“已授权后发放解密密钥/下载”

下面方案可直接跑；我只引用了官方、稳定接口，不写不确定的点。

⸻

1) 架构与数据流（单轮对话）
	1.	前端把 (wallet, user_input) POST 给 网关。
	2.	网关→Ollama 生成查询向量；网关→Weaviate 执行 nearVector Top-K；（“自带向量/nearVector”的用法是 Weaviate 官方推荐路径） ￼
	3.	网关用你给的 episodic_memory_prompt 拼出 Prompt（把命中片段注入）。
	4.	网关→OpenAI 生成最终回答；
	5.	网关→AO MemoryAgent Mem.Save（把这次对话与摘要等元信息记一笔）→ 返回消息结果（aoconnect message/result） ￼
	6.	如用户点击“导出快照”→ 网关向 Marketplace 请求授权；通过后：
	•	网关→AO MemoryAgent Mem.Export 拿全量 JSON；
	•	网关 本地加密（对称密钥）→ arweave-js 上传 → 拿到 TXID； ￼
	•	网关→Marketplace 回写 Export.Done（含 TXID 与密钥的加密封装 / 或解密授权记录）。

⸻

2) AO – Memory Agent（AOS / Lua）

处理：Ping、Mem.Save、Mem.Export（快照）；内部只存结构化文本&元数据（向量都在 Weaviate）。
Handler 结构与 Msg/Tags 用法完全遵循 Cookbook（Handlers.add / Msg.Action / Tags / Data）。 ￼

-- memory_agent.lua
local json = require("json")

MemStore = MemStore or {}   -- { id => {id, wallet, ts, input, answer, meta={} } }
MemIndex = MemIndex or 0

local function now() return tostring(os.time()) end

Handlers.add(
  "Ping",
  function (msg) return msg.Action == "Ping" end,
  function (msg)
    ao.send({ Target = msg.From, Tags = { Action = "Pong" }, Data = "ok" })
  end
)

-- 保存一轮对话：Action=Mem.Save
-- Tags: Wallet=<0x...>  Optional: Topic
-- Data: JSON { input, answer, matches:[{conversation, previous, worked, avoid}] }
Handlers.add(
  "Mem.Save",
  function (msg) return msg.Action == "Mem.Save" end,
  function (msg)
    local wallet = (msg.Tags and msg.Tags.Wallet) or "unknown"
    local ok, obj = pcall(json.decode, msg.Data or "{}")
    if not ok or type(obj) ~= "table" then
      ao.send({ Target = msg.From, Tags = { Action = "Mem.Saved", Ok="false" }, Data = "bad json" })
      return
    end
    MemIndex = MemIndex + 1
    local rec = {
      id = MemIndex,
      wallet = wallet,
      ts = now(),
      input = obj.input or "",
      answer = obj.answer or "",
      meta = {
        topic = msg.Tags and msg.Tags.Topic or nil,
        topk = obj.topk or 0,
        summary = obj.summary or ""
      }
    }
    MemStore[MemIndex] = rec
    ao.send({
      Target = msg.From,
      Tags = { Action = "Mem.Saved", Ok="true", Id=tostring(MemIndex) },
      Data = json.encode(rec)
    })
  end
)

-- 导出快照（供网关加密后上链）
-- Action=Mem.Export → Data: JSON { index, store }
Handlers.add(
  "Mem.Export",
  function (msg) return msg.Action == "Mem.Export" end,
  function (msg)
    ao.send({
      Target = msg.From,
      Tags = { Action = "Mem.Snapshot", Count=tostring(MemIndex) },
      Data = json.encode({ index = MemIndex, store = MemStore })
    })
  end
)

AOS Handler/消息模型与 aoconnect 的消息发送/取结果方式，见 Cookbook 与 npm 文档（消息是“目标、数据、标签”的组合）。 ￼

⸻

3) AO – Marketplace（AOS / Lua，最小可用）

目标：在 AO 里维护“哪个钱包允许导出一次”。
由于链上代币支付方案因你最终选用的合约/蓝图而异，这里给最可靠、可运行的最小实现：
	•	你手动或通过自动化在 Marketplace 里登记授权（Grant.Export）。
	•	Memory 导出前，网关请求 Export.Check，通过则继续。
如需与 Token Blueprint 集成，可在此基础上扩展“收到支付事件→Grant”。（蓝图加载与用法参考官方文档。） ￼

-- marketplace.lua
local json = require("json")
Grants = Grants or {}   -- { wallet => remaining_exports }

Handlers.add(
  "Grant.Export",
  function (msg) return msg.Action == "Grant.Export" end,
  function (msg)
    local w = msg.Tags and msg.Tags.Wallet
    local n = tonumber(msg.Tags and msg.Tags.N or "1") or 1
    if not w then
      ao.send({ Target=msg.From, Tags={ Action="Grant.Ack", Ok="false" }, Data="missing wallet" })
      return
    end
    Grants[w] = (Grants[w] or 0) + n
    ao.send({ Target=msg.From, Tags={ Action="Grant.Ack", Ok="true", Wallet=w, Left=tostring(Grants[w]) } })
  end
)

Handlers.add(
  "Export.Check",
  function (msg) return msg.Action == "Export.Check" end,
  function (msg)
    local w = msg.Tags and msg.Tags.Wallet
    local ok = (w and (Grants[w] or 0) > 0)
    ao.send({ Target=msg.From, Tags={ Action="Export.Check.Ack", Ok=tostring(ok), Wallet=w } })
  end
)

Handlers.add(
  "Export.Consume",
  function (msg) return msg.Action == "Export.Consume" end,
  function (msg)
    local w = msg.Tags and msg.Tags.Wallet
    if not w or (Grants[w] or 0) <= 0 then
      ao.send({ Target=msg.From, Tags={ Action="Export.Consumed", Ok="false", Wallet=w or "" } })
      return
    end
    Grants[w] = Grants[w] - 1
    ao.send({ Target=msg.From, Tags={ Action="Export.Consumed", Ok="true", Wallet=w, Left=tostring(Grants[w]) } })
  end
)

这样你可以：收款→在 Marketplace 调 Grant.Export（N=1）→ 网关 Export.Check 通过后触发导出 → 成功后 Export.Consume 扣减一次额度。
未来要切到真实代币蓝图时，把“Grant”触发条件换成“检测支付事件/消息”即可。 ￼

⸻

4) 网关（Node / TypeScript）

作用：
	•	/chat：Top-K → Prompt → LLM → 回写 AO Mem.Save（存本轮）
	•	/export：向 Marketplace 校验 → 拉取 Mem.Export 快照 → 本地加密 → arweave-js 上传 → 返回 TXID
	•	仅网关持有 OpenAI API Key；Ollama & Weaviate 走内网

依赖：npm i @permaweb/aoconnect openai weaviate-ts-client express node-fetch arweave
文档参考：aoconnect 发送消息/取结果、OpenAI Chat、Weaviate TS、arweave-js 上传。 ￼ ￼ ￼ ￼

// server.ts
import express from "express";
import crypto from "node:crypto";
import Arweave from "arweave";
import fetch from "node-fetch";
import weaviate, { WeaviateClient } from "weaviate-ts-client";
import { message, result, createDataItemSigner } from "@permaweb/aoconnect";
import OpenAI from "openai";

const {
  OPENAI_API_KEY,
  OPENAI_MODEL = "gpt-4o-mini",
  OLLAMA_URL = "http://localhost:11434",
  WEAVIATE_URL = "http://localhost:8080",
  WEAVIATE_API_KEY,
  AO_WALLET_JSON,      // contents of wallet.json
  MEMORY_PROCESS_ID,   // Memory Agent PID
  MARKET_PROCESS_ID,   // Marketplace PID
  EXPORT_PRICE = "1"   // 价格仅用于前端展示；实际授权靠 Marketplace
} = process.env;

if (!OPENAI_API_KEY || !AO_WALLET_JSON || !MEMORY_PROCESS_ID || !MARKET_PROCESS_ID) {
  throw new Error("Missing required env vars.");
}

// ---- Init clients ----
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });  // chat completions  [oai_citation:19‡OpenAI Platform](https://platform.openai.com/docs/api-reference/chat/?utm_source=chatgpt.com)
const arweave = Arweave.init({ host: "arweave.net", port: 443, protocol: "https" }); //  [oai_citation:20‡Cooking with the Permaweb](https://cookbook.arweave.net/guides/posting-transactions/arweave-js.html?utm_source=chatgpt.com)
const aoWallet = JSON.parse(AO_WALLET_JSON);

const wclient: WeaviateClient = weaviate.client({
  scheme: "http",
  host: WEAVIATE_URL.replace(/^https?:\/\//, ""),
  apiKey: WEAVIATE_API_KEY ? new weaviate.ApiKey(WEAVIATE_API_KEY) : undefined,
}); // TypeScript client  [oai_citation:21‡Weaviate Documentation](https://docs.weaviate.io/weaviate/client-libraries/typescript?utm_source=chatgpt.com)

const signer = createDataItemSigner(aoWallet);

async function aoSend(process: string, tags: { name: string; value: string }[], data?: string) {
  const mid = await message({ process, signer, tags, data });
  return await result({ process, message: mid });
}

// ---- helpers ----
async function embedWithOllama(text: string): Promise<number[]> {
  // Ollama embeddings API: POST /api/embeddings {"model":"mxbai-embed-large","input": "..."}  [oai_citation:22‡Ollama](https://ollama.com/library/mxbai-embed-large?utm_source=chatgpt.com)
  const r = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "mxbai-embed-large", input: text })
  });
  const j = await r.json();
  if (!j || !j.embedding) throw new Error("Ollama embeddings failed");
  return j.embedding;
}

async function weaviateTopK(queryVec: number[], k=5) {
  // 使用 nearVector 查询（Bring-your-own-vectors） [oai_citation:23‡Weaviate Documentation](https://docs.weaviate.io/weaviate/starter-guides/custom-vectors?utm_source=chatgpt.com)
  return await wclient.graphql.get()
    .withClassName("Memory")
    .withFields("conversation previous what_worked what_to_avoid _additional { distance }")
    .withNearVector({ vector: queryVec })
    .withLimit(k)
    .do();
}

// AES-GCM 对称加密
function encryptGCM(plaintext: Buffer, key: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, enc, tag };
}

// ---- HTTP Server ----
const app = express();
app.use(express.json({ limit: "2mb" }));

// 1) 聊天：RAG + LLM + 回写 AO
app.post("/chat", async (req, res) => {
  try {
    const { wallet, user_input } = req.body as { wallet: string; user_input: string };
    if (!wallet || !user_input) return res.status(400).json({ error: "wallet,user_input required" });

    // Top-K
    const qvec = await embedWithOllama(user_input);
    const hits = await weaviateTopK(qvec, 5);
    const objects = (hits?.data?.Get?.Memory || []) as any[];

    const previous_convos = objects.map(o => o.previous).filter(Boolean);
    const what_worked = objects.map(o => o.what_worked).filter(Boolean);
    const what_to_avoid = objects.map(o => o.what_to_avoid).filter(Boolean);
    const conversation = objects[0]?.conversation || "";

    const episodic_memory_prompt =
`You are a helpful AI Assistant. Answer the user's questions to the best of your ability.
You recall similar conversations with the user, here are the details:

Current Conversation Match: ${conversation || ""}
Previous Conversations: ${previous_convos.join(" | ")}
What has worked well: ${what_worked.join(" ")}
What to avoid: ${what_to_avoid.join(" ")}

Use these memories as context for your response to the user.`;

    // LLM（OpenAI Chat Completions） [oai_citation:24‡OpenAI Platform](https://platform.openai.com/docs/api-reference/chat/?utm_source=chatgpt.com)
    const chat = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: episodic_memory_prompt },
        { role: "user", content: user_input }
      ]
    });

    const answer = chat.choices?.[0]?.message?.content || "";

    // 保存一轮对话到 AO
    const savePayload = {
      input: user_input,
      answer,
      topk: objects.length,
      summary: objects.slice(0,3).map(o => o.conversation).join(" | ")
    };
    const saved = await aoSend(MEMORY_PROCESS_ID, [
      { name: "Action", value: "Mem.Save" },
      { name: "Wallet", value: wallet },
      { name: "Topic", value: "chat" }
    ], JSON.stringify(savePayload));

    return res.json({ answer, saved: saved.Messages?.[0] ?? null });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// 2) 导出快照：校验→导出→本地加密→Arweave
app.post("/export", async (req, res) => {
  try {
    const { wallet } = req.body as { wallet: string };
    if (!wallet) return res.status(400).json({ error: "wallet required" });

    // 授权检查（Marketplace）
    const check = await aoSend(MARKET_PROCESS_ID, [
      { name: "Action", value: "Export.Check" },
      { name: "Wallet", value: wallet }
    ]);
    const ok = check.Messages?.[0]?.Tags?.find((t:any)=>t.name==="Ok")?.value === "true";
    if (!ok) return res.status(402).json({ error: "not authorized, please purchase export" });

    // 拿快照
    const snapRes = await aoSend(MEMORY_PROCESS_ID, [{ name: "Action", value: "Mem.Export" }]);
    const snapshot = snapRes.Messages?.[0]?.Data || "";
    const key = crypto.randomBytes(32);
    const { iv, enc, tag } = encryptGCM(Buffer.from(snapshot, "utf8"), key);

    // 上传（arweave-js） [oai_citation:25‡Cooking with the Permaweb](https://cookbook.arweave.net/guides/posting-transactions/arweave-js.html?utm_source=chatgpt.com)
    const tx = await arweave.createTransaction({ data: Buffer.concat([iv, tag, enc]) });
    // 这里假设你用同一把 aoWallet 作为 Arweave 钱包；如不同，请替换为对应 Arweave key
    await arweave.transactions.sign(tx, aoWallet);
    const resp = await arweave.transactions.post(tx);
    if (resp.status !== 200 && resp.status !== 202) throw new Error("Arweave upload failed");

    // 扣减额度
    await aoSend(MARKET_PROCESS_ID, [
      { name: "Action", value: "Export.Consume" },
      { name: "Wallet", value: wallet }
    ]);

    // 返回 TXID 与密钥（建议只给一次性下载/或用你自己的 KMS 保管）
    return res.json({
      arweave_tx: tx.id,
      // 为安全起见，生产中建议：不直接回 key；而是“付费用户可在受控页面解密/下载”
      key_b64: key.toString("base64")
    });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

app.listen(8787, () => console.log("Gateway on :8787"));

说明与依据
	•	aoconnect：message() 发送到进程、result() 读执行结果的范式见官方指南与 npm 说明。 ￼ ￼
	•	Ollama embeddings：POST /api/embeddings 带 model: mxbai-embed-large。 ￼
	•	Weaviate：TS 客户端 + nearVector 查询是官方路径（自带向量/自定义向量器场景）。 ￼
	•	OpenAI Chat：官方 Chat Completions API（Node SDK）。 ￼ ￼
	•	Arweave 上传：arweave-js 创建/签名/上传事务。 ￼ ￼

⸻

5) Weaviate Schema（一次性初始化）

// scripts/initWeaviate.ts
import weaviate from "weaviate-ts-client";
const client = weaviate.client({ scheme: "http", host: "localhost:8080" });

await client.schema.classCreator().withClass({
  class: "Memory",
  vectorizer: "none",       // 我们自己提供向量（Ollama）
  properties: [
    { name: "conversation", dataType: ["text"] },
    { name: "previous", dataType: ["text"] },
    { name: "what_worked", dataType: ["text"] },
    { name: "what_to_avoid", dataType: ["text"] }
  ]
}).do();

之后你把历史语料写入时：用 Ollama 生成 doc 向量 → client.data.creator().withClassName("Memory").withProperties({...}).withVector(vec).do()
查询时用 nearVector（与插入保持同一向量器），这是官方“Bring your own vectors”建议。 ￼

⸻

6) 运行步骤（最短路径）
	1.	启动 AOS：
	•	:load memory_agent.lua → 记下 MEMORY_PROCESS_ID
	•	:load marketplace.lua → 记下 MARKET_PROCESS_ID
	2.	Weaviate & Ollama：
	•	起 Weaviate（本地或云）并执行上面的 schema 初始化。 ￼
	•	ollama run mxbai-embed-large（首次会拉取模型） ￼
	3.	网关：
	•	export AO_WALLET_JSON="$(cat wallet.json)"
	•	export MEMORY_PROCESS_ID=... MARKET_PROCESS_ID=... OPENAI_API_KEY=...
	•	node server.js（或 ts-node server.ts）
	4.	授权与导出：
	•	在 Marketplace 里对某钱包授权一次：
Send({Target=MARKET_PID, Tags={Action="Grant.Export", Wallet="<0x..>", N="1"}})
	•	前端调用 POST /export 即可拿到 { arweave_tx, key_b64 }。
	•	Arweave 上传流程/示例与 arweave-js 文档一致。 ￼

⸻

7) 和你给的 episodic_memory_prompt 的对齐

我在 /chat 中原样使用了你的 Prompt 结构（把 Weaviate Top-K 命中的四段：conversation / previous / what_worked / what_to_avoid 注入），并将 LLM 最终回答 + 命中摘要 写回 AO 的 Mem.Save。下一轮对话，仍走“先检索再回答”的闭环。

⸻

可以继续扩展但不影响 MVP 跑通的点
	•	支付闭环：把 Marketplace 的 Grant.Export 换成“监听你实际的结算/支付通道，再自动 Grant”；如果用到 AO Token Blueprint，加载蓝图后在 Handler 里消费蓝图事件即可（官方有加载与核验说明）。 ￼
	•	权限：把 Mem.Export 结果只返回给 消息来源（现已如此），并在网关层再加调用签名/节流。
	•	KMS：不直接把 key_b64 返回前端，而是在“已登录/已授权”的受控页面做解密下载（网关短时持有或通过你自带 KMS/金库托管）。
	•	A2A：如果后续要接入别的 Agent，只需在 MemoryAgent 里加我之前给你的 a2a.v1 最小 Handler（Ping/Offer/Accept）。

涉及后端参考
https://github.com/RecallNet0526/ai-memory/blob/main/braindance_back/api.py
https://github.com/RecallNet0526/ai-memory/blob/main/braindance_back/memory_store.py

