import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Download, Sparkles, GraduationCap, Cpu, 
  BookOpen, Smartphone, Zap, ListChecks, RefreshCw, Layers, Info, CheckCircle2 // Đã thêm CheckCircle2
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v5.0.0-FIXED"; 
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

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.logs]);

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file || !state.subject || !state.grade) {
        addLog("🔴 Vui lòng chọn đầy đủ Môn, Lớp và File!");
        return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: ["🚀 Đang phân tích NLS chuyên sâu..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(
        createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), 
        userApiKey
      );
      addLog("✨ Đã xác định xong các Năng lực số đặc thù.");
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e: any) { 
      addLog(`🔴 Lỗi: ${e.message}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const handleDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⚡ Đang chèn NLS vào file Word..."] }));
    try {
      const blob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', addLog);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `NLS-${state.file.name}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: a.download, blob } }));
      addLog("✅ Xuất file thành công!");
    } catch (e: any) { 
      addLog(`🔴 Lỗi xuất file: ${e.message}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Sparkles size={24}/></div>
            <div><h1 className="font-black text-xl">NLS Integrator Pro</h1><span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{APP_VERSION}</span></div>
          </div>
          <div className="flex gap-2">
            <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="API Key..." className="text-xs border rounded-xl px-4 py-2 w-48 focus:ring-2 focus:ring-indigo-500 outline-none"/>
            <button onClick={() => localStorage.setItem('gemini_api_key', userApiKey)} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs">Lưu</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {state.step === 'upload' && (
            <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14}/> Môn học (GDPT 2018)</label>
                  <select className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold outline-none" value={state.subject} onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                    <option value="">-- Chọn môn học --</option>
                    <optgroup label="MÔN BẮT BUỘC">
                      <option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Lịch sử">Lịch sử</option>
                    </optgroup>
                    <optgroup label="MÔN LỰA CHỌN">
                      <option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Địa lý">Địa lý</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option><option value="GD Kinh tế & Pháp luật">GD Kinh tế & Pháp luật</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Lớp</label>
                  <select className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold outline-none" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                    <option value="">-- Chọn lớp --</option>
                    <optgroup label="THPT"><option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option></optgroup>
                    <optgroup label="THCS"><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option></optgroup>
                  </select>
                </div>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-indigo-100 bg-indigo-50/10 rounded-[2rem] cursor-pointer hover:bg-indigo-50/20">
                <FileUp size={48} className="text-indigo-400 mb-2"/>
                <p className="font-bold text-slate-600">{state.file ? state.file.name : "Nạp giáo án (.docx)"}</p>
                <input type="file" accept=".docx" className="hidden" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </label>
              <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                {state.isProcessing ? <RefreshCw className="animate-spin"/> : <Zap/>} BẮT ĐẦU TÍCH HỢP
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2"><Info size={18} className="text-indigo-400"/><span className="font-bold text-sm uppercase">Kết quả NLS</span></div>
                <button onClick={handleDownload} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"><Download size={14}/> TẢI FILE WORD</button>
              </div>
              <div className="flex border-b bg-slate-100 overflow-x-auto">
                {[{id: 'objectives', label: '1. Năng lực & Mục tiêu'}, {id: 'materials', label: '2. Thiết bị'}, {id: 'activities', label: '3. Hoạt động'}, {id: 'matrix', label: '4. Phụ lục'}].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === t.id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>{t.label}</button>
                ))}
              </div>
              <div className="p-6 h-[400px] overflow-y-auto bg-white custom-scrollbar">
                {activeTab === 'activities' ? (
                  <div className="space-y-4">
                    {state.generatedContent.activities_integration.map((act, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-slate-500 font-bold text-xs uppercase mb-2">Chèn sau: {act.anchor_text}</div>
                        <p className="text-sm text-indigo-800 font-medium">👉 {act.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-emerald-800 font-medium whitespace-pre-wrap bg-emerald-50 p-4 rounded-xl">
                    {activeTab === 'objectives' ? state.generatedContent.objectives_addition : activeTab === 'materials' ? state.generatedContent.materials_addition : state.generatedContent.appendix_table}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {state.step === 'done' && (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-emerald-100">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4"/>
              <h2 className="text-2xl font-black text-slate-800">Thành công!</h2>
              <button onClick={() => window.location.reload()} className="mt-6 bg-slate-800 text-white px-8 py-3 rounded-xl font-bold">Làm bài khác</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100"><h4 className="text-xs font-black text-slate-400 uppercase mb-4 flex gap-2"><GraduationCap size={16}/> Tác giả</h4><div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">MH</div><div><p className="font-bold text-slate-800">Đặng Mạnh Hùng</p><p className="text-[10px] text-slate-500 font-bold uppercase">THPT Lý Nhân Tông</p></div></div></div>
          <div className="bg-slate-900 p-5 rounded-3xl shadow-xl h-[300px] flex flex-col font-mono text-xs border border-slate-800 text-slate-400">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3 mb-3 font-bold text-indigo-400 uppercase"><Cpu size={14} className="animate-pulse"/> System Logs</div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2">{state.logs.map((l, i) => <div key={i} className="border-l-2 border-slate-700 pl-2">[{new Date().toLocaleTimeString()}] {l}</div>)}</div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default App;