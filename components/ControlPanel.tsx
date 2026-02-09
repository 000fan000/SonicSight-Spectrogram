
import React from 'react';
import { Icons, DEFAULT_SETTINGS } from '../constants';
import { ColorScheme, VisualizerSettings } from '../types';

interface Props {
  isActive: boolean;
  isPaused: boolean;
  settings: VisualizerSettings;
  onToggle: () => void;
  onTogglePause: () => void;
  onUpdateSettings: (s: Partial<VisualizerSettings>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const ControlPanel: React.FC<Props> = ({ 
  isActive, 
  isPaused, 
  settings, 
  onToggle, 
  onTogglePause,
  onUpdateSettings,
  onAnalyze,
  isAnalyzing
}) => {
  return (
    <div className="flex flex-col gap-6 p-6 bg-zinc-900 border-l border-white/10 w-80 shrink-0 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
          SonicSight
        </h2>
        <p className="text-sm text-zinc-400">Professional Spectrum Analysis</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onToggle}
          className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isActive 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
          }`}
        >
          {isActive ? <Icons.Stop className="w-5 h-5" /> : <Icons.Mic className="w-5 h-5" />}
          {isActive ? 'Stop Stream' : 'Start Microphone'}
        </button>

        {isActive && (
          <button
            onClick={onTogglePause}
            className="w-full py-2 px-4 rounded-lg text-sm font-medium border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors"
          >
            {isPaused ? 'Resume Visualizer' : 'Pause Rendering'}
          </button>
        )}
      </div>

      <div className="h-px bg-white/5 w-full" />

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Icons.Settings className="w-3.5 h-3.5" />
            Visual Settings
          </label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs mono">
                <span className="text-zinc-400">Sensitivity (Gain)</span>
                <span className="text-white">{settings.gain.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                value={settings.gain}
                onChange={(e) => onUpdateSettings({ gain: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs text-zinc-400 block">Color Map</span>
              <div className="grid grid-cols-2 gap-2">
                {(['magma', 'viridis', 'inferno', 'plasma', 'grayscale'] as ColorScheme[]).map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => onUpdateSettings({ colorScheme: scheme })}
                    className={`text-[10px] uppercase font-bold py-1.5 rounded border transition-all ${
                      settings.colorScheme === scheme 
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' 
                        : 'border-white/5 bg-white/5 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {scheme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5 w-full" />

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Icons.Sparkles className="w-3.5 h-3.5" />
            AI Intelligence
          </label>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Use Gemini Pro Vision to analyze the current spectrogram patterns.
          </p>
          <button
            onClick={onAnalyze}
            disabled={!isActive || isAnalyzing}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              isAnalyzing 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 active:scale-[0.98]'
            } disabled:opacity-50`}
          >
            {isAnalyzing ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Icons.Sparkles className="w-4 h-4" />
            )}
            Analyze Signature
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6 text-[10px] text-zinc-600 mono flex justify-between">
        <span>FFT {settings.fftSize}</span>
        <span>44.1 KHZ</span>
      </div>
    </div>
  );
};

export default ControlPanel;
