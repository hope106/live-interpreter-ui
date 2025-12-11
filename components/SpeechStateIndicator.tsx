import React from 'react';
import { SpeechState } from '../types';

interface SpeechStateIndicatorProps {
  state: SpeechState;
}

const SpeechStateIndicator: React.FC<SpeechStateIndicatorProps> = ({ state }) => {
  const stateConfig = {
    speaking: {
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-400',
      iconColor: 'text-green-500',
      icon: '🎤',
      text: '말씀하세요...',
      animation: 'animate-pulse-custom'
    },
    silent: {
      bgColor: 'bg-zinc-800/50',
      borderColor: 'border-zinc-700',
      textColor: 'text-zinc-400',
      iconColor: 'text-zinc-500',
      icon: '👂',
      text: '듣고 있습니다...',
      animation: ''
    },
    processing: {
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-400',
      iconColor: 'text-blue-500',
      icon: '⏳',
      text: '처리 중...',
      animation: 'animate-spin-slow'
    }
  };

  const config = stateConfig[state];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.bgColor} ${config.borderColor} transition-all duration-300`}>
      <div className={`text-2xl ${config.animation}`}>
        {config.icon}
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
        <span className="text-xs text-zinc-500 capitalize">
          {state}
        </span>
      </div>
    </div>
  );
};

export default SpeechStateIndicator;
