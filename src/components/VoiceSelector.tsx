'use client';

import React from 'react';

export interface Voice {
  id: string;
  name: string;
  description: string;
}

// Define available voices with their descriptions
export const voices: Voice[] = [
  {
    id: 'uju3wxzG5OhpWcoi3SMy',
    name: 'Michael C. Vincent',
    description: 'Deep, authoritative male voice with a professional tone. Perfect for documentaries and business presentations.'
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Warm and friendly female voice with a conversational style. Ideal for educational content and explainer videos.'
  },
  {
    id: 'ZQe5CZNOzWyzPSCn5a3c',
    name: 'James',
    description: 'Smooth, confident male voice with a slight British accent. Great for narrations and storytelling.'
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    description: 'Young, energetic male voice with a casual tone. Well-suited for youthful content and tutorials.'
  },
  {
    id: '2EiwWnXFnvU5JabPnv8n',
    name: 'Clyde',
    description: 'Deep, resonant male voice with a theatrical quality. Excellent for dramatic narratives and trailers.'
  },
  {
    id: 'EiNlNiXeDU1pqqOPrYMO',
    name: 'John Doe',
    description: 'Neutral, clear male voice with a professional tone. Versatile for various types of content.'
  }
];

interface VoiceSelectorProps {
  selectedVoice: string;
  setSelectedVoice: (voiceId: string) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  setSelectedVoice,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-lg font-medium">
        Select a voice
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {voices.map((voice) => (
          <button
            key={voice.id}
            type="button"
            onClick={() => setSelectedVoice(voice.id)}
            disabled={disabled}
            className={`
              relative p-4 rounded-lg border text-left transition-all
              ${selectedVoice === voice.id 
                ? 'border-purple-500 bg-purple-900/30 text-white' 
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div>
              <div className="font-medium">{voice.name}</div>
              <div className="text-sm text-gray-400 mt-1">{voice.description}</div>
            </div>
            {selectedVoice === voice.id && (
              <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full w-4 h-4"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}; 