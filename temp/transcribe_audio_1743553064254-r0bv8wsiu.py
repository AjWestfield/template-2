
import sys
import json
import whisper
import torch

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
    except Exception as e:
        print(f"Error splitting sentences: {e}")
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
  