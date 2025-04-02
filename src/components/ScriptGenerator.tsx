'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { DurationSelector } from './DurationSelector';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

export default function ScriptGenerator() {
  const router = useRouter();
  const [storyIdea, setStoryIdea] = useState('');
  const [duration, setDuration] = useState(3); // Default 3 minutes
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storyIdea.trim()) {
      setError('Please enter a story idea');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setGenerationStatus('Initializing script generation...');
    
    try {
      const targetWordCount = Math.round(duration * 180); // 150 wpm * 1.2 factor = 180
      
      setGenerationStatus(`Generating script with target of ${targetWordCount} words...`);
      
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyIdea,
          duration,
          targetWordCount
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.attempts > 1) {
        setGenerationStatus(`Script generated after ${data.attempts} attempts. Final word count: ${data.wordCount}.`);
        
        // Pause briefly to show the status message
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Encode the script for URL
      const encodedScript = encodeURIComponent(data.script);
      
      // Navigate to the voice generator page with script data
      router.push(`/generate-voice?script=${encodedScript}&wordCount=${data.wordCount}&targetWordCount=${targetWordCount}&withinRange=${data.withinTargetRange}&attempts=${data.attempts}`);
      
    } catch (err) {
      console.error('Error generating script:', err);
      setError('Failed to generate script. Please try again.');
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="storyIdea" className="block text-lg font-medium mb-2">
              Enter your story idea
            </label>
            <textarea
              id="storyIdea"
              value={storyIdea}
              onChange={(e) => setStoryIdea(e.target.value)}
              placeholder="Describe your story idea here..."
              className="w-full h-36 p-4 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
              disabled={isGenerating}
            />
          </div>
          
          <DurationSelector 
            duration={duration} 
            setDuration={setDuration} 
            disabled={isGenerating} 
          />
          
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
              {error}
            </div>
          )}
          
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Generating Script...</span>
                </div>
              ) : (
                'Generate Script'
              )}
            </Button>
          </div>
        </form>
      </div>
      
      {isGenerating && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg border border-gray-700">
          <LoadingSpinner size="lg" className="text-purple-500 mb-4" />
          <p className="text-gray-300">{generationStatus || 'Generating your voice over script...'}</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      )}
    </div>
  );
} 