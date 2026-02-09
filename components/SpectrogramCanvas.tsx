
import React, { useEffect, useRef, useCallback } from 'react';
import { ColorScheme, VisualizerSettings } from '../types';

interface Props {
  analyser: AnalyserNode | null;
  settings: VisualizerSettings;
  isPaused: boolean;
}

const COLOR_MAPS: Record<ColorScheme, (v: number) => string> = {
  magma: (v) => {
    const r = v > 150 ? 255 : (v / 150) * 255;
    const g = v > 150 ? (v - 150) / 105 * 255 : 0;
    const b = v > 200 ? (v - 200) / 55 * 255 : 0;
    return `rgb(${r},${g},${b})`;
  },
  viridis: (v) => {
    const r = (1 - v / 255) * 68;
    const g = (v / 255) * 190;
    const b = (v / 255) * 158;
    return `rgb(${r},${g},${b})`;
  },
  inferno: (v) => {
    const r = v > 100 ? 255 : (v / 100) * 255;
    const g = v > 180 ? 255 : v > 100 ? (v - 100) / 80 * 255 : 0;
    const b = v > 220 ? 255 : v > 180 ? (v - 180) / 40 * 255 : 0;
    return `rgb(${r},${g},${b})`;
  },
  plasma: (v) => {
    const r = (v / 255) * 237;
    const g = (1 - v / 255) * 121;
    const b = 255;
    return `rgb(${r},${g},${b})`;
  },
  grayscale: (v) => `rgb(${v},${v},${v})`,
};

const SpectrogramCanvas: React.FC<Props> = ({ analyser, settings, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>();

  // Use a named function or provide the expected timestamp argument to avoid circularity or parameter count issues
  const draw = useCallback((_timestamp: number) => {
    if (!analyser || !canvasRef.current || isPaused) {
      requestRef.current = requestAnimationFrame(draw);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    if (!bufferCanvasRef.current) {
      bufferCanvasRef.current = document.createElement('canvas');
      bufferCanvasRef.current.width = canvas.width;
      bufferCanvasRef.current.height = canvas.height;
    }
    const bCanvas = bufferCanvasRef.current;
    const bCtx = bCanvas.getContext('2d', { alpha: false });
    if (!bCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Scroll existing image
    bCtx.drawImage(canvas, -1, 0);
    
    const height = canvas.height;
    const width = canvas.width;
    
    // Clear the newest column
    ctx.fillStyle = '#000';
    ctx.fillRect(width - 1, 0, 1, height);

    if (settings.scaleMode === 'linear') {
      const barHeight = height / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        ctx.fillStyle = COLOR_MAPS[settings.colorScheme](value);
        const y = height - (i * barHeight);
        ctx.fillRect(width - 1, y, 1, barHeight + 1);
      }
    } else {
      // Logarithmic scaling logic
      // We map the visible vertical pixels to frequency bins log-proportionally
      const minFreq = 20; // Human hearing min
      const maxFreq = analyser.context.sampleRate / 2;
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      
      for (let y = 0; y < height; y++) {
        // Find corresponding frequency for this pixel
        const percent = 1 - (y / height);
        const freq = Math.pow(10, logMin + percent * (logMax - logMin));
        
        // Find closest bin index for this frequency
        const binIndex = Math.floor(freq / (maxFreq / bufferLength));
        const value = dataArray[Math.min(binIndex, bufferLength - 1)] || 0;
        
        ctx.fillStyle = COLOR_MAPS[settings.colorScheme](value);
        ctx.fillRect(width - 1, y, 1, 1);
      }
    }

    // Apply the scrolled buffer
    ctx.drawImage(bCanvas, 0, 0);

    requestRef.current = requestAnimationFrame(draw);
  }, [analyser, settings.colorScheme, settings.scaleMode, isPaused]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const w = parent.clientWidth;
          const h = parent.clientHeight;
          canvasRef.current.width = w;
          canvasRef.current.height = h;
          if (bufferCanvasRef.current) {
            bufferCanvasRef.current.width = w;
            bufferCanvasRef.current.height = h;
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    requestRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [draw]);

  const labels = settings.scaleMode === 'logarithmic' 
    ? ['20k', '10k', '5k', '2k', '1k', '500', '200', '100', '50', '20']
    : ['20k', '15k', '10k', '5k', '0'];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-xl border border-white/10 shadow-2xl group">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded text-[10px] mono text-white/70 border border-white/5 uppercase tracking-widest">
          {analyser ? '• Live Stream' : 'Ready'}
        </div>
        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded text-[10px] mono text-white/70 border border-white/5 uppercase tracking-widest">
          {settings.scaleMode} Scale
        </div>
      </div>
      
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2 pl-2 pointer-events-none text-[9px] mono text-white/30">
        {labels.map(l => <span key={l}>{l}Hz</span>)}
      </div>

      <div className="absolute right-4 bottom-4 pointer-events-none flex flex-col items-end">
         <span className="text-[10px] mono text-white/20 uppercase tracking-tighter">SonicSight Engine v1.2</span>
      </div>
    </div>
  );
};

export default SpectrogramCanvas;
