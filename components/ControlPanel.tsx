
import React from 'react';
import { Icons } from '../constants';
import { ColorScheme, VisualizerSettings, ScaleMode } from '../types';

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
  const fftSizes = [1024, 2048, 4096, 8192];

  return (
    <div className="flex flex-col gap-6 p-6 bg-zinc-900 border-white/10 md:border-l h-full overflow-y-auto">
      <div className="hidden md:flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Icons.Activity className={`w-5 h-5 ${isActive ? 'text-indigo-500 animate-pulse' : 'text-zinc-600'}`} />
          SonicSight
        </h2>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Spectral Analysis Suite</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onToggle}
          className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isActive 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
          }`}
        >
          {isActive ? <Icons.Stop className="w-5 h-5" /> : <Icons.Mic className="w-5 h-5" />}
          {isActive ? 'Terminate Stream' : 'Initialize Engine'}
        </button>

        {isActive && (
          <button
            onClick={onTogglePause}
            className="w-full py-2 px-4 rounded-lg text-xs font-bold border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isPaused ? 'Resume Rendering' : 'Pause Waterfall'}
          </button>
        )}
      </div>

      <div className="h-px bg-white/5 w-full" />

      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Icons.Settings className="w-3 h-3" />
            Signal Parameters
          </label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs mono">
                <span className="text-zinc-500">Frequency Scale</span>
                <span className="text-indigo-400 uppercase tracking-tighter">{settings.scaleMode}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['linear', 'logarithmic'] as ScaleMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdateSettings({ scaleMode: mode })}
                    className={`text-[10px] uppercase font-bold py-2.5 rounded-lg border transition-all ${
                      settings.scaleMode === mode 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                        : 'border-white/5 bg-white/5 text-zinc-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs mono">
                <span className="text-zinc-500">Resolution (FFT)</span>
                <span className="text-white">{settings.fftSize}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {fftSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateSettings({ fftSize: size })}
                    className={`text-[9px] font-bold py-2 rounded border transition-all ${
                      settings.fftSize === size 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                        : 'border-white/5 bg-white/5 text-zinc-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs mono">
                <span className="text-zinc-500">Input Gain</span>
                <span className="text-white">{(settings.gain * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                value={settings.gain}
                onChange={(e) => onUpdateSettings({ gain: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Thermal Mapping</span>
              <div className="grid grid-cols-3 gap-1">
                {(['magma', 'viridis', 'plasma'] as ColorScheme[]).map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => onUpdateSettings({ colorScheme: scheme })}
                    className={`text-[9px] uppercase font-bold py-2 rounded border transition-all ${
                      settings.colorScheme === scheme 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                        : 'border-white/5 bg-white/5 text-zinc-600'
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
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Icons.Sparkles className="w-3 h-3 text-purple-400" />
            Neural Analysis
          </label>
          <button
            onClick={onAnalyze}
            disabled={!isActive || isAnalyzing}
            className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              isAnalyzing 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-500/10 active:scale-[0.98]'
            } disabled:opacity-50`}
          >
            {isAnalyzing ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Icons.Sparkles className="w-4 h-4" />
            )}
            Analyze acoustics
          </button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 text-[9px] text-zinc-600 mono flex justify-between items-center">
        <span>BUFF: {settings.fftSize / 2} BINS</span>
        <div className="flex gap-2 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
          <span>48.0kHz</span>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
