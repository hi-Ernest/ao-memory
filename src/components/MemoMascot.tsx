import React from "react";

interface MemoMascotProps {
  size?: number;
  animated?: boolean;
  style?: React.CSSProperties;
  showBubbles?: boolean;
}

const MemoMascot: React.FC<MemoMascotProps> = ({ 
  size = 64, 
  animated = true, 
  style = {}, 
  showBubbles = true 
}) => {
  return (
    <div style={{
      position: "relative",
      width: `${size}px`,
      height: `${size}px`,
      display: "inline-block",
      ...style
    }}>
      {/* Memory Bubbles */}
      {showBubbles && (
        <>
          <div style={{
            position: "absolute",
            width: "8px",
            height: "8px",
            background: "#00ffff",
            borderRadius: "50%",
            top: "10%",
            left: "20%",
            animation: animated ? "memoryFloat 2s ease-in-out infinite" : "none",
            animationDelay: "0s"
          }} />
          <div style={{
            position: "absolute",
            width: "6px",
            height: "6px",
            background: "#ffff00",
            borderRadius: "50%",
            top: "15%",
            right: "25%",
            animation: animated ? "memoryFloat 2.5s ease-in-out infinite" : "none",
            animationDelay: "0.5s"
          }} />
          <div style={{
            position: "absolute",
            width: "4px",
            height: "4px",
            background: "#00ff00",
            borderRadius: "50%",
            top: "5%",
            left: "50%",
            animation: animated ? "memoryFloat 3s ease-in-out infinite" : "none",
            animationDelay: "1s"
          }} />
        </>
      )}
      
      {/* Memo the Dolphin */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        style={{
          imageRendering: "pixelated",
          animation: animated ? "dolphinBob 3s ease-in-out infinite" : "none"
        }}
      >
        {/* Dolphin Body */}
        <path
          d="M8 32 Q8 20 20 16 Q40 12 56 20 Q60 24 58 32 Q56 40 48 44 Q32 48 20 44 Q8 40 8 32 Z"
          fill="#00aaff"
          stroke="#000000"
          strokeWidth="2"
        />
        
        {/* Dolphin Belly */}
        <path
          d="M16 32 Q16 28 24 26 Q40 24 48 28 Q52 32 48 36 Q40 38 24 36 Q16 34 16 32 Z"
          fill="#ffffff"
        />
        
        {/* Dolphin Snout */}
        <ellipse
          cx="8"
          cy="32"
          rx="6"
          ry="4"
          fill="#00aaff"
          stroke="#000000"
          strokeWidth="2"
        />
        
        {/* Dorsal Fin */}
        <path
          d="M28 16 L32 8 L36 16 Z"
          fill="#0088cc"
          stroke="#000000"
          strokeWidth="1"
        />
        
        {/* Tail Fin */}
        <path
          d="M48 28 L58 24 L60 32 L58 40 L48 36 Z"
          fill="#0088cc"
          stroke="#000000"
          strokeWidth="2"
        />
        
        {/* Eye */}
        <circle
          cx="20"
          cy="28"
          r="4"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1"
        />
        <circle
          cx="22"
          cy="26"
          r="2"
          fill="#000000"
        />
        <circle
          cx="23"
          cy="25"
          r="1"
          fill="#ffffff"
        />
        
        {/* Memory Chip on Head (tech element) */}
        <rect
          x="24"
          y="20"
          width="8"
          height="4"
          fill="#ff3333"
          stroke="#000000"
          strokeWidth="1"
          rx="1"
        />
        <rect
          x="26"
          y="21"
          width="4"
          height="2"
          fill="#ffffff"
        />
        
        {/* Smile */}
        <path
          d="M4 34 Q8 38 12 34"
          fill="none"
          stroke="#000000"
          strokeWidth="1"
        />
      </svg>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes dolphinBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes memoryFloat {
          0%, 100% { 
            transform: translateY(0px); 
            opacity: 0.7; 
          }
          50% { 
            transform: translateY(-12px); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
};

export default MemoMascot;
