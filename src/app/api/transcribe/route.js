import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { transcribeAudio } from '@/utils/whisperTranscribe';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

/**
 * API route handler for audio transcription
 */
export async function POST(request) {
  // Use formData to parse multipart/form-data
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    // Always use 'large' model to avoid compatibility issues
    const model = 'large';
    const language = formData.get('language') || null;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    if (!(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid file format' },
        { status: 400 }
      );
    }
    
    // Create temporary directory if it doesn't exist
    const tmpDir = path.join(os.tmpdir(), 'whisper-transcriptions');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    // Get file extension
    const fileExtension = audioFile.name.split('.').pop().toLowerCase();
    
    // Create unique filename
    const fileName = `audio-${uuidv4()}.${fileExtension}`;
    const filePath = path.join(tmpDir, fileName);
    
    // Convert File to Buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write file to temp directory
    await writeFile(filePath, buffer);
    
    console.log(`File saved to ${filePath}, proceeding with transcription...`);
    
    // Transcribe the audio
    try {
      const transcription = await transcribeAudio(filePath, model, language);
      
      // Cleanup the temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
      
      return NextResponse.json({ 
        success: true, 
        transcription 
      });
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      return NextResponse.json(
        { 
          error: 'Transcription failed', 
          details: transcriptionError.message 
        },
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

// Add a simple GET endpoint for health check
export async function GET() {
  return NextResponse.json({ status: 'Transcription API is running' });
} 