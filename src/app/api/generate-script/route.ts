import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { storyIdea, duration, targetWordCount } = await req.json();

    if (!storyIdea) {
      return NextResponse.json(
        { error: 'Story idea is required' },
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

    // Define the acceptable word count range (±10%)
    const minAcceptableWordCount = Math.floor(targetWordCount * 0.9);
    const maxAcceptableWordCount = Math.ceil(targetWordCount * 1.1);
    
    // Track attempts to prevent infinite loops
    const maxAttempts = 3;
    let currentAttempt = 0;
    let generatedScript = '';
    let wordCount = 0;
    let isWithinRange = false;
    
    // Create base prompts
    const createSystemPrompt = (targetCount, prevCount = null, feedback = null) => {
      let prompt = `You are a Video Script Generator that creates precisely timed scripts based on user-specified durations. 
      
      Create a clean, production-ready voiceover script that contains only the exact text to be spoken by the voice actor. The script should:
      
      1. Include only the actual words to be read aloud
      2. Exclude all production directions (camera angles, music cues, transitions, etc.)
      3. Remove all performance notes and parenthetical directions (like "(excitedly)" or "(whispering)")
      4. Omit visual descriptions or references to on-screen elements
      5. Eliminate formatting instructions, brackets, or special characters not meant to be spoken
      6. Present the content as continuous, readable text without interruptions
      7. Not contain timestamps, scene headings, or technical directions
      8. Be formatted in plain text that can be read straight through without interpretation
      
      This script should be EXACTLY ${targetCount} words in length to fit a ${duration}-minute video.`;
      
      // Add feedback if this is a retry attempt
      if (prevCount !== null && feedback) {
        prompt += `\n\nYour previous attempt had ${prevCount} words, which is ${feedback} the target. Please adjust accordingly.`;
      }
      
      return prompt;
    };
    
    const createUserPrompt = (targetCount) => {
      return `Create a professional voiceover script based on this story idea: ${storyIdea}
      
      The script MUST be ${targetCount} words in length. This is a strict requirement.
      
      Provide ONLY the clean script text, with no headers, formatting marks, or directions.`;
    };
    
    // Loop until we get a script with acceptable word count or max attempts reached
    while (!isWithinRange && currentAttempt < maxAttempts) {
      currentAttempt++;
      console.log(`Attempt ${currentAttempt} of ${maxAttempts} to generate script with target word count ${targetWordCount}`);
      
      // Create prompts with feedback if this is a retry
      let feedback = null;
      if (currentAttempt > 1) {
        feedback = wordCount < targetWordCount ? "too short and below" : "too long and above";
      }
      
      const systemPrompt = createSystemPrompt(targetWordCount, currentAttempt > 1 ? wordCount : null, feedback);
      const userPrompt = createUserPrompt(targetWordCount);
      
      // Make request to OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'AI Script Generator'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        return NextResponse.json(
          { error: 'Error from AI provider' },
          { status: response.status }
        );
      }

      const data = await response.json();
      generatedScript = data.choices[0].message.content;
      
      // Calculate word count
      wordCount = generatedScript.split(/\s+/).filter(word => word.length > 0).length;
      
      // Check if word count is within acceptable range
      isWithinRange = wordCount >= minAcceptableWordCount && wordCount <= maxAcceptableWordCount;
      
      console.log(`Generated script with ${wordCount} words. Target: ${targetWordCount}. Within range: ${isWithinRange}`);
      
      // If not within range and we have attempts left, continue the loop
      if (!isWithinRange && currentAttempt < maxAttempts) {
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Return the best script we could generate
    return NextResponse.json({
      script: generatedScript,
      wordCount,
      targetWordCount,
      withinTargetRange: isWithinRange,
      attempts: currentAttempt
    });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
} 