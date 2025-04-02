import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Transcribes audio files using OpenAI's Whisper with timestamps
 * @param {string} audioFilePath - Path to the audio file to transcribe
 * @param {string} modelSize - Whisper model size ('tiny', 'base', 'small', 'medium', 'large', 'large-v1', 'large-v2')
 * @param {string} language - Optional language code (e.g., 'en', 'es', 'fr')
 * @returns {Promise<object>} - Transcription with text and timestamps
 */
export async function transcribeAudio(audioFilePath, modelSize = 'large', language = null) {
  // Create python script for transcription
  const tempDir = path.join(process.cwd(), 'temp');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Generate unique filenames for both the script and output
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const pythonScriptPath = path.join(tempDir, `transcribe_audio_${uniqueId}.py`);
  const outputJsonPath = path.join(tempDir, `transcription_${uniqueId}.json`);
  
  // Python script content
  const pythonScript = `
import sys
import json
import whisper
import torch
import re

def format_timestamp(seconds):
    """Convert seconds to HH:MM:SS.mmm format"""
    hours = int(seconds / 3600)
    minutes = int((seconds % 3600) / 60)
    seconds = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:06.3f}"

def split_into_sentences(text, start, end):
    """Split a text segment into sentences with interpolated timestamps"""
    try:
        # Ultra simple approach - don't use regex at all
        # Just split on common sentence endings directly
        parts = []
        
        # First try to split by periods with space
        for part in text.split(". "):
            if part.strip():
                parts.append(part.strip())
        
        # If no splits were found, try other punctuation
        if len(parts) <= 1:
            # Try other separators 
            text_modified = text.replace("! ", ". ").replace("? ", ". ")
            parts = [p.strip() for p in text_modified.split(". ") if p.strip()]
            
        # If still no splits, use the whole text
        if not parts:
            parts = [text]
            
        # Generate timestamps for each sentence
        total_chars = sum(len(s) for s in parts)
        duration = end - start
        
        result = []
        current_pos = 0
        
        for sentence in parts:
            # Calculate proportional time based on character count
            sentence_ratio = len(sentence) / total_chars if total_chars > 0 else 0
            
            sentence_start = start + (current_pos / total_chars) * duration if total_chars > 0 else start
            sentence_end = sentence_start + sentence_ratio * duration
            
            result.append({
                "text": sentence,
                "start": format_timestamp(sentence_start),
                "end": format_timestamp(sentence_end),
                "start_seconds": sentence_start,
                "end_seconds": sentence_end
            })
            
            current_pos += len(sentence)
        
        return result
    except Exception as e:
        print(f"Error in split_into_sentences: {e}")
        # Return the whole segment as one sentence if anything fails
        return [{
            "text": text,
            "start": format_timestamp(start),
            "end": format_timestamp(end),
            "start_seconds": start,
            "end_seconds": end
        }]

def combine_into_complete_sentences(segments):
    """Combine segments into complete sentences ending with period, question mark, or exclamation point"""
    if not segments:
        return []
        
    complete_sentences = []
    current_sentence = {
        "text": "",
        "start": "",
        "end": "",
        "start_seconds": 0,
        "end_seconds": 0
    }
    
    def split_into_individual_sentences(text):
        """Split text into individual sentences using regex"""
        import re
        # Match sentences that end with ., !, or ? followed by space or end of string
        sentences = re.findall(r'[^.!?]+[.!?](?:\s|$)', text)
        if not sentences:
            return [text]
        return [s.strip() for s in sentences]
    
    for i, segment in enumerate(segments):
        segment_text = segment["text"]
        
        # If the segment already contains complete sentences, split them
        if len(re.split(r'[.!?]\s', segment_text)) > 1:
            sentences = split_into_individual_sentences(segment_text)
            total_chars = len(segment_text)
            current_pos = 0
            
            # Distribute timestamps proportionally for each sentence
            for sentence in sentences:
                if not sentence.strip():
                    continue
                    
                sentence_ratio = len(sentence) / total_chars if total_chars > 0 else 0
                sentence_start = segment["start_seconds"] + (current_pos / total_chars) * (segment["end_seconds"] - segment["start_seconds"]) if total_chars > 0 else segment["start_seconds"]
                sentence_end = sentence_start + sentence_ratio * (segment["end_seconds"] - segment["start_seconds"])
                
                complete_sentences.append({
                    "text": sentence,
                    "start": format_timestamp(sentence_start),
                    "end": format_timestamp(sentence_end),
                    "start_seconds": sentence_start,
                    "end_seconds": sentence_end
                })
                
                current_pos += len(sentence)
                
            # Reset the current sentence
            current_sentence = {
                "text": "",
                "start": "",
                "end": "",
                "start_seconds": 0,
                "end_seconds": 0
            }
            continue
        
        # Start a new sentence if we don't have one
        if current_sentence["text"] == "":
            current_sentence = {
                "text": segment_text,
                "start": segment["start"],
                "end": segment["end"],
                "start_seconds": segment["start_seconds"],
                "end_seconds": segment["end_seconds"]
            }
        else:
            # Append to current sentence
            current_sentence["text"] += " " + segment_text
            current_sentence["end"] = segment["end"]
            current_sentence["end_seconds"] = segment["end_seconds"]
        
        # Check if we have a complete sentence
        if re.search(r'[.!?]$', current_sentence["text"].strip()):
            complete_sentences.append(current_sentence)
            current_sentence = {
                "text": "",
                "start": "",
                "end": "",
                "start_seconds": 0,
                "end_seconds": 0
            }
        elif i == len(segments) - 1 and current_sentence["text"]:
            # Add the last segment if it has content
            complete_sentences.append(current_sentence)
            
    return complete_sentences

def main():
    # Parse arguments
    audio_path = sys.argv[1]
    model_name = sys.argv[2]
    language = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != "null" else None
    output_path = sys.argv[4]
    
    # Print available models and validate the requested model
    available_models = whisper.available_models()
    print(f"Available Whisper models: {available_models}")
    
    # Fallback to 'large' if model doesn't exist
    if model_name not in available_models:
        print(f"Model {model_name} not found. Falling back to 'large'")
        model_name = 'large'
    
    # Load the model
    print(f"Loading Whisper {model_name} model...")
    model = whisper.load_model(model_name)
    
    # Transcribe the audio
    print(f"Transcribing {audio_path}...")
    decode_options = {"language": language} if language else {}
    
    try:
        result = model.transcribe(audio_path, **decode_options)
    except Exception as e:
        print(f"Error during transcription: {e}")
        # Try another approach if word timestamps aren't supported
        result = model.transcribe(audio_path, **decode_options)
    
    # Process segments and split into sentences
    all_sentences = []
    
    try:
        for segment in result["segments"]:
            sentences = split_into_sentences(
                segment["text"].strip(), 
                segment["start"], 
                segment["end"]
            )
            all_sentences.extend(sentences)
        
        # Now combine sentences that don't end with proper sentence endings
        all_sentences = combine_into_complete_sentences(all_sentences)
    except Exception as e:
        print(f"Error splitting/combining sentences: {e}")
        print("Falling back to segment-level timestamps")
        # Fallback to segment-level if sentence splitting fails
        all_sentences = []
        for segment in result["segments"]:
            all_sentences.append({
                "text": segment["text"].strip(),
                "start": format_timestamp(segment["start"]),
                "end": format_timestamp(segment["end"]),
                "start_seconds": segment["start"],
                "end_seconds": segment["end"]
            })
    
    # Save the transcription with timestamps
    output = {
        "text": result["text"],
        "segments": all_sentences,
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Transcription saved to {output_path}")

if __name__ == "__main__":
    main()
  `;
  
  try {
    // Remove any existing script file first
    if (fs.existsSync(pythonScriptPath)) {
      try {
        fs.unlinkSync(pythonScriptPath);
        console.log('Removed existing Python script');
      } catch (err) {
        console.error('Failed to remove existing script:', err);
      }
    }
    
    // Write the Python script
    fs.writeFileSync(pythonScriptPath, pythonScript, { encoding: 'utf8' });
    
    // Construct the command
    const langParam = language ? language : 'null';
    const command = `python ${pythonScriptPath} "${audioFilePath}" "${modelSize}" "${langParam}" "${outputJsonPath}"`;
    
    console.log('Executing Whisper transcription...');
    // Execute the Python script
    const { stdout, stderr } = await execPromise(command);
    console.log(stdout);
    
    if (stderr && !stderr.includes('FP16 not supported')) {
      console.error('Error during transcription:', stderr);
    }
    
    // Read and parse the output JSON
    if (fs.existsSync(outputJsonPath)) {
      const transcriptionData = JSON.parse(fs.readFileSync(outputJsonPath, 'utf-8'));
      return transcriptionData;
    } else {
      throw new Error('Transcription file not created');
    }
  } catch (error) {
    console.error('Transcription failed:', error);
    throw error;
  }
} 