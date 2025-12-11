import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Bot, User } from 'lucide-react';

interface TranscriptProps {
  messages: ChatMessage[];
  userText: string;
  modelText: string;
}

const Transcript: React.FC<TranscriptProps> = ({ messages, userText, modelText }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages or streaming content updates
  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userText, modelText]);

  if (messages.length === 0 && !userText && !modelText) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
        <Bot className="w-12 h-12 mb-4" />
        <p className="text-sm">Ready to interpret.</p>
        <p className="text-xs mt-2">Speak Korean or English.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full scroll-smooth pb-20">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {msg.role === 'model' && (
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-blue-400" />
            </div>
          )}
          
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
                : 'bg-blue-950/40 border border-blue-900/50 text-blue-100 rounded-tl-sm'
            }`}
          >
            {msg.text}
          </div>

          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-zinc-400" />
            </div>
          )}
        </div>
      ))}

      {/* Real-time User Input Bubble */}
      {userText.trim() && (
         <div className="flex gap-3 justify-end">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed opacity-80 bg-zinc-800/80 text-zinc-100 rounded-tr-sm">
              {userText}
              <span className="inline-block w-1 h-3 ml-1 bg-current animate-pulse align-middle opacity-50"/>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center flex-shrink-0 animate-pulse">
              <User size={16} className="text-zinc-400" />
            </div>
          </div>
      )}

      {/* Real-time Model Response Bubble */}
      {modelText.trim() && (
        <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot size={16} className="text-blue-400" />
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed opacity-80 bg-blue-950/30 border border-blue-900/30 text-blue-100 rounded-tl-sm">
              {modelText}
              <span className="inline-block w-1 h-3 ml-1 bg-current animate-pulse align-middle opacity-50"/>
            </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default Transcript;