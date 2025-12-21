import { Message, Conversation } from '@/types/chat';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const createNewConversation = (): Conversation => {
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createMessage = (role: 'user' | 'assistant', content: string): Message => {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date(),
  };
};

export const generateTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  
  const title = firstUserMessage.content.slice(0, 30);
  return title.length < firstUserMessage.content.length ? `${title}...` : title;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Simulated AI response for demo purposes
const aiResponses = [
  "I understand your question. Let me provide a helpful response.",
  "That's an interesting point. Here's what I think about it.",
  "Great question! Let me break this down for you.",
  "I'd be happy to help you with that. Here's my analysis.",
  "Thank you for asking. Let me share some insights on this topic.",
];

export const simulateAIResponse = async (
  message: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  const baseResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
  const fullResponse = `${baseResponse}\n\nBased on your message: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}", I can provide you with detailed information and assistance. This is a demonstration of the streaming capability, where text appears gradually to simulate real-time generation.\n\nFeel free to ask follow-up questions or request more specific information!`;
  
  const words = fullResponse.split(' ');
  let result = '';
  
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    
    const word = words[i] + (i < words.length - 1 ? ' ' : '');
    result += word;
    onChunk(word);
  }
  
  return result;
};
