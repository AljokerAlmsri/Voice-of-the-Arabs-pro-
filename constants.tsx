
import React from 'react';
import { ArabicDialect, VoiceMode, VoiceOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Kore', name: 'كوري', gender: 'male', description: 'صوت عميق وواضح للمحتوى الإخباري' },
  { id: 'Puck', name: 'باك', gender: 'male', description: 'صوت شبابي وحيوي للمحتوى الإعلاني' },
  { id: 'Charon', name: 'شارون', gender: 'male', description: 'صوت هادئ ومريح للكتب الصوتية' },
  { id: 'Zephyr', name: 'زفير', gender: 'female', description: 'صوت أنثوي رقيق وجذاب' },
  { id: 'Fenrir', name: 'فنرير', gender: 'male', description: 'صوت قوي ومؤثر للمقاطع الملحمية' }
];

export const DIALECTS: ArabicDialect[] = [
  ArabicDialect.MSA,
  ArabicDialect.Egyptian,
  ArabicDialect.Gulf,
  ArabicDialect.Levantine,
  ArabicDialect.Maghrebi,
  ArabicDialect.Iraqi
];

export const MODES: VoiceMode[] = [
  VoiceMode.Professional,
  VoiceMode.Friendly,
  VoiceMode.Cheerful,
  VoiceMode.Serious,
  VoiceMode.Soft
];
