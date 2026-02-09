
export type ColorScheme = 'magma' | 'viridis' | 'inferno' | 'plasma' | 'grayscale';

export interface VisualizerSettings {
  fftSize: number;
  minDecibels: number;
  maxDecibels: number;
  smoothingTimeConstant: number;
  colorScheme: ColorScheme;
  gain: number;
}

export interface AnalysisResult {
  dominantFrequency: number;
  peakAmplitude: number;
  insight?: string;
}
