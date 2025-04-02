'use client';

import React, { useState } from 'react';
import { VoiceSelector, voices } from './VoiceSelector';
import { AudioPlayer } from './AudioPlayer';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Button } from './ui/Button';
import TranscriptionViewer from './TranscriptionViewer';
import { useSearchParams } from 'next/navigation';

interface VoiceGeneratorProps {
  script: string;
  wordCount: number;
  targetWordCount: number;
  onTranscriptionComplete?: (transcription: any) => void;
}

export default function VoiceGenerator({ script, wordCount, targetWordCount, onTranscriptionComplete }: VoiceGeneratorProps) {
  const searchParams = useSearchParams();
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [transcription, setTranscription] = useState<any>(null);
  const [isFallbackTranscription, setIsFallbackTranscription] = useState(false);
  
  // Get additional parameters from URL
  const withinRange = searchParams.get('withinRange') === 'true';
  const attempts = parseInt(searchParams.get('attempts') || '1');
  
  // Get the selected voice name for display
  const selectedVoiceName = voices.find(voice => voice.id === selectedVoice)?.name || 'Unknown';
  
  // Calculate percentage accuracy of word count
  const percentage = Math.round((wordCount / targetWordCount) * 100);
  const acceptableRange = 10; // 10% tolerance
  const isWithinAcceptableRange = percentage >= (100 - acceptableRange) && percentage <= (100 + acceptableRange);
  
  const handleGenerateVoiceOver = async () => {
    setIsGeneratingVoice(true);
    setVoiceError('');
    setTranscription(null);
    setTranscriptionError('');
    
    try {
      // Revoke previous object URL to avoid memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setAudioBlob(null);
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
      const blob = await response.blob();
      setAudioBlob(blob);
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Remove the automatic transcription
      // await transcribeAudio(blob);
      
    } catch (err) {
      console.error('Error generating voice over:', err);
      setVoiceError('Failed to generate voice over. Please try again.');
    } finally {
      setIsGeneratingVoice(false);
    }
  };
  
  const handleStartTranscription = () => {
    if (audioBlob) {
      transcribeAudio(audioBlob);
    } else {
      setTranscriptionError('No audio available to transcribe');
    }
  };
  
  const transcribeAudio = async (audioBlob: Blob) => {
    if (!audioBlob) {
      setTranscriptionError('No audio available to transcribe');
      return;
    }
    
    setIsTranscribing(true);
    setTranscriptionError('');
    setIsFallbackTranscription(false);
    
    try {
      // Create a form data object to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.mp3');
      formData.append('model', 'large');
      
      // Send the audio for transcription
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTranscription(result.transcription);
        
        // Check if we received a fallback transcription
        if (result.isFallback || result.transcription.is_fallback) {
          setIsFallbackTranscription(true);
        }
        
        // Call the callback if provided
        if (onTranscriptionComplete) {
          onTranscriptionComplete(result.transcription);
        }
      } else {
        throw new Error(result.error || 'Transcription process failed');
      }
      
    } catch (err) {
      console.error('Transcription error:', err);
      setTranscriptionError('Failed to transcribe audio. ' + (err as Error).message);
    } finally {
      setIsTranscribing(false);
    }
  };
  
  return (
    <div className="w-full space-y-8">
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <div>
            <h3 className="font-medium text-lg">Your Script</h3>
            <div className="flex items-center mt-1">
              <span className="text-sm">
                <span className={`font-medium ${isWithinAcceptableRange ? 'text-green-400' : 'text-yellow-400'}`}>
                  {wordCount}
                </span> 
                <span className="text-gray-400"> / {targetWordCount} words</span>
              </span>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                isWithinAcceptableRange 
                  ? 'bg-green-900/30 text-green-400 border border-green-800' 
                  : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
              }`}>
                {percentage}%
              </span>
              {attempts > 1 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-900/30 text-blue-400 border border-blue-800 rounded">
                  Auto-adjusted after {attempts} attempt{attempts > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {isWithinAcceptableRange 
                ? 'Script is within the acceptable word count range (±10%)' 
                : 'Script is outside the target word count range, but the system has made its best attempt to adjust it'}
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-gray-900 text-gray-200 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {script}
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-5 space-y-6">
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
        
        <div className="flex justify-center">
          <Button
            onClick={handleGenerateVoiceOver}
            disabled={isGeneratingVoice || isTranscribing}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3"
            size="lg"
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
          <div className="mt-6 space-y-6">
            <AudioPlayer audioUrl={audioUrl} voiceName={selectedVoiceName} />
            
            <div className="flex justify-center mt-4">
              <Button
                onClick={handleStartTranscription}
                disabled={isTranscribing}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3"
                size="lg"
              >
                {isTranscribing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Approve & Continue to Analysis</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {isTranscribing && (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8 flex flex-col items-center">
          <LoadingSpinner size="lg" className="text-purple-500 mb-4" />
          <p className="text-gray-300">Generating transcription via OpenAI API...</p>
        </div>
      )}
      
      {transcriptionError && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
          <h3 className="font-medium text-lg mb-2">Transcription Error</h3>
          <p>{transcriptionError}</p>
        </div>
      )}
      
      {transcription && !isTranscribing && (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h3 className="font-medium text-lg">Transcription with Timestamps</h3>
            {isFallbackTranscription && (
              <div className="mt-2 px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-200 text-sm">
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>The audio was processed successfully, but precise transcription could not be generated due to a connection issue.</span>
                </p>
                <p className="ml-7 mt-1">The system will use placeholder segments for the image generation. You may continue to the next step.</p>
              </div>
            )}
          </div>
          <div className="p-4">
            <TranscriptionViewer transcription={transcription} />
          </div>
        </div>
      )}
    </div>
  );
} 