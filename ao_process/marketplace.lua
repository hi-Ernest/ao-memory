local json = require("json")

-- Minimal Marketplace (AOS / Lua)
-- Purpose: track per-wallet export grants for Memory export

Grants = Grants or {}   -- { wallet => remaining_exports }

-- Grant export quota: Action=Grant.Export, Tags: Wallet=<addr>, N=<int default 1>
Handlers.add(
  "Grant.Export",
  function (msg) return msg.Action == "Grant.Export" end,
  function (msg)
    local w = msg.Tags and msg.Tags.Wallet
    local n = tonumber(msg.Tags and msg.Tags.N or "1") or 1
    if not w or #w == 0 then
      ao.send({ Target = msg.From, Tags = { Action = "Grant.Ack", Ok = "false" }, Data = "missing wallet" })
      return
    end
    Grants[w] = (Grants[w] or 0) + n
    ao.send({ Target = msg.From, Tags = { Action = "Grant.Ack", Ok = "true", Wallet = w, Left = tostring(Grants[w]) } })
  end
)

-- Check export eligibility: Action=Export.Check, Tags: Wallet=<addr>
Handlers.add(
  "Export.Check",
  function (msg) return msg.Action == "Export.Check" end,
  function (msg)
    local w = msg.Tags and msg.Tags.Wallet
    local ok = (w and (Grants[w] or 0) > 0) and "true" or "false"
    ao.send({ Target = msg.From, Tags = { Action = "Export.Check.Ack", Ok = ok, Wallet = w or "" } })
  end
)

-- Consume one export grant: Action=Export.Consume, Tags: Wallet=<addr>
Handlers.add(
  "Export.Consume",
  function (msg) return msg.Action == "Export.Consume" end,
  function (msg)
    local w = msg.Tags and msg.Tags.Wallet
    if not w or (Grants[w] or 0) <= 0 then
      ao.send({ Target = msg.From, Tags = { Action = "Export.Consumed", Ok = "false", Wallet = w or "" } })
      return
    end
    Grants[w] = Grants[w] - 1
    ao.send({ Target = msg.From, Tags = { Action = "Export.Consumed", Ok = "true", Wallet = w, Left = tostring(Grants[w]) } })
  end
)

