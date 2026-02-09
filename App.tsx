
import React, { useState, useCallback, useRef } from 'react';
import SpectrogramCanvas from './components/SpectrogramCanvas';
import ControlPanel from './components/ControlPanel';
import { audioProcessor } from './services/audioService';
import { analyzeSpectrogram } from './services/geminiService';
import { VisualizerSettings } from './types';
import { DEFAULT_SETTINGS, Icons } from './constants';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState<VisualizerSettings>(DEFAULT_SETTINGS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  const analyserRef = useRef<AnalyserNode | null>(null);

  const toggleStream = useCallback(async () => {
    if (isActive) {
      audioProcessor.stop();
      analyserRef.current = null;
      setIsActive(false);
      setIsPaused(false);
    } else {
      try {
        await audioProcessor.start(settings.fftSize);
        analyserRef.current = audioProcessor.getAnalyser();
        audioProcessor.setGain(settings.gain);
        setIsActive(true);
      } catch (err) {
        console.error("Failed to start microphone:", err);
        alert("Could not access microphone. Please ensure permissions are granted.");
      }
    }
  }, [isActive, settings.fftSize, settings.gain]);

  const updateSettings = useCallback((newSettings: Partial<VisualizerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.gain !== undefined) {
        audioProcessor.setGain(newSettings.gain);
      }
      return updated;
    });
  }, []);

  const handleCaptureAndAnalyze = async () => {
    if (!isActive) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Capture the current canvas state
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const insight = await analyzeSpectrogram(dataUrl);
        setAnalysisResult(insight);
      }
    } catch (error) {
      setAnalysisResult("Failed to perform analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `spectrogram-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="flex h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 min-w-0">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Icons.Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">SonicSight</h1>
              <span className="text-xs text-zinc-500 mono">v1.2.0 • REAL-TIME FREQUENCY ENGINE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {isActive && (
                <button 
                  onClick={downloadSnapshot}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                  title="Download Snapshot"
                >
                  <Icons.Download className="w-5 h-5" />
                </button>
             )}
          </div>
        </header>

        <div className="flex-1 relative min-h-0">
          <SpectrogramCanvas 
            analyser={analyserRef.current} 
            settings={settings}
            isPaused={isPaused}
          />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl border border-dashed border-white/10">
              <div className="text-center p-8 max-w-sm">
                <div className="mb-6 inline-flex p-4 rounded-full bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20">
                  <Icons.Mic className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Initialize Audio Stream</h3>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                  Start the microphone to begin visualizing environmental sounds, voice patterns, or musical frequencies in real-time.
                </p>
                <button
                  onClick={toggleStream}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                >
                  Activate Engine
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Insight Result Area */}
        {analysisResult && (
          <div className="mt-6 bg-zinc-900/50 backdrop-blur-md border border-indigo-500/20 rounded-xl p-5 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Gemini Audio Insight</h4>
                  <button onClick={() => setAnalysisResult(null)} className="text-zinc-600 hover:text-zinc-400">
                    ✕
                  </button>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  "{analysisResult}"
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar Control Panel */}
      <ControlPanel 
        isActive={isActive}
        isPaused={isPaused}
        settings={settings}
        onToggle={toggleStream}
        onTogglePause={() => setIsPaused(!isPaused)}
        onUpdateSettings={updateSettings}
        onAnalyze={handleCaptureAndAnalyze}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};

export default App;
