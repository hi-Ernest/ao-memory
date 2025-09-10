local json = require("json")

-- Backend AO Process Logic (Core Flow from section 2.5)

CurrentReference = CurrentReference or 0          -- Initialize or use existing reference counter
Tasks = Tasks or {}                               -- Your process's state where results are stored
Balances = Balances or "0"
Talks = Talks or {}                               -- Store balance information for each reference
ConversationMemories = ConversationMemories or {} -- Store conversation memories

APUS_ROUTER = "TED2PpCVx0KbkQtzEYBo0TRAO-HPJlpCMmUzch9ZL2g"

Handlers.add(
    "SaveTalk",
    Handlers.utils.hasMatchingTag("Action", "SaveTalk"),
    function(msg)
        if not msg.Talk or msg.Talk == "" then
            msg.reply({ Error = "Talk cannot be empty" })
            return
        end

        local talk = {
            id = #Talks + 1,
            talk = msg.Talk,
            task = msg.Task,
            creator = msg.From,
            timestamp = msg.Timestamp,
        }
        table.insert(Talks, talk)

        -- 回复成功
        msg.reply({
            Action = "SaveTalked",
            TalkId = talk.id,
            Data = json.encode(talk)
        })
    end
)

-- Handler to save conversation memories
Handlers.add(
    "SaveConversationMemory",
    Handlers.utils.hasMatchingTag("Action", "SaveConversationMemory"),
    function(msg)
        if not msg.Data or msg.Data == "" then
            msg.reply({ Error = "Memory data cannot be empty" })
            return
        end

        local memoryData = json.decode(msg.Data)
        if not memoryData then
            msg.reply({ Error = "Invalid memory data format" })
            return
        end

        -- Validate required fields
        if not memoryData.title or memoryData.title == "" then
            msg.reply({ Error = "Memory title is required" })
            return
        end

        if not memoryData.conversationData or #memoryData.conversationData == 0 then
            msg.reply({ Error = "Conversation data is required" })
            return
        end

        -- Create memory record
        local memory = {
            id = memoryData.id or ("memory_" .. #ConversationMemories + 1),
            title = memoryData.title,
            description = memoryData.description or "",
            theme = memoryData.theme or "ai-assistant",
            tags = memoryData.tags or {},
            price = memoryData.price or 0,
            isPublic = memoryData.isPublic or false,
            walletAddress = memoryData.walletAddress or msg.From,
            conversationData = memoryData.conversationData,
            summary = memoryData.summary or "",
            createdAt = memoryData.createdAt or os.date("!%Y-%m-%dT%H:%M:%SZ"),
            updatedAt = memoryData.updatedAt or os.date("!%Y-%m-%dT%H:%M:%SZ"),
            creator = msg.From,
            timestamp = msg.Timestamp
        }

        -- Save to memories table
        table.insert(ConversationMemories, memory)

        -- Reply with success
        msg.reply({
            Action = "ConversationMemorySaved",
            MemoryId = memory.id,
            IsPublic = memory.isPublic,
            Data = json.encode({
                id = memory.id,
                title = memory.title,
                isPublic = memory.isPublic,
                price = memory.price,
                createdAt = memory.createdAt
            })
        })
    end
)

-- Handler to get user's conversation memories
Handlers.add(
    "GetConversationMemories",
    Handlers.utils.hasMatchingTag("Action", "GetConversationMemories"),
    function(msg)
        local walletAddress = msg.Tags.WalletAddress or msg.From
        local userMemories = {}

        -- Filter memories by wallet address
        for _, memory in ipairs(ConversationMemories) do
            if memory.walletAddress == walletAddress then
                table.insert(userMemories, {
                    id = memory.id,
                    title = memory.title,
                    description = memory.description,
                    theme = memory.theme,
                    tags = memory.tags,
                    price = memory.price,
                    isPublic = memory.isPublic,
                    summary = memory.summary,
                    createdAt = memory.createdAt,
                    updatedAt = memory.updatedAt,
                    conversationCount = #memory.conversationData
                })
            end
        end

        msg.reply({
            Action = "ConversationMemoriesResponse",
            Count = #userMemories,
            Data = json.encode(userMemories)
        })
    end
)

-- Handler to get public conversation memories for marketplace
Handlers.add(
    "GetPublicMemories",
    Handlers.utils.hasMatchingTag("Action", "GetPublicMemories"),
    function(msg)
        local publicMemories = {}

        -- Filter only public memories
        for _, memory in ipairs(ConversationMemories) do
            if memory.isPublic then
                table.insert(publicMemories, {
                    id = memory.id,
                    title = memory.title,
                    description = memory.description,
                    theme = memory.theme,
                    tags = memory.tags,
                    price = memory.price,
                    summary = memory.summary,
                    createdAt = memory.createdAt,
                    conversationCount = #memory.conversationData,
                    author = memory.walletAddress,
                    rating = 4.5, -- Default rating, can be enhanced later
                    downloads = 0 -- Can be tracked separately
                })
            end
        end

        msg.reply({
            Action = "PublicMemoriesResponse",
            Count = #publicMemories,
            Data = json.encode(publicMemories)
        })
    end
)

-- Handler to get specific memory details
Handlers.add(
    "GetMemoryDetails",
    Handlers.utils.hasMatchingTag("Action", "GetMemoryDetails"),
    function(msg)
        local memoryId = msg.Tags.MemoryId
        if not memoryId then
            msg.reply({ Error = "MemoryId is required" })
            return
        end

        local memory = nil
        for _, mem in ipairs(ConversationMemories) do
            if mem.id == memoryId then
                memory = mem
                break
            end
        end

        if not memory then
            msg.reply({ Error = "Memory not found" })
            return
        end

        -- Check if requester can access this memory
        local canAccess = memory.isPublic or memory.walletAddress == msg.From

        if not canAccess then
            msg.reply({ Error = "Access denied to private memory" })
            return
        end

        msg.reply({
            Action = "MemoryDetailsResponse",
            Data = json.encode(memory)
        })
    end
)


-- Handler to listen for prompts from your frontend
Handlers.add(
    "SendInfer",
    Handlers.utils.hasMatchingTag("Action", "Infer"),
    function(msg)
        local reference = msg["X-Reference"] or msg.Reference
        local requestReference = reference
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
            status = "processing",
            starttime = os.time(),
        }
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
--     starttime = "1754705621248",
--     endtime = "1754705610148",
--     data = "{"attestation":"","result":"\nI am Gemma, an open-weights AI assistant."}",
--     error_code = "400", // has this field when the request failed
--     error_message = "Invalid request format" // has this field when the request failed
-- }
-- ```
--
-- Additional Notes:
-- - Ensure that the `APUS_ROUTER` is correctly set to your APUS service
-- - Ensure your are useing YOUR_PROCESS_ID in the frontend API calls
-- - You can check CREDITS BALANCE by querying the APUS_ROUTER Patch API
--  `GET /{APUS_ROUTER}~process@1.0/now/cache/credits/{your_process_id}/serialize~json@1.0`
-- http://72.46.85.207:8734/D0na6AspYVzZnZNa7lQHnBt_J92EldK_oFtEPLjIexo~process@1.0/now/cache/credits/sNWrdfUcR9kBpRPPPnJKFlel4j_z2rJ89PStNXITMto/serialize~json@1.0
