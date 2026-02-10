
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

  const startStream = useCallback(async (currentSettings: VisualizerSettings) => {
    try {
      await audioProcessor.start(currentSettings.fftSize);
      analyserRef.current = audioProcessor.getAnalyser();
      audioProcessor.setGain(currentSettings.gain);
      setIsActive(true);
    } catch (err) {
      console.error("Failed to start microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  }, []);

  const toggleStream = useCallback(async () => {
    if (isActive) {
      audioProcessor.stop();
      analyserRef.current = null;
      setIsActive(false);
      setIsPaused(false);
    } else {
      await startStream(settings);
    }
  }, [isActive, startStream, settings]);

  const updateSettings = useCallback(async (newSettings: Partial<VisualizerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Some settings require a hardware/analyser restart
      if (isActive && newSettings.fftSize !== undefined && newSettings.fftSize !== prev.fftSize) {
        audioProcessor.stop();
        startStream(updated);
      } else if (newSettings.gain !== undefined) {
        audioProcessor.setGain(newSettings.gain);
      }
      
      return updated;
    });
  }, [isActive, startStream]);

  const handleCaptureAndAnalyze = async () => {
    if (!isActive) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const insight = await analyzeSpectrogram(dataUrl);
        setAnalysisResult(insight);
      }
    } catch (error) {
      setAnalysisResult("Analysis engine failure.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col p-4 lg:p-6 min-w-0">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 ring-1 ring-indigo-400/20">
              <Icons.Activity className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black tracking-tight leading-none text-white">SonicSight Pro</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] lg:text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 mono font-bold uppercase tracking-widest">Acoustic Lab</span>
                <span className="text-[8px] lg:text-[9px] text-zinc-600 mono font-bold">ST-4096-X</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
             {isActive && (
                <button 
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      const link = document.createElement('a');
                      link.download = `spectral-data-${Date.now()}.png`;
                      link.href = canvas.toDataURL();
                      link.click();
                    }
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/20 transition-all text-zinc-400 hover:text-white flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Icons.Download className="w-4 h-4" />
                  <span className="hidden sm:inline">EXPORT MAP</span>
                  <span className="sm:hidden">EXPORT</span>
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
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-xl border border-dashed border-white/5">
              <div className="text-center p-6 lg:p-12 max-w-md mx-4">
                <div className="mb-6 lg:mb-8 inline-flex p-4 lg:p-5 rounded-2xl lg:rounded-3xl bg-indigo-600/10 text-indigo-500 ring-1 ring-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                  <Icons.Mic className="w-8 h-8 lg:w-10 lg:h-10" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-3 tracking-tight">Spectral Stream Offline</h3>
                <p className="text-zinc-500 text-xs lg:text-sm mb-6 lg:mb-10 leading-relaxed font-medium">
                  The audio engine is idle. Connect your microphone to visualize acoustic signatures and harmonic distributions in real-time.
                </p>
                <button
                  onClick={toggleStream}
                  className="w-full sm:w-auto px-8 lg:px-10 py-3 lg:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm tracking-widest uppercase shadow-2xl shadow-indigo-600/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 lg:gap-3 mx-auto"
                >
                  <Icons.Activity className="w-4 h-4 lg:w-5 lg:h-5" />
                  Initialize Core
                </button>
              </div>
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="mt-4 lg:mt-6 bg-zinc-900/80 backdrop-blur-xl border-l-4 border-indigo-600 rounded-r-xl p-4 lg:p-5 animate-in slide-in-from-bottom-6 fade-in duration-700 shadow-2xl">
            <div className="flex items-start gap-3 lg:gap-5">
              <div className="p-2 lg:p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 ring-1 ring-indigo-500/20">
                <Icons.Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[9px] lg:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Neural Signal Analysis</h4>
                  <button onClick={() => setAnalysisResult(null)} className="text-zinc-600 hover:text-white transition-colors text-lg lg:text-base">
                    <span className="sr-only">Dismiss</span>
                    ✕
                  </button>
                </div>
                <div className="text-xs lg:text-sm text-zinc-300 leading-relaxed font-medium font-serif italic">
                  "{analysisResult}"
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
