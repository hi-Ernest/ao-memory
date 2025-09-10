import React, { useState, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import ChatBoxV2 from "./components/ChatBoxV2";
import WalletConnectButton from "./components/WalletConnectButton";
import TabSwitcher from "./components/TabSwitcher";
import MemoryMarketplace from "./components/MemoryMarketplace";
import LoadingPage from "./components/LoadingPage";
import LogoDisplay from "./components/LogoDisplay";
import MemoMascot from "./components/MemoMascot";
import type { MemoryItem } from "./types/memory";
import { message as antdMessage } from "antd";

interface AttestationInfo {
  runtimeMeasurement: string;
  tlsFingerprint: string;
  attestedBy: string[];
}

interface ChatItem {
  role: "user" | "assistant" | "tip";
  message: string;
  timestamp: number;
}

// Pixel cloud component
const PixelCloud: React.FC<{ top: string; animationDuration: string }> = ({ top, animationDuration }) => (
  <div style={{
    position: "absolute",
    top,
    left: 0,
    width: "64px",
    height: "32px",
    background: `
      #ffffff,
      linear-gradient(90deg, transparent 0px, transparent 8px, #ffffff 8px, #ffffff 56px, transparent 56px),
      linear-gradient(0deg, transparent 0px, transparent 8px, #ffffff 8px, #ffffff 24px, transparent 24px)
    `,
    imageRendering: "pixelated",
    animation: `cloudMove ${animationDuration} linear infinite`,
    zIndex: 1
  }} />
);

// Pixel character component
const PixelCharacter: React.FC<{ bottom: string; left: string }> = ({ bottom, left }) => (
  <div style={{
    position: "absolute",
    bottom,
    left,
    width: "16px",
    height: "16px",
    background: "#ffffff",
    imageRendering: "pixelated",
    animation: "run 0.5s infinite",
    zIndex: 2
  }} />
);

// Falling pixel block component
const FallingBlock: React.FC<{ 
  left: string; 
  delay: string; 
  duration: string; 
  color: string;
  size: number;
  animationType?: string;
}> = ({ left, delay, duration, color, size, animationType = "blockFall" }) => (
  <div style={{
    position: "absolute",
    top: 0,
    left,
    width: `${size}px`,
    height: `${size}px`,
    background: color,
    border: "2px solid #000000",
    imageRendering: "pixelated",
    animation: `${animationType} ${duration} linear infinite`,
    animationDelay: delay,
    zIndex: 1,
    boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.3)"
  }} />
);

// 默认聊天记录
const DEFAULT_CHAT: ChatItem[] = [
  {
    role: "tip",
    message: "> SYSTEM READY\n> AI AGENT INITIALIZED\n> ENTER YOUR QUERY BELOW:",
    timestamp: Date.now(),
  },
];

const DEFAULT_CHAT_V2: ChatItem[] = [
  {
    role: "tip",
    message: "> MEMORY AI SYSTEM READY\n> ENHANCED MEMORY PROCESSING INITIALIZED\n> ENTER YOUR MEMORY-RELATED QUERY BELOW:",
    timestamp: Date.now(),
  },
];

