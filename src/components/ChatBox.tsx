import React, { useState, useRef, useEffect } from "react";
import { message as antdMessage } from "antd";
import { useWallet } from "../contexts/WalletContext";
import { message as aoMessage, dryrun, createDataItemSigner } from '@permaweb/aoconnect';
import { config } from "../config";

interface ChatItem {
  role: "user" | "assistant" | "tip";
  message: string;
  timestamp: number;
}

interface AttestationInfo {
  runtimeMeasurement: string;
  tlsFingerprint: string;
  attestedBy: string[];
}

interface ChatBoxProps {
  onAttestationUpdate?: (attestation: AttestationInfo) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const DEFAULT_CHAT: ChatItem[] = [
  {
    role: "tip",
    message: "> SYSTEM READY\n> AI AGENT INITIALIZED\n> ENTER YOUR QUERY BELOW:",
    timestamp: Date.now(),
  },
];

const processId = config.aoProcessId;

const payApusToken = async () => {
  // TODO: Call backend/contract to pay 1 Apus Token
  return Promise.resolve();
};

// use aoconnect's result to wait for message processing to complete
const pollForResult = async (reference: string): Promise<{ data: string; attestation?: any; reference?: string; status?: string }> => {
  try {
    const res = await dryrun({
      process: processId,
      tags: [
        { name: 'Action', value: 'GetInferResponse' },
        { name: 'X-Reference', value: reference },
      ],
    });

    const raw = res?.Messages?.[0]?.Data;
    let parsed: any;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      parsed = raw;
    }

    // handle different structures: parse status and response first (response is a JSON string)
    const status = parsed?.status ?? 'success';
    if (status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 20000));
      return pollForResult(reference);
    }
    if (status === 'failed') {
      const msg = parsed?.error_message || 'Task failed';
      throw new Error(msg);
    }

    // parse inner response
    let inner: any = undefined;
    try {
      inner = parsed?.response
        ? (typeof parsed.response === 'string' ? JSON.parse(parsed.response) : parsed.response)
        : undefined;
    } catch {
      inner = undefined;
    }

    const resultText = (inner?.result ?? inner?.data ?? inner)
      ?? (parsed?.result ?? parsed?.data)
      ?? (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));

    const attestation = inner?.attestation ?? parsed?.attestation;
    const resolvedRef = parsed?.reference ?? reference;

    return {
      data: typeof resultText === 'string' ? resultText : JSON.stringify(resultText),
      attestation,
      reference: resolvedRef,
      status: 'success',
    };
  } catch (error) {
    throw new Error('Failed to get result: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const ChatBox: React.FC<ChatBoxProps> = ({ onAttestationUpdate: _, onToggleFullscreen, isFullscreen }) => {
  const { checkLogin } = useWallet();
  const [chatHistory, setChatHistory] = useState<ChatItem[]>(DEFAULT_CHAT);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestReference, setRequestReference] = useState<string>('');
  const [savingMemory, setSavingMemory] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when chatHistory changes
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSaveMemory = async () => {
    if (!checkLogin()) return;
    
    setSavingMemory(true);
    try {
      // 获取用户钱包地址
      const wallet = await (window as any).arweaveWallet.getActiveAddress();
      
      // 调用 Gateway API 来保存记忆
      const response = await fetch(`${config.gatewayApiUrl}/api/memory/save-from-ao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: wallet,
          ao_process_id: processId
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        antdMessage.success(
          `Memory saved successfully! Processed ${result.conversation_count} conversations (${result.message_count} messages) to vector database.`
        );
      } else {
        throw new Error(result.error || "Failed to save memory");
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to save memory";
      console.error('Save memory error:', e);
      antdMessage.error(`Save memory failed: ${errorMessage}`);
    } finally {
      setSavingMemory(false);
    }
  };

  const handleSend = async () => {
    if (!checkLogin()) return;
    if (!prompt.trim()) {
      antdMessage.warning("Please enter a message");
      return;
    }
    
    setLoading(true);
    try {
      await payApusToken();
      
      // Unique reference for UX display (not required for aoconnect)
      const ref = Date.now().toString();
      setRequestReference(ref);
      
      setChatHistory((prev) => [
        ...prev,
        { role: "user", message: prompt, timestamp: Date.now() },
        { role: "tip", message: "Your question is sent. Please wait for the answer...", timestamp: Date.now() },
      ]);
      
      const currentPrompt = prompt;
      setPrompt("");

      // use browser wallet signer
      const signer = createDataItemSigner((window as any).arweaveWallet);

      // send request to AO process via aoconnect.message
      await aoMessage({
        process: processId,
        tags: [
          { name: 'Action', value: 'Infer' },
          { name: 'X-Reference', value: ref },
        ],
        data: currentPrompt,
        signer,
      });

      // use dryrun to query inference result by reference
      const aiReply = await pollForResult(ref);
      
      // Update chat history with AI response
      setChatHistory((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", message: aiReply.data || String(aiReply), timestamp: Date.now() }
      ]);

      // Update attestation if available
      if (aiReply.attestation) {
        // handle complex attestation structure
        // let attestationData = aiReply.attestation;
        // let attestationJWT = '';
        
        // if (Array.isArray(attestationData) && attestationData.length > 0) {
        //   for (const item of attestationData) {
        //     if (Array.isArray(item) && item.length === 2 && item[0] === 'JWT') {
        //       attestationJWT = item[1];
        //       break;
        //     }
        //   }
        // }
        
        // const newAttestation = {
        //   runtimeMeasurement: attestationJWT || JSON.stringify(attestationData),
        //   tlsFingerprint: aiReply.reference || "N/A",
        //   attestedBy: [...config.defaultAttestedBy]
        // };
        // onAttestationUpdate?.(newAttestation);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to send message";
      antdMessage.error(errorMessage);
      setChatHistory((prev) => prev.slice(0, -1));
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
        <span>AI_AGENT_TERMINAL</span>
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
              {item.role === "user" ? "> USER: " : item.role === "tip" ? "> SYSTEM: " : "> AI: "}
              {item.message}
            </div>
          </div>
        ))}
      </div>
      
      {/* Request Reference Display */}
      {requestReference && (
        <div style={{ 
          padding: "8px 16px", 
          background: "#333333", 
          borderTop: "2px solid #ffffff",
          fontSize: "8px",
          color: "#ffff00",
          fontFamily: "'Press Start 2P', cursive"
        }}>
          REF: {requestReference}
        </div>
      )}
      
      <div style={{ 
        background: "#000000", 
        borderTop: "2px solid #ffffff",
        padding: "16px"
      }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="> ENTER COMMAND..."
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
            {loading ? "PROC..." : "SEND >>"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox; 