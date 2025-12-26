
import { GoogleGenAI, Modality } from "@google/genai";

// وظيفة مساعدة لفك تشفير base64 إلى Uint8Array
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// وظيفة مساعدة لإنشاء Header ملف WAV
function createWavHeader(dataLength: number, sampleRate: number) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'يرجى استخدام POST Request' });
  }

  // استلام البيانات بما في ذلك خيارات التخصيص المتقدمة
  const { 
    text, 
    voice = 'Kore', 
    dialect = 'اللغة العربية الفصحى', 
    speed = 1.0, 
    pitch = 'عادي',
    emotionIntensity = 50,
    apiKey 
  } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'النص مطلوب في Body' });
  }

  const finalApiKey = apiKey || process.env.API_KEY;

  if (!finalApiKey) {
    return res.status(401).json({ error: 'مفتاح API غير متوفر.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    
    // 1. تكييف النص للهجة
    const adaptPrompt = `حول النص التالي إلى لهجة "${dialect}" بشكل طبيعي جداً. أجب بالنص الجديد فقط: "${text}"`;
    const adaptRes = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: adaptPrompt }] }],
    });
    const finalText = adaptRes.text?.trim() || text;

    // بناء وصف المشاعر والطبقة بناءً على المدخلات القادمة من API
    const emotionDesc = emotionIntensity < 20 ? "حيادي جداً وروبوتي" : 
                        emotionIntensity < 50 ? "هادئ وطبيعي" :
                        emotionIntensity < 80 ? "متحمس ومعبر" : "انفعالي جداً وشغوف";
    
    const pitchDesc = pitch === 'منخفض' ? "عميق وغليظ" : 
                      pitch === 'مرتفع' ? "رفيع وحاد" : "متوسط وطبيعي";

    // 2. توليد الصوت مع التعليمات المتقدمة
    const ttsPrompt = `
      تقمص شخصية متحدث بلهجة ${dialect}.
      توجيهات الصوت:
      - النبرة: ${pitchDesc}.
      - المشاعر: ${emotionDesc}.
      - السرعة: ${speed}x.
      - قوة التعبير: ${emotionIntensity}%.
      
      النص: "${finalText}"
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("فشل توليد الصوت");

    const rawAudio = decodeBase64(base64Audio);
    const wavHeader = createWavHeader(rawAudio.length, 24000);
    
    const fullAudio = new Uint8Array(wavHeader.length + rawAudio.length);
    fullAudio.set(wavHeader);
    fullAudio.set(rawAudio, wavHeader.length);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="sawt.wav"');
    return res.status(200).send(fullAudio);

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'خطأ: ' + error.message });
  }
}
