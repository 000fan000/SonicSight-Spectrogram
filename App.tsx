
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  
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
      setIsSidebarOpen(false);
    } else {
      await startStream(settings);
    }
  }, [isActive, startStream, settings]);

  const updateSettings = useCallback(async (newSettings: Partial<VisualizerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (isActive && newSettings.fftSize !== undefined && newSettings.fftSize !== prev.fftSize) {
        audioProcessor.stop();
        startStream(updated);
      } else if (newSettings.gain !== undefined) {
        audioProcessor.setGain(newSettings.gain);
      }
      return updated;
    });
  }, [isActive, startStream]);

  const handleExport = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      const link = document.createElement('a');
      link.download = `spectrogram-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, []);

  const handleCaptureAndAnalyze = async () => {
    if (!isActive) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsSidebarOpen(false);

    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
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
    <div className="flex h-screen flex-col md:flex-row bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 min-w-0 relative">
        <header className="flex justify-between items-center mb-4 md:mb-6 z-20">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-indigo-400/20">
              <Icons.Activity className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight leading-none text-white">SonicSight Pro</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 mono font-bold uppercase tracking-widest">Acoustic Lab</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {isActive && (
                <button 
                  onClick={handleExport}
                  className="p-2 md:px-3 md:py-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/20 transition-all text-zinc-400 hover:text-white flex items-center gap-2 text-xs font-bold"
                  aria-label="Export Spectrogram"
                >
                  <Icons.Download className="w-4 h-4" />
                  <span className="hidden md:inline">EXPORT</span>
                </button>
             )}
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400"
              >
                <Icons.Settings className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="flex-1 relative min-h-0">
          <SpectrogramCanvas 
            analyser={analyserRef.current} 
            settings={settings}
            isPaused={isPaused}
          />
          
          {/* Capture Flash Overlay */}
          {flash && <div className="absolute inset-0 z-50 animate-flash pointer-events-none" />}

          {!isActive && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-xl border border-dashed border-white/5">
              <div className="text-center p-6 md:p-12 max-w-md">
                <div className="mb-6 md:mb-8 inline-flex p-4 md:p-5 rounded-3xl bg-indigo-600/10 text-indigo-500 ring-1 ring-indigo-500/20">
                  <Icons.Mic className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">Spectral Stream Offline</h3>
                <p className="text-zinc-500 text-xs md:text-sm mb-8 md:mb-10 leading-relaxed font-medium">
                  The audio engine is idle. Connect your microphone to visualize acoustic signatures and harmonic distributions in real-time.
                </p>
                <button
                  onClick={toggleStream}
                  className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                >
                  <Icons.Activity className="w-5 h-5" />
                  Initialize Core
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Insight Result */}
        {analysisResult && (
          <div className="absolute bottom-4 left-4 right-4 z-30 bg-zinc-900/90 backdrop-blur-xl border-l-4 border-indigo-600 rounded-r-xl p-4 animate-in shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 ring-1 ring-indigo-500/20">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Signal Report</h4>
                  <button onClick={() => setAnalysisResult(null)} className="text-zinc-600 hover:text-white">✕</button>
                </div>
                <div className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium italic">
                  "{analysisResult}"
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Control Sidebar / Mobile Drawer */}
      <div 
        className={`mobile-drawer ${isSidebarOpen ? 'open' : ''} md:static md:translate-y-0 md:block md:w-80 md:h-full`}
      >
        {/* Mobile Handle */}
        <div 
          className="md:hidden w-full h-8 flex items-center justify-center bg-zinc-900 border-b border-white/5"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="w-12 h-1 bg-zinc-700 rounded-full" />
        </div>
        
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

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
