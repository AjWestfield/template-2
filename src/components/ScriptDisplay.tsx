'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { VoiceSelector, voices } from './VoiceSelector';
import { AudioPlayer } from './AudioPlayer';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ScriptDisplayProps {
  script: string;
  wordCount: number;
  targetWordCount: number;
}

export const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ 
  script, 
  wordCount, 
  targetWordCount 
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState('');
  
  // Get the selected voice name for display
  const selectedVoiceName = voices.find(voice => voice.id === selectedVoice)?.name || 'Unknown';
  
  // Calculate percentage accuracy of word count
  const percentage = Math.round((wordCount / targetWordCount) * 100);
  const isWithinRange = percentage >= 95 && percentage <= 105;
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setIsCopied(true);
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const handleGenerateVoiceOver = async () => {
    setIsGeneratingVoice(true);
    setVoiceError('');
    
    try {
      // Revoke previous object URL to avoid memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          voiceId: selectedVoice
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Get audio data as blob
      const audioBlob = await response.blob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err) {
      console.error('Error generating voice over:', err);
      setVoiceError('Failed to generate voice over. Please try again.');
    } finally {
      setIsGeneratingVoice(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
        <div>
          <h3 className="font-medium text-lg">Generated Script</h3>
          <div className="flex items-center mt-1">
            <span className="text-sm">
              <span className={`font-medium ${isWithinRange ? 'text-green-400' : 'text-yellow-400'}`}>
                {wordCount}
              </span> 
              <span className="text-gray-400"> / {targetWordCount} words</span>
            </span>
            <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
              isWithinRange 
                ? 'bg-green-900/30 text-green-400 border border-green-800' 
                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
            }`}>
              {percentage}%
            </span>
          </div>
        </div>
        <Button 
          onClick={handleCopyToClipboard}
          variant="secondary" 
          size="sm"
          className="flex items-center space-x-1"
        >
          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            className="w-4 h-4"
          >
            {isCopied ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            )}
          </svg>
        </Button>
      </div>
      
      <div className="p-5 bg-gray-900 text-gray-200 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
        {script}
      </div>
      
      <div className="border-t border-gray-700 p-5 space-y-6">
        <h3 className="font-medium text-lg mb-4">Generate Voice Over</h3>
        
        <VoiceSelector 
          selectedVoice={selectedVoice} 
          setSelectedVoice={setSelectedVoice}
          disabled={isGeneratingVoice}
        />
        
        {voiceError && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 my-4">
            {voiceError}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            onClick={handleGenerateVoiceOver}
            disabled={isGeneratingVoice}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isGeneratingVoice ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Generating Voice...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
                <span>Generate Voice Over</span>
              </>
            )}
          </Button>
        </div>
        
        {audioUrl && !isGeneratingVoice && (
          <div className="mt-4">
            <AudioPlayer audioUrl={audioUrl} voiceName={selectedVoiceName} />
          </div>
        )}
      </div>
    </div>
  );
}; 