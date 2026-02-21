import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download,
  BookOpen, GraduationCap, Sparkles, ChevronRight,
  Smartphone, Zap, Layers, Cpu, Phone, Info, Clock, CheckCircle2, ListChecks
} from 'lucide-react';
import { AppState, SubjectType, GradeType, GeneratedNLSContent } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt, PEDAGOGY_MODELS } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  // PHIÊN BẢN V3.3.6 MASTER - NLS GREEN HIGHLIGHT & FULL GDPT 2018 - GV. ĐẶNG MẠNH HÙNG
  const APP_VERSION = "v3.3.6-MASTER"; 
  const [pedagogy, setPedagogy] = useState<string>('DEFAULT');
  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: '' as GradeType, isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  
  const [activeTab, setActiveTab] = useState<'objectives' | 'materials' | 'activities' | 'matrix'>('objectives');
  const [userApiKey, setUserApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) { setUserApiKey(savedKey); setIsKeySaved(true); }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.logs]);

  // LOGIC NHẬN DIỆN THÔNG MINH - KHÔNG BẮT NHẦM SỐ TIẾT
  const autoDetectInfo = (fileName: string) => {
    const name = fileName.toLowerCase();
    let s = '' as SubjectType;
    let g = '' as GradeType;

    if (/toan|hinh|dai so|giai tich|ham so|vecto/.test(name)) s = 'Toán';
    else if (/van|ngu van|doc hieu/.test(name)) s = 'Ngữ văn';
    else if (/anh|english/.test(name)) s = 'Tiếng Anh';
    else if (/dia|dan so/.test(name)) s = 'Địa lý';
    else if (/su|lich su/.test(name)) s = 'Lịch sử';
    else if (/ly|vat ly/.test(name)) s = 'Vật lý';
    else if (/hoa/.test(name)) s = 'Hóa học';
    else if (/sinh/.test(name)) s = 'Sinh học';
    else if (/tin|lap trinh/.test(name)) s = 'Tin học';
    else if (/cn|cong nghe/.test(name)) s = 'Công nghệ';
    else if (/gdkt|phap luat/.test(name)) s = 'Giáo dục kinh tế và pháp luật';

    const cleanName = name.replace(/tiết\s*\d+/g, '');
    const gradeMatch = cleanName.match(/\d+/);
    if (gradeMatch) {
      const num = parseInt(gradeMatch[0]);
      if (num >= 6 && num <= 12) g = `Lớp ${num}` as GradeType;
    }
    return { s, g };
  };

  const saveKeyToLocal = () => {
    if (userApiKey.trim()) { 
      localStorage.setItem('gemini_api_key', userApiKey); 
      setIsKeySaved(true); 
      addLog("✓ Đã lưu API Key."); 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith('.docx')) {
      const { s, g } = autoDetectInfo(file.name);
      setState(prev => ({ 
        ...prev, file, subject: s || prev.subject, grade: g || prev.grade, step: 'upload',
        logs: [`✅ Đã nhận: ${file.name}`, s ? `⭐ Môn: ${s}` : "", g ? `⭐ Nhận diện đúng: ${g}` : ""].filter(Boolean)
      }));
    }
  };

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.subject || !state.grade) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, `🚀 Khởi động Core ${APP_VERSION}...`] }));
    try {
      const text = await extractTextFromDocx(state.file!);
      const prompt = createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', pedagogy);
      const content = await generateCompetencyIntegration(prompt, userApiKey);
      addLog(`✅ AI đã thiết kế xong nội dung tích hợp.`);
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e) { 
      addLog(`🔴 Lỗi: ${e instanceof Error ? e.message : "Xung đột"}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const handleFinalizeAndDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "⚡ Đang đóng gói dữ liệu..."] }));
    try {
      const newBlob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', (m) => addLog(`→ ${m}`));
      setState(prev => ({ 
        ...prev, isProcessing: false, step: 'done', 
        result: { fileName: `Tich-hop-NLS-${state.file?.name}`, blob: newBlob }, 
        logs: [...prev.logs, "✅ Sẵn sàng tải về."] 
      }));
    } catch (error) { 
      addLog(`🔴 Lỗi đóng gói: ${error instanceof Error ? error.message : "Thất bại"}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center">
      {/* HEADER */}
      <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 py-3">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles className="w-6 h-6" /></div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg leading-tight">NLS Integrator Pro</h2>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{APP_VERSION} | GV. ĐẶNG MẠNH HÙNG</span>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  {isKeySaved ? (
                      <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                          <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative h-2 w-2 rounded-full bg-emerald-500"></span></span>
                          <span className="text-emerald-700 font-bold text-xs">AI Ready</span>
                          <button onClick={() => setIsKeySaved(false)} className="ml-2 text-[10px] text-slate-400 underline">Đổi</button>
                      </div>
                  ) : (
                      <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="API Key..." className="text-xs px-2 outline-none w-32" />
                        <button onClick={saveKeyToLocal} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-bold">Lưu</button>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="w-full max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {state.step === 'upload' && (
            <div className="bg-white rounded-3xl shadow-xl border p-8 space-y-8 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Môn học (GDPT 2018)</label>
                  <select className="w-full p-3.5 rounded-xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={state.subject} onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                    <option value="">-- Chọn môn học --</option>
                    <optgroup label="Môn học Bắt buộc">
                      <option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Lịch sử">Lịch sử</option>
                      <option value="Giáo dục thể chất">Giáo dục thể chất</option><option value="Giáo dục quốc phòng và an ninh">GD Quốc phòng & An ninh</option><option value="Hoạt động trải nghiệm, hướng nghiệp">HĐ Trải nghiệm, hướng nghiệp</option>
                    </optgroup>
                    <optgroup label="Môn học Lựa chọn">
                      <option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Địa lý">Địa lý</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option>
                      <option value="Giáo dục kinh tế và pháp luật">GD Kinh tế & Pháp luật</option><option value="Âm nhạc">Âm nhạc</option><option value="Mỹ thuật">Mỹ thuật</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khối lớp</label>
                  <select className="w-full p-3.5 rounded-xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={state.grade} onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                    <option value="">-- Chọn khối lớp --</option>
                    <optgroup label="Cấp THPT"><option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option></optgroup>
                    <optgroup label="Cấp THCS"><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option></optgroup>
                  </select>
                </div>
              </div>
              <label className={`relative flex flex-col items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${state.file ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-300 hover:border-indigo-400'}`}>
                <FileUp className={`w-10 h-10 mb-2 transition-transform group-hover:-translate-y-1 ${state.file ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-600">{state.file ? state.file.name : "Nạp giáo án môn học (.docx)"}</span>
                <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
              </label>
              <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-2">
                {state.isProcessing ? <Clock className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                {state.isProcessing ? "Đang thiết kế..." : "🚀 Kích hoạt AI & Tích hợp ngay"}
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-3xl shadow-xl border overflow-hidden animate-fade-in-up">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold flex items-center gap-2 text-indigo-900"><Sparkles className="w-5 h-5" /> Smart Studio Master</h3>
                <div className="flex gap-3">
                  <button onClick={() => setState(prev => ({...prev, step: 'upload'}))} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-rose-500 transition-colors">Hủy</button>
                  <button onClick={handleFinalizeAndDownload} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2 transition-transform active:scale-95">
                    <FileCheck className="w-4 h-4" /> Xác nhận tích hợp
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-12 min-h-[500px]">
                <div className="col-span-4 border-r bg-slate-50/50 p-4 space-y-2">
                  <button onClick={() => setActiveTab('objectives')} className={`w-full p-3 rounded-xl text-left font-bold text-xs transition-all flex items-center gap-2 ${activeTab === 'objectives' ? 'bg-white border border-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white'}`}><BookOpen className="w-4 h-4" /> 1. Mục tiêu NLS</button>
                  <button onClick={() => setActiveTab('materials')} className={`w-full p-3 rounded-xl text-left font-bold text-xs transition-all flex items-center gap-2 ${activeTab === 'materials' ? 'bg-white border border-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white'}`}><Smartphone className="w-4 h-4" /> 2. Học liệu số</button>
                  <button onClick={() => setActiveTab('activities')} className={`w-full p-3 rounded-xl text-left font-bold text-xs transition-all flex items-center gap-2 ${activeTab === 'activities' ? 'bg-white border border-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white'}`}><Zap className="w-4 h-4" /> 3. Hoạt động tích hợp</button>
                  <button onClick={() => setActiveTab('matrix')} className={`w-full p-3 rounded-xl text-left font-bold text-xs transition-all flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-white border border-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white'}`}><ListChecks className="w-4 h-4" /> 4. Ma trận đánh giá</button>
                </div>
                <div className="col-span-8 p-8 max-h-[550px] overflow-y-auto custom-scrollbar bg-white">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 min-h-full font-sans">
                    {activeTab === 'objectives' && (
                      <div className="space-y-3">
                        {state.generatedContent.objectives_addition.split('\n').filter(l => l.trim()).map((line, i) => (
                          <div key={i} className="flex gap-2 text-emerald-600 font-medium text-[13px] leading-relaxed">
                            <span className="shrink-0">•</span><span>Bổ sung NLS: {line.replace(/^- /g, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'materials' && (
                      <div className="space-y-3">
                        {state.generatedContent.materials_addition.split('\n').filter(l => l.trim()).map((line, i) => (
                          <div key={i} className="flex gap-2 text-emerald-600 font-medium text-[13px]">
                            <span className="shrink-0">•</span><span>Bổ sung NLS: {line.replace(/^- /g, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'matrix' && (
                      <div className="space-y-3">
                        {state.generatedContent.appendix_table.split('\n').filter(l => l.trim()).map((line, i) => (
                          <div key={i} className="p-3 bg-emerald-50/50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700 text-[12px] font-semibold">{line}</div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'activities' && (
                      <div className="space-y-5">
                        {state.generatedContent.activities_integration.map((act, i) => (
                          <div key={i} className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-1 mb-3 block">Mốc chèn: {act.anchor_text}</span>
                            <div className="flex gap-2 text-emerald-600 font-medium text-[13px] leading-relaxed">
                              <span className="shrink-0">•</span><span>Bổ sung NLS: {act.content}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {state.step === 'done' && state.result && (
            <div className="bg-white rounded-3xl p-10 shadow-2xl text-center animate-fade-in-up border border-emerald-100">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800">Thành công rồi thầy Hùng ơi!</h3>
              <p className="text-slate-500 mt-2">Giáo án môn {state.subject} {state.grade} đã sẵn sàng.</p>
              <button onClick={() => { if(state.result) { const url = URL.createObjectURL(state.result.blob); const a = document.createElement('a'); a.href = url; a.download = state.result.fileName; a.click(); } }} className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl flex items-center gap-3 mx-auto transition-all hover:bg-indigo-700 hover:scale-105"><Download className="w-5 h-5" /> Tải giáo án (.docx)</button>
              <button onClick={() => setState(prev => ({...prev, step: 'upload', generatedContent: null, result: null}))} className="mt-6 text-sm text-slate-400 hover:text-indigo-600 font-semibold">Tích hợp bài khác</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-24 transition-all duration-300">
            <div className="bg-[#1e1e2e] rounded-2xl p-5 shadow-2xl h-[450px] flex flex-col border border-slate-700 relative overflow-hidden group ring-1 ring-white/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-bold font-mono uppercase tracking-wider"><Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> AI Terminal Status</div>
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div></div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-3 font-mono text-[11px] text-indigo-100/90 leading-relaxed">
                {state.logs.length === 0 && <span className="text-slate-600 italic">{" >> "} Chờ lệnh từ thầy Hùng...</span>}
                {state.logs.map((log, i) => (
                  <div key={i} className="flex gap-3 animate-fade-in-left border-l border-indigo-500/30 pl-3">
                    <span className="text-slate-500 shrink-0 select-none">[{new Date().toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span>
                    <span className="break-words font-medium">{log.replace("✓ ", "✅ ").replace("🚀 ", "⚡ ").replace("✨ ", "⭐ ")}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-200/60 transition-transform hover:translate-y-[-2px]">
              <h4 className="font-bold text-[10px] text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Thông tin Tác giả</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black shadow-inner">MH</div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Đặng Mạnh Hùng</p>
                  <p className="text-[10px] text-slate-500 font-medium italic">GV THPT Lý Nhân Tông</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">📞 097 8386 357</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full mt-auto py-6 text-center border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] px-4">© 2026 NLS Integrator Pro — Cung cấp bởi GV. Đặng Mạnh Hùng — THPT Lý Nhân Tông</p>
      </div>
    </div>
  );
};

export default App;