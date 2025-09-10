import React from "react";
import MemoMascot from "./MemoMascot";

interface LogoDisplayProps {
  size?: "small" | "medium" | "large";
  animated?: boolean;
  showText?: boolean;
  style?: React.CSSProperties;
}

const LogoDisplay: React.FC<LogoDisplayProps> = ({ 
  size = "medium", 
  animated = true, 
  showText = true,
  style = {} 
}) => {
  const sizeConfig = {
    small: { mascot: 32, fontSize: "12px", padding: "8px" },
    medium: { mascot: 48, fontSize: "16px", padding: "12px" },
    large: { mascot: 64, fontSize: "20px", padding: "16px" }
  };

  const config = sizeConfig[size];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: config.padding,
      background: "#ffffff",
      border: "3px solid #000000",
      borderRadius: "8px",
      boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.5)",
      fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)",
      ...style
    }}>
      {/* Memo Mascot */}
      <MemoMascot 
        size={config.mascot} 
        animated={animated}
        showBubbles={animated}
      />
      
      {/* Logo Text */}
      {showText && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start"
        }}>
          <div style={{
            fontSize: config.fontSize,
            fontWeight: "bold",
            color: "#ff3333",
            lineHeight: "1",
            textShadow: "1px 1px 0px #000000"
          }}>
            AO-MEMORY
          </div>
          <div style={{
            fontSize: `${parseInt(config.fontSize) * 0.6}px`,
            color: "#0088cc",
            lineHeight: "1",
            marginTop: "2px"
          }}>
            with Memo
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoDisplay;
