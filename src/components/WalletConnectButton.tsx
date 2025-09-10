import React from "react";
import { ConnectButton } from "arweave-wallet-kit";

const WalletConnectButton: React.FC = () => {
  return (
    <div style={{ 
      position: "absolute", 
      top: 20, 
      right: 20, 
      zIndex: 1000
    }}>
      <ConnectButton 
        profileModal={true} 
        showBalance={true}
        accent="#000000"
        style={{
          fontFamily: "var(--pixel-font-family)",
          fontWeight: "var(--pixel-font-weight)",
          fontSize: "8px",
          background: "#ffffff",
          border: "3px solid #000000",
          color: "#000000",
          boxShadow: "3px 3px 0px #000000",
          borderRadius: "0",
          padding: "8px 12px",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}
      />
    </div>
  );
};

export default WalletConnectButton; 