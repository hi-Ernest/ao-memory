local json = require("json")

-- Backend AO Process Logic (Core Flow from section 2.5)

CurrentReference = CurrentReference or 0 -- Initialize or use existing reference counter
Tasks = Tasks or {}                      -- Your process's state where results are stored
Balances = Balances or "0"               -- Store balance information for each reference
GlobalMemory = GlobalMemory or
    {}                                   -- Store conversation history for each user: GlobalMemory[user_id] = [{Human: xxx, AI: xxx, timestamp: xxx}]

APUS_ROUTER = "TED2PpCVx0KbkQtzEYBo0TRAO-HPJlpCMmUzch9ZL2g"

-- Helper function to manage conversation history
local function addToConversationHistory(user_id, human_text, ai_text)
    if not GlobalMemory[user_id] then
        GlobalMemory[user_id] = {}
    end

    -- Add new conversation entry
    local conversation_entry = {
        Human = human_text or "",
        AI = ai_text or "",
        timestamp = os.time()
    }

    table.insert(GlobalMemory[user_id], conversation_entry)

    -- Keep only the last 1000 conversations
    if #GlobalMemory[user_id] > 1000 then
        table.remove(GlobalMemory[user_id], 1) -- Remove the oldest entry
    end

    -- Sync to Patch API
    Send({
        device = 'patch@1.0',
        cache = {
            memory = GlobalMemory
        }
    })
end

-- Helper function to clear user's conversation history
local function clearUserHistory(user_id)
    GlobalMemory[user_id] = {}
    -- Sync to Patch API
    Send({
        device = 'patch@1.0',
        cache = {
            memory = GlobalMemory
        }
    })
end

-- Handler to listen for prompts from your frontend
Handlers.add(
    "SendInfer",
    Handlers.utils.hasMatchingTag("Action", "Infer"),
    function(msg)
        local reference = msg["X-Reference"] or msg.Reference
        local requestReference = reference
        local user_id = msg.From -- Get user ID from wallet address

        local request = {
            Target = APUS_ROUTER,
            Action = "Infer",
            ["X-Prompt"] = msg.Data,
            ["X-Reference"] = reference
        }
        if msg["X-Session"] then
            request["X-Session"] = msg["X-Session"]
        end
        if msg["X-Options"] then
            request["X-Options"] = msg["X-Options"]
        end

        Tasks[requestReference] = {
            prompt = request["X-Prompt"],
            options = request["X-Options"],
            session = request["X-Session"],
            reference = reference,
            user_id = user_id,
            status = "processing",
            starttime = os.time(),
        }

        -- Record user's question in conversation history
        addToConversationHistory(user_id, msg.Data, nil)

        Send({
            device = 'patch@1.0',
            cache = {
                tasks = Tasks
            }
        })
        ao.send(request)
    end
)

