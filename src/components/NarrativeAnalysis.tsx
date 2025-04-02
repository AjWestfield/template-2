'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import ImagePromptGenerator from './ImagePromptGenerator';

interface NarrativeElement {
  timestamp: string;
  text: string;
  imagePrompt: string;
  characters?: string[];
  environment?: string;
  visualStyle?: string;
  negativePrompt?: string;
}

interface NarrativeContext {
  MAIN_CHARACTERS: any[];
  SETTINGS: any[];
  VISUAL_STYLE: {
    color_palette: string;
    lighting_style: string;
    camera_perspective: string;
    visual_references: string;
    art_direction_notes: string;
  };
  STORY_TIMELINE: any[];
  RECURRING_SYMBOLS: any[];
}

interface NarrativeAnalysisProps {
  transcription: any;
}

export default function NarrativeAnalysis({ transcription }: NarrativeAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [narrativeContext, setNarrativeContext] = useState<NarrativeContext | null>(null);
  const [narrativeElements, setNarrativeElements] = useState<NarrativeElement[]>([]);
  const [activeTab, setActiveTab] = useState<'characters' | 'settings' | 'style' | 'prompts'>('prompts');
  const [copySuccess, setCopySuccess] = useState('');
  const [expandedElement, setExpandedElement] = useState<number | null>(null);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null);
  
  // Automatically start analysis when transcription is available
  useEffect(() => {
    const shouldStartAnalysis = 
      transcription && 
      transcription.segments && 
      transcription.segments.length > 0 && 
      !narrativeContext && 
      !isAnalyzing;
      
    if (shouldStartAnalysis) {
      handleAnalyzeNarrative();
    }
  }, [transcription, narrativeContext, isAnalyzing]);
  
  const handleAnalyzeNarrative = async () => {
    if (!transcription || !transcription.segments) {
      setError('No transcription data available for analysis');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/narrative-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNarrativeContext(data.narrativeContext);
        setNarrativeElements(data.narrativeElements);
      } else {
        throw new Error(data.error || 'Failed to analyze narrative');
      }
    } catch (err) {
      console.error('Error analyzing narrative:', err);
      setError(`Failed to analyze narrative: ${(err as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(() => {
        setCopySuccess('Failed to copy');
      });
  };
  
  const toggleExpandElement = (index: number) => {
    if (expandedElement === index) {
      setExpandedElement(null);
    } else {
      setExpandedElement(index);
    }
  };
  
  const handleSelectPrompt = (index: number) => {
    setSelectedPromptIndex(index);
    setExpandedElement(index);
  };
  
  const renderCharactersTab = () => {
    if (!narrativeContext || !narrativeContext.MAIN_CHARACTERS.length) {
      return <div className="text-gray-400 text-center py-6">No character information available</div>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {narrativeContext.MAIN_CHARACTERS.map((character, index) => (
          <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-2">
              {character.name || `Character ${character.character_id || index + 1}`}
            </h4>
            <div className="text-sm text-gray-300 space-y-2">
              {character.character_id && <p><span className="text-gray-400">ID:</span> {character.character_id}</p>}
              {character.age && <p><span className="text-gray-400">Age:</span> {character.age}</p>}
              {character.appearance && <p><span className="text-gray-400">Appearance:</span> {typeof character.appearance === 'string' ? character.appearance : JSON.stringify(character.appearance)}</p>}
              {character.clothing_palette && <p><span className="text-gray-400">Clothing:</span> {typeof character.clothing_palette === 'string' ? character.clothing_palette : character.clothing_palette.join(', ')}</p>}
              {character.accessories && <p><span className="text-gray-400">Accessories:</span> {typeof character.accessories === 'string' ? character.accessories : character.accessories.join(', ')}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderSettingsTab = () => {
    if (!narrativeContext || !narrativeContext.SETTINGS.length) {
      return <div className="text-gray-400 text-center py-6">No setting information available</div>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {narrativeContext.SETTINGS.map((setting, index) => (
          <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-medium mb-2">
              {setting.name || `Setting ${setting.setting_id || index + 1}`}
            </h4>
            <div className="text-sm text-gray-300 space-y-2">
              {setting.setting_id && <p><span className="text-gray-400">ID:</span> {setting.setting_id}</p>}
              {setting.time_period && <p><span className="text-gray-400">Time Period:</span> {setting.time_period}</p>}
              {setting.architecture_style && <p><span className="text-gray-400">Architecture:</span> {setting.architecture_style}</p>}
              {setting.lighting_characteristics && <p><span className="text-gray-400">Lighting:</span> {setting.lighting_characteristics}</p>}
              {setting.mood_atmosphere && <p><span className="text-gray-400">Mood:</span> {setting.mood_atmosphere}</p>}
              {setting.distinctive_features && <p><span className="text-gray-400">Distinctive Features:</span> {typeof setting.distinctive_features === 'string' ? setting.distinctive_features : JSON.stringify(setting.distinctive_features)}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderStyleTab = () => {
    if (!narrativeContext || !narrativeContext.VISUAL_STYLE) {
      return <div className="text-gray-400 text-center py-6">No visual style information available</div>;
    }
    
    const style = narrativeContext.VISUAL_STYLE;
    
    return (
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 my-4">
        <h4 className="text-lg font-medium mb-3">Visual Style Guide</h4>
        <div className="text-sm text-gray-300 space-y-3">
          {style.color_palette && (
            <div>
              <h5 className="text-gray-400 font-medium mb-1">Color Palette</h5>
              <p>{style.color_palette}</p>
            </div>
          )}
          
          {style.lighting_style && (
            <div>
              <h5 className="text-gray-400 font-medium mb-1">Lighting Style</h5>
              <p>{style.lighting_style}</p>
            </div>
          )}
          
          {style.camera_perspective && (
            <div>
              <h5 className="text-gray-400 font-medium mb-1">Camera Perspective</h5>
              <p>{style.camera_perspective}</p>
            </div>
          )}
          
          {style.visual_references && (
            <div>
              <h5 className="text-gray-400 font-medium mb-1">Visual References</h5>
              <p>{style.visual_references}</p>
            </div>
          )}
          
          {style.art_direction_notes && (
            <div>
              <h5 className="text-gray-400 font-medium mb-1">Art Direction Notes</h5>
              <p>{style.art_direction_notes}</p>
            </div>
          )}
        </div>
        
        {narrativeContext.RECURRING_SYMBOLS && narrativeContext.RECURRING_SYMBOLS.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">Recurring Symbols</h4>
            <ul className="list-disc list-inside text-sm text-gray-300">
              {narrativeContext.RECURRING_SYMBOLS.map((symbol, index) => (
                <li key={index}>{typeof symbol === 'string' ? symbol : JSON.stringify(symbol)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  const renderPromptsTab = () => {
    if (!narrativeElements.length) {
      return <div className="text-gray-400 text-center py-6">No image prompts available</div>;
    }
    
    return (
      <div className="space-y-4 my-4">
        {narrativeElements.map((element, index) => (
          <div 
            key={index} 
            className={`bg-gray-900 rounded-lg border ${expandedElement === index ? 'border-purple-500' : 'border-gray-700'} transition-all overflow-hidden`}
          >
            <div 
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => toggleExpandElement(index)}
            >
              <div>
                <div className="text-sm text-gray-400 font-mono">{element.timestamp}</div>
                <div className="font-medium">{element.text}</div>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transform transition-transform ${expandedElement === index ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {expandedElement === index && (
              <div className="px-4 pb-4 border-t border-gray-700 pt-3">
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium text-gray-400">Image Prompt</h5>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => copyToClipboard(element.imagePrompt)}
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 px-2"
                      >
                        Copy
                      </Button>
                      <Button
                        onClick={() => handleSelectPrompt(index)}
                        size="sm"
                        variant="default"
                        className="text-xs h-6 px-2 bg-purple-600 hover:bg-purple-700"
                      >
                        Generate Image
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm bg-gray-800 p-3 rounded whitespace-pre-wrap">
                    {element.imagePrompt}
                  </div>
                </div>
                
                {element.environment && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-400 mb-1">Environment</h5>
                    <div className="text-sm bg-gray-800 p-2 rounded">
                      {element.environment}
                    </div>
                  </div>
                )}
                
                {element.visualStyle && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-400 mb-1">Visual Style</h5>
                    <div className="text-sm bg-gray-800 p-2 rounded">
                      {element.visualStyle}
                    </div>
                  </div>
                )}
                
                {element.characters && element.characters.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-400 mb-1">Characters</h5>
                    <div className="text-sm bg-gray-800 p-2 rounded">
                      {element.characters.join(', ')}
                    </div>
                  </div>
                )}
                
                {element.negativePrompt && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-400 mb-1">Negative Prompt</h5>
                    <div className="text-sm bg-gray-800 p-2 rounded">
                      {element.negativePrompt}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="w-full space-y-6">
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
          <h3 className="font-medium text-lg mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8 flex flex-col items-center">
          <LoadingSpinner size="lg" className="text-purple-500 mb-4" />
          <p className="text-gray-300">Analyzing narrative and generating image prompts...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      )}
      
      {selectedPromptIndex !== null && narrativeElements[selectedPromptIndex] && (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Generate Image</h3>
            <Button
              onClick={() => setSelectedPromptIndex(null)}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-gray-300"
            >
              Close
            </Button>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            <div className="font-mono">{narrativeElements[selectedPromptIndex].timestamp}</div>
            <div className="font-medium text-white mt-1">{narrativeElements[selectedPromptIndex].text}</div>
          </div>
          
          <ImagePromptGenerator 
            imagePrompt={narrativeElements[selectedPromptIndex].imagePrompt}
            negativePrompt={narrativeElements[selectedPromptIndex].negativePrompt}
          />
        </div>
      )}
      
      {narrativeContext && !isAnalyzing && (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <div className="border-b border-gray-700">
            <div className="flex overflow-x-auto">
              <button
                className={`px-4 py-3 font-medium text-sm ${activeTab === 'prompts' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('prompts')}
              >
                Image Prompts
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm ${activeTab === 'characters' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('characters')}
              >
                Characters
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm ${activeTab === 'settings' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm ${activeTab === 'style' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('style')}
              >
                Visual Style
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {activeTab === 'prompts' && renderPromptsTab()}
            {activeTab === 'characters' && renderCharactersTab()}
            {activeTab === 'settings' && renderSettingsTab()}
            {activeTab === 'style' && renderStyleTab()}
          </div>
          
          {copySuccess && (
            <div className="fixed bottom-4 right-4 px-3 py-2 bg-green-900/70 border border-green-700 text-green-400 text-sm rounded shadow-lg">
              {copySuccess}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 