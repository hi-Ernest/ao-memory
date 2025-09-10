export interface MemoryItem {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  theme: string;
  tags: string[];
  price: number;
  rating: number;
  downloads: number;
  preview: string;
  isOwned?: boolean;
  isFeatured?: boolean;
  createdAt: string;
}

// 对话记忆专用数据类型
export interface ConversationMemory {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  tags?: string[];
  price: number;
  isPublic: boolean; // 是否公开到marketplace
  walletAddress: string;
  conversationData: ChatMessage[]; // 完整对话数据
  summary?: string; // 自动生成的摘要
  createdAt: string;
  updatedAt: string;
}

// 聊天消息接口
export interface ChatMessage {
  role: "user" | "assistant" | "tip";
  message: string;
  timestamp: number;
}

export interface MemoryTheme {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const MEMORY_THEMES: MemoryTheme[] = [
  { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖', color: '#00ff00' },
  { id: 'programming', name: 'Programming', icon: '💻', color: '#00ffff' },
  { id: 'learning', name: 'Learning', icon: '📚', color: '#ffff00' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎮', color: '#ff00ff' },
  { id: 'business', name: 'Business', icon: '💼', color: '#ffa500' },
  { id: 'creative', name: 'Creative', icon: '🎨', color: '#ff6b6b' },
  { id: 'science', name: 'Science', icon: '🔬', color: '#4ecdc4' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌟', color: '#ffffff' }
];

export const MOCK_MEMORIES: MemoryItem[] = [
  {
    id: '1',
    title: 'React Expert Assistant',
    description: 'Advanced React development knowledge including hooks, context, and performance optimization',
    author: 'DevMaster2023',
    authorAvatar: '👨‍💻',
    theme: 'programming',
    tags: ['React', 'JavaScript', 'Frontend', 'Performance'],
    price: 50,
    rating: 4.8,
    downloads: 1250,
    preview: 'I can help you with React development, including component optimization, state management...',
    isFeatured: true,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'AI Ethics Consultant',
    description: 'Comprehensive knowledge about AI ethics, responsible AI development, and bias mitigation',
    author: 'EthicsGuru',
    authorAvatar: '🧠',
    theme: 'ai-assistant',
    tags: ['Ethics', 'AI', 'Responsibility', 'Bias'],
    price: 75,
    rating: 4.9,
    downloads: 890,
    preview: 'I can guide you through ethical AI development practices, bias detection...',
    isFeatured: true,
    createdAt: '2024-01-12'
  },
  {
    id: '3',
    title: 'Pixel Art Creator',
    description: 'Master pixel art techniques, color theory, and sprite animation for indie games',
    author: 'PixelMaster',
    authorAvatar: '🎨',
    theme: 'creative',
    tags: ['Pixel Art', 'Game Design', 'Animation', 'Sprites'],
    price: 30,
    rating: 4.7,
    downloads: 2100,
    preview: 'I can teach you pixel art fundamentals, from basic sprites to complex animations...',
    createdAt: '2024-01-10'
  },
  {
    id: '4',
    title: 'Machine Learning Tutor',
    description: 'Complete ML knowledge from basics to advanced deep learning and neural networks',
    author: 'MLExpert',
    authorAvatar: '🔬',
    theme: 'learning',
    tags: ['Machine Learning', 'Python', 'TensorFlow', 'AI'],
    price: 100,
    rating: 4.9,
    downloads: 750,
    preview: 'I can explain machine learning concepts from linear regression to transformers...',
    isFeatured: true,
    createdAt: '2024-01-08'
  },
  {
    id: '5',
    title: 'Crypto Trading Bot',
    description: 'Advanced cryptocurrency trading strategies and market analysis techniques',
    author: 'CryptoTrader',
    authorAvatar: '💰',
    theme: 'business',
    tags: ['Crypto', 'Trading', 'Analysis', 'DeFi'],
    price: 120,
    rating: 4.6,
    downloads: 650,
    preview: 'I can analyze crypto markets, suggest trading strategies, and explain DeFi protocols...',
    createdAt: '2024-01-05'
  },
  {
    id: '6',
    title: 'Game Design Mentor',
    description: 'Indie game development wisdom, from concept to publishing on Steam',
    author: 'IndieDev',
    authorAvatar: '🎮',
    theme: 'entertainment',
    tags: ['Game Design', 'Unity', 'Indie', 'Steam'],
    price: 80,
    rating: 4.8,
    downloads: 420,
    preview: 'I can guide you through the entire indie game development process...',
    createdAt: '2024-01-03'
  },
  {
    id: '7',
    title: 'Meditation Guide',
    description: 'Mindfulness practices, stress reduction, and mental wellness techniques',
    author: 'ZenMaster',
    authorAvatar: '🧘',
    theme: 'lifestyle',
    tags: ['Meditation', 'Mindfulness', 'Wellness', 'Stress'],
    price: 25,
    rating: 4.9,
    downloads: 1800,
    preview: 'I can guide you through various meditation techniques and mindfulness practices...',
    createdAt: '2024-01-01'
  },
  {
    id: '8',
    title: 'Blockchain Developer',
    description: 'Smart contract development, Solidity programming, and Web3 integration',
    author: 'Web3Builder',
    authorAvatar: '⛓️',
    theme: 'programming',
    tags: ['Blockchain', 'Solidity', 'Web3', 'Smart Contracts'],
    price: 150,
    rating: 4.7,
    downloads: 380,
    preview: 'I can help you build smart contracts, integrate Web3 functionality...',
    isFeatured: true,
    createdAt: '2023-12-28'
  },
  {
    id: '9',
    title: 'Quantum Computing Expert',
    description: 'Quantum algorithms, quantum mechanics principles, and quantum programming',
    author: 'QuantumDoc',
    authorAvatar: '⚛️',
    theme: 'science',
    tags: ['Quantum', 'Physics', 'Algorithms', 'Research'],
    price: 200,
    rating: 4.9,
    downloads: 150,
    preview: 'I can explain quantum computing concepts from basic qubits to complex algorithms...',
    createdAt: '2023-12-25'
  },
  {
    id: '10',
    title: 'Digital Marketing Strategist',
    description: 'Social media marketing, SEO optimization, and content strategy expertise',
    author: 'MarketingPro',
    authorAvatar: '📈',
    theme: 'business',
    tags: ['Marketing', 'SEO', 'Social Media', 'Strategy'],
    price: 60,
    rating: 4.5,
    downloads: 920,
    preview: 'I can develop comprehensive digital marketing strategies and campaigns...',
    createdAt: '2023-12-20'
  }
];
