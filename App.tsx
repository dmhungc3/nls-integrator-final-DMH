import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Wand2, Download, Sparkles, GraduationCap, 
  Cpu, CheckCircle2, BookOpen, Smartphone, Zap, 
  ListChecks, FileText, Clock, RefreshCw, Layers
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v4.1.0-ULTIMATE"; 
  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: '' as GradeType, isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  const [activeTab, setActiveTab] = useState<'objectives' | 'materials' | 'activities' | 'matrix'>('activities');
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

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file || !state.subject || !state.grade) {
        addLog("🔴 Thầy vui lòng chọn đầy đủ Môn, Lớp và File giáo án nhé!");
        return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⚡ Đang khởi chạy AI Chuyên gia Giáo dục..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(
        createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), 
        userApiKey
      );
      addLog("✨ AI đã thiết kế xong nội dung Năng lực số.");
      setActiveTab('activities');
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e) { 
      addLog("🔴 Lỗi xử lý AI. Thầy hãy kiểm tra lại API Key."); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const handleDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "⚡ Đang biên tập file Word..."] }));
    try {
      const blob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', addLog);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NLS-${state.file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: a.download, blob } }));
      addLog("✅ Đã tải file xuống máy thành công.");
    } catch (error) { 
      addLog("🔴 Lỗi xuất file Word."); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-indigo-100">
      {/* Header Chuyên nghiệp */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-lg">
              <Sparkles size={24}/>
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 text-xl tracking-tight">NLS Integrator Pro</h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">{APP_VERSION}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="password" 
              value={userApiKey} 
              onChange={e => setUserApiKey(e.target.value)} 
              placeholder="Gemini API Key..." 
              className="text-xs border border-slate-200 rounded-xl px-4 py-2 w-56 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
            <button 
              onClick={() => { localStorage.setItem('gemini_api_key', userApiKey); setIsKeySaved(true); addLog("✅ Đã lưu API Key."); }} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              Lưu Key
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột trái: Điều khiển & Hiển thị */}
        <div className="lg:col-span-8 space-y-6">
          {state.step === 'upload' && (
            <div className="bg-white rounded-[2rem] shadow-2xl p-10 border border-slate-100 space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chọn Môn học */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={14}/> Môn học (GDPT 2018)
                  </label>
                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer transition-all"
                    value={state.subject} 
                    onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}
                  >
                    <option value="">-- Chọn môn học --</option>
                    <optgroup label="Môn Bắt buộc">
                      <option value="Toán">Toán học</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Lịch sử">Lịch sử</option>
                    </optgroup>
                    <optgroup label="Môn Lựa chọn">
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Địa lý">Địa lý</option>
                      <option value="Tin học">Tin học</option>
                      <option value="Công nghệ">Công nghệ</option>
                      <option value="Giáo dục kinh tế và pháp luật">GD Kinh tế & Pháp luật</option>
                    </optgroup>
                  </select>
                </div>

                {/* Chọn Khối lớp */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14}/> Khối lớp
                  </label>
                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer transition-all"
                    value={state.grade} 
                    onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}
                  >
                    <option value="">-- Chọn khối lớp --</option>
                    <optgroup label="Cấp THPT">
                      <option value="Lớp 10">Lớp 10</option>
                      <option value="Lớp 11">Lớp 11</option>
                      <option value="Lớp 12">Lớp 12</option>
                    </optgroup>
                    <optgroup label="Cấp THCS">
                      <option value="Lớp 6">Lớp 6</option>
                      <option value="Lớp 7">Lớp 7</option>
                      <option value="Lớp 8">Lớp 8</option>
                      <option value="Lớp 9">Lớp 9</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Nạp File */}
              <label className="group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-indigo-100 bg-indigo-50/20 rounded-[2rem] cursor-pointer hover:bg-indigo-50 transition-all duration-300">
                <FileUp size={56} className="text-indigo-500 mb-4 group-hover:-translate-y-2 transition-transform duration-300"/>
                <p className="font-extrabold text-lg text-slate-700">{state.file ? state.file.name : "Nạp giáo án (.docx) của thầy"}</p>
                <input type="file" accept=".docx" className="hidden" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </label>

              <button 
                disabled={!state.file || !state.subject || !state.grade || state.isProcessing} 
                onClick={handleAnalyze} 
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.25rem] font-black shadow-xl disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {state.isProcessing ? <RefreshCw className="animate-spin" size={20}/> : "BẮT ĐẦU TÍCH HỢP NĂNG LỰC SỐ"}
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-lg uppercase">Kết quả tích hợp NLS</h3>
                <button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95">
                  <Download size={18}/> Xuất file Word
                </button>
              </div>
              <div className="flex border-b overflow-x-auto no-scrollbar">
                {[
                  { id: 'activities', label: '3. Hoạt động', icon: Zap },
                  { id: 'objectives', label: '1. Mục tiêu', icon: BookOpen },
                  { id: 'materials', label: '2. Học liệu', icon: Smartphone },
                  { id: 'matrix', label: '4. Ma trận', icon: ListChecks },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 min-w-[120px] py-5 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${activeTab === t.id ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <t.icon size={14}/> {t.label}
                  </button>
                ))}
              </div>
              <div className="p-8 h-[500px] overflow-y-auto bg-white custom-scrollbar">
                {activeTab === 'activities' ? (
                  <div className="space-y-6">
                    {state.generatedContent.activities_integration.map((act, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-3 text-indigo-600 font-black text-xs uppercase border-b border-indigo-100 pb-2">
                          <Zap size={16} className="fill-indigo-600"/> {act.anchor_text}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{act.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap leading-[1.8] font-medium shadow-inner">
                    {activeTab === 'objectives' ? state.generatedContent.objectives_addition : activeTab === 'materials' ? state.generatedContent.materials_addition : state.generatedContent.appendix_table}
                  </div>
                )}
              </div>
            </div>
          )}

          {state.step === 'done' && (
            <div className="bg-white rounded-[2rem] p-16 text-center shadow-xl border border-emerald-100 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={48}/>
              </div>
              <h2 className="text-3xl font-black text-slate-800">Thành công!</h2>
              <p className="text-slate-500 mt-4 text-lg font-medium">Giáo án môn <span className="text-indigo-600">{state.subject}</span> đã sẵn sàng trong máy của thầy.</p>
              <button onClick={() => window.location.reload()} className="mt-10 bg-slate-800 text-white px-12 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Làm bài tiếp theo</button>
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <h4 className="text-[10px] font-black text-slate-300 uppercase mb-6 tracking-widest flex items-center gap-2"><GraduationCap size={16} className="text-indigo-500"/> Author</h4>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">MH</div>
              <div>
                <p className="font-extrabold text-slate-800 text-lg">Đặng Mạnh Hùng</p>
                <p className="text-xs text-slate-500 font-bold">THPT Lý Nhân Tông</p>
                <p className="text-[11px] text-indigo-600 font-bold mt-1">📞 097 8386 357</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-[2rem] shadow-2xl h-[400px] flex flex-col font-mono text-[10px] border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest"><Cpu size={14} className="animate-pulse"/> System Logs</div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 text-slate-400 custom-scrollbar pr-2">
              {state.logs.map((l, i) => (
                <div key={i} className="flex gap-2 leading-relaxed border-l-2 border-indigo-500/20 pl-3">
                  <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit',second:'2-digit'})}]</span>
                  <span className={l.includes('🔴') ? 'text-rose-400' : 'text-slate-300'}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto w-full py-8 text-center text-slate-400 border-t border-slate-100 mt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">© 2026 NLS Integrator Pro — Developed by GV. Đặng Mạnh Hùng</p>
      </footer>
    </div>
  );
};
export default App;