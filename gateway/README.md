Memory Gateway (Node/TypeScript)

Endpoints
- POST `/chat` — body `{ wallet, user_input }`
  - Weaviate Top-K via text2vec-ollama nearText → builds prompt → OpenAI chat → saves to AO (`Mem.Save`) → inserts Memory doc (Weaviate auto-vectorizes).
- POST `/export` — body `{ wallet }`
  - Checks Marketplace (`Export.Check`) → exports snapshot from Memory Agent (`Mem.Export`) → AES-GCM encrypts locally → uploads to Arweave → consumes grant → returns `{ arweave_tx, key_b64 }`.
- GET `/health` — healthcheck.

Env vars
- `OPENAI_API_KEY` — OpenAI API key.
- `OPENAI_MODEL` — default `gpt-4o-mini`.
- `OLLAMA_URL` — default `http://localhost:11434`.
- `WEAVIATE_URL` — default `http://localhost:8080`.
- `WEAVIATE_API_KEY` — optional.
- `AO_WALLET_JSON` — contents of Arweave wallet JSON (also used by aoconnect signer).
- `MEMORY_PROCESS_ID` — PID for `memory_agent.lua`.
- `MARKET_PROCESS_ID` — PID for `marketplace.lua`.
- `PORT` — default `8787`.

Install & run
- `cd gateway && npm install`
- `npm run init:weaviate` — create `Memory` class (vectorizer text2vec-ollama).
- `npm run dev` — start server on `:8787`.

Notes
- Requires Node 18+ (built-in `fetch`).
- Ollama: ensure the Docker compose service is running; Weaviate calls it internally.
- Weaviate: run locally via docker-compose with text2vec-ollama module enabled.
- AO: in `aos` shell `:load ao_process/memory_agent.lua` and `:load ao_process/marketplace.lua` to get PIDs.
- Security: in production, avoid returning `key_b64` directly; deliver decryption in a controlled page or via your KMS.
