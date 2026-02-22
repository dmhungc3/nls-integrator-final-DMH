import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Wand2, Download, Sparkles, GraduationCap, Cpu, CheckCircle2, 
  BookOpen, Smartphone, Zap, ListChecks, RefreshCw, Layers
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v4.2.1-FIX-CSS"; 
  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: '' as GradeType, isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  const [activeTab, setActiveTab] = useState<'objectives' | 'materials' | 'activities' | 'matrix'>('activities');
  const [userApiKey, setUserApiKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file || !state.subject || !state.grade) {
      addLog("🔴 Thầy vui lòng chọn đầy đủ Môn, Lớp và nạp file nhé!");
      return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⚡ AI đang bắt đầu thiết kế NLS..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), userApiKey);
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
      addLog("✨ Đã thiết kế xong bản xem trước.");
    } catch (e) { addLog("🔴 Lỗi AI: Hãy kiểm tra lại API Key."); setState(prev => ({ ...prev, isProcessing: false })); }
  };

  const handleDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⚡ Đang xuất file Word..."] }));
    try {
      const blob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', addLog);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `NLS-TichHop-${state.file.name}`;
      a.click();
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: a.download, blob } }));
    } catch { addLog("🔴 Lỗi tạo file."); setState(prev => ({ ...prev, isProcessing: false })); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      {/* HEADER DASHBOARD */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100"><Sparkles size={32}/></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">NLS Integrator Pro</h1>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{APP_VERSION}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="Gemini API Key..." className="flex-1 md:w-64 text-sm border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
          <button onClick={() => localStorage.setItem('gemini_api_key', userApiKey)} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all">Lưu</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {state.step === 'upload' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-100 space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><BookOpen size={12}/> Chọn Môn học</label>
                  <select className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer" value={state.subject} onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                    <option value="">-- Chọn môn học --</option>
                    <optgroup label="Môn Bắt buộc"><option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Lịch sử">Lịch sử</option></optgroup>
                    <optgroup label="Môn Lựa chọn"><option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Tin học">Tin học</option></optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={12}/> Chọn Khối lớp</label>
                  <select className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                    <option value="">-- Chọn khối lớp --</option>
                    <optgroup label="THPT"><option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option></optgroup>
                    <optgroup label="THCS"><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option></optgroup>
                  </select>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-72 border-4 border-dashed border-slate-100 bg-slate-50/50 rounded-[2rem] cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 transition-all duration-300">
                <FileUp size={64} className="text-indigo-400 mb-4"/>
                <p className="text-lg font-extrabold text-slate-600">{state.file ? state.file.name : "Nạp giáo án của thầy (.docx)"}</p>
                <input type="file" accept=".docx" className="hidden" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </label>

              <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-2xl shadow-indigo-200 disabled:opacity-50 transition-all uppercase tracking-widest active:scale-[0.98]">
                {state.isProcessing ? <RefreshCw className="animate-spin inline mr-2"/> : null} 
                Bắt đầu tích hợp năng lực số
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-lg uppercase">Bản xem trước tích hợp</h3>
                <button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                  <Download size={18}/> Xuất file Word
                </button>
              </div>
              <div className="flex border-b bg-white overflow-x-auto">
                {[{id: 'activities', label: 'Hoạt động', icon: Zap}, {id: 'objectives', label: 'Mục tiêu', icon: BookOpen}, {id: 'materials', label: 'Học liệu', icon: Smartphone}, {id: 'matrix', label: 'Ma trận', icon: ListChecks}].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 min-w-[120px] py-5 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === t.id ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <t.icon size={14}/> {t.label}
                  </button>
                ))}
              </div>
              <div className="p-8 h-[450px] overflow-y-auto bg-white">
                {activeTab === 'activities' ? (
                  <div className="space-y-6">
                    {state.generatedContent.activities_integration.map((act, i) => (
                      <div key={i} className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-indigo-700 font-black text-xs uppercase border-b border-indigo-100 pb-2"><Zap size={16}/> {act.anchor_text}</div>
                        <p className="text-sm text-indigo-900 font-medium leading-relaxed">👉 {act.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 font-bold whitespace-pre-wrap leading-relaxed italic bg-emerald-50/30 p-8 rounded-3xl border border-emerald-100 shadow-inner">
                    {activeTab === 'objectives' ? state.generatedContent.objectives_addition : activeTab === 'materials' ? state.generatedContent.materials_addition : state.generatedContent.appendix_table}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {state.step === 'done' && (
            <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-2xl border border-emerald-100">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle2 size={48}/></div>
              <h2 className="text-3xl font-black text-slate-800 mb-4">Thành công rồi thầy ơi!</h2>
              <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-12 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Tiếp tục bài khác</button>
            </div>
          )}
        </div>

        {/* LOG TERMINAL */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]"><GraduationCap size={16} className="text-indigo-600"/> Tác giả</h4>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">MH</div>
              <div><p className="font-black text-slate-800 text-lg leading-tight">Đặng Mạnh Hùng</p><p className="text-xs text-slate-500 font-bold uppercase italic">Lý Nhân Tông - Bắc Ninh</p></div>
            </div>
          </div>
          <div className="bg-[#1e1e2e] p-6 rounded-[2rem] shadow-2xl h-[350px] flex flex-col font-mono text-[10px] border border-slate-800 text-emerald-400">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-4 mb-4 font-bold uppercase tracking-widest"><Cpu size={14} className="animate-pulse text-indigo-400"/> System Logs</div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {state.logs.map((l, i) => <div key={i} className="leading-relaxed border-l-2 border-slate-700 pl-3">[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit',second:'2-digit'})}] {l}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;