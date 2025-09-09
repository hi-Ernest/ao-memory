import React from "react";
import { ConnectButton } from "arweave-wallet-kit";

const WalletConnectButton: React.FC = () => {
  return (
    <div style={{ 
      position: "absolute", 
      top: 24, 
      right: 24, 
      zIndex: 1000,
      background: "rgba(31, 41, 55, 0.95)",
      borderRadius: 12,
      padding: "8px",
      boxShadow: "0 0 25px rgba(34, 197, 194, 0.4)",
      border: "1px solid rgba(34, 197, 194, 0.6)",
      backdropFilter: "blur(15px)"
    }}>
      <ConnectButton 
        profileModal={true} 
        showBalance={true}
        accent="#22c5c2"
        style={{
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "14px",
          color: "#e2e8f0",
          background: "transparent",
          border: "none"
        }}
      />
    </div>
  );
};

export default WalletConnectButton; 