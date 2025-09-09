import React, { useState } from "react";
import ChatBox from "./components/ChatBox";
import WalletConnectButton from "./components/WalletConnectButton";
import AttestationSection from "./components/AttestationSection";

interface AttestationInfo {
  runtimeMeasurement: string;
  tlsFingerprint: string;
  attestedBy: string[];
}

const App: React.FC = () => {
  const [attestation, setAttestation] = useState<AttestationInfo | null>(null);

  console.log("App component rendering...");

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #1a1f35 0%, #2d3748 50%, #1a202c 100%)",
      position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      overflow: "hidden"
    }}>
      {/* Dark forest/mountain background effect */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(34, 197, 194, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(79, 172, 254, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: "none"
      }} />
      
      {/* Animated particles/stars effect */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(34, 197, 194, 0.03) 2px,
            rgba(34, 197, 194, 0.03) 4px
          )
        `,
        pointerEvents: "none",
        animation: "float 20s ease-in-out infinite"
      }} />
      
      <WalletConnectButton />
      
      {/* Left Navigation */}
      <div style={{
        position: "absolute",
        left: 20,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 10
      }}>
        <div style={{
          background: "rgba(31, 41, 55, 0.8)",
          border: "1px solid rgba(34, 197, 194, 0.3)",
          borderRadius: 16,
          padding: "20px 16px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 16,
            color: "#22c5c2",
            fontSize: "14px",
            fontWeight: 600
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              marginRight: 8
            }} />
            Build
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: 500
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "transparent",
              border: "1px solid #64748b",
              marginRight: 8
            }} />
            Explore
          </div>
        </div>
      </div>
      
      <div style={{ 
        position: "relative", 
        zIndex: 1,
        padding: "80px 20px 120px",
        maxWidth: 900,
        margin: "0 auto",
        textAlign: "center"
      }}>
        <h1 style={{ 
          color: "#22c5c2",
          fontSize: "4rem",
          fontWeight: 800,
          marginBottom: 60,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          textShadow: "0 0 30px rgba(34, 197, 194, 0.5), 0 0 60px rgba(34, 197, 194, 0.3)",
          animation: "glow 2s ease-in-out infinite alternate"
        }}>
          Build Memories
        </h1>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: 32, 
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 60
        }}>
          <ChatBox onAttestationUpdate={setAttestation} />
        </div>

        {/* Bottom Action Buttons */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          flexWrap: "wrap"
        }}>
          <button style={{
            background: "transparent",
            border: "1px solid rgba(34, 197, 194, 0.5)",
            borderRadius: 25,
            padding: "12px 24px",
            color: "#22c5c2",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(34, 197, 194, 0.2)"
          }}>
            Share Memory
          </button>
          <button style={{
            background: "transparent",
            border: "1px solid rgba(34, 197, 194, 0.5)",
            borderRadius: 25,
            padding: "12px 24px",
            color: "#22c5c2",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(34, 197, 194, 0.2)"
          }}>
            Load Memory
          </button>
          <button style={{
            background: "transparent",
            border: "1px solid rgba(34, 197, 194, 0.5)",
            borderRadius: 25,
            padding: "12px 24px",
            color: "#22c5c2",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(34, 197, 194, 0.2)"
          }}>
            Download Memory
          </button>
          <button style={{
            background: "transparent",
            border: "1px solid rgba(34, 197, 194, 0.5)",
            borderRadius: 25,
            padding: "12px 24px",
            color: "#22c5c2",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(34, 197, 194, 0.2)"
          }}>
            Clear Memory
          </button>
        </div>
      </div>
      
      {/* AttestationSection positioned absolutely */}
      <div style={{
        position: "absolute",
        right: 20,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 5
      }}>
        <AttestationSection 
          runtimeMeasurement={attestation?.runtimeMeasurement}
          tlsFingerprint={attestation?.tlsFingerprint}
          attestedBy={attestation?.attestedBy}
        />
      </div>
    </div>
  );
};

export default App; 