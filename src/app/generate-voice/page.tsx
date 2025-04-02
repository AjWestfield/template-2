'use client';

import VoiceGenerator from '@/components/VoiceGenerator';
import NarrativeAnalysis from '@/components/NarrativeAnalysis';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function GenerateVoicePage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(2); // Default to Step 2 (Voice Generation)
  const [transcription, setTranscription] = useState<any>(null);
  
  // Get script data from URL parameters
  const script = searchParams.get('script') || '';
  const wordCount = parseInt(searchParams.get('wordCount') || '0');
  const targetWordCount = parseInt(searchParams.get('targetWordCount') || '0');
  
  useEffect(() => {
    // Validate that we have the necessary data
    if (!script) {
      setError('No script data found. Please return to the script generation step.');
    }
    setIsLoading(false);
  }, [script]);
  
  // Handler for when transcription is complete
  const handleTranscriptionComplete = (transcriptionData: any) => {
    setTranscription(transcriptionData);
    setActiveStep(3); // Move to Step 3 (Narrative Analysis)
  };
  
  // If script data is missing, show error
  if (!isLoading && !script) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 lg:p-24">
        <div className="w-full max-w-5xl">
          <div className="flex items-center mb-8">
            <Link 
              href="/"
              className="text-gray-400 hover:text-white mr-4 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Home
            </Link>
          </div>
          
          <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg text-center">
            <h2 className="text-xl font-medium text-white mb-2">Error</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <Link 
              href="/" 
              className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white font-medium inline-block"
            >
              Return to Script Generator
            </Link>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-5xl">
        <div className="flex items-center mb-8">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white mr-4 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </Link>
          <div className="h-6 w-px bg-gray-600 mr-4"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600">
            {activeStep === 2 ? 'Step 2: Generate Voice' : 'Step 3: Generate Image Prompts'}
          </h1>
        </div>
        
        <div className="flex items-center mb-8">
          <div className="flex space-x-2 items-center opacity-50">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">1</div>
            <span className="text-gray-400 font-medium">Create Script</span>
          </div>
          <div className="h-px w-12 bg-gray-700 mx-2"></div>
          <div className={`flex space-x-2 items-center ${activeStep === 2 ? '' : 'opacity-50'}`}>
            <div className={`w-8 h-8 rounded-full ${activeStep === 2 ? 'bg-blue-500' : 'bg-gray-600'} flex items-center justify-center text-sm font-medium`}>2</div>
            <span className={`${activeStep === 2 ? 'text-white' : 'text-gray-400'} font-medium`}>Generate Voice</span>
          </div>
          <div className="h-px w-12 bg-gray-700 mx-2"></div>
          <div className={`flex space-x-2 items-center ${activeStep === 3 ? '' : 'opacity-50'}`}>
            <div className={`w-8 h-8 rounded-full ${activeStep === 3 ? 'bg-blue-500' : 'bg-gray-600'} flex items-center justify-center text-sm font-medium`}>3</div>
            <span className={`${activeStep === 3 ? 'text-white' : 'text-gray-400'} font-medium`}>Image Prompts</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" className="text-purple-500 mb-4" />
            <p className="text-gray-300">Loading script data...</p>
          </div>
        ) : (
          <>
            {activeStep === 2 && (
              <VoiceGenerator 
                script={script} 
                wordCount={wordCount} 
                targetWordCount={targetWordCount}
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            )}
            
            {activeStep === 3 && transcription && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="text-gray-400 hover:text-white flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Back to Voice Generation
                  </button>
                </div>
                
                <NarrativeAnalysis transcription={transcription} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 