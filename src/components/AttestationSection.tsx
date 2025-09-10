import React from "react";
import { config } from "../config";

interface AttestationSectionProps {
  runtimeMeasurement?: string;
  tlsFingerprint?: string;
  attestedBy?: string[];
}

const AttestationSection: React.FC<AttestationSectionProps> = ({
  runtimeMeasurement,
  attestedBy = [...config.defaultAttestedBy]
}) => {
  const formatLongString = (str: string, charsPerLine: number = 15) => {
    if (!str) return "NO_DATA";
    
    const chunks = [];
    for (let i = 0; i < str.length; i += charsPerLine) {
      chunks.push(str.slice(i, i + charsPerLine));
    }
    return chunks.slice(0, 6).join('\n'); // Limit to 6 lines
  };

  return (
    <div style={{ 
      width: 280, 
      background: "#000000", 
      border: "3px solid #ffffff", 
      fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)",
      boxShadow: "6px 6px 0px rgba(0, 0, 0, 0.5)"
    }}>
      {/* Runtime Measurement Section */}
      <div style={{ padding: "12px" }}>
        <div style={{ 
          color: "#ffff00", 
          fontSize: "6px", 
          marginBottom: "8px",
          lineHeight: "1.4"
        }}>
          &gt; RUNTIME_MEASUREMENT:
        </div>
        <div style={{ 
          background: "#333333", 
          border: "2px solid #ffffff",
          padding: "8px",
          marginBottom: "12px",
          minHeight: "60px"
        }}>
          <div style={{ 
            fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)", 
            fontSize: "5px", 
            color: "#00ff00",
            wordBreak: "break-all",
            lineHeight: 1.4,
            whiteSpace: "pre-wrap"
          }}>
            {formatLongString(runtimeMeasurement || "AWAITING_DATA...")}
          </div>
        </div>

        {/* Security indicators */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          marginBottom: "12px",
          gap: "8px"
        }}>
          <div style={{ 
            width: "12px", 
            height: "12px", 
            background: "#00ff00", 
            border: "1px solid #000000" 
          }} />
          <div style={{ 
            fontSize: "6px", 
            color: "#ffffff",
            alignSelf: "center"
          }}>
            SECURE
          </div>
          <div style={{ 
            width: "12px", 
            height: "12px", 
            background: "#00ff00", 
            border: "1px solid #000000" 
          }} />
        </div>

        {/* Runtime attested by Section */}
        <div>
          <div style={{ 
            color: "#ffff00", 
            fontSize: "6px", 
            marginBottom: "8px" 
          }}>
            &gt; ATTESTED_BY:
          </div>
          <div style={{ 
            display: "flex", 
            gap: "4px", 
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {attestedBy.map((company, index) => (
              <div 
                key={index}
                style={{ 
                  background: "#ffffff",
                  color: "#000000",
                  border: "2px solid #000000",
                  padding: "4px 6px",
                  fontSize: "5px",
                  fontWeight: "bold"
                }}
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttestationSection; 