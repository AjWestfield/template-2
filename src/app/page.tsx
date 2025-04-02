'use client';

import ScriptGenerator from '@/components/ScriptGenerator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600">
          AI Script Generator
        </h1>
        
        <p className="text-lg md:text-xl mb-8 text-gray-300">
          Transform your story ideas into perfectly timed voice over scripts with AI.
        </p>
        
        <div className="flex items-center mb-8">
          <div className="flex space-x-2 items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium">1</div>
            <span className="text-white font-medium">Create Script</span>
          </div>
          <div className="h-px w-12 bg-gray-700 mx-2"></div>
          <div className="flex space-x-2 items-center opacity-50">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">2</div>
            <span className="text-gray-400 font-medium">Generate Voice</span>
          </div>
        </div>
        
        <ScriptGenerator />
      </div>
    </main>
  );
}
