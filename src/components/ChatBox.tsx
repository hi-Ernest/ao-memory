import React, { useState, useRef, useEffect } from "react";
import { Input, Button, message as antdMessage } from "antd";
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
}

const DEFAULT_CHAT: ChatItem[] = [
  {
    role: "tip",
    message: "Hi, I’m Apus Assistant! Ask me anything below — let’s get started!",
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

const ChatBox: React.FC<ChatBoxProps> = ({ onAttestationUpdate }) => {
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
      // use browser wallet signer
      const signer = createDataItemSigner((window as any).arweaveWallet);
      
      // Send request to save conversation history to AO process
      await aoMessage({
        process: processId,
        tags: [
          { name: 'Action', value: 'SaveConversationMemory' },
        ],
        data: JSON.stringify(chatHistory),
        signer,
      });
      
      antdMessage.success("Conversation memory saved successfully!");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to save memory";
      antdMessage.error(errorMessage);
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
        let attestationData = aiReply.attestation;
        let attestationJWT = '';
        
        if (Array.isArray(attestationData) && attestationData.length > 0) {
          for (const item of attestationData) {
            if (Array.isArray(item) && item.length === 2 && item[0] === 'JWT') {
              attestationJWT = item[1];
              break;
            }
          }
        }
        
        const newAttestation = {
          runtimeMeasurement: attestationJWT || JSON.stringify(attestationData),
          tlsFingerprint: aiReply.reference || "N/A",
          attestedBy: [...config.defaultAttestedBy]
        };
        onAttestationUpdate?.(newAttestation);
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
      width: 700, 
      background: "rgba(31, 41, 55, 0.8)", 
      borderRadius: 20, 
      boxShadow: "0 0 40px rgba(34, 197, 194, 0.2)", 
      padding: 32,
      border: "1px solid rgba(34, 197, 194, 0.3)",
      backdropFilter: "blur(20px)",
      animation: "pulse 3s ease-in-out infinite"
    }}>
      <div
        ref={chatListRef}
        style={{
          height: 400,
          marginBottom: 24,
          overflowY: "auto",
          padding: "20px 0",
          background: "transparent"
        }}
      >
        {chatHistory.map((item, idx) => (
          <div key={idx} style={{ 
            textAlign: item.role === "user" ? "right" : "left", 
            margin: "12px 0",
            padding: "8px 0"
          }}>
            <div style={{
              display: "inline-block",
              maxWidth: "75%",
              padding: "14px 20px",
              borderRadius: "16px",
              background: item.role === "user" 
                ? "rgba(34, 197, 194, 0.2)" 
                : item.role === "tip" 
                ? "rgba(100, 116, 139, 0.2)" 
                : "rgba(55, 65, 81, 0.4)",
              color: item.role === "user" ? "#22c5c2" : "#e2e8f0",
              fontSize: "15px",
              lineHeight: "1.6",
              boxShadow: item.role === "user" 
                ? "0 0 20px rgba(34, 197, 194, 0.3)" 
                : "0 4px 12px rgba(0, 0, 0, 0.2)",
              border: item.role === "user" 
                ? "1px solid rgba(34, 197, 194, 0.4)" 
                : "1px solid rgba(55, 65, 81, 0.5)",
              backdropFilter: "blur(10px)"
            }}>
              {item.message}
            </div>
          </div>
        ))}
      </div>
      
      {/* Request Reference Display */}
      {requestReference && (
        <div style={{ 
          marginBottom: 20, 
          padding: "12px 16px", 
          background: "rgba(34, 197, 194, 0.1)", 
          borderRadius: 12,
          fontSize: "13px",
          color: "#22c5c2",
          border: "1px solid rgba(34, 197, 194, 0.2)"
        }}>
          <strong>Request Reference:</strong> {requestReference}
        </div>
      )}
      
      <div style={{ 
        background: "rgba(55, 65, 81, 0.4)", 
        borderRadius: 16, 
        padding: "20px",
        border: "1px solid rgba(34, 197, 194, 0.2)",
        backdropFilter: "blur(10px)"
      }}>
        <Input.TextArea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="What do you know?"
          autoSize={{ minRows: 3, maxRows: 5 }}
          disabled={loading}
          onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "15px",
            resize: "none",
            color: "#e2e8f0"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <Button 
            onClick={handleSaveMemory} 
            loading={savingMemory} 
            disabled={savingMemory || loading}
            style={{
              background: "transparent",
              border: "1px solid rgba(34, 197, 194, 0.4)",
              borderRadius: "12px",
              height: "44px",
              padding: "0 24px",
              fontWeight: 500,
              color: "#22c5c2",
              boxShadow: "0 0 20px rgba(34, 197, 194, 0.2)",
              backdropFilter: "blur(10px)"
            }}
          >
            Save Memory
          </Button>
          <Button 
            type="primary" 
            onClick={handleSend} 
            loading={loading} 
            disabled={loading}
            style={{
              background: "rgba(34, 197, 194, 0.3)",
              border: "1px solid rgba(34, 197, 194, 0.6)",
              borderRadius: "12px",
              height: "44px",
              padding: "0 32px",
              fontWeight: 600,
              color: "#ffffff",
              boxShadow: "0 0 30px rgba(34, 197, 194, 0.4)",
              backdropFilter: "blur(10px)"
            }}
          >
            📤
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox; 