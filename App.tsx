import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Wand2, Download, Sparkles, GraduationCap, 
  Cpu, CheckCircle2, BookOpen, Smartphone, Zap, 
  ListChecks, FileText, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v4.0.0-ULTIMATE"; 
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

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file || !state.subject || !state.grade) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⚡ Đang khởi tạo trí tuệ nhân tạo..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(
        createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), 
        userApiKey
      );
      addLog("✨ Đã thiết kế cấu trúc NLS thành công.");
      setActiveTab('activities');
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e) { 
      addLog("🔴 Lỗi xử lý dữ liệu AI."); 
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
      a.download = `NLS-TichHop-${state.file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: a.download, blob } }));
      addLog("✅ File giáo án đã được xuất xưởng.");
    } catch (error) { 
      addLog("🔴 Lỗi xuất file Word."); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-indigo-100">
      {/* Header Chuyên nghiệp */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Sparkles size={24}/>
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 tracking-tight text-xl">NLS Integrator Pro</h1>
              <div className="flex gap-2 items-center">
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{APP_VERSION}</span>
                <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest">Sư phạm 4.0</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="password" 
              value={userApiKey} 
              onChange={e => setUserApiKey(e.target.value)} 
              placeholder="Gemini API Key..." 
              className="text-xs border border-slate-200 rounded-xl px-4 py-2 w-56 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
            <button 
              onClick={() => { localStorage.setItem('gemini_api_key', userApiKey); setIsKeySaved(true); }} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2 rounded-xl shadow-md transition-all active:scale-95"
            >
              Lưu Key
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột trái: Nội dung chính */}
        <div className="lg:col-span-8 space-y-6">
          {state.step === 'upload' && (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Chọn Môn học GDPT 2018 */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                    <BookOpen size={14}/> Môn học (Chuẩn 2018)
                  </label>
                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                    value={state.subject} 
                    onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}
                  >
                    <option value="">-- Chọn môn học --</option>
                    <optgroup label="Môn Bắt buộc">
                      <option value="Toán">Toán học</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Lịch sử">Lịch sử</option>
                      <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                      <option value="Hoạt động trải nghiệm, hướng nghiệp">HĐ Trải nghiệm, hướng nghiệp</option>
                    </optgroup>
                    <optgroup label="Môn Lựa chọn">
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Địa lý">Địa lý</option>
                      <option value="Tin học">Tin học</option>
                      <option value="Công nghệ">Công nghệ</option>
                      <option value="Giáo dục kinh tế và pháp luật">GD Kinh tế & Pháp luật</option>
                      <option value="Âm nhạc">Âm nhạc</option>
                      <option value="Mỹ thuật">Mỹ thuật</option>
                    </optgroup>
                  </select>
                </div>

                {/* Chọn Khối lớp */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Layers size={14}/> Khối lớp
                  </label>
                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
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

              {/* Khu vực nạp file */}
              <label className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-indigo-200 bg-indigo-50/20 rounded-[2rem] cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300">
                <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"></div>
                <FileUp size={56} className="text-indigo-500 mb-4 group-hover:-translate-y-2 transition-transform duration-300"/>
                <p className="font-extrabold text-lg text-slate-700">{state.file ? state.file.name : "Nạp giáo án của thầy"}</p>
                <p className="text-sm text-slate-400 font-medium mt-1">Định dạng hỗ trợ: Microsoft Word (.docx)</p>
                <input type="file" accept=".docx" className="hidden" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </label>

              <button 
                disabled={!state.file || !state.subject || !state.grade || state.isProcessing} 
                onClick={handleAnalyze} 
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-[1.25rem] font-black shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-3 text-base uppercase tracking-wider active:scale-[0.98]"
              >
                {state.isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <Wand2 size={20}/>} 
                {state.isProcessing ? "AI Đang làm việc..." : "Bắt đầu tích hợp năng lực số"}
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                  <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-tight">Kết quả thiết kế NLS</h3>
                </div>
                <button 
                  onClick={handleDownload} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  <Download size={18}/> Xuất file Word
                </button>
              </div>
              
              <div className="flex border-b bg-white overflow-x-auto no-scrollbar">
                {[
                  { id: 'activities', label: '3. Hoạt động', icon: Zap },
                  { id: 'objectives', label: '1. Mục tiêu', icon: BookOpen },
                  { id: 'materials', label: '2. Học liệu', icon: Smartphone },
                  { id: 'matrix', label: '4. Ma trận', icon: ListChecks },
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id as any)} 
                    className={`flex-1 min-w-[120px] py-5 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === t.id ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                  >
                    <t.icon size={14}/> {t.label}
                  </button>
                ))}
              </div>

              <div className="p-8 h-[500px] overflow-y-auto bg-[#fcfdfe] custom-scrollbar">
                {activeTab === 'activities' ? (
                  <div className="grid grid-cols-1 gap-6">
                    {state.generatedContent.activities_integration.map((act, i) => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4 text-indigo-600 font-black text-xs uppercase tracking-widest border-b border-slate-50 pb-3">
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
            <div className="bg-white rounded-[2rem] p-16 text-center shadow-2xl border border-emerald-100 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={48}/>
              </div>
              <h2 className="text-3xl font-black text-slate-800">Thành công rực rỡ!</h2>
              <p className="text-slate-500 mt-4 text-lg font-medium max-w-md mx-auto leading-relaxed">
                Giáo án môn <span className="text-indigo-600 font-bold">{state.subject}</span> đã được tích hợp năng lực số chuẩn chương trình mới.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-10 bg-slate-800 hover:bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl active:scale-95"
              >
                Tiếp tục bài khác
              </button>
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin tác giả & Logs */}
        <div className="lg:col-span-4 space-y-6 sticky top-24 h-fit">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <h4 className="text-[10px] font-black text-slate-300 uppercase mb-6 tracking-[0.2em] flex items-center gap-2">
              <GraduationCap size={16} className="text-indigo-500"/> Author Information
            </h4>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">MH</div>
              <div>
                <p className="font-extrabold text-slate-800 text-lg">Đặng Mạnh Hùng</p>
                <p className="text-xs text-slate-500 font-bold">THPT Lý Nhân Tông</p>
                <div className="mt-2 flex gap-2">
                   <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold italic">Toán - Tin</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-[2rem] shadow-2xl h-[400px] flex flex-col font-mono text-[10px] border border-slate-800 shadow-indigo-500/10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest">
                <Cpu size={14} className="animate-pulse"/> System Logs
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 text-slate-400 custom-scrollbar pr-2">
              {state.logs.length === 0 && <p className="opacity-30 italic">Idle - Waiting for input...</p>}
              {state.logs.map((l, i) => (
                <div key={i} className="flex gap-3 leading-relaxed border-l-2 border-indigo-500/20 pl-3">
                  <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit',second:'2-digit'})}]</span>
                  <span className={`${l.includes('🔴') ? 'text-rose-400' : l.includes('✨') ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {l.replace("✓ ", "✅ ").replace("🚀 ", "⚡ ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto w-full py-8 text-center text-slate-400 border-t border-slate-100 mt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
          © 2026 NLS Integrator Pro • Crafted for Educators by DMH
        </p>
      </footer>
    </div>
  );
};
export default App;