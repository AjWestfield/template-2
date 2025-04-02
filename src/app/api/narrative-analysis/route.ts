import { NextRequest, NextResponse } from 'next/server';

interface NarrativeElement {
  timestamp: string;
  text: string;
  imagePrompt: string;
  characterProfiles?: Record<string, any>;
  environment?: string;
  visualStyle?: string;
  negativePrompt?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { transcription } = await req.json();
    
    if (!transcription || !transcription.segments || transcription.segments.length === 0) {
      return NextResponse.json(
        { error: 'Valid transcription with segments is required' },
        { status: 400 }
      );
    }

    // Get the API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }
    
    // Extract full text first for overall analysis
    const fullText = transcription.text || transcription.segments.map((s: any) => s.text).join(' ');
    
    // 1. First, analyze the complete narrative for overall context and character profiles
    const narrativeAnalysisPrompt = `
    Analyze this narrative voice-over script for creating visual scenes:
    "${fullText}"
    
    Extract the following information in JSON format:
    
    1. MAIN_CHARACTERS: List all main characters with detailed profiles:
       - character_id (e.g., "CP-01")
       - name
       - age (approximate)
       - appearance: hair (color, style, length), eyes (color, shape), build/height, distinctive features
       - clothing_palette (3-5 dominant colors)
       - accessories (if any)
    
    2. SETTINGS: List all environments/locations where scenes take place:
       - setting_id (e.g., "SET-01")
       - name/description
       - time_period
       - architecture_style
       - lighting_characteristics
       - mood/atmosphere
       - distinctive_features
    
    3. VISUAL_STYLE: Define the overall visual style:
       - color_palette
       - lighting_style
       - camera_perspective
       - visual_references (e.g., "similar to Studio Ghibli")
       - art_direction_notes
    
    4. STORY_TIMELINE: Identify major plot points or narrative sequence.
    
    5. RECURRING_SYMBOLS: Note any recurring visual motifs or symbols.
    
    Provide your analysis as valid JSON that can be parsed by JavaScript.
    `;
    
