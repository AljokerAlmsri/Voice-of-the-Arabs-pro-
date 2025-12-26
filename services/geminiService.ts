
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData, audioBufferToWav } from "./audioService";
import { ArabicDialect, VoiceMode, AudioCustomization } from "../types";

/**
 * تكييف النص للهجة المختارة باستخدام مفتاح API من البيئة
 */
export async function adaptTextToDialect(text: string, dialect: ArabicDialect): Promise<string> {
  if (dialect === ArabicDialect.MSA) return text;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `حول النص التالي إلى لهجة "${dialect}" طبيعية جداً، مع الحفاظ على المعنى والروح. أجب بالنص المترجم فقط دون أي تعليق: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Adaptation Error:", error);
    return text;
  }
}

/**
 * توليد الصوت باستخدام Gemini 2.5 Flash TTS
 */
export async function generateSpeech(
  text: string, 
  voiceName: string, 
  dialect: ArabicDialect, 
  mode: VoiceMode,
  customization: AudioCustomization,
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  onStatusUpdate?.("جاري معالجة اللهجة...");
  const adaptedText = await adaptTextToDialect(text, dialect);
  
  onStatusUpdate?.("جاري توليد الصوت...");
  
  // بناء وصف المشاعر والطبقة بناءً على المدخلات
  const emotionDesc = customization.emotionIntensity < 20 ? "حيادي جداً وروبوتي" : 
                      customization.emotionIntensity < 50 ? "هادئ وطبيعي" :
                      customization.emotionIntensity < 80 ? "متحمس ومعبر" : "انفعالي جداً وشغوف";
  
  const pitchDesc = customization.pitch === 'منخفض' ? "عميق وغليظ" : 
                    customization.pitch === 'مرتفع' ? "رفيع وحاد" : "متوسط وطبيعي";

  const prompt = `
    تقمص شخصية متحدث بلهجة ${dialect}.
    الأسلوب: ${mode}.
    توجيهات الصوت:
    - النبرة: ${pitchDesc}.
    - المشاعر: ${emotionDesc}.
    - السرعة: ${customization.speed}x.
    - قوة التعبير: ${customization.emotionIntensity}%.
    
    النص المراد قراءته: "${adaptedText}"
  `.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("فشل في الحصول على البيانات الصوتية");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  try {
    const rawData = decode(base64Audio);
    const audioBuffer = await decodeAudioData(rawData, audioContext, 24000, 1);
    const wavBlob = audioBufferToWav(audioBuffer);
    return URL.createObjectURL(wavBlob);
  } finally {
    audioContext.close();
  }
}
