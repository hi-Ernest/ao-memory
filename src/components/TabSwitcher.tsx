import React from 'react';

interface TabSwitcherProps {
  activeTab: 'chat' | 'marketplace';
  onTabChange: (tab: 'chat' | 'marketplace') => void;
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ activeTab, onTabChange }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      gap: '12px'
    }}>
      <button
        onClick={() => onTabChange('chat')}
        className="pixel-button"
        style={{
          fontSize: '8px',
          padding: '12px 16px',
          background: activeTab === 'chat' ? '#00ff00' : '#ffffff',
          color: '#000000',
          border: '3px solid #000000',
          width: '100%',
          textAlign: 'center'
        }}
      >
        💬 CHAT
      </button>
      
      <button
        onClick={() => onTabChange('marketplace')}
        className="pixel-button"
        style={{
          fontSize: '8px',
          padding: '12px 16px',
          background: activeTab === 'marketplace' ? '#00ff00' : '#ffffff',
          color: '#000000',
          border: '3px solid #000000',
          width: '100%',
          textAlign: 'center'
        }}
      >
        🏪 MEMORY MARKET
      </button>
    </div>
  );
};

export default TabSwitcher;
