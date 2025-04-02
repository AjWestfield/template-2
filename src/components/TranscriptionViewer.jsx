'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

/**
 * Component to display transcription with timestamps
 */
export default function TranscriptionViewer({ transcription }) {
  const [filter, setFilter] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  
  if (!transcription || !transcription.segments || transcription.segments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        No transcription data available
      </div>
    );
  }
  
  // Filter segments based on search text
  const filteredSegments = transcription.segments.filter(segment => 
    segment.text.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Copy full transcription to clipboard
  const copyFullTranscription = () => {
    const text = transcription.text;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(() => {
        setCopySuccess('Failed to copy');
      });
  };
  
  // Copy timestamped transcription to clipboard
  const copyTimestampedTranscription = () => {
    const text = transcription.segments
      .map(segment => `${segment.start} - ${segment.end}\n${segment.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess('Copied with timestamps!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(() => {
        setCopySuccess('Failed to copy');
      });
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button 
            onClick={copyFullTranscription}
            size="sm"
            variant="secondary"
            className="flex items-center space-x-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 01-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0113.5 1.5H15a3 3 0 012.663 1.618zM12 4.5A1.5 1.5 0 0113.5 3H15a1.5 1.5 0 011.5 1.5H12z" clipRule="evenodd" />
              <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 019 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0116.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625v-12z" />
            </svg>
            <span>Copy Text</span>
          </Button>
          <Button 
            onClick={copyTimestampedTranscription}
            size="sm"
            variant="secondary"
            className="flex items-center space-x-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
            </svg>
            <span>Copy with Timestamps</span>
          </Button>
        </div>
        {copySuccess && (
          <span className="px-3 py-1 bg-green-900/50 border border-green-700 text-green-400 text-sm rounded">
            {copySuccess}
          </span>
        )}
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search in transcription..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      
      <div className="mb-4 p-4 bg-gray-900 border border-gray-700 rounded max-h-[40vh] overflow-y-auto">
        {filteredSegments.length > 0 ? (
          filteredSegments.map((segment, index) => (
            <div key={index} className="mb-5 p-2 hover:bg-gray-800 rounded border-l-2 border-purple-500">
              <div className="text-sm text-gray-400 font-mono mb-2">
                {segment.start} - {segment.end}
              </div>
              <div className="mt-1 text-gray-200 text-lg">
                {segment.text}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-400">
            {filter ? 'No results found' : 'No transcription segments available'}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2 text-gray-200">Full Transcription</h3>
        <div className="p-3 bg-gray-900 border border-gray-700 rounded max-h-[20vh] overflow-y-auto text-gray-300">
          {transcription.text}
        </div>
      </div>
    </div>
  );
} 