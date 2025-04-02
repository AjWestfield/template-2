'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface AudioPlayerProps {
  audioUrl: string | null;
  voiceName: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, voiceName }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  useEffect(() => {
    // Reset player state when audio changes
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    
    // Create audio element ref
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });
      
      // Clean up
      return () => {
        audio.pause();
        audio.src = '';
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('timeupdate', () => {});
        audio.removeEventListener('ended', () => {});
      };
    }
  }, [audioUrl]);
  
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const value = parseFloat(e.target.value);
    const newTime = (value / 100) * duration;
    
    audioRef.current.currentTime = newTime;
    setProgress(value);
    setCurrentTime(newTime);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  if (!audioUrl) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 w-full border border-gray-700">
      <div className="flex items-center mb-4">
        <Button 
          onClick={togglePlayPause} 
          variant="primary"
          size="sm"
          className="w-12 h-12 rounded-full p-0 flex items-center justify-center mr-4 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7 0a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </Button>
        <div className="flex-1">
          <div className="font-medium">Voice Over</div>
          <div className="text-sm text-gray-400">Narrated by {voiceName}</div>
        </div>
        <div className="text-sm font-medium text-blue-400">
          {formatTime(currentTime)}
        </div>
      </div>
      
      <div className="w-full relative h-4 flex items-center group">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="w-full absolute z-10 h-1.5 opacity-0 cursor-pointer"
        />
        <div className="absolute w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div 
          className="absolute h-3 w-3 rounded-full bg-white shadow-md transform -translate-y-1/2 top-1/2 pointer-events-none group-hover:scale-110 transition-transform"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>
      
      <div className="flex justify-end mt-3">
        <a
          href={audioUrl}
          download="voice-over.mp3"
          className="text-sm text-purple-400 hover:text-purple-300 flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Audio
        </a>
      </div>
    </div>
  );
}; 