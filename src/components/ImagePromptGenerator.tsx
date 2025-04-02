'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ImagePromptGeneratorProps {
  imagePrompt: string;
  negativePrompt?: string;
  modelId?: string;
}

export default function ImagePromptGenerator({ 
  imagePrompt, 
  negativePrompt = '',
  modelId = 'flux/stable-diffusion-3.0-medium'
}: ImagePromptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // For now we're using a placeholder function - in a real implementation
      // you would integrate with an image generation API like Replicate or Stability AI
      // This function simulates an API call and returns a placeholder image
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Generate a placeholder image URL
      // In a real implementation, this would be the URL returned by the API
      const mockImageUrl = `https://placehold.co/800x800/2a254b/e2e8f0?text=Generated+Image`;
      
      setImageUrl(mockImageUrl);
    } catch (err) {
      console.error('Error generating image:', err);
      setError(`Failed to generate image: ${(err as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-medium mb-2">Image Prompt</h3>
        <div className="text-sm text-gray-300 whitespace-pre-wrap mb-3">
          {imagePrompt}
        </div>
        
        {negativePrompt && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Negative Prompt</h4>
            <div className="text-sm text-gray-400">
              {negativePrompt}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center mb-4">
        <Button
          onClick={handleGenerateImage}
          disabled={isGenerating}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Generating Image...</span>
            </div>
          ) : (
            'Generate Image from Prompt'
          )}
        </Button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 my-4">
          {error}
        </div>
      )}
      
      {isGenerating && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-900 border border-gray-700 rounded-lg">
          <LoadingSpinner size="lg" className="text-purple-500 mb-4" />
          <p className="text-gray-300">Generating image from prompt...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      )}
      
      {imageUrl && !isGenerating && (
        <div className="mt-4">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <div className="aspect-square w-full overflow-hidden rounded-md mb-2">
              <img 
                src={imageUrl} 
                alt="Generated from prompt" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">Generated Image</p>
              <a 
                href={imageUrl} 
                download="generated-image.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Download Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 