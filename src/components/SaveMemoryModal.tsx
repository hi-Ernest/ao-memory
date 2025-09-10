import React, { useState, useEffect } from 'react';
import { MEMORY_THEMES } from '../types/memory';
import type { ConversationMemory, ChatMessage } from '../types/memory';

interface SaveMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memoryData: Partial<ConversationMemory>) => void;
  conversationData: ChatMessage[];
  walletAddress: string;
}

const SaveMemoryModal: React.FC<SaveMemoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  conversationData,
  walletAddress
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('ai-assistant');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [price, setPrice] = useState(0);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // 智能推荐价格 - 基于对话长度和复杂度
  const getRecommendedPrice = () => {
    const messageCount = conversationData.filter(msg => msg.role !== 'tip').length;
    const totalLength = conversationData.reduce((sum, msg) => sum + msg.message.length, 0);
    
    // 基础价格计算：消息数量 * 5 + 内容长度 / 100
    const basePrice = Math.max(10, messageCount * 5 + Math.floor(totalLength / 100));
    return Math.min(basePrice, 500); // 最高500
  };

  // 自动生成摘要
  const generateSummary = () => {
    const userMessages = conversationData
      .filter(msg => msg.role === 'user')
      .slice(0, 3) // 取前3个用户消息
      .map(msg => msg.message.substring(0, 50))
      .join(', ');
    
    return `Discussion about: ${userMessages}...`;
  };

  // 初始化推荐价格
  useEffect(() => {
    if (isOpen && conversationData.length > 0) {
      setPrice(getRecommendedPrice());
    }
  }, [isOpen, conversationData]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return; // 标题是必填的
    }

    setSaving(true);
    
    const memoryData: Partial<ConversationMemory> = {
      title: title.trim(),
      description: description.trim() || generateSummary(),
      theme: theme,
      tags: tags,
      price: price,
      isPublic: isPublic,
      walletAddress: walletAddress,
      conversationData: conversationData.filter(msg => msg.role !== 'tip'), // 过滤掉系统提示
      summary: generateSummary(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSave(memoryData);
      handleClose();
    } catch (error) {
      console.error('Failed to save memory:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setTheme('ai-assistant');
    setTags([]);
    setTagInput('');
    setPrice(0);
    setIsPublic(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: "var(--pixel-font-family)",
      fontWeight: "var(--pixel-font-weight)"
    }}>
      <div style={{
        background: '#000000',
        border: '4px solid #ffffff',
        boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.5)',
        width: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Corner decorations */}
        <div style={{ position: "absolute", top: "-4px", left: "-4px", width: "12px", height: "12px", background: "#ffffff", zIndex: 10 }} />
        <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "12px", height: "12px", background: "#ffffff", zIndex: 10 }} />
        <div style={{ position: "absolute", bottom: "-4px", left: "-4px", width: "12px", height: "12px", background: "#ffffff", zIndex: 10 }} />
        <div style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "12px", height: "12px", background: "#ffffff", zIndex: 10 }} />

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
          <span>💾 SAVE CONVERSATION MEMORY</span>
          <button
            onClick={handleClose}
            className="pixel-button"
            style={{
              fontSize: '8px',
              padding: '4px 8px',
              background: '#ff0000',
              color: '#ffffff',
              border: '2px solid #000000'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', color: '#ffffff' }}>
          {/* Title - Required */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '8px', 
              marginBottom: '6px',
              color: '#ffff00'
            }}>
              📝 MEMORY TITLE (REQUIRED) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a memorable title..."
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '8px',
                background: '#333333',
                color: '#ffffff',
                border: title.trim() ? '2px solid #00ff00' : '2px solid #ff0000',
                fontFamily: "var(--pixel-font-family)",
                fontWeight: "var(--pixel-font-weight)",
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Description - Optional */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '8px', 
              marginBottom: '6px',
              color: '#ffffff'
            }}>
              📄 DESCRIPTION (OPTIONAL)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this conversation... (will auto-generate if empty)"
              style={{
                width: '100%',
                height: '60px',
                padding: '8px',
                fontSize: '8px',
                background: '#333333',
                color: '#ffffff',
                border: '2px solid #ffffff',
                fontFamily: "var(--pixel-font-family)",
                fontWeight: "var(--pixel-font-weight)",
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Theme Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '8px', 
              marginBottom: '6px',
              color: '#ffffff'
            }}>
              🎨 THEME
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '8px',
                background: '#333333',
                color: '#ffffff',
                border: '2px solid #ffffff',
                fontFamily: "var(--pixel-font-family)",
                fontWeight: "var(--pixel-font-weight)",
                outline: 'none'
              }}
            >
              {MEMORY_THEMES.map(themeOption => (
                <option key={themeOption.id} value={themeOption.id}>
                  {themeOption.icon} {themeOption.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '8px', 
              marginBottom: '6px',
              color: '#ffffff'
            }}>
              🏷️ TAGS
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tags..."
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '7px',
                  background: '#333333',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  fontFamily: "var(--pixel-font-family)",
                  fontWeight: "var(--pixel-font-weight)",
                  outline: 'none'
                }}
              />
              <button
                onClick={handleAddTag}
                className="pixel-button"
                style={{
                  fontSize: '6px',
                  padding: '6px 12px',
                  background: '#00ff00',
                  color: '#000000',
                  border: '2px solid #000000'
                }}
              >
                ADD
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    background: '#ffff00',
                    color: '#000000',
                    padding: '2px 6px',
                    fontSize: '6px',
                    border: '1px solid #000000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ✕
                </span>
              ))}
            </div>
          </div>

          {/* Price Settings */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '8px', 
              marginBottom: '6px',
              color: '#ffffff'
            }}>
              💰 PRICE: {price} AOM
              <span style={{ 
                color: '#ffff00', 
                fontSize: '6px', 
                marginLeft: '8px' 
              }}>
                (Recommended: {getRecommendedPrice()} AOM)
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="5"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              style={{
                width: '100%',
                background: '#333333'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '6px', 
              color: '#888888',
              marginTop: '4px'
            }}>
              <span>0 AOM (Free)</span>
              <span>1000 AOM</span>
            </div>
          </div>

          {/* Public Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '8px',
              color: '#ffffff',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              🌐 PUBLISH TO MARKETPLACE
              {isPublic && (
                <span style={{ color: '#ffff00', fontSize: '6px' }}>
                  (Others can discover and purchase this memory)
                </span>
              )}
            </label>
          </div>

          {/* Conversation Preview */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '8px', 
              marginBottom: '6px',
              color: '#ffffff'
            }}>
              💬 CONVERSATION PREVIEW ({conversationData.filter(msg => msg.role !== 'tip').length} messages)
            </label>
            <div style={{
              background: '#333333',
              border: '2px solid #ffffff',
              padding: '8px',
              maxHeight: '100px',
              overflowY: 'auto',
              fontSize: '6px',
              color: '#00ff00'
            }}>
              {conversationData.slice(0, 5).map((msg, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                  <span style={{ color: msg.role === 'user' ? '#00ff00' : '#ffffff' }}>
                    {msg.role === 'user' ? 'USER: ' : 'MEMO: '}
                  </span>
                  <span>{msg.message.substring(0, 80)}...</span>
                </div>
              ))}
              {conversationData.length > 5 && (
                <div style={{ color: '#888888' }}>
                  ... and {conversationData.length - 5} more messages
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end' 
          }}>
            <button
              onClick={handleClose}
              className="pixel-button"
              style={{
                fontSize: '8px',
                padding: '8px 16px',
                background: '#666666',
                color: '#ffffff',
                border: '2px solid #000000'
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="pixel-button"
              style={{
                fontSize: '8px',
                padding: '8px 16px',
                background: (!title.trim() || saving) ? '#333333' : '#00ff00',
                color: '#000000',
                border: '2px solid #000000',
                opacity: (!title.trim() || saving) ? 0.6 : 1
              }}
            >
              {saving ? 'SAVING...' : 'SAVE MEMORY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveMemoryModal;