    // Make request to OpenRouter API for narrative analysis
    const analysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://localhost:3000',
        'X-Title': 'AI Narrative Analysis'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'user', content: narrativeAnalysisPrompt }
        ]
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      console.error('API error during narrative analysis:', errorData);
      return NextResponse.json(
        { error: 'Error from AI provider during narrative analysis' },
        { status: analysisResponse.status }
      );
    }

    const analysisData = await analysisResponse.json();
    let narrativeContext;
    
    try {
      // Extract JSON from the response - the model might wrap it in markdown code blocks
      const jsonMatch = analysisData.choices[0].message.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        analysisData.choices[0].message.content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, analysisData.choices[0].message.content];
      
      const jsonString = jsonMatch[1] || analysisData.choices[0].message.content;
      narrativeContext = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Error parsing narrative analysis JSON:', parseError);
      console.log('Raw response:', analysisData.choices[0].message.content);
      
      // Create a default structure if parsing fails
      narrativeContext = {
        MAIN_CHARACTERS: [],
        SETTINGS: [],
        VISUAL_STYLE: {
          color_palette: "Undetermined",
          lighting_style: "Natural",
          camera_perspective: "Mixed",
          visual_references: "",
          art_direction_notes: ""
        },
        STORY_TIMELINE: [],
        RECURRING_SYMBOLS: []
      };
    }
    
    // 2. Now generate image prompts for each segment
    const narrativeElements: NarrativeElement[] = [];
    
    // Pre-process the transcription segments to merge fragments into meaningful sentences
    // This more sophisticated approach will ensure we have proper sentence units
    const combinedSegments = [];
    let buffer = {
      text: '',
      start: '',
      end: '',
      start_seconds: 0,
      end_seconds: 0
    };
    
    // Helper function to check if text is likely a complete thought/sentence
    const isLikelyComplete = (text: string) => {
      // Check for ending punctuation
      if (/[.!?]$/.test(text.trim())) {
        // Make sure the sentence has some substance - at least a subject and verb
        const words = text.trim().split(/\s+/);
        return words.length >= 4; // Arbitrary minimum for a "complete thought"
      }
      return false;
    };
    
    // Helper function to check if text is likely a sentence fragment
    const isLikelyFragment = (text: string) => {
      const trimmed = text.trim();
      
      // Very short text is likely a fragment
      if (trimmed.split(/\s+/).length < 4) return true;
      
      // Starting with lowercase articles, conjunctions, or prepositions suggests a fragment
      if (/^(the|a|an|and|but|or|for|nor|so|yet|at|by|from|in|into|of|on|to|with)\s+/i.test(trimmed)) {
        // Check if it doesn't end with punctuation or is very short
        return !(/[.!?]$/.test(trimmed)) || trimmed.split(/\s+/).length < 5;
      }
      
      // If it doesn't end with punctuation, it's likely a fragment
      return !(/[.!?]$/.test(trimmed));
    };
    
    // First pass: Collect all text to analyze the natural sentence breaks
    let allText = '';
    const segmentMap = [];
    
    for (let i = 0; i < transcription.segments.length; i++) {
      const segment = transcription.segments[i];
      
      // Add to the overall text
      if (allText && !allText.endsWith(' ')) allText += ' ';
      allText += segment.text.trim();
      
      // Map the segment boundaries
      segmentMap.push({
        originalIndex: i,
        start: segment.start,
        end: segment.end,
        start_seconds: segment.start_seconds,
        end_seconds: segment.end_seconds,
        text: segment.text,
        startPos: allText.length - segment.text.length,
        endPos: allText.length
      });
    }
    
    // Now find natural sentence breaks using regex
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    let sentences = [];
    let match;
    
    while ((match = sentenceRegex.exec(allText)) !== null) {
      sentences.push({
        text: match[0].trim(),
        startPos: match.index,
        endPos: match.index + match[0].length
      });
    }
    
    // If there's remaining text that doesn't end with punctuation, add it as the last sentence
    const lastMatchEnd = sentences.length > 0 ? sentences[sentences.length - 1].endPos : 0;
    if (lastMatchEnd < allText.length) {
      sentences.push({
        text: allText.slice(lastMatchEnd).trim(),
        startPos: lastMatchEnd,
        endPos: allText.length
      });
    }
    
    // For each sentence, find the corresponding segments and create a combined segment
    for (const sentence of sentences) {
      // Find all segments that overlap with this sentence
      const overlappingSegments = segmentMap.filter(
        seg => (seg.startPos < sentence.endPos && seg.endPos > sentence.startPos)
      );
      
      if (overlappingSegments.length > 0) {
        // Create a combined segment with the full sentence text and the start/end times
        combinedSegments.push({
          text: sentence.text,
          start: overlappingSegments[0].start,
          end: overlappingSegments[overlappingSegments.length - 1].end,
          start_seconds: overlappingSegments[0].start_seconds,
          end_seconds: overlappingSegments[overlappingSegments.length - 1].end_seconds
        });
      }
    }
    
    // Process each combined segment sequentially
    for (let i = 0; i < combinedSegments.length; i++) {
      const segment = combinedSegments[i];
      const segmentTimestamp = `${segment.start}-${segment.end}`;
      
      // Determine context from surrounding segments
      const prevSegment = i > 0 ? combinedSegments[i-1].text : "";
      const nextSegment = i < combinedSegments.length - 1 ? combinedSegments[i+1].text : "";
      
      const imagePromptTemplate = `
      You are a visual prompt engineer creating image generation prompts based on narrative segments.
      
      NARRATIVE CONTEXT:
      ${JSON.stringify(narrativeContext, null, 2)}
      
      Create a detailed image generation prompt for this segment of the narrative:
      
      TIMESTAMP: ${segmentTimestamp}
      CURRENT SEGMENT: "${segment.text}"
      PREVIOUS SEGMENT: "${prevSegment}"
      NEXT SEGMENT: "${nextSegment}"
      
      Return ONLY a JSON object with these fields:
      
      {
        "timestamp": "${segmentTimestamp}",
        "text": "${segment.text}",
        "imagePrompt": "Detailed visual prompt for image generation model",
        "characters": ["List of character_ids appearing in this segment"],
        "environment": "Description of the environment/setting",
        "visualStyle": "Specific visual style notes for this segment",
        "negativePrompt": "Negative prompts to avoid undesired elements"
      }
      
      Follow these rules for the image prompt:
      1. VERY IMPORTANT: The imagePrompt field MUST begin with the exact phrase "photo realistic" 
      2. For character continuity, reference appropriate character profiles from the narrative context
      3. Be specific about environment details, lighting, mood, and camera perspective
      4. Capture the emotion and action of the moment precisely
      5. Maintain consistency with previous segments' visual elements
      6. Format the prompt optimally for Flux-1.1-pro model
      
      Ensure the JSON is valid and can be parsed by JavaScript.
      `;
      
      // Make request to OpenRouter API for image prompt generation
      const promptResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'AI Image Prompt Generator'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'user', content: imagePromptTemplate }
          ]
        }),
      });

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json();
        console.error('API error during image prompt generation:', errorData);
        continue; // Skip this segment but continue with others
      }

      const promptData = await promptResponse.json();
      
      try {
        // Extract JSON from the response
        const jsonMatch = promptData.choices[0].message.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                          promptData.choices[0].message.content.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, promptData.choices[0].message.content];
                          
        const jsonString = jsonMatch[1] || promptData.choices[0].message.content;
        const parsedPrompt = JSON.parse(jsonString.trim());
        
        // Ensure the image prompt starts with "photo realistic"
        if (parsedPrompt.imagePrompt && !parsedPrompt.imagePrompt.toLowerCase().startsWith("photo realistic")) {
          parsedPrompt.imagePrompt = "photo realistic " + parsedPrompt.imagePrompt;
        }
        
        narrativeElements.push(parsedPrompt);
      } catch (parseError) {
        console.error('Error parsing image prompt JSON:', parseError);
        console.log('Raw response:', promptData.choices[0].message.content);
        
        // Add a basic entry with the raw text if parsing fails
        narrativeElements.push({
          timestamp: segmentTimestamp,
          text: segment.text,
          imagePrompt: "photo realistic scene - Error generating detailed prompt",
          environment: "Unknown",
          visualStyle: "Standard",
          negativePrompt: "deformed, blurry, low quality"
        });
      }
      
      // Add a small delay to prevent rate limiting
      if (i < combinedSegments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      narrativeContext,
      narrativeElements
    });
  } catch (error) {
    console.error('Error during narrative analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative analysis' },
      { status: 500 }
    );
  }
} 