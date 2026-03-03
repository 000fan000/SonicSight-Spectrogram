
export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private stream: MediaStream | null = null;

  async start(fftSize: number = 2048): Promise<void> {
    try {
      // Step 1: Request microphone access first (critical for Safari iOS)
      // This must be triggered by a user gesture
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false 
        }, 
        video: false 
      });
      
      // Step 2: Create AudioContext after obtaining media stream
      // This ensures the context is created in a valid state
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Step 3: Ensure AudioContext is running
      // Safari requires this to be in response to a user gesture
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Step 4: Create audio nodes
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();

      // Step 5: Configure analyser
      this.analyser.fftSize = fftSize;
      this.analyser.smoothingTimeConstant = 0.8;

      // Step 6: Connect audio graph
      this.microphone.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      // Clean up any partially initialized resources
      this.stop();
      throw error;
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.microphone = null;
    this.gainNode = null;
    this.stream = null;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  setGain(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
  }
}

export const audioProcessor = new AudioProcessor();
