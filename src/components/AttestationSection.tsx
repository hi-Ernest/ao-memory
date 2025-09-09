import React from "react";
import { Card, Typography } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { config } from "../config";

const { Title, Text } = Typography;

interface AttestationSectionProps {
  runtimeMeasurement?: string;
  tlsFingerprint?: string;
  attestedBy?: string[];
}

const AttestationSection: React.FC<AttestationSectionProps> = ({
  runtimeMeasurement,
  attestedBy = [...config.defaultAttestedBy]
}) => {
  const formatLongString = (str: string, charsPerLine: number = 20) => {
    if (!str) return "No attestation data available";
    
    const chunks = [];
    for (let i = 0; i < str.length; i += charsPerLine) {
      chunks.push(str.slice(i, i + charsPerLine));
    }
    return chunks.join('\n');
  };

  return (
    <div style={{ width: 300, padding: 20, background: "rgba(31, 41, 55, 0.8)", borderRadius: 16, boxShadow: "0 0 30px rgba(34, 197, 194, 0.2)", border: "1px solid rgba(34, 197, 194, 0.3)", backdropFilter: "blur(20px)" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#22c5c2", fontWeight: 700 }}>
          Attestation
        </Title>
        <CheckCircleFilled style={{ marginLeft: 8, fontSize: 20, color: "#22c5c2" }} />
      </div>
      
      {/* Runtime Measurement Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 8, color: "#e2e8f0", fontWeight: 600 }}>
          Runtime Measurement
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12, color: "#94a3b8" }}>
          Received from the enclave.
        </Text>
        <Card 
          size="small" 
          style={{ 
            border: "1px solid rgba(34, 197, 194, 0.3)", 
            borderRadius: 8,
            backgroundColor: "rgba(34, 197, 194, 0.1)",
            boxShadow: "0 0 20px rgba(34, 197, 194, 0.2)"
          }}
        >
          <div style={{ 
            fontFamily: "monospace", 
            fontSize: 10, 
            color: "#22c5c2",
            wordBreak: "break-all",
            lineHeight: 1.3,
            padding: "8px 0",
            maxHeight: "120px",
            overflowY: "auto"
          }}>
            {formatLongString(runtimeMeasurement || "No attestation data available")}
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            marginTop: 8,
            gap: 8
          }}>
            <span style={{ fontSize: 14, color: "#999" }}>🔒</span>
            <span style={{ fontSize: 14, color: "#999" }}>+</span>
            <span style={{ fontSize: 14, color: "#999" }}>🖥️</span>
          </div>
        </Card>
      </div>

      {/* Runtime attested by Section */}
      <div>
        <Title level={5} style={{ 
          marginBottom: 12, 
          color: "#22c5c2",
          backgroundColor: "rgba(34, 197, 194, 0.2)",
          padding: "6px 12px",
          borderRadius: 6,
          display: "inline-block",
          fontWeight: 600
        }}>
          Runtime attested by:
        </Title>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {attestedBy.map((company, index) => (
            <Card 
              key={index}
              size="small" 
              style={{ 
                width: 70, 
                height: 50, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                border: "1px solid rgba(34, 197, 194, 0.3)",
                borderRadius: 6,
                backgroundColor: "rgba(55, 65, 81, 0.4)",
                boxShadow: "0 0 10px rgba(34, 197, 194, 0.2)"
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#e2e8f0" }}>{company}</Text>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttestationSection; 