const App: React.FC = () => {
  const [, setAttestation] = useState<AttestationInfo | null>(null);
  const [blocks, setBlocks] = useState<React.ReactNode[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'chatv2' | 'marketplace'>('chat');
  const [userBalance, setUserBalance] = useState(500); // Mock user balance in AO coins
  const [isFullscreenChat, setIsFullscreenChat] = useState(false);
  const [isFullscreenChatV2, setIsFullscreenChatV2] = useState(false);
  const [isFullscreenMarketplace, setIsFullscreenMarketplace] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  
  // 聊天历史状态管理 - 提升到App级别以保持状态
  const [chatHistory, setChatHistory] = useState<ChatItem[]>(DEFAULT_CHAT);
  const [chatV2History, setChatV2History] = useState<ChatItem[]>(DEFAULT_CHAT_V2);

  // Generate random falling blocks
  const generateBlocks = (count: number = 30) => {
    const newBlocks = [];
    const colors = ["#ffffff", "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ffa500", "#ff6b6b", "#4ecdc4"];
    const sizes = [12, 16, 20, 24, 28];
    const animations = ["blockFall", "blockFallWobble"];
    
    for (let i = 0; i < count; i++) {
      newBlocks.push(
        <FallingBlock
          key={`block-${Date.now()}-${i}`}
          left={`${Math.random() * 100}%`}
          delay={`${Math.random() * 2}s`}
          duration={`${2 + Math.random() * 3}s`}
          color={colors[Math.floor(Math.random() * colors.length)]}
          size={sizes[Math.floor(Math.random() * sizes.length)]}
          animationType={animations[Math.floor(Math.random() * animations.length)]}
        />
      );
    }
    return newBlocks;
  };

  // Initialize blocks and set up continuous generation
  useEffect(() => {
    setBlocks(generateBlocks());
    
    const interval = setInterval(() => {
      setBlocks(prevBlocks => [
        ...prevBlocks,
        ...generateBlocks(3) // Add 3 new blocks every interval
      ]);
    }, 1000);

    // Clean up old blocks periodically to prevent memory leaks
    const cleanup = setInterval(() => {
      setBlocks(prevBlocks => prevBlocks.slice(-50)); // Keep only last 50 blocks
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  // Handle memory purchase
  const handlePurchaseMemory = (memory: MemoryItem) => {
    if (userBalance >= memory.price) {
      setUserBalance(prev => prev - memory.price);
      antdMessage.success(`Successfully purchased "${memory.title}" for $${memory.price} AOM!`);
      
      // Mark memory as owned (in real app, this would update backend)
      memory.isOwned = true;
    } else {
      antdMessage.error(`Insufficient balance! You need $${memory.price} AOM but only have $${userBalance} AOM.`);
    }
  };

  // Handle memory import
  const handleImportMemory = (memory: MemoryItem) => {
    antdMessage.success(`"${memory.title}" has been imported to your AI assistant!`);
    // In real app, this would integrate the memory into the AI's knowledge base
  };

  // Handle loading completion
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Show loading page first
  if (isLoading) {
    return <LoadingPage onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#ff3333",
      position: "relative",
      fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)",
      overflow: "hidden"
    }}>
      {/* Falling blocks */}
      {blocks}
      
      {/* Animated pixel clouds */}
      <PixelCloud top="10%" animationDuration="20s" />
      <PixelCloud top="15%" animationDuration="15s" />
      <PixelCloud top="25%" animationDuration="25s" />
      <PixelCloud top="70%" animationDuration="18s" />
      <PixelCloud top="75%" animationDuration="22s" />
      
      {/* Running pixel characters */}
      <PixelCharacter bottom="200px" left="calc(20% + 100px)" />
      <PixelCharacter bottom="200px" left="calc(20% + 120px)" />
      
      {/* Floating Memo Decorations */}
      <div style={{
        position: "absolute",
        top: "15%",
        right: "10%",
        zIndex: 2
      }}>
        <MemoMascot size={40} animated={true} showBubbles={true} />
      </div>
      
      <div style={{
        position: "absolute",
        bottom: "25%",
        left: "5%",
        zIndex: 2
      }}>
        <MemoMascot size={32} animated={true} showBubbles={false} />
      </div>
      
      {/* Logo with Memo */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 10
      }}>
        <LogoDisplay size="small" />
      </div>

      {/* Top Navigation */}
      <nav style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "30px",
        zIndex: 10
      }}>
      </nav>
      
      <WalletConnectButton />
      
      {/* Main content frame */}
      {isFullscreenChat ? (
        // Fullscreen Chat Layout
        <div style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          zIndex: 20,
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Title bar in fullscreen */}
          <div style={{
            background: "rgba(255, 51, 51, 0.95)",
            padding: "20px",
            borderBottom: "4px solid #000000"
          }}>
            <h1 style={{
              fontSize: "clamp(16px, 4vw, 32px)",
              color: "#ffffff",
              textAlign: "center",
              margin: 0,
              letterSpacing: "4px",
              lineHeight: 1.2,
              textShadow: "4px 4px 0px #000000",
              animation: "blink 2s infinite"
            }}>
              MEMO SWIMMING IN THE AO
            </h1>
          </div>
          
          {/* Fullscreen Chat */}
          <div style={{
            flex: 1,
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <div style={{ width: "90%", height: "100%", maxWidth: "1200px" }}>
              <ChatBox 
                onAttestationUpdate={setAttestation} 
                onToggleFullscreen={() => setIsFullscreenChat(false)}
                isFullscreen={true}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
              />
            </div>
          </div>
        </div>
      ) : isFullscreenChatV2 ? (
        // Fullscreen ChatV2 Layout
        <div style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          zIndex: 20,
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Title bar in fullscreen */}
          <div style={{
            background: "rgba(255, 51, 51, 0.95)",
            padding: "20px",
            borderBottom: "4px solid #000000"
          }}>
            <h1 style={{
              fontSize: "clamp(16px, 4vw, 32px)",
              color: "#ffffff",
              textAlign: "center",
              margin: 0,
              letterSpacing: "4px",
              lineHeight: 1.2,
              textShadow: "4px 4px 0px #000000",
              animation: "blink 2s infinite"
            }}>
              MEMO SWIMMING IN THE AO
            </h1>
          </div>
          
          {/* Fullscreen ChatV2 */}
          <div style={{
            flex: 1,
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <div style={{ width: "90%", height: "100%", maxWidth: "1200px" }}>
              <ChatBoxV2 
                onToggleFullscreen={() => setIsFullscreenChatV2(false)}
                isFullscreen={true}
                chatHistory={chatV2History}
                setChatHistory={setChatV2History}
              />
            </div>
          </div>
        </div>
      ) : isFullscreenMarketplace ? (
        // Fullscreen Marketplace Layout
        <div style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          zIndex: 20,
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Title bar in fullscreen */}
          <div style={{
            background: "rgba(255, 51, 51, 0.95)",
            padding: "20px",
            borderBottom: "4px solid #000000"
          }}>
            <h1 style={{
              fontSize: "clamp(16px, 4vw, 32px)",
              color: "#ffffff",
              textAlign: "center",
              margin: 0,
              letterSpacing: "4px",
              lineHeight: 1.2,
              textShadow: "4px 4px 0px #000000",
              animation: "blink 2s infinite"
            }}>
              MEMO SWIMMING IN THE AO
            </h1>
          </div>
          
          {/* Fullscreen Marketplace */}
          <div style={{
            flex: 1,
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <div style={{ width: "95%", height: "100%" }}>
              <MemoryMarketplace
                userBalance={userBalance}
                onPurchase={handlePurchaseMemory}
                onImport={handleImportMemory}
                onToggleFullscreen={() => setIsFullscreenMarketplace(false)}
                isFullscreen={true}
              />
            </div>
          </div>
        </div>
      ) : (
        // Normal Layout
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "1200px",
          height: "80%",
          zIndex: 5
        }}>
        {/* Main title frame */}
        <div style={{
          border: "4px solid #000000",
          background: "transparent",
          padding: "20px",
          marginBottom: "20px",
          position: "relative"
        }}>
          {/* Corner decorations */}
          <div style={{
            position: "absolute",
            top: "-4px",
            left: "-4px",
            width: "12px",
            height: "12px",
            background: "#000000"
          }} />
          <div style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "12px",
            height: "12px",
            background: "#000000"
          }} />
          <div style={{
            position: "absolute",
            bottom: "-4px",
            left: "-4px",
            width: "12px",
            height: "12px",
            background: "#000000"
          }} />
          <div style={{
            position: "absolute",
            bottom: "-4px",
            right: "-4px",
            width: "12px",
            height: "12px",
            background: "#000000"
          }} />

          <h1 style={{
            fontSize: "clamp(16px, 4vw, 32px)",
            color: "#ffffff",
            textAlign: "center",
            margin: 0,
            letterSpacing: "4px",
            lineHeight: 1.2,
            textShadow: "4px 4px 0px #000000",
            animation: "blink 2s infinite"
          }}>
            MEMO SWIMMING IN THE AO
          </h1>
        </div>

        {/* Content Area with Sidebar */}
        <div style={{
          height: "calc(100% - 80px)",
          display: "flex",
          gap: "20px"
        }}>
          {/* Left Sidebar */}
          <div style={{
            width: "240px",
            background: "rgba(0, 150, 255, 0.8)",
            border: "4px solid #000000",
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
              background: "#000000"
            }} />
            <div style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "12px",
              height: "12px",
              background: "#000000"
            }} />
            <div style={{
              position: "absolute",
              bottom: "-4px",
              left: "-4px",
              width: "12px",
              height: "12px",
              background: "#000000"
            }} />
            <div style={{
              position: "absolute",
              bottom: "-4px",
              right: "-4px",
              width: "12px",
              height: "12px",
              background: "#000000"
            }} />
            
            {/* Tab Switcher */}
            <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
            
            {/* Import/Export buttons for chat modes */}
            {(activeTab === 'chat' || activeTab === 'chatv2') && (
              <div style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <button className="pixel-button register" style={{
                  fontSize: "8px",
                  padding: "8px 12px",
                  width: "100%"
                }}>
                  IMPORT MEMORY
                </button>
                <button className="pixel-button code-conduct" style={{
                  fontSize: "8px",
                  padding: "8px 12px",
                  width: "100%"
                }}>
                  EXPORT MEMORY
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column"
          }}>
            {activeTab === 'chat' ? (
              <ChatBox 
                onAttestationUpdate={setAttestation} 
                onToggleFullscreen={() => setIsFullscreenChat(true)}
                isFullscreen={false}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
              />
            ) : activeTab === 'chatv2' ? (
              <ChatBoxV2 
                onToggleFullscreen={() => setIsFullscreenChatV2(true)}
                isFullscreen={false}
                chatHistory={chatV2History}
                setChatHistory={setChatV2History}
              />
            ) : (
              <MemoryMarketplace
                userBalance={userBalance}
                onPurchase={handlePurchaseMemory}
                onImport={handleImportMemory}
                onToggleFullscreen={() => setIsFullscreenMarketplace(true)}
                isFullscreen={false}
              />
            )}
          </div>
        </div>
        </div>
      )}

      {/* Bottom scrolling text */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: 0,
        right: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "rgba(255, 255, 255, 0.1)",
        padding: "10px 0",
        zIndex: 1
      }}>
        <div style={{
          display: "inline-block",
          paddingLeft: "100%",
          animation: "cloudMove 20s linear infinite",
          fontSize: "10px",
          color: "#ffffff",
          letterSpacing: "2px"
        }}>
          Build. Innovate. Get rewarded. Build. Innovate. Get rewarded. Build. Innovate. Get rewarded.
        </div>
      </div>

      {/* Running characters at bottom */}
      <PixelCharacter bottom="80px" left="calc(80% + 50px)" />
      <PixelCharacter bottom="80px" left="calc(90% + 80px)" />
    </div>
  );
};

export default App; 