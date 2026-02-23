import React, { useState, useEffect } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download,
  BookOpen, GraduationCap, Sparkles, ChevronRight,
  Smartphone, Zap, Layers, Cpu, Phone, Info, ShieldCheck, Key
} from 'lucide-react';
import { AppState, SubjectType, GradeType, GeneratedNLSContent } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt, PEDAGOGY_MODELS } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';
import SmartEditor from './components/SmartEditor';

type IntegrationMode = 'NLS' | 'NAI';

const App: React.FC = () => {
  const APP_VERSION = "v2.3.1 PRO (GDPT 2018)"; 
  
  const [pedagogy, setPedagogy] = useState<string>('DEFAULT');
  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: '' as GradeType, isProcessing: false, step: 'upload', logs: [],
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
    if (userApiKey.trim()) { 
      localStorage.setItem('gemini_api_key', userApiKey); 
      setIsKeySaved(true); 
      addLog("🔐 Đã lưu API Key bảo mật vào hệ thống."); 
    } else { 
      alert("Vui lòng nhập Key!"); 
    }
  };
   
  const handleEditKey = () => setIsKeySaved(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setState(prev => ({ ...prev, file, result: null, generatedContent: null, step: 'upload', logs: [`📂 Đã nạp file: ${file.name}`] }));
    } else { 
      alert("Chỉ hỗ trợ định dạng Word (.docx)!"); 
    }
  };

  const addLog = (msg: string) => { setState(prev => ({ ...prev, logs: [...prev.logs, msg] })); };

  const handleAnalyze = async () => {
    if (!userApiKey.trim()) { alert("Vui lòng nhập API Key!"); return; }
    if (!state.file || !state.subject || !state.grade) { alert("Vui lòng chọn đầy đủ Môn và Khối lớp!"); return; }

    setState(prev => ({ ...prev, isProcessing: true, logs: [`🚀 Khởi động Core ${APP_VERSION}...`] }));

    try {
      const modelName = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS]?.name || "Linh hoạt";
      addLog(`⚙️ Cấu hình chiến lược: ${modelName}`);
      addLog("→ Chế độ: Tách năng lực & Lồng ghép hoạt động (Smart Mode)."); 
      addLog("🔍 Đang phân tích cấu trúc giáo án...");
      
      const textContext = await extractTextFromDocx(state.file);
      const prompt = createIntegrationTextPrompt(textContext, state.subject, state.grade, mode);
      
      addLog("🧠 Đang kích hoạt mô hình AI xử lý...");
      const generatedContent = await generateCompetencyIntegration(prompt, userApiKey);
      addLog(`✓ AI đã hoàn thành thiết kế nội dung.`);
      
      setState(prev => ({ ...prev, isProcessing: false, generatedContent, step: 'review' }));
    } catch (error) {
      addLog(`❌ Lỗi hệ thống: ${error instanceof Error ? error.message : "Xung đột không xác định"}`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleFinalizeAndDownload = async (finalContent: GeneratedNLSContent) => {
    if (!state.file) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "📦 Đang đóng gói file chuẩn định dạng..."] }));
    try {
      const newBlob = await injectContentIntoDocx(state.file, finalContent, mode, addLog);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        step: 'done', 
        result: { fileName: `[NLS-PRO] ${state.file?.name}`, blob: newBlob }, 
        logs: [...prev.logs, "✨ Xuất file thành công! Sẵn sàng tải về."] 
      }));
    } catch (error) {
       addLog(`❌ Lỗi đóng gói: ${error instanceof Error ? error.message : "Thất bại"}`);
       setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-800 pb-10">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-200/20 blur-[120px]" />
      </div>

      {/* HEADER */}
      <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-indigo-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
                      <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                      <h1 className="font-bold text-slate-800 text-xl tracking-tight">NLS Integrator <span className="text-indigo-600">Pro</span></h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{APP_VERSION}</span>
                        <span className="text-[10px] text-slate-400">| Developed by GV. Đặng Mạnh Hùng</span>
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  {isKeySaved ? (
                      <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                          <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </div>
                          <span className="text-emerald-700 font-bold text-xs">AI Connected</span>
                          <button onClick={handleEditKey} className="ml-2 text-xs text-slate-400 hover:text-indigo-600 underline decoration-indigo-200">Đổi Key</button>
                      </div>
                  ) : (
                      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm ring-4 ring-slate-50">
                        <div className="flex items-center px-3 text-slate-400"><Key className="w-4 h-4" /></div>
                        <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Nhập Gemini API Key..." className="text-sm outline-none w-48 bg-transparent" />
                        <button onClick={saveKeyToLocal} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">Kết nối</button>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
        
        {/* STEPPER */}
        <div className="flex justify-center">
             <div className="flex items-center gap-6 bg-white px-8 py-3 rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-50">
                <div className={`flex items-center gap-2 text-sm font-bold ${state.step === 'upload' ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 ${state.step === 'upload' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>1</span> 
                    Tải giáo án
                </div>
                <div className="w-12 h-0.5 bg-slate-100 rounded-full"></div>
                <div className={`flex items-center gap-2 text-sm font-bold ${state.step === 'review' ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 ${state.step === 'review' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>2</span> 
                    AI Thiết kế
                </div>
                <div className="w-12 h-0.5 bg-slate-100 rounded-full"></div>
                <div className={`flex items-center gap-2 text-sm font-bold ${state.step === 'done' ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 ${state.step === 'done' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>3</span> 
                    Xuất bản
                </div>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: MAIN INTERFACE */}
          <div className="lg:col-span-8 space-y-6">
            {state.step === 'upload' && (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden ring-1 ring-slate-100/50">
                  
                  {/* Card Header */}
                  <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BookOpen className="w-5 h-5" /></div>
                          <div>
                              <h3 className="font-bold text-slate-800 text-lg">Cấu hình Tích hợp</h3>
                              <p className="text-xs text-slate-500">Thiết lập thông số cho AI xử lý giáo án</p>
                          </div>
                      </div>
                      <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner">
                          <button onClick={() => setMode('NLS')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mode === 'NLS' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}><Smartphone className="w-4 h-4" /> Năng lực Số</button>
                          <button onClick={() => setMode('NAI')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mode === 'NAI' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}><Zap className="w-4 h-4" /> Năng lực AI</button>
                      </div>
                  </div>

                  <div className="p-8 space-y-8">
                      {/* Select Inputs - PHÂN LOẠI THEO GDPT 2018 */}
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide ml-1">Môn học</label>
                              <div className="relative group">
                                <select 
                                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer hover:bg-white" 
                                  value={state.subject} 
                                  onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}
                                >
                                    <option value="">-- Chọn môn --</option>
                                    <optgroup label="Môn Bắt buộc">
                                        <option value="Toán">Toán học</option>
                                        <option value="Ngữ Văn">Ngữ Văn</option>
                                        <option value="Tiếng Anh">Tiếng Anh</option>
                                        <option value="Lịch Sử">Lịch Sử</option>
                                        <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                                        <option value="Giáo dục quốc phòng và an ninh">GDQP & AN</option>
                                        <option value="Hoạt động trải nghiệm, hướng nghiệp">HĐ Trải nghiệm</option>
                                    </optgroup>
                                    <optgroup label="Môn Lựa chọn">
                                        <option value="Vật Lí">Vật Lí</option>
                                        <option value="Hóa Học">Hóa Học</option>
                                        <option value="Sinh Học">Sinh Học</option>
                                        <option value="Địa Lí">Địa Lí</option>
                                        <option value="Giáo dục kinh tế và pháp luật">GDKT & PL</option>
                                        <option value="Tin Học">Tin Học</option>
                                        <option value="Công Nghệ">Công Nghệ</option>
                                        <option value="Âm Nhạc">Âm Nhạc</option>
                                        <option value="Mỹ Thuật">Mỹ Thuật</option>
                                    </optgroup>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                              </div>
                          </div>
                          
                          <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide ml-1">Khối lớp</label>
                              <div className="relative group">
                                <select 
                                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer hover:bg-white" 
                                  value={state.grade} 
                                  onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}
                                >
                                    <option value="">-- Chọn khối --</option>
                                    <optgroup label="Trung học Phổ thông (THPT)">
                                        <option value="Lớp 10">Lớp 10</option>
                                        <option value="Lớp 11">Lớp 11</option>
                                        <option value="Lớp 12">Lớp 12</option>
                                    </optgroup>
                                    <optgroup label="Trung học Cơ sở (THCS)">
                                        <option value="Lớp 6">Lớp 6</option>
                                        <option value="Lớp 7">Lớp 7</option>
                                        <option value="Lớp 8">Lớp 8</option>
                                        <option value="Lớp 9">Lớp 9</option>
                                    </optgroup>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 ml-1"><Layers className="w-3.5 h-3.5" /> Mô hình Sư phạm</label>
                          <div className="relative group">
                            <select 
                                className="w-full p-4 pl-12 rounded-xl border-2 border-indigo-50 bg-indigo-50/30 text-sm font-bold text-indigo-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer hover:bg-indigo-50/50 appearance-none"
                                value={pedagogy}
                                onChange={(e) => setPedagogy(e.target.value)}
                            >
                                {Object.entries(PEDAGOGY_MODELS).map(([key, value]) => (
                                    <option key={key} value={key}>{value.name}</option>
                                ))}
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"><Sparkles className="w-5 h-5" /></div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none group-hover:text-indigo-600 transition-colors"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                          </div>
                          <p className="text-xs text-slate-500 pl-2 italic">ℹ️ {PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS]?.desc}</p>
                      </div>

                      {/* File Dropzone */}
                      <label className={`relative overflow-hidden flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${state.file ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/10'}`}>
                          <div className="flex flex-col items-center justify-center text-center p-4 z-10 transition-transform duration-300 group-hover:scale-105">
                              {state.file ? (
                                  <div className="flex flex-col items-center gap-3">
                                      <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-100"><FileCheck className="w-7 h-7" /></div>
                                      <div>
                                        <p className="font-bold text-indigo-900 text-base">{state.file.name}</p>
                                        <p className="text-xs text-indigo-500 font-medium bg-indigo-50 px-3 py-1 rounded-full mt-2 inline-block">Đã sẵn sàng xử lý</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center gap-3">
                                      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"><FileUp className="w-7 h-7" /></div>
                                      <div>
                                        <p className="font-bold text-slate-600 text-base">Nhấn để chọn giáo án (.docx)</p>
                                        <p className="text-xs text-slate-400 mt-1">hoặc kéo thả file vào đây</p>
                                      </div>
                                  </div>
                              )}
                          </div>
                          <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
                      </label>

                      {/* Action Button */}
                      <button 
                        disabled={!state.file || state.isProcessing} 
                        onClick={handleAnalyze} 
                        className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 transform active:scale-[0.98] ${
                            !state.file || state.isProcessing 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white hover:shadow-indigo-500/40 bg-[length:200%_auto] hover:bg-right transition-all duration-500'
                        }`}
                      >
                        {state.isProcessing ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang thiết kế nội dung...</>) : (<><Wand2 className="w-5 h-5" /> Kích hoạt AI & Tích hợp ngay</>)}
                      </button>
                  </div>
              </div>
            )}

            {state.step === 'review' && state.generatedContent && (
               <SmartEditor initialContent={state.generatedContent} onConfirm={handleFinalizeAndDownload} onCancel={() => setState(prev => ({ ...prev, step: 'upload', generatedContent: null }))} />
            )}
            
            {state.step === 'done' && state.result && (
              <div className="bg-white rounded-3xl p-12 shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-white flex flex-col items-center text-center animate-fade-in-up">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 ring-8 ring-emerald-50/50"><Sparkles className="w-12 h-12" /></div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-2">Tuyệt vời!</h3>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">Giáo án của thầy/cô đã được tích hợp năng lực {mode === 'NAI' ? 'AI' : 'Số'} chuẩn GDPT 2018 thành công.</p>
                  
                  <div className="flex gap-4">
                      <button onClick={() => setState(prev => ({ ...prev, step: 'upload', result: null, generatedContent: null }))} className="px-6 py-3.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">Làm bài khác</button>
                      <button onClick={() => { if (state.result) { const url = URL.createObjectURL(state.result.blob); const a = document.createElement('a'); a.href = url; a.download = state.result.fileName; a.click(); } }} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-transform hover:-translate-y-1"><Download className="w-4 h-4" /> Tải giáo án về máy</button>
                  </div>
              </div>
            )}
          </div>
          
          {/* RIGHT PANEL: TERMINAL & INFO */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             {/* Terminal Card */}
             <div className="bg-[#1e1e2e] rounded-3xl p-6 shadow-2xl shadow-slate-400/20 flex flex-col h-[420px] border border-slate-800 relative overflow-hidden group">
                {/* Terminal Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-2.5">
                       <ShieldCheck className="w-4 h-4 text-emerald-400" />
                       <span className="text-slate-300 text-xs font-bold uppercase tracking-wider font-mono">AI Secure Core</span>
                    </div>
                    <div className="flex gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors"></div>
                    </div>
                </div>
                
                {/* Terminal Logs */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 font-mono text-[11px] leading-relaxed pr-2">
                   {state.logs.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                        <Cpu className="w-10 h-10 mb-3 animate-pulse" />
                        <p>Hệ thống sẵn sàng...</p>
                     </div>
                   ) : (
                     state.logs.map((log, i) => (
                       <div key={i} className="flex gap-3 animate-fade-in-left group/log">
                         <span className="text-slate-600 shrink-0 select-none group-hover/log:text-slate-500 transition-colors">➜</span>
                         <span className={`${log.includes("❌") ? "text-rose-400 font-bold" : log.includes("✓") ? "text-emerald-400 font-bold" : log.includes("🚀") ? "text-amber-400 font-bold" : "text-indigo-200"}`}>
                           {log.replace("✓ ", "").replace("🚀 ", "")}
                         </span>
                       </div>
                     ))
                   )}
                   {state.isProcessing && (
                      <div className="flex gap-2 animate-pulse pl-6">
                        <span className="w-2 h-4 bg-indigo-500 block"></span>
                      </div>
                   )}
                </div>
             </div>
             
             {/* Author Card */}
             <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 bg-rose-50 rounded-lg text-rose-500"><GraduationCap className="w-5 h-5" /></div>
                   <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Thông tin bản quyền</h4>
                </div>
                
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-xs font-bold text-indigo-900 mb-1">Tác giả: Đặng Mạnh Hùng</p>
                         <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Giáo viên Trường THPT Lý Nhân Tông</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                         <Info className="w-4 h-4" />
                      </div>
                   </div>
                   <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <Phone className="w-3 h-3 text-indigo-500" /> 097 8386 357
                   </div>
                </div>

                <div className="mt-auto text-center">
                   <p className="text-[10px] text-slate-400 leading-relaxed">
                      Sản phẩm được phát triển nhằm hỗ trợ giáo viên chuyển đổi số theo chương trình GDPT 2018. <br/>
                      <span className="text-indigo-400 font-bold">Phiên bản: {APP_VERSION}</span>
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center border-t border-slate-100 pt-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-indigo-500 transition-colors cursor-default">© 2026 NLS Integrator Pro</p>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-fade-in-left { animation: fadeInLeft 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;