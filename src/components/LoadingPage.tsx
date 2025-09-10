import React, { useState, useEffect } from "react";
import LogoDisplay from "./LogoDisplay";
import MemoMascot from "./MemoMascot";

interface LoadingPageProps {
  onLoadingComplete?: () => void;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ onLoadingComplete }) => {
  const [currentText, setCurrentText] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const loadingTexts = [
    "INITIALIZING MEMORY FEDERATION...",
    "CONNECTING TO DECENTRALIZED NETWORK...",
    "LOADING AI CREATIVITY AMPLIFIERS...",
    "ESTABLISHING CROSS-PLATFORM BRIDGE...",
    "ACTIVATING MEMORY VAULT PROTOCOL...",
    "READY TO UNLEASH YOUR IMAGINATION!"
  ];

  const visionContent = [
    {
      title: "THE AGE OF AI-POWERED INDIVIDUAL CREATIVITY",
      content: "In this era of AI explosion driving personal creativity, we believe every independent developer/content creator can become a 'One-Person Company' - even without traditional company structures. Deconstructing hierarchical relationships in favor of collaborative partnerships."
    },
    {
      title: "VISION: DIGITAL MEMORY FEDERATION",
      content: "Breaking through data silos and tool limitations, we're building a Digital Memory Federation for the AI age - where your creative traces become compounding productivity assets!"
    },
    {
      title: "PROBLEM 1: DATA MONOPOLY & FRAGMENTATION",
      content: "Current State: User creative traces scattered across closed platforms, data value monopolized by centralized giants (ds/gpt...)\n\nSolution: Crypte protocol builds trustless data networks, achieving user autonomy over creative assets through encrypted rights management."
    },
    {
      title: "PROBLEM 2: AI CREATION LACKS CONTINUITY",
      content: "Current State: LLM conversations lack memory state, cross-platform content difficult to aggregate, creative inspiration easily fragmented.\n\n• Full-scenario Memory Hub: Structured storage of multi-platform creative traces (text/code/worldviews), supporting dynamic weaving into callable knowledge graphs\n• Intelligent Memory Collaboration: Plugin matrix connecting Notion/Discord platforms, AI auto-extracts cross-platform contextual associations\n• Controllable Memory Sharing: Wallet-based permission system enabling encrypted distribution and commercialization of creative memories"
    }
  ];

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % loadingTexts.length);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setShowContent(true);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    const timeout = setTimeout(() => {
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 12000);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [onLoadingComplete]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#ff3333",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)",
      color: "#ffffff",
      overflow: "auto",
      zIndex: 9999
    }}>
      {/* Animated background pixels */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "8px",
            height: "8px",
            background: "#ffffff",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `blink ${0.5 + Math.random() * 1.5}s infinite alternate`,
            opacity: 0.3
          }}
        />
      ))}
      
      {/* Floating Memo decorations */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "10%",
        zIndex: 1
      }}>
        <MemoMascot size={24} animated={true} showBubbles={true} />
      </div>
      
      <div style={{
        position: "absolute",
        top: "20%",
        right: "15%",
        zIndex: 1
      }}>
        <MemoMascot size={20} animated={true} showBubbles={false} />
      </div>
      
      <div style={{
        position: "absolute",
        bottom: "15%",
        left: "5%",
        zIndex: 1
      }}>
        <MemoMascot size={28} animated={true} showBubbles={true} />
      </div>

      {!showContent ? (
        // Loading Screen
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "800px",
          padding: "40px"
        }}>
          {/* Main Logo with Memo */}
          <div style={{
            marginBottom: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px"
          }}>
            <LogoDisplay size="large" animated={true} />
            <div style={{
              background: "#ffffff",
              color: "#ff3333",
              padding: "15px 30px",
              border: "4px solid #000000",
              fontSize: "18px",
              fontWeight: "bold",
              textAlign: "center",
              boxShadow: "8px 8px 0px rgba(0, 0, 0, 0.5)"
            }}>
              DIGITAL MEMORY FEDERATION
            </div>
          </div>

          {/* Loading Text */}
          <div style={{
            fontSize: "12px",
            marginBottom: "30px",
            textAlign: "center",
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            animation: "blink 1s infinite"
          }}>
            {loadingTexts[currentText]}
          </div>

          {/* Progress Bar */}
          <div style={{
            width: "400px",
            height: "20px",
            border: "3px solid #ffffff",
            background: "#000000",
            position: "relative",
            marginBottom: "20px"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #ffffff 0%, #ffff00 50%, #00ff00 100%)",
              transition: "width 0.1s ease"
            }} />
          </div>

          {/* Progress Percentage */}
          <div style={{
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            {progress}% LOADED
          </div>
        </div>
      ) : (
        // Vision Content
        <div style={{
          maxWidth: "900px",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "30px",
          animation: "fadeIn 1s ease-in"
        }}>
          {visionContent.map((section, index) => (
            <div
              key={index}
              style={{
                background: "rgba(0, 0, 0, 0.8)",
                border: "3px solid #ffffff",
                padding: "20px",
                boxShadow: "6px 6px 0px rgba(0, 0, 0, 0.5)",
                animation: `slideIn ${0.5 + index * 0.2}s ease-out`
              }}
            >
              <h2 style={{
                fontSize: "14px",
                color: "#ffff00",
                marginBottom: "15px",
                textShadow: "2px 2px 0px #000000"
              }}>
                {section.title}
              </h2>
              <p style={{
                fontSize: "10px",
                lineHeight: "1.6",
                whiteSpace: "pre-line",
                color: "#ffffff"
              }}>
                {section.content}
              </p>
            </div>
          ))}

          {/* Skip Button */}
          <div style={{
            textAlign: "center",
            marginTop: "20px"
          }}>
            <button
              onClick={onLoadingComplete}
              className="pixel-button"
              style={{
                fontSize: "10px",
                padding: "10px 20px",
                background: "#00ff00",
                color: "#000000",
                border: "3px solid #000000",
                cursor: "pointer",
                boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.5)"
              }}
            >
              ENTER MEMORY FEDERATION {">>>"}
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default LoadingPage;
