
export type ColorScheme = 'magma' | 'viridis' | 'inferno' | 'plasma' | 'grayscale';
export type ScaleMode = 'linear' | 'logarithmic';

export interface VisualizerSettings {
  fftSize: number;
  minDecibels: number;
  maxDecibels: number;
  smoothingTimeConstant: number;
  colorScheme: ColorScheme;
  scaleMode: ScaleMode;
  gain: number;
}

export interface AnalysisResult {
  dominantFrequency: number;
  peakAmplitude: number;
  insight?: string;
}
