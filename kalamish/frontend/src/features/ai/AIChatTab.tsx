import React, { useState } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { ChatMessage } from '../../types';
import { Button } from '../../components/Button';

interface AIChatTabProps {
  novelId: string;
}

export const AIChatTab: React.FC<AIChatTabProps> = ({ novelId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI novel co-author. Ask me to brainstorm plot twists, review character arcs, or outline your next chapter!",
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    const newHistory = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newHistory);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await apiClient.post('/ai/chat', {
        novel_id: novelId,
        message: userText,
        history: newHistory,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant' as const, content: res.data.reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: 'Sorry, I ran into an issue communicating with the AI service.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] text-xs select-none">
      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-vscode-accent/20 border border-vscode-accent/40 flex items-center justify-center text-vscode-accent shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-2.5 rounded-xl text-[11px] leading-relaxed ${
                  isUser
                    ? 'bg-vscode-accent text-white rounded-tr-none'
                    : 'bg-vscode-bg border border-vscode-border text-vscode-text rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
              {isUser && (
                <div className="w-6 h-6 rounded-full bg-vscode-hover border border-vscode-border flex items-center justify-center text-vscode-text shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
        {isSending && (
          <div className="flex items-center gap-2 text-vscode-muted text-[11px]">
            <Bot className="w-3.5 h-3.5 animate-pulse text-vscode-accent" />
            <span>AI Co-Author is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Message Bar */}
      <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-vscode-border">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask your AI co-author..."
          className="flex-1 bg-vscode-input border border-vscode-border text-vscode-text text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-vscode-accent transition-colors"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSending}
          disabled={!inputMessage.trim()}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
};
