local json = require("json")

-- Memory Agent (AOS / Lua)
-- Features: Ping healthcheck, save memory, simple search, export snapshot
-- Message model follows AO Cookbook: Tags(Action, ...), Data (string JSON)

MemStore = MemStore or {}   -- [id] => { id, wallet, ts, input, answer, meta }
MemIndex = MemIndex or 0

local function now()
  return tostring(os.time())
end

-- Ping → Pong
Handlers.add(
  "Ping",
  function (msg) return msg.Action == "Ping" end,
  function (msg)
    ao.send({ Target = msg.From, Tags = { Action = "Pong" }, Data = "ok" })
  end
)

-- Save a conversation round
-- Tags: Wallet=<0x...> (optional Topic)
-- Data: JSON { input, answer, topk?, summary? }
Handlers.add(
  "Mem.Save",
  function (msg) return msg.Action == "Mem.Save" end,
  function (msg)
    local wallet = (msg.Tags and msg.Tags.Wallet) or "unknown"
    local ok, obj = pcall(json.decode, msg.Data or "{}")
    if not ok or type(obj) ~= "table" then
      ao.send({ Target = msg.From, Tags = { Action = "Mem.Saved", Ok = "false" }, Data = "bad json" })
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
      Tags = { Action = "Mem.Saved", Ok = "true", Id = tostring(MemIndex) },
      Data = json.encode(rec)
    })
  end
)

-- Simple substring search over input/answer/summary
-- Tags: Query=<text> Optional: Limit=<N>
-- Or Data: JSON { q: string, limit?: number }
Handlers.add(
  "Mem.Search",
  function (msg) return msg.Action == "Mem.Search" end,
  function (msg)
    local q = ""
    local limit = 10
    if msg.Data and #msg.Data > 0 then
      local ok, obj = pcall(json.decode, msg.Data)
      if ok and type(obj) == "table" then
        q = tostring(obj.q or obj.query or "")
        if obj.limit then
          local n = tonumber(obj.limit)
          if n and n > 0 then limit = n end
        end
      end
    end
    if msg.Tags and msg.Tags.Query and (not q or #q == 0) then
      q = tostring(msg.Tags.Query)
    end
    if msg.Tags and msg.Tags.Limit then
      local n = tonumber(msg.Tags.Limit)
      if n and n > 0 then limit = n end
    end

    local matches = {}
    local total = 0
    if q and #q > 0 then
      for id, rec in pairs(MemStore) do
        local hay = (rec.input or "") .. "\n" .. (rec.answer or "") .. "\n" .. (rec.meta and rec.meta.summary or "")
        if string.find(string.lower(hay), string.lower(q), 1, true) then
          total = total + 1
          if #matches < limit then table.insert(matches, rec) end
        end
      end
    end

    ao.send({
      Target = msg.From,
      Tags = { Action = "Mem.SearchResult", Total = tostring(total) },
      Data = json.encode({ total = total, matches = matches })
    })
  end
)

-- Export all in-memory snapshot for off-chain encryption + storage
-- Action=Mem.Export → Data: { index, store }
Handlers.add(
  "Mem.Export",
  function (msg) return msg.Action == "Mem.Export" end,
  function (msg)
    ao.send({
      Target = msg.From,
      Tags = { Action = "Mem.Snapshot", Count = tostring(MemIndex) },
      Data = json.encode({ index = MemIndex, store = MemStore })
    })
  end
)

