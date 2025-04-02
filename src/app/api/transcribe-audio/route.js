import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { transcribeWithOpenAI } from '@/utils/openaiTranscribe';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

/**
 * API route handler for audio transcription
 */
export async function POST(request) {
  try {
    // We need to handle either FormData (for direct file uploads) or JSON (for blob data)
    const contentType = request.headers.get('content-type');
    
    let audioBlob;
    let language = null;
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle form data upload
      const formData = await request.formData();
      audioBlob = formData.get('audio');
      language = formData.get('language') || null;
      
      if (!audioBlob) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }
    } else {
      // Handle JSON with Blob data
      const data = await request.json();
      
      if (!data.audioData) {
        return NextResponse.json(
          { error: 'No audio data provided' },
          { status: 400 }
        );
      }
      
      // Convert base64 to blob if needed
      if (typeof data.audioData === 'string') {
        // Remove data URL prefix if present
        const base64String = data.audioData.replace(/^data:audio\/\w+;base64,/, '');
        
        // Use Buffer in Node.js environment instead of atob
        const buffer = Buffer.from(base64String, 'base64');
        audioBlob = buffer;
      } else if (data.audioData instanceof ArrayBuffer) {
        audioBlob = Buffer.from(data.audioData);
      } else {
        audioBlob = data.audioData;
      }
      
      language = data.language || null;
    }
    
    // Create temporary directory if it doesn't exist
    const tmpDir = path.join(os.tmpdir(), 'whisper-transcriptions');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    // Create unique filename
    const fileName = `audio-${uuidv4()}.mp3`;
    const filePath = path.join(tmpDir, fileName);
    
    // Convert to Buffer and save
    let buffer;
    if (audioBlob instanceof Blob) {
      const arrayBuffer = await audioBlob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (audioBlob instanceof File) {
      const arrayBuffer = await audioBlob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (audioBlob instanceof ArrayBuffer) {
      buffer = Buffer.from(audioBlob);
    } else if (Buffer.isBuffer(audioBlob)) {
      buffer = audioBlob;
    } else {
      return NextResponse.json(
        { error: 'Invalid audio format' },
        { status: 400 }
      );
    }
    
    // Write file to temp directory
    try {
      await writeFile(filePath, buffer);
      console.log(`File saved to ${filePath}, proceeding with transcription...`);
    } catch (writeError) {
      console.error('Error saving audio file:', writeError);
      return NextResponse.json(
        { error: 'Failed to save audio file', details: writeError.message },
        { status: 500 }
      );
    }
    
    // Transcribe the audio using OpenAI API
    try {
      let transcription;
      let isFallback = false;
      
      try {
        console.log('Using OpenAI API for transcription...');
        transcription = await transcribeWithOpenAI(filePath, language);
        
        // Check if we received a fallback transcription
        if (transcription.is_fallback) {
          console.log('Using fallback transcription due to API issues');
          isFallback = true;
        }
      } catch (transcriptionError) {
        console.error('OpenAI Transcription error:', transcriptionError);
        // Create a basic fallback transcription
        transcription = {
          text: "Your audio has been processed successfully, but transcription couldn't be generated. The system will continue with default segments.",
          segments: [{
            text: "Your audio has been processed successfully.",
            start: "0:00.0",
            end: "0:03.0",
            start_seconds: 0,
            end_seconds: 3
          }, {
            text: "Transcription couldn't be generated due to a connection issue.",
            start: "0:03.0",
            end: "0:06.0",
            start_seconds: 3,
            end_seconds: 6
          }, {
            text: "The system will continue with these default segments.",
            start: "0:06.0",
            end: "0:10.0",
            start_seconds: 6,
            end_seconds: 10
          }],
          is_fallback: true
        };
        isFallback = true;
      }
      
      // Cleanup the temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
      
      return NextResponse.json({ 
        success: true, 
        transcription,
        isFallback
      });
    } catch (error) {
      console.error('API route error:', error);
      return NextResponse.json(
        { error: 'Server error', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
} 