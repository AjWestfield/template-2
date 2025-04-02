'use client';

import { useState } from 'react';

/**
 * Component for transcribing audio files using OpenAI's Whisper
 */
export default function AudioTranscriber({ onTranscriptionComplete }) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState('');
  const [file, setFile] = useState(null);
  const [model, setModel] = useState('large');
  const [language, setLanguage] = useState('');
  
  // Available Whisper models
  const models = [
    { id: 'tiny.en', name: 'Tiny English (fastest)' },
    { id: 'tiny', name: 'Tiny (fast, multilingual)' },
    { id: 'base.en', name: 'Base English' },
    { id: 'base', name: 'Base (multilingual)' },
    { id: 'small.en', name: 'Small English' },
    { id: 'small', name: 'Small (multilingual)' },
    { id: 'medium.en', name: 'Medium English' },
    { id: 'medium', name: 'Medium (multilingual)' },
    { id: 'large-v1', name: 'Large v1' },
    { id: 'large-v2', name: 'Large v2' },
    { id: 'large', name: 'Large (most accurate, slowest)' }
  ];
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleTranscribe = async () => {
    if (!file) {
      setProgress('Please select an audio file first');
      return;
    }
    
    try {
      setIsTranscribing(true);
      setProgress('Preparing file for transcription...');
      
      // Extract the file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        setProgress('Error: Unsupported file format. Please use MP3, WAV, OGG, FLAC, or M4A.');
        setIsTranscribing(false);
        return;
      }
      
      setProgress(`Uploading file and preparing for transcription...`);
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('model', model);
      
      if (language.trim()) {
        formData.append('language', language.trim());
      }
      
      // Call the API endpoint
      setProgress(`Loading Whisper ${model} model and starting transcription...`);
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Transcription process failed');
      }
      
      setProgress('Transcription complete!');
      
      // Pass the result to the parent component
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result.transcription);
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      setProgress(`Error during transcription: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Audio Transcription</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Select audio file
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={isTranscribing}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Select Whisper model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={isTranscribing}
          className="w-full p-2 border rounded"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Larger models are more accurate but slower
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Language (optional)
        </label>
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="en, es, fr, etc. (leave empty for auto-detect)"
          disabled={isTranscribing}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <button
        onClick={handleTranscribe}
        disabled={isTranscribing || !file}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded"
      >
        {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
      </button>
      
      {progress && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <p>{progress}</p>
        </div>
      )}
    </div>
  );
} 