Handlers.add(
    "AcceptResponse",
    Handlers.utils.hasMatchingTag("Action", "Infer-Response"),
    function(msg)
        local reference = msg.Tags["X-Reference"] or ""
        print(msg)

        if msg.Tags["Code"] then
            -- Update task status to failed
            if Tasks[reference] then
                local error_message = msg.Tags["Message"] or "Unknown error"
                Tasks[reference].status = "failed"
                Tasks[reference].error_message = error_message
                Tasks[reference].error_code = msg.Tags["Code"]
                Tasks[reference].endtime = os.time()

                -- Update conversation history with error message for AI response
                local user_id = Tasks[reference].user_id
                if user_id and GlobalMemory[user_id] and #GlobalMemory[user_id] > 0 then
                    GlobalMemory[user_id][#GlobalMemory[user_id]].AI = "Error: " .. error_message
                    -- Sync to Patch API
                    Send({
                        device = 'patch@1.0',
                        cache = {
                            memory = GlobalMemory
                        }
                    })
                end
            end
            Send({
                device = 'patch@1.0',
                cache = {
                    tasks = {
                        [reference] = Tasks[reference] }
                }
            })
            return
        end

        Tasks[reference].response = msg.Data or ""
        Tasks[reference].status = "success"
        Tasks[reference].endtime = os.time()

        -- Update conversation history with AI response
        local user_id = Tasks[reference].user_id
        if user_id and GlobalMemory[user_id] and #GlobalMemory[user_id] > 0 then
            GlobalMemory[user_id][#GlobalMemory[user_id]].AI = msg.Data or ""
            -- Sync to Patch API
            Send({
                device = 'patch@1.0',
                cache = {
                    memory = GlobalMemory
                }
            })
        end

        Send({
            device = 'patch@1.0',
            cache = {
                tasks = {
                    [reference] = Tasks[reference] }
            }
        })
    end
)

Handlers.add(
    "GetInferResponse",
    Handlers.utils.hasMatchingTag("Action", "GetInferResponse"),
    function(msg)
        local reference = msg.Tags["X-Reference"] or ""
        print(Tasks[reference])
        if Tasks[reference] then
            msg.reply({ Data = json.encode(Tasks[reference]) })
        else
            msg.reply({ Data = "Task not found" }) -- if task not found, return error
        end
    end
)

-- Handler to get user's conversation history
Handlers.add(
    "GetConversationHistory",
    Handlers.utils.hasMatchingTag("Action", "GetConversationHistory"),
    function(msg)
        local user_id = msg.From -- Get user ID from sender's wallet address
        local history = GlobalMemory[user_id] or {}

        msg.reply({
            Data = json.encode({
                user_id = user_id,
                conversation_count = #history,
                conversations = history
            })
        })
    end
)

-- Handler to clear user's conversation history
Handlers.add(
    "ClearConversationHistory",
    Handlers.utils.hasMatchingTag("Action", "ClearConversationHistory"),
    function(msg)
        local user_id = msg.From -- Get user ID from sender's wallet address
        clearUserHistory(user_id)

        msg.reply({
            Data = json.encode({
                success = true,
                message = "Conversation history cleared for user: " .. user_id
            })
        })
    end
)

-- Frontend workflow
-- 1. User input a prompt
-- 2. Generate a unique reference ID for the request
-- 3. Send the prompt to the backend
-- 4. Wait for the request ended, show a loading indicator
-- 5. Query the task status by Patch API(this is AO HyperBEAM's API for your process, not APUS service!):
--  `GET /{your_process_id}~process@1.0/now/cache/tasks/{your_process_id}-{reference}/serialize~json@1.0`
-- 6. display the response or error message
-- ```
-- {
--     prompt = "who are you?",
--     status = "success/failed",
--     reference = "123",
--     user_id = "wallet_address",
--     starttime = "1754705621248",
--     endtime = "1754705610148",
--     data = "{"attestation":"","result":"\nI am Gemma, an open-weights AI assistant."}",
--     error_code = "400", // has this field when the request failed
--     error_message = "Invalid request format" // has this field when the request failed
-- }
-- ```
--
-- Conversation History Management:
-- - Each user (identified by wallet address) has their own conversation history
-- - Automatically stores up to 1000 conversations per user (oldest are removed when limit exceeded)
-- - Each conversation entry contains: {Human: "question", AI: "answer", timestamp: unix_timestamp}
--
-- New Handler Actions:
-- 1. GetConversationHistory - Retrieve user's conversation history
--    Action: "GetConversationHistory"
--    Returns: {user_id: "wallet_address", conversation_count: number, conversations: [array]}
--
-- 2. ClearConversationHistory - Clear user's conversation history
--    Action: "ClearConversationHistory"
--    Returns: {success: true, message: "Conversation history cleared for user: wallet_address"}
--
-- Patch API Access:
-- - Conversation history: `GET /{your_process_id}~process@1.0/now/cache/memory/{user_wallet_address}/serialize~json@1.0`
-- - Task status: `GET /{your_process_id}~process@1.0/now/cache/tasks/{your_process_id}-{reference}/serialize~json@1.0`
-- - Credits balance: `GET /{APUS_ROUTER}~process@1.0/now/cache/credits/{your_process_id}/serialize~json@1.0`
--
-- Additional Notes:
-- - Ensure that the `APUS_ROUTER` is correctly set to your APUS service
-- - Ensure your are using YOUR_PROCESS_ID in the frontend API calls
-- - User identification is based on the message sender's wallet address (msg.From)
-- - Conversation history is automatically managed and synced to Patch API cache
