
import { GoogleGenAI } from "@google/genai";

export async function analyzeSpectrogram(imageDataBase64: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze this audio spectrogram. What kind of sounds or patterns can you identify? For example, is it speech, music, white noise, or a specific instrument? Describe the frequency distribution and intensity patterns shown." },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageDataBase64.split(',')[1],
              },
            },
          ],
        },
      ],
    });

    return response.text || "I couldn't identify specific patterns in this snapshot.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "An error occurred while analyzing the audio signature.";
  }
}
