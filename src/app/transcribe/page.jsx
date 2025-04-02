'use client';

import { useState } from 'react';
import AudioTranscriber from '@/components/AudioTranscriber';
import TranscriptionViewer from '@/components/TranscriptionViewer';

export default function TranscribePage() {
  const [transcription, setTranscription] = useState(null);
  
  const handleTranscriptionComplete = (result) => {
    setTranscription(result);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Audio Transcription with Whisper</h1>
      
      <div className="mb-8">
        <AudioTranscriber onTranscriptionComplete={handleTranscriptionComplete} />
      </div>
      
      {transcription && (
        <div className="mt-8">
          <TranscriptionViewer transcription={transcription} />
        </div>
      )}
      
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Select an audio file (MP3, WAV, OGG, FLAC, or M4A)</li>
          <li>Choose a Whisper model (larger models are more accurate but slower)</li>
          <li>Optionally specify a language code (e.g., "en" for English)</li>
          <li>Click "Transcribe Audio" to start the transcription process</li>
          <li>View the transcription with timestamps once processing completes</li>
          <li>Search within the transcription or copy the full text</li>
        </ol>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">About Whisper</h3>
          <p>
            Whisper is an automatic speech recognition (ASR) system trained on 680,000 hours 
            of multilingual and multitask supervised data collected from the web. 
            It is designed to recognize, transcribe, and translate multiple languages.
          </p>
          <p className="mt-2">
            The models used range from "tiny" (39M parameters) to "large" (1.5B parameters),
            with accuracy and processing time increasing with model size.
          </p>
        </div>
      </div>
    </div>
  );
} 