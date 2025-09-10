import React, { useState, useRef, useEffect } from "react";
import { message as antdMessage } from "antd";
import { config } from "../config";

interface ChatItem {
  role: "user" | "assistant" | "tip";
  message: string;
  timestamp: number;
}

interface ChatBoxV2Props {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const DEFAULT_CHAT: ChatItem[] = [
  {
    role: "tip",
    message: "> MEMORY AI SYSTEM READY\n> ENHANCED MEMORY PROCESSING INITIALIZED\n> ENTER YOUR MEMORY-RELATED QUERY BELOW:",
    timestamp: Date.now(),
  },
];


const ChatBoxV2: React.FC<ChatBoxV2Props> = ({ onToggleFullscreen, isFullscreen }) => {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>(DEFAULT_CHAT);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);


  // Auto-scroll to bottom when chatHistory changes
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatHistory]);


  const handleSend = async () => {
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
          justifyContent: "flex-end", 
          alignItems: "center", 
          marginTop: "12px"
        }}>
          <button 
            onClick={handleSend}
            disabled={loading}
            className="pixel-button"
            style={{
              fontSize: "6px",
              padding: "8px 16px",
              background: loading ? "#666666" : "#00ff00",
              color: "#000000",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "PROCESSING..." : "SEND >>"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBoxV2;
