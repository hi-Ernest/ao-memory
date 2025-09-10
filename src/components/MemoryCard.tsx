import React from 'react';
import type { MemoryItem } from '../types/memory';
import { MEMORY_THEMES } from '../types/memory';

interface MemoryCardProps {
  memory: MemoryItem;
  onPurchase: (memory: MemoryItem) => void;
  onImport: (memory: MemoryItem) => void;
  userBalance: number;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onPurchase, onImport, userBalance }) => {
  const theme = MEMORY_THEMES.find(t => t.id === memory.theme);
  const canAfford = userBalance >= memory.price;
  
  // Generate pixel stars for rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} style={{ color: '#ffff00' }}>★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" style={{ color: '#ffff00' }}>☆</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} style={{ color: '#666666' }}>☆</span>);
    }
    return stars;
  };

  return (
    <div style={{
      background: '#000000',
      border: '3px solid #ffffff',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
      fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)",
      position: 'relative'
    }}>
      {/* Featured badge */}
      {memory.isFeatured && (
        <div style={{
          position: 'absolute',
          top: '-3px',
          right: '16px',
          background: '#ffff00',
          color: '#000000',
          padding: '4px 8px',
          fontSize: '6px',
          border: '2px solid #000000'
        }}>
          FEATURED
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        gap: '8px'
      }}>
        <div style={{
          fontSize: '16px',
          background: theme?.color || '#ffffff',
          color: '#000000',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #000000'
        }}>
          {theme?.icon}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#ffffff',
            fontSize: '8px',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}>
            {memory.title}
          </div>
          <div style={{
            color: '#cccccc',
            fontSize: '6px'
          }}>
            by {memory.authorAvatar} {memory.author}
          </div>
        </div>
        
        <div style={{
          background: '#00ff00',
          color: '#000000',
          padding: '4px 8px',
          fontSize: '8px',
          border: '2px solid #000000',
          fontWeight: 'bold'
        }}>
          ${memory.price} AOM
        </div>
      </div>

      {/* Description */}
      <div style={{
        color: '#cccccc',
        fontSize: '6px',
        lineHeight: '1.4',
        marginBottom: '12px',
        minHeight: '32px'
      }}>
        {memory.description}
      </div>

      {/* Tags */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '12px'
      }}>
        {memory.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            style={{
              background: '#333333',
              color: '#ffffff',
              padding: '2px 6px',
              fontSize: '5px',
              border: '1px solid #666666'
            }}
          >
            #{tag}
          </span>
        ))}
        {memory.tags.length > 3 && (
          <span style={{
            color: '#666666',
            fontSize: '5px',
            alignSelf: 'center'
          }}>
            +{memory.tags.length - 3} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '6px',
          color: '#ffff00'
        }}>
          {renderStars(memory.rating)} ({memory.rating})
        </div>
        
        <div style={{
          fontSize: '6px',
          color: '#00ffff'
        }}>
          ⬇ {memory.downloads.toLocaleString()}
        </div>
      </div>

      {/* Preview */}
      <div style={{
        background: '#333333',
        border: '2px solid #666666',
        padding: '8px',
        marginBottom: '12px',
        fontSize: '5px',
        color: '#cccccc',
        fontStyle: 'italic',
        minHeight: '24px'
      }}>
        "{memory.preview}"
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        {memory.isOwned ? (
          <button
            onClick={() => onImport(memory)}
            className="pixel-button"
            style={{
              flex: 1,
              fontSize: '6px',
              padding: '8px',
              background: '#00ff00',
              color: '#000000'
            }}
          >
            ✅ IMPORT
          </button>
        ) : (
          <button
            onClick={() => onPurchase(memory)}
            disabled={!canAfford}
            className="pixel-button"
            style={{
              flex: 1,
              fontSize: '6px',
              padding: '8px',
              background: canAfford ? '#ffffff' : '#666666',
              color: '#000000',
              opacity: canAfford ? 1 : 0.6
            }}
          >
            {canAfford ? '💰 BUY' : '❌ NO FUNDS'}
          </button>
        )}
        
        <button
          className="pixel-button"
          style={{
            fontSize: '6px',
            padding: '8px 12px',
            background: '#ffff00',
            color: '#000000'
          }}
        >
          👁 PREVIEW
        </button>
      </div>
    </div>
  );
};

export default MemoryCard;
