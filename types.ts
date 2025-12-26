
export enum ArabicDialect {
  MSA = 'اللغة العربية الفصحى',
  Egyptian = 'اللهجة المصرية',
  Gulf = 'اللهجة الخليجية',
  Levantine = 'اللهجة الشامية',
  Maghrebi = 'اللهجة المغربية',
  Iraqi = 'اللهجة العراقية'
}

export enum VoiceMode {
  Professional = 'احترافي',
  Friendly = 'ودي',
  Cheerful = 'مبهج',
  Serious = 'جدي',
  Soft = 'ناعم',
  Dramatic = 'درامي',
  Angry = 'غاضب',
  Sad = 'حزين'
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
}

export interface AudioCustomization {
  speed: number; // 0.5 to 2.0
  pitch: 'منخفض' | 'عادي' | 'مرتفع';
  emotionIntensity: number; // 0 to 100
}

export interface GeneratedSpeech {
  id: string;
  text: string;
  timestamp: number;
  audioUrl: string;
  dialect: ArabicDialect;
  mode: VoiceMode;
  voice: string;
  customization: AudioCustomization;
}
