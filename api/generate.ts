
import { GoogleGenAI, Modality } from "@google/genai";

// وظيفة مساعدة لإنشاء Header ملف WAV بشكل يدوي
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
  view.setUint32(28, sampleRate * 2, true); // Byte Rate
  view.setUint16(32, 2, true); // Block Align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'يرجى استخدام POST Request' });
  }

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
    
    // 1. تكييف النص للهجة المحددة
    const adaptPrompt = `حول النص التالي إلى لهجة "${dialect}" بشكل طبيعي جداً. أجب بالنص الجديد فقط: "${text}"`;
    const adaptRes = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: adaptPrompt }] }],
    });
    const finalText = adaptRes.text?.trim() || text;

    // تحويل الخيارات إلى وصف نصي دقيق لنموذج Gemini
    const emotionDesc = emotionIntensity < 20 ? "حيادي جداً" : 
                        emotionIntensity < 50 ? "هادئ" :
                        emotionIntensity < 80 ? "متحمس" : "انفعالي جداً";
    
    const pitchDesc = pitch === 'منخفض' ? "عميق" : 
                      pitch === 'مرتفع' ? "حاد" : "عادي";

    // 2. طلب توليد الصوت
    const ttsPrompt = `
      تقمص شخصية متحدث بلهجة ${dialect}.
      النبرة: ${pitchDesc}.
      المشاعر: ${emotionDesc}.
      السرعة: ${speed}x.
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
    if (!base64Audio) throw new Error("فشل توليد الصوت من Gemini");

    // 3. تحويل Base64 إلى Uint8Array وتجهيز الملف النهائي
    // Fix: replaced Buffer with Uint8Array and manual base64 decoding to resolve 'Cannot find name Buffer' errors
    const binaryString = atob(base64Audio);
    const rawAudio = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      rawAudio[i] = binaryString.charCodeAt(i);
    }
    
    const wavHeader = createWavHeader(rawAudio.length, 24000);
    
    // دمج الـ Header مع البيانات الصوتية يدوياً باستخدام Uint8Array
    const finalBuffer = new Uint8Array(wavHeader.length + rawAudio.length);
    finalBuffer.set(wavHeader);
    finalBuffer.set(rawAudio, wavHeader.length);

    // 4. إرسال الرد كبيانات ثنائية حقيقية
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', finalBuffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename="sawtalarab.wav"');
    
    return res.status(200).send(finalBuffer);

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: 'خطأ داخلي: ' + error.message });
  }
}
