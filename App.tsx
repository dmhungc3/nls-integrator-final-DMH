import React, { useState, useEffect } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download,
  BookOpen, GraduationCap, Sparkles, ChevronRight, ArrowLeft, Key,
  User, School, Phone, Activity, Terminal, Smartphone, Zap
} from 'lucide-react';
import { AppState, SubjectType, GradeType, GeneratedNLSContent } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';
import SmartEditor from './components/SmartEditor';

type IntegrationMode = 'NLS' | 'NAI';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    file: null, subject: '', grade: '', isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });

  const [mode, setMode] = useState<IntegrationMode>('NLS');
  const [userApiKey, setUserApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) { setUserApiKey(savedKey); setIsKeySaved(true); }
  }, []);

  const saveKeyToLocal = () => {
    if (userApiKey.trim()) { localStorage.setItem('gemini_api_key', userApiKey); setIsKeySaved(true); addLog("✓ Đã lưu API Key."); } 
    else { alert("Vui lòng nhập Key!"); }
  };

  const handleEditKey = () => setIsKeySaved(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setState(prev => ({ ...prev, file, result: null, generatedContent: null, step: 'upload', logs: [`✓ Đã tải lên: ${file.name}`] }));
    } else { alert("Chọn file Word (.docx)!"); }
  };

  const addLog = (msg: string) => { setState(prev => ({ ...prev, logs: [...prev.logs, msg] })); };

  const handleAnalyze = async () => {
    if (!userApiKey.trim()) { alert("Nhập API Key!"); return; }
    if (!state.file || !state.subject || !state.grade) { alert("Thiếu thông tin!"); return; }

    setState(prev => ({ ...prev, isProcessing: true, logs: [`🚀 Kích hoạt AI Mode: ${mode === 'NAI' ? 'AI Competency' : 'Digital Competency'}...`] }));

    try {
      addLog("Đang đọc file Word...");
      const textContext = await extractTextFromDocx(state.file);
      const prompt = createIntegrationTextPrompt(textContext, state.subject, state.grade, mode);
      const generatedContent = await generateCompetencyIntegration(prompt, userApiKey);
      addLog(`✓ Đã tạo nội dung ${mode}.`);
      setState(prev => ({ ...prev, isProcessing: false, generatedContent, step: 'review' }));
    } catch (error) {
      addLog(`❌ Lỗi: ${error instanceof Error ? error.message : "Unknown"}`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleFinalizeAndDownload = async (finalContent: GeneratedNLSContent) => {
    if (!state.file) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "Đang ghi file Word..."] }));
    try {
      const newBlob = await injectContentIntoDocx(state.file, finalContent, mode, addLog);
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: `${mode}_${state.file?.name}`, blob: newBlob }, logs: [...prev.logs, "✨ Thành công!"] }));
    } catch (error) {
       addLog(`❌ Lỗi tạo file: ${error instanceof Error ? error.message : "Unknown"}`);
       setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans text-slate-900 flex flex-col items-center pb-32">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200/30 rounded-full blur-[100px]"></div>
      </div>

      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-50 w-full max-w-7xl transition-all">
          <div className="absolute inset-x-0 top-0 h-full bg-slate-50/90 backdrop-blur-xl shadow-lg border-b border-white/50 rounded-b-[2rem] -z-10"></div>
          <div className="pt-4 pb-4 px-2 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 group">
                      <div className="relative w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0 ring-2 ring-white group-hover:scale-105 transition-transform">
                          <User className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                          <h2 className="font-bold text-slate-800 text-base group-hover:text-indigo-700 transition-colors">Tác giả: Đặng Mạnh Hùng</h2>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                              <span className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded text-indigo-700"><School className="w-3 h-3" /> THPT Lý Nhân Tông</span>
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 097 8386 357</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center justify-end">
                      {isKeySaved ? (
                          <div className="flex items-center gap-3 bg-white p-1.5 pl-4 pr-2 rounded-full border border-emerald-100 shadow-sm">
                              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                  <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></div>
                                  <span>API Ready</span>
                              </div>
                              <button onClick={handleEditKey} className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200">Đổi</button>
                          </div>
                      ) : (
                          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-indigo-100 shadow-sm w-full md:w-auto"><div className="pl-3 py-2"><Key className="w-4 h-4 text-amber-500" /></div><input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Nhập API Key..." className="bg-transparent outline-none text-sm w-32" /><button onClick={saveKeyToLocal} className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Lưu</button></div>
                      )}
                  </div>
              </div>
              <div className="flex items-center justify-center gap-3 border-t border-slate-200/50 pt-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                    NLS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Integrator</span> Pro
                  </h1>
              </div>
          </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mt-8">
        <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-white/50">
                <div className={`flex items-center gap-2 ${state.step === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><span className="text-sm">1. Tải lên</span></div>
                <div className="text-slate-300">→</div>
                <div className={`flex items-center gap-2 ${state.step === 'review' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><span className="text-sm">2. Xử lý</span></div>
                <div className="text-slate-300">→</div>
                <div className={`flex items-center gap-2 ${state.step === 'done' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><span className="text-sm">3. Hoàn tất</span></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {state.step === 'upload' && (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl border border-white animate-fade-in">
                  <div className="bg-slate-100 p-1 rounded-2xl flex relative mb-6">
                      <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ${mode === 'NLS' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                      <button onClick={() => setMode('NLS')} className={`relative z-10 flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'NLS' ? 'text-indigo-600' : 'text-slate-500'}`}><Smartphone className="w-4 h-4" /> Năng lực Số</button>
                      <button onClick={() => setMode('NAI')} className={`relative z-10 flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'NAI' ? 'text-rose-600' : 'text-slate-500'}`}><Zap className="w-4 h-4" /> Năng lực AI</button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Môn học</label><div className="relative"><select className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 appearance-none" value={state.subject} onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}><option value="">-- Chọn môn --</option><optgroup label="Cơ bản"><option value="Toán">Toán</option><option value="Ngữ văn">Văn</option><option value="Tiếng Anh">Anh</option></optgroup><optgroup label="KHTN"><option value="Vật lí">Lý</option><option value="Hóa học">Hóa</option><option value="Sinh học">Sinh</option></optgroup><optgroup label="KHXH"><option value="Lịch sử">Sử</option><option value="Địa lí">Địa</option><option value="GDKT & PL">GDKT&PL</option></optgroup><optgroup label="Công nghệ"><option value="Tin học">Tin</option><option value="Công nghệ (Công nghiệp)">CN (CN)</option><option value="Công nghệ (Nông nghiệp)">CN (NN)</option></optgroup></select><ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" /></div></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Khối</label><div className="relative"><select className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 appearance-none" value={state.grade} onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}><option value="">-- Chọn khối --</option><option value="Lớp 10">10</option><option value="Lớp 11">11</option><option value="Lớp 12">12</option><option value="Lớp 6">6</option><option value="Lớp 7">7</option><option value="Lớp 8">8</option><option value="Lớp 9">9</option></select><ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" /></div></div>
                  </div>

                  <label className={`flex flex-col items-center justify-center w-full h-40 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${state.file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 bg-slate-50/50 hover:bg-white'}`}>
                      <div className="flex flex-col items-center justify-center text-center">
                          {state.file ? (<><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 text-indigo-600"><FileCheck className="w-6 h-6" /></div><p className="font-bold text-indigo-900">{state.file.name}</p></>) : (<><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-400"><FileUp className="w-6 h-6" /></div><p className="font-bold text-slate-600">Thả file Giáo án (.docx)</p></>)}
                      </div>
                      <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
                  </label>

                  <button disabled={!state.file || state.isProcessing} onClick={handleAnalyze} className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 mt-6 ${!state.file || state.isProcessing ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700'}`}>
                    {state.isProcessing ? "Đang phân tích..." : "Kích hoạt AI"}
                  </button>
              </div>
            )}
            {state.step === 'review' && state.generatedContent && (
               <SmartEditor initialContent={state.generatedContent} onConfirm={handleFinalizeAndDownload} onCancel={() => setState(prev => ({ ...prev, step: 'upload', generatedContent: null }))} />
            )}
            {state.step === 'done' && state.result && (
              <div className="bg-white/90 backdrop-blur rounded-[2rem] p-10 shadow-2xl border border-white animate-fade-in flex flex-col items-center text-center gap-6">
                 <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-200"><Sparkles className="w-10 h-10" /></div>
                 <div><h3 className="text-2xl font-black text-slate-800">Xử lý thành công!</h3><p className="text-slate-500 mt-2">File đã sẵn sàng.</p></div>
                 <div className="flex gap-3 mt-4">
                     <button onClick={() => setState(prev => ({ ...prev, step: 'upload', result: null, generatedContent: null }))} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 border border-slate-200">Làm bài khác</button>
                     <button onClick={() => { if (state.result) { const url = URL.createObjectURL(state.result.blob); const a = document.createElement('a'); a.href = url; a.download = state.result.fileName; a.click(); } }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg"><Download className="w-5 h-5" /> Tải về</button>
                 </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
             <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-lg border border-white h-[400px] flex flex-col">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Nhật ký hệ thống</h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 font-mono text-xs">
                   {state.logs.map((log, i) => (<div key={i} className={`pb-1 border-b border-slate-50 ${log.includes("❌") ? "text-rose-600 font-bold" : "text-slate-600"}`}>{log}</div>))}
                   {state.isProcessing && <div className="text-indigo-600 animate-pulse font-bold">Checking...</div>}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;