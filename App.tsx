import React, { useState, useEffect, useRef } from 'react';
import { FileUp, Wand2, Download, Sparkles, GraduationCap, Cpu, CheckCircle2, BookOpen, Smartphone, Zap, ListChecks, FileText, Clock, RefreshCw } from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v3.9.5-FINAL-PRO"; 
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
    if (!userApiKey || !state.file) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⚡ Bắt đầu quá trình tích hợp..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(createIntegrationTextPrompt(text, state.subject || "Toán", state.grade || "Lớp 10", 'NLS', 'DEFAULT'), userApiKey);
      addLog("✨ AI đã thiết kế xong NLS.");
      setActiveTab('activities');
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e) { addLog("🔴 Lỗi xử lý."); setState(prev => ({ ...prev, isProcessing: false })); }
  };

  const handleDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "⚡ Đang đóng gói file..."] }));
    try {
      const blob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', addLog);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `NLS-${state.file.name}`; a.click();
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: a.download, blob } }));
    } catch { addLog("🔴 Lỗi tải xuống."); setState(prev => ({ ...prev, isProcessing: false })); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-sm border p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white"><Sparkles/></div>
          <div><h1 className="font-bold text-slate-800">NLS Integrator Pro</h1><p className="text-[10px] text-slate-400 font-bold uppercase">{APP_VERSION} | GV. ĐẶNG MẠNH HÙNG</p></div>
        </div>
        <div className="flex gap-2">
          <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="API Key..." className="text-xs border rounded-lg px-3 py-2 w-48"/>
          <button onClick={() => { localStorage.setItem('gemini_api_key', userApiKey); setIsKeySaved(true); }} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg">Lưu</button>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          {state.step === 'upload' && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border">
              <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-indigo-100 bg-indigo-50/30 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all mb-6">
                <FileUp size={48} className="text-indigo-400 mb-4"/>
                <span className="font-bold text-slate-600">{state.file ? state.file.name : "Nạp giáo án của thầy vào đây"}</span>
                <input type="file" accept=".docx" className="hidden" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </label>
              <button disabled={!state.file || state.isProcessing} onClick={handleAnalyze} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all">
                {state.isProcessing ? <RefreshCw className="animate-spin"/> : <Wand2/>} {state.isProcessing ? "Đang xử lý..." : "BẮT ĐẦU TÍCH HỢP NLS"}
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Kết quả phân tích</h3>
                <button onClick={handleDownload} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:shadow-lg transition-all"><Download size={14}/> XUẤT FILE WORD</button>
              </div>
              <div className="flex border-b">
                {['activities', 'objectives', 'materials', 'matrix'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest ${activeTab === t ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                    {t === 'activities' ? '3. Hoạt động' : t === 'objectives' ? '1. Mục tiêu' : t === 'materials' ? '2. Học liệu' : '4. Ma trận'}
                  </button>
                ))}
              </div>
              <div className="p-6 h-[450px] overflow-y-auto bg-slate-50/50">
                {activeTab === 'activities' ? (
                  <div className="space-y-4">
                    {state.generatedContent.activities_integration.map((act, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border shadow-sm"><div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase"><Zap size={14}/> {act.anchor_text}</div><p className="text-sm text-slate-600 leading-relaxed">{act.content}</p></div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border text-sm text-slate-600 whitespace-pre-wrap leading-loose">
                    {activeTab === 'objectives' ? state.generatedContent.objectives_addition : activeTab === 'materials' ? state.generatedContent.materials_addition : state.generatedContent.appendix_table}
                  </div>
                )}
              </div>
            </div>
          )}

          {state.step === 'done' && (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40}/></div>
              <h2 className="text-2xl font-bold text-slate-800">Thành công rồi thầy Hùng ơi!</h2>
              <p className="text-slate-500 mt-2 mb-8">File giáo án đã được chèn NLS chuẩn mẫu và tải về máy.</p>
              <button onClick={() => window.location.reload()} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">Làm bài tiếp theo</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><GraduationCap size={14}/> Tác giả</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">MH</div>
              <div><p className="font-bold text-slate-800">Đặng Mạnh Hùng</p><p className="text-xs text-slate-500">THPT Lý Nhân Tông</p></div>
            </div>
          </div>
          <div className="bg-[#1e1e2e] p-5 rounded-2xl shadow-xl h-[350px] flex flex-col font-mono text-[11px] text-indigo-100/80 border border-slate-700">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3 mb-3 text-slate-400 uppercase font-bold"><Cpu size={14} className="text-emerald-400 animate-pulse"/> Terminal Logs</div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2">
              {state.logs.map((l, i) => <div key={i} className="border-l-2 border-slate-700 pl-3">{l}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;