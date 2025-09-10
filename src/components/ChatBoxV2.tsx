import React, { useState, useRef, useEffect } from "react";
import { message as antdMessage } from "antd";
import { config } from "../config";
import { message as aoMessage, createDataItemSigner } from '@permaweb/aoconnect';
import { useWallet } from "../contexts/WalletContext";
import SaveMemoryModal from "./SaveMemoryModal";
import type { ConversationMemory, ChatMessage } from '../types/memory';

interface ChatItem {
  role: "user" | "assistant" | "tip";
  message: string;
  timestamp: number;
}

interface ChatBoxV2Props {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  chatHistory?: ChatItem[];
  setChatHistory?: React.Dispatch<React.SetStateAction<ChatItem[]>>;
}

const DEFAULT_CHAT: ChatItem[] = [
  {
    role: "tip",
    message: "> MEMORY AI SYSTEM READY\n> ENHANCED MEMORY PROCESSING INITIALIZED\n> CONNECT YOUR WALLET TO START CHATTING WITH MEMO:",
    timestamp: Date.now(),
  },
];

// use ao processId
const processId = config.aoProcessId;

const ChatBoxV2: React.FC<ChatBoxV2Props> = ({ 
  onToggleFullscreen, 
  isFullscreen,
  chatHistory: externalChatHistory,
  setChatHistory: externalSetChatHistory
}) => {
  const { checkLogin, activeAddress } = useWallet();
  // 使用外部传入的状态，如果没有则使用内部状态作为回退
  const [internalChatHistory, setInternalChatHistory] = useState<ChatItem[]>(DEFAULT_CHAT);
  const chatHistory = externalChatHistory || internalChatHistory;
  const setChatHistory = externalSetChatHistory || setInternalChatHistory;
  
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  
  // use browser wallet signer
  const signer = createDataItemSigner((window as any).arweaveWallet);

  const handleSaveMemory = async () => {
    if (!checkLogin()) return;
    
    // 检查是否有有效的对话内容
    const validMessages = chatHistory.filter(msg => msg.role !== "tip");
    if (validMessages.length < 2) {
      antdMessage.warning("Need at least one conversation to save as memory");
      return;
    }
    
    // 打开保存记忆的弹出窗口
    setShowSaveModal(true);
  };

  // 实际保存记忆到 AO Process
  const handleSaveMemoryToAO = async (memoryData: Partial<ConversationMemory>) => {
    setSavingMemory(true);
    try {
      // 获取用户钱包地址
      const wallet = await (window as any).arweaveWallet.getActiveAddress();
      
      // 生成唯一ID
      const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 准备发送到 AO Process 的数据
      const aoMemoryData = {
        ...memoryData,
        id: memoryId,
        walletAddress: wallet
      };

      // 发送到 AO Process
      await aoMessage({
        process: processId,
        tags: [
          { name: "Action", value: "SaveConversationMemory" },
          { name: "MemoryId", value: memoryId },
          { name: "WalletAddress", value: wallet }
        ],
        signer: signer,
        data: JSON.stringify(aoMemoryData)
      });

      antdMessage.success(`Memory "${memoryData.title}" saved successfully!`);
      
      // 如果是公开的，提示用户可以在marketplace查看
      if (memoryData.isPublic) {
        antdMessage.info("Your memory will be available in the marketplace for others to discover!");
      }
      
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to save memory";
      console.error('Save memory error:', e);
      antdMessage.error(`Save memory failed: ${errorMessage}`);
      throw e;
    } finally {
      setSavingMemory(false);
    }
  };


  // Auto-scroll to bottom when chatHistory changes
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Update system message when wallet connection changes
  useEffect(() => {
    const isConnected = !!activeAddress;
    const currentSystemMessage = chatHistory.find(item => item.role === "tip");
    
    if (currentSystemMessage) {
      const newMessage = isConnected 
        ? "> MEMORY AI SYSTEM READY\n> WALLET CONNECTED\n> ENTER YOUR MEMORY-RELATED QUERY BELOW:"
        : "> MEMORY AI SYSTEM READY\n> ENHANCED MEMORY PROCESSING INITIALIZED\n> CONNECT YOUR WALLET TO START CHATTING WITH MEMO:";
      
      if (currentSystemMessage.message !== newMessage) {
        setChatHistory(prev => prev.map((item, idx) => 
          idx === 0 && item.role === "tip" 
            ? { ...item, message: newMessage, timestamp: Date.now() }
            : item
        ));
      }
    }
  }, [activeAddress, chatHistory, setChatHistory]);


  const handleSend = async () => {
    // 首先验证钱包登录
    if (!checkLogin()) {
      antdMessage.warning("Please connect your wallet first");
      return;
    }

    if (!prompt.trim()) {
      antdMessage.warning("Please enter a message");
      return;
    }

    setLoading(true);
    
    // Add user message to chat
    setChatHistory((prev) => [
      ...prev,
      { role: "user", message: prompt, timestamp: Date.now() },
      { role: "tip", message: "Processing your memory query...", timestamp: Date.now() },
    ]);
    
    const currentPrompt = prompt;
    setPrompt("");

    try {
      // Prepare conversation history for context
      const conversationHistory = chatHistory
        .filter(item => item.role !== "tip")
        .slice(-6) // Last 6 messages for context
        .map(item => ({
          role: item.role === "user" ? "user" : "assistant",
          content: item.message
        }));

      // Call gateway API
      const response = await fetch(`${config.gatewayApiUrl}/api/simple-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentPrompt,
          conversation_history: conversationHistory
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.success && result.response) {
        // Update chat history with AI response
        setChatHistory((prev) => [
          ...prev.slice(0, -1), // Remove "processing" message
          { role: "assistant", message: result.response, timestamp: Date.now() }
        ]);

        antdMessage.success("Memory AI response received");

        const talkData = JSON.stringify({
          "Human": currentPrompt,
          "AI": result.response,
        });

      // Send a message to the AO process, using tags to pass the fields required by the Handler
      await aoMessage({
        /*
          The arweave TxID of the process, this will become the "target".
          This is the process the message is ultimately sent to.
        */
        process: processId,
        // Tags that the process will use as input.
        tags: [
          { name: "Action", value: "SaveTalk" },
          { name: "Talk", value: talkData },
          { name: "Task", value: "Memory Chat Conversation" },
        ],
        // A signer function used to build the message "signature"
        signer: signer,
        //The "data" portion can be the same or additional context
        data: talkData
      })
        .then(console.log)
        .catch(console.error);
        

      } else {
        throw new Error(result.error || "Failed to get AI response");
      }
      
    } catch (error) {
      console.error('Error calling Memory AI:', error);
      let errorMessage = "Failed to get AI response";
      let suggestionMessage = "";
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = "Network connection failed";
        suggestionMessage = "\n\nPlease ensure:\n1. Gateway service is running (npm run dev in gateway folder)\n2. Check if http://localhost:8787/health is accessible";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setChatHistory((prev) => [
        ...prev.slice(0, -1), // Remove "processing" message
        { role: "assistant", message: `Sorry, I encountered an error: ${errorMessage}${suggestionMessage}\n\nPlease try again.`, timestamp: Date.now() }
      ]);
      antdMessage.error(`Memory AI failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SaveMemoryModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveMemoryToAO}
        conversationData={chatHistory as ChatMessage[]}
        walletAddress={activeAddress || ''}
      />
      
      <div style={{ 
        width: "100%", 
        height: "100%",
        background: "#000000", 
        border: "4px solid #ffffff",
        boxShadow: "8px 8px 0px rgba(0, 0, 0, 0.5)",
        fontFamily: "var(--pixel-font-family)",
        fontWeight: "var(--pixel-font-weight)",
        imageRendering: "pixelated",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}>
        {/* Corner decorations */}
      <div style={{
        position: "absolute",
        top: "-4px",
        left: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      <div style={{
        position: "absolute",
        top: "-4px",
        right: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      <div style={{
        position: "absolute",
        bottom: "-4px",
        left: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      <div style={{
        position: "absolute",
        bottom: "-4px",
        right: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      
      {/* Terminal header */}
      <div style={{
        background: "#ffffff",
        color: "#000000",
        padding: "8px 12px",
        fontSize: "10px",
        borderBottom: "2px solid #000000",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span>MEMORY_AI_TERMINAL_V2</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="pixel-button"
              style={{
                fontSize: "6px",
                padding: "4px 8px",
                background: "#ffff00",
                color: "#000000",
                border: "2px solid #000000",
                cursor: "pointer"
              }}
            >
              {isFullscreen ? "MINIMIZE" : "FULLSCREEN"}
            </button>
          )}
          <div style={{ display: "flex", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", background: "#ff0000" }} />
            <div style={{ width: "8px", height: "8px", background: "#ffff00" }} />
            <div style={{ width: "8px", height: "8px", background: "#00ff00" }} />
          </div>
        </div>
      </div>

      <div
        ref={chatListRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          background: "#000000",
          fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)",
          minHeight: 0
        }}
      >
        {chatHistory.map((item, idx) => (
          <div key={idx} style={{ 
            margin: "8px 0",
            color: item.role === "user" ? "#00ff00" : item.role === "tip" ? "#ffff00" : "#ffffff",
            fontSize: "8px",
            lineHeight: "1.5",
            whiteSpace: "pre-wrap"
          }}>
            <div style={{
              display: "block",
              marginBottom: "4px"
            }}>
              {item.role === "user" ? "> USER: " : item.role === "tip" ? "> SYSTEM: " : "> MEMORY AI: "}
              {item.message}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ 
        background: "#000000", 
        borderTop: "2px solid #ffffff",
        padding: "16px"
      }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="> ENTER MEMORY QUERY..."
          disabled={loading}
          onKeyDown={e => { 
            if (e.key === 'Enter' && !e.shiftKey) { 
              e.preventDefault(); 
              handleSend(); 
            } 
          }}
          style={{
            width: "100%",
            height: "60px",
            border: "2px solid #ffffff",
            background: "#000000",
            fontSize: "8px",
            resize: "none",
            color: "#00ff00",
            fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)",
            padding: "8px",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginTop: "12px",
          gap: "8px"
        }}>
          <button 
            onClick={handleSaveMemory}
            disabled={savingMemory || loading}
            className="pixel-button"
            style={{
              fontSize: "6px",
              padding: "8px 12px",
              background: savingMemory ? "#666666" : "#ffffff",
              color: "#000000",
              opacity: savingMemory || loading ? 0.6 : 1
            }}
          >
            {savingMemory ? "SAVING..." : "SAVE MEM"}
          </button>
          <button 
            onClick={handleSend}
            disabled={loading || !activeAddress}
            className="pixel-button"
            style={{
              fontSize: "6px",
              padding: "8px 16px",
              background: (loading || !activeAddress) ? "#666666" : "#00ff00",
              color: "#000000",
              opacity: (loading || !activeAddress) ? 0.6 : 1
            }}
          >
            {loading ? "PROCESSING..." : !activeAddress ? "CONNECT WALLET" : "SEND >>"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatBoxV2;
