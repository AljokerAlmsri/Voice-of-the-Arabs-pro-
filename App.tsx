
import React, { useState, useRef, useEffect } from 'react';
import { ArabicDialect, VoiceMode, VoiceOption, AudioCustomization } from './types';
import { DIALECTS, MODES, VOICE_OPTIONS } from './constants';
import { generateSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('مرحباً بكم في استوديو صوت العرب الذكي، حيث نحول نصوصكم إلى واقع مسموع بكل اللهجات.');
  const [selectedDialect, setSelectedDialect] = useState<ArabicDialect>(ArabicDialect.MSA);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'studio' | 'api'>('studio');
  const [customization, setCustomization] = useState<AudioCustomization>({
    speed: 1.0,
    pitch: 'عادي',
    emotionIntensity: 50
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleManualGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    try {
      const url = await generateSpeech(
        inputText,
        selectedVoice.id,
        selectedDialect,
        VoiceMode.Professional,
        customization,
        () => {}
      );
      setCurrentAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (error) {
      console.error(error);
      alert("فشل التوليد، يرجى التحقق من المفتاح أو الاتصال.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getApiUrl = () => `${window.location.origin}/api/generate`;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans rtl">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-600/20 shadow-2xl rotate-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">صوت العرب <span className="text-indigo-500 text-xs">PRO</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Advanced TTS Studio</p>
            </div>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setActiveTab('studio')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'studio' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>الاستوديو</button>
            <button onClick={() => setActiveTab('api')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'api' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>REST API (n8n)</button>
          </div>
        </header>

        {activeTab === 'studio' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <main className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-sm">
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-6">
                  {VOICE_OPTIONS.map(v => (
                    <button 
                      key={v.id} 
                      onClick={() => setSelectedVoice(v)} 
                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all shrink-0 ${selectedVoice.id === v.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      <span className="text-lg">{v.gender === 'male' ? '👨' : '👩'}</span>
                      <div className="text-right">
                        <p className="text-xs font-bold">{v.name}</p>
                        <p className="text-[8px] opacity-50 uppercase font-mono">{v.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
                
                <textarea 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  placeholder="اكتب النص هنا..." 
                  className="w-full h-64 bg-transparent border-none text-slate-100 text-2xl leading-relaxed resize-none focus:ring-0 placeholder:text-slate-800 custom-scrollbar" 
                />

                <div className="h-px bg-slate-800/40 my-8"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 mr-2">تكييف اللهجة</label>
                    <select 
                      value={selectedDialect} 
                      onChange={e => setSelectedDialect(e.target.value as ArabicDialect)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-400 outline-none focus:border-indigo-600 transition-colors appearance-none cursor-pointer"
                    >
                      {DIALECTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-[10px] text-slate-600 leading-tight mr-2">
                      * سيتم استخدام الذكاء الاصطناعي لإعادة صياغة النص بلهجة <span className="text-indigo-400 font-bold">{selectedDialect}</span> قبل التوليد لضمان واقعية النطق.
                    </p>
                  </div>
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2.5rem] p-8 shadow-xl">
                <h3 className="text-[10px] font-black text-slate-500 mb-8 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                  إعدادات الصوت المتقدمة
                </h3>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-black">
                      <span className="text-slate-400">سرعة النطق</span>
                      <span className="text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded">{customization.speed}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      value={customization.speed} 
                      onChange={e => setCustomization({...customization, speed: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-black">
                      <span className="text-slate-400">قوة المشاعر</span>
                      <span className="text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded">{customization.emotionIntensity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1" 
                      value={customization.emotionIntensity} 
                      onChange={e => setCustomization({...customization, emotionIntensity: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 block">طبقة الصوت (Pitch)</label>
                    <div className="flex gap-2">
                      {['منخفض', 'عادي', 'مرتفع'].map(p => (
                        <button 
                          key={p} 
                          onClick={() => setCustomization({...customization, pitch: p as any})} 
                          className={`flex-1 py-3 text-[10px] rounded-xl border font-bold transition-all ${customization.pitch === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleManualGenerate} 
                disabled={isGenerating || !inputText.trim()} 
                className={`w-full py-8 rounded-[2.5rem] font-black text-xl transition-all shadow-2xl active:scale-95 group relative overflow-hidden ${isGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40'}`}
              >
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-light tracking-[0.2em] uppercase">Processing AI Audio...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">توليد ومعالجة الصوت</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  </>
                )}
              </button>

              {currentAudioUrl && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2.5rem] flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-400">ملف الصوت جاهز</p>
                    <div className="flex gap-4 mt-4">
                      <button onClick={() => audioRef.current?.play()} className="text-[10px] font-bold text-emerald-300 hover:text-white uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-lg transition-all">تشغيل</button>
                      <button onClick={() => { const a = document.createElement('a'); a.href = currentAudioUrl; a.download = 'voice_sawtalarab.wav'; a.click(); }} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest bg-slate-950 px-4 py-2 rounded-lg transition-all">تحميل</button>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-indigo-400 mb-8 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              تكامل n8n عبر HTTP Request (POST)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">1. رابط الاستدعاء (URL)</h3>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[11px] text-indigo-400 overflow-x-auto whitespace-nowrap">
                    {getApiUrl()}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">3. جسم الطلب (JSON Body)</h3>
                  <pre className="bg-slate-950 p-6 rounded-2xl border border-slate-900 font-mono text-[10px] text-slate-500 leading-relaxed overflow-x-auto">
{`{
  "apiKey": "المفتاح_الخاص_بـ_جيمناي",
  "text": "مرحباً بك من n8n",
  "voice": "Kore",
  "dialect": "اللهجة المصرية",
  "speed": 1.2,
  "pitch": "مرتفع",
  "emotionIntensity": 75
}`}
                  </pre>
                </div>
              </div>

              <div className="space-y-6 bg-indigo-600/5 p-8 rounded-3xl border border-indigo-500/10">
                 <h4 className="text-sm font-black text-indigo-300 mb-4 flex items-center gap-2">
                   <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                   خطوات هامة للنجاح في n8n:
                 </h4>
                 <ul className="space-y-4 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
                   <li>أضف عقدة <span className="text-indigo-400 font-bold">HTTP Request</span>.</li>
                   <li>اختر Method: <span className="text-white font-bold">POST</span>.</li>
                   <li>تأكد من اختيار <span className="text-indigo-300 font-bold">Response Format: File</span>.</li>
                   <li>بدون خيار <span className="text-indigo-300 font-bold">File</span>، سيحاول n8n قراءة الملف كنص وسيتلف الصوت.</li>
                   <li>يمكنك الآن استخدام الحقول المتقدمة (speed, pitch, emotionIntensity) برمجياً.</li>
                 </ul>
                 <div className="mt-8 pt-6 border-t border-indigo-500/10 flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">✅</div>
                   <p className="text-[10px] italic">تم تحديث الـ API ليرسل <span className="text-emerald-300 font-bold">Raw Binary Buffer</span>، مما يحل مشكلة عدم عمل الملف بعد التحميل من n8n.</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .custom-scrollbar::-webkit-scrollbar { height: 2px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .rtl { direction: rtl; }
        input[type=range] { -webkit-appearance: none; background: #0f172a; border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #4f46e5; cursor: pointer; border: 3px solid #0f172a; box-shadow: 0 0 15px rgba(79, 70, 229, 0.4); }
      `}</style>
    </div>
  );
};

export default App;
