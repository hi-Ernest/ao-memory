import React, { useState } from 'react';
import type { MemoryItem } from '../types/memory';
import { MEMORY_THEMES, MOCK_MEMORIES } from '../types/memory';
import MemoryCard from './MemoryCard';

interface MemoryMarketplaceProps {
  userBalance: number;
  onPurchase: (memory: MemoryItem) => void;
  onImport: (memory: MemoryItem) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const MemoryMarketplace: React.FC<MemoryMarketplaceProps> = ({ 
  userBalance, 
  onPurchase, 
  onImport,
  onToggleFullscreen,
  isFullscreen
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'price' | 'downloads'>('featured');

  // Filter and sort memories
  const filteredMemories = MOCK_MEMORIES
    .filter(memory => {
      const matchesSearch = memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memory.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTheme = selectedTheme === 'all' || memory.theme === selectedTheme;
      return matchesSearch && matchesTheme;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.rating - a.rating;
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.price - b.price;
        case 'downloads':
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#000000',
      border: '4px solid #ffffff',
      fontFamily: "'Press Start 2P', cursive",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Corner decorations */}
      <div style={{
        position: "absolute",
        top: "-4px",
        left: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      <div style={{
        position: "absolute",
        top: "-4px",
        right: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      <div style={{
        position: "absolute",
        bottom: "-4px",
        left: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      <div style={{
        position: "absolute",
        bottom: "-4px",
        right: "-4px",
        width: "12px",
        height: "12px",
        background: "#ffffff",
        zIndex: 10
      }} />
      
      {/* Header */}
      <div style={{
        background: '#ffffff',
        color: '#000000',
        padding: '12px 16px',
        fontSize: '10px',
        borderBottom: '2px solid #000000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>🏪 MEMORY MARKETPLACE</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="pixel-button"
              style={{
                fontSize: '6px',
                padding: '4px 8px',
                background: '#ffff00',
                color: '#000000',
                border: '2px solid #000000',
                cursor: 'pointer'
              }}
            >
              {isFullscreen ? 'MINIMIZE' : 'FULLSCREEN'}
            </button>
          )}
          <div style={{
            background: '#00ff00',
            color: '#000000',
            padding: '4px 8px',
            border: '2px solid #000000',
            fontSize: '8px'
          }}>
            💰 ${userBalance} AOM
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '200px',
          background: '#333333',
          borderRight: '2px solid #ffffff',
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Search */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              color: '#ffffff',
              fontSize: '6px',
              marginBottom: '8px'
            }}>
              🔍 SEARCH:
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search memories..."
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '6px',
                background: '#000000',
                color: '#00ff00',
                border: '2px solid #ffffff',
                fontFamily: "'Press Start 2P', cursive",
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Sort Options */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              color: '#ffffff',
              fontSize: '6px',
              marginBottom: '8px'
            }}>
              📊 SORT BY:
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '6px',
                background: '#000000',
                color: '#00ff00',
                border: '2px solid #ffffff',
                fontFamily: "'Press Start 2P', cursive",
                outline: 'none'
              }}
            >
              <option value="featured">⭐ Featured</option>
              <option value="rating">🌟 Rating</option>
              <option value="price">💰 Price</option>
              <option value="downloads">⬇ Downloads</option>
            </select>
          </div>

          {/* Theme Filter */}
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '6px',
              marginBottom: '8px'
            }}>
              🎨 THEMES:
            </div>
            
            <button
              onClick={() => setSelectedTheme('all')}
              className="pixel-button"
              style={{
                width: '100%',
                marginBottom: '4px',
                fontSize: '5px',
                padding: '6px',
                background: selectedTheme === 'all' ? '#00ff00' : '#ffffff',
                color: '#000000'
              }}
            >
              📋 ALL THEMES
            </button>
            
            {MEMORY_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className="pixel-button"
                style={{
                  width: '100%',
                  marginBottom: '4px',
                  fontSize: '5px',
                  padding: '6px',
                  background: selectedTheme === theme.id ? theme.color : '#ffffff',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{theme.icon}</span>
                <span>{theme.name.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px',
            padding: '8px 12px',
            background: '#333333',
            border: '2px solid #ffffff',
            fontSize: '6px',
            color: '#ffffff'
          }}>
            <span>📊 {filteredMemories.length} MEMORIES FOUND</span>
            <span>🔥 {filteredMemories.filter(m => m.isFeatured).length} FEATURED</span>
            <span>⭐ AVG RATING: {(filteredMemories.reduce((sum, m) => sum + m.rating, 0) / filteredMemories.length || 0).toFixed(1)}</span>
          </div>

          {/* Memory Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {filteredMemories.map(memory => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onPurchase={onPurchase}
                onImport={onImport}
                userBalance={userBalance}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredMemories.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666666',
              fontSize: '8px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔍</div>
              <div>NO MEMORIES FOUND</div>
              <div style={{ fontSize: '6px', marginTop: '8px' }}>
                Try adjusting your search or filters
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryMarketplace;
