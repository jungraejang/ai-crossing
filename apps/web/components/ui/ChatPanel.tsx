'use client';

import { useState, useRef, useEffect } from 'react';
import type { Villager } from '@ai-crossing/shared';

interface ChatMessage {
  speaker: 'player' | string;
  text: string;
  timestamp: number;
}

interface Props {
  villager: Villager;
}

export function ChatPanel({ villager }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
  }, [villager.profile.id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { speaker: 'player', text, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villagerId: villager.profile.id,
          message: text,
        }),
      });

      if (!res.ok) throw new Error('Chat failed');

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          speaker: villager.profile.name,
          text: data.dialogue ?? 'Hmm...',
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          speaker: villager.profile.name,
          text: '...*looks confused*...',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-64">
      <div className="px-3 py-2 text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wide border-b border-[var(--color-border)]">
        Chat with {villager.profile.name}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${msg.speaker === 'player' ? 'text-right' : ''}`}
          >
            <span className="text-xs text-[var(--color-text-dim)]">{msg.speaker === 'player' ? 'You' : msg.speaker}</span>
            <div
              className={`inline-block px-2 py-1 rounded mt-0.5 max-w-[90%] ${
                msg.speaker === 'player'
                  ? 'bg-[var(--color-accent)] text-white ml-auto'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text)]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-xs text-[var(--color-text-dim)] animate-pulse">
            {villager.profile.name} is thinking...
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[var(--color-border)] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={`Say something to ${villager.profile.name}...`}
          className="flex-1 bg-[var(--color-bg)] text-sm px-2 py-1 rounded border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-3 py-1 bg-[var(--color-accent)] text-white text-sm rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  );
}
