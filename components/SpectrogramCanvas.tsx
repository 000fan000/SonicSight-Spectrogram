
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

  const draw = useCallback(() => {
    if (!analyser || !canvasRef.current || isPaused) {
      requestRef.current = requestAnimationFrame(draw);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Buffer canvas for scrolling
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
    
    // Draw new column
    const barWidth = 1;
    const barHeight = canvas.height / (bufferLength * 0.8); // Focus on lower 80% of frequencies usually
    
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      ctx.fillStyle = COLOR_MAPS[settings.colorScheme](value);
      // Frequencies are drawn from bottom up
      const y = canvas.height - (i * barHeight);
      ctx.fillRect(canvas.width - 1, y, barWidth, barHeight);
    }

    // Apply the scrolled buffer
    ctx.drawImage(bCanvas, 0, 0);

    requestRef.current = requestAnimationFrame(draw);
  }, [analyser, settings.colorScheme, isPaused]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
          if (bufferCanvasRef.current) {
            bufferCanvasRef.current.width = parent.clientWidth;
            bufferCanvasRef.current.height = parent.clientHeight;
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

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded text-xs mono text-white/70 border border-white/5">
          {analyser ? 'LIVE STREAMING' : 'READY TO START'}
        </div>
        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded text-xs mono text-white/70 border border-white/5 uppercase">
          Color: {settings.colorScheme}
        </div>
      </div>
      
      {/* Frequency Labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4 pl-2 pointer-events-none text-[10px] mono text-white/40">
        <span>20kHz</span>
        <span>15kHz</span>
        <span>10kHz</span>
        <span>5kHz</span>
        <span>0Hz</span>
      </div>
    </div>
  );
};

export default SpectrogramCanvas;
