# Script Generator App

This path creates a modern web application that generates voice over scripts for stories using AI.

## Description

A web app that allows users to input a story idea and uses AI to generate a precisely timed voice over script based on the desired video duration. The app features:

- Clean, modern UI with a futuristic color scheme
- Integration with Google/Gemini-2.0-flash-001 via Open Router API
- Automatic word count calculation for script timing
- Multiple duration options (1, 3, 5, 10 minutes)
- Script formatting optimized for voiceovers

## Prompt

Create a modern web application that allows users to input a story idea and generate a voice over script using the OpenRouter API and Google/Gemini-2.0-flash-001 model. The application should:

1. Have a sleek, intuitive UI with a futuristic color scheme
2. Allow users to input a story idea in a text area
3. Let users select a desired video duration (1, 3, 5, or 10 minutes)
4. Generate a script with word count appropriate for the selected duration:
   - 1-minute: 180 words (±5%)
   - 3-minute: 540 words (±5%)
   - 5-minute: 900 words (±5%)
   - 10-minute: 1800 words (±5%)
5. Display the generated script with word count information
6. Include options to copy the script or generate a new one
7. Use the Open Router API with the Gemini model for script generation
8. Implement proper error handling for API calls
9. Make the application responsive for different screen sizes

Use Next.js, React, and TailwindCSS for the frontend. Implement the API integration in a secure manner, keeping the API key in environment variables. Ensure all components are well-structured and reusable. 