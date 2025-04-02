import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice ID is required' },
        { status: 400 }
      );
    }

    // Get the API key from environment variables
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Eleven Labs API key is not configured' },
        { status: 500 }
      );
    }

    // Maximum text length that Eleven Labs allows (approx. 5000 characters)
    const MAX_TEXT_LENGTH = 5000;
    
    // Trim the text if it's too long
    const trimmedText = text.length > MAX_TEXT_LENGTH 
      ? text.substring(0, MAX_TEXT_LENGTH) 
      : text;

    // Prepare the request body
    const requestBody = {
      text: trimmedText,
      model_id: "eleven_turbo_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    };

    // Call Eleven Labs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eleven Labs API error:', errorText);
      return NextResponse.json(
        { error: 'Error generating voice over' },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Return the audio as an ArrayBuffer
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Error generating voice over:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice over' },
      { status: 500 }
    );
  }
} 