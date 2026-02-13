import React, { useState, useEffect } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download, Edit3,
  BookOpen, GraduationCap, Sparkles, ChevronRight, ArrowLeft, Key,
  User, School, Phone, Activity, Terminal
} from 'lucide-react';
import { AppState, SubjectType, GradeType, GeneratedNLSContent } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';
import SmartEditor from './components/SmartEditor';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    file: null,
    subject: '',
    grade: '',
    isProcessing: false,
    step: 'upload',
    logs: [],
    config: {
      insertObjectives: true,
      insertMaterials: true,
      insertActivities: true,
      appendTable: true
    },
    generatedContent: null,
    result: null
  });

  const [userApiKey, setUserApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setUserApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  const saveKeyToLocal = () => {
    if (userApiKey.trim()) {
      localStorage.setItem('gemini_api_key', userApiKey);
      setIsKeySaved(true);
      addLog("✓ Đã lưu API Key thành công.");
    } else {
      alert("Vui lòng nhập Key trước khi lưu!");
    }
  };

  const handleEditKey = () => {
    setIsKeySaved(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setState(prev => ({ 
        ...prev, 
        file, 
        result: null, 
        generatedContent: null,
        step: 'upload',
        logs: [`✓ Đã tải lên: ${file.name}`] 
      }));
    } else {
        alert("Vui lòng chọn file Word (.docx)");
    }
  };

  const addLog = (msg: string) => {
    setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const handleAnalyze = async () => {
    if (!userApiKey.trim()) {
        alert("Vui lòng nhập API Key để tiếp tục!");
        return;
    }
    if (!state.file || !state.subject || !state.grade) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        logs: ["🚀 Khởi động quy trình phân tích AI..."] 
    }));

    try {
      addLog("Đang đọc và phân tích cấu trúc giáo án...");
      const textContext = await extractTextFromDocx(state.file);
      if (!textContext || textContext.length < 50) {
          throw new Error("File không có nội dung văn bản để xử lý.");
      }

      addLog("Đang thiết kế kịch bản Năng lực số...");
      const prompt = createIntegrationTextPrompt(textContext, state.subject, state.grade);
      
      const generatedContent = await generateCompetencyIntegration(prompt, userApiKey);
      addLog("✓ AI đã đề xuất phương án tích hợp.");
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        generatedContent: generatedContent,
        step: 'review'
      }));

    } catch (error) {
      addLog(`❌ Lỗi: ${error instanceof Error ? error.message : "Unknown error"}`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleFinalizeAndDownload = async (finalContent: GeneratedNLSContent) => {
    if (!state.file) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      logs: [...prev.logs, "Đang áp dụng thay đổi và tạo file..."]
    }));

    try {
      const newBlob = await injectContentIntoDocx(state.file, finalContent, addLog);
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        step: 'done',
        result: {
            fileName: `NLS_${state.file?.name}`,
            blob: newBlob
        },
        logs: [...prev.logs, "✨ Thành công! File đã sẵn sàng."] 
      }));
    } catch (error) {
       addLog(`❌ Lỗi khi tạo file: ${error instanceof Error ? error.message : "Unknown error"}`);
       setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans text-slate-900 flex flex-col items-center selection:bg-indigo-100">
      
      {/* BACKGROUND DECOR BLOBS */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-200/30 rounded-full blur-[100px]"></div>
      </div>

      {/* --- TOP BAR (GLASS EFFECT) --- */}
      <div className="relative z-10 w-full max-w-7xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-sm">
        
        {/* Tác giả */}
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <User className="w-5 h-5" />
           </div>
           <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-sm tracking-wide">Tác giả: Đặng Mạnh Hùng</span>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                  <span className="flex items-center gap-1"><School className="w-3 h-3" /> THPT Lý Nhân Tông</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 097 8386 357</span>
              </div>
           </div>
        </div>

        {/* API Key Modern Pill */}
        <div className="flex items-center justify-end">
            {isKeySaved ? (
                <div className="group flex items-center gap-3 bg-white/80 p-2 pl-4 pr-2 rounded-full border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                        </div>
                        <span>API Ready</span>
                    </div>
                    <button onClick={handleEditKey} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        Thay đổi
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-indigo-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 transition-all w-full md:w-80">
                    <div className="pl-3"><Key className="w-4 h-4 text-amber-500" /></div>
                    <input 
                        type="password" 
                        value={userApiKey} 
                        onChange={(e) => setUserApiKey(e.target.value)} 
                        placeholder="Nhập Gemini API Key..." 
                        className="w-full bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 h-9" 
                    />
                    <button onClick={saveKeyToLocal} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95">
                        Lưu
                    </button>
                </div>
            )}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        
        {/* HERO HEADER */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 backdrop-blur rounded-2xl mb-4 shadow-xl shadow-indigo-100 border border-white">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-3">
            NLS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Integrator</span> Pro
          </h1>
          <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium">
            Trợ lý AI tích hợp Năng lực số vào Giáo án • <span className="text-indigo-500">Chính xác</span> • <span className="text-indigo-500">Chuẩn GDPT 2018</span>
          </p>
        </header>

        {/* STEPPER MODERN */}
        <div className="flex justify-center mb-10">
              <div className="flex items-center gap-6 bg-white/70 backdrop-blur-md px-8 py-3 rounded-full shadow-lg shadow-indigo-900/5 border border-white/50">
                  <div className={`flex items-center gap-2 ${state.step === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${state.step === 'upload' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300' : 'bg-slate-100'}`}>1</span> 
                      <span className="text-sm">Tải lên</span>
                  </div>
                  <div className="w-12 h-0.5 bg-slate-200/80"></div>
                  <div className={`flex items-center gap-2 ${state.step === 'review' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${state.step === 'review' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300' : 'bg-slate-100'}`}>2</span> 
                      <span className="text-sm">Xử lý</span>
                  </div>
                  <div className="w-12 h-0.5 bg-slate-200/80"></div>
                  <div className={`flex items-center gap-2 ${state.step === 'done' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${state.step === 'done' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300' : 'bg-slate-100'}`}>3</span> 
                      <span className="text-sm">Hoàn tất</span>
                  </div>
              </div>
         </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MAIN ACTION AREA */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* STEP 1: UPLOAD & CONFIG CARD */}
            {state.step === 'upload' && (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl shadow-indigo-900/5 border border-white relative overflow-hidden group animate-fade-in">
                
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

                <div className="relative z-10 space-y-6">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><BookOpen className="w-5 h-5" /></div>
                      Thiết lập Giáo án
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Môn học (GDPT 2018)</label>
                          <div className="relative">
                            <select 
                                className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer hover:bg-white"
                                value={state.subject}
                                onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}
                            >
                                <option value="">-- Chọn môn học --</option>
                                <optgroup label="Môn Cơ bản (Chung)">
                                    <option value="Toán">Toán học</option>
                                    <option value="Ngữ văn">Ngữ văn</option>
                                    <option value="Tiếng Anh">Tiếng Anh</option>
                                </optgroup>

                                <optgroup label="Cấp 3 (THPT): Khoa học Tự nhiên">
                                    <option value="Vật lí">Vật lí</option>
                                    <option value="Hóa học">Hóa học</option>
                                    <option value="Sinh học">Sinh học</option>
                                </optgroup>

                                <optgroup label="Cấp 3 (THPT): Khoa học Xã hội">
                                    <option value="Lịch sử">Lịch sử</option>
                                    <option value="Địa lí">Địa lí</option>
                                    <option value="GDKT & PL">Giáo dục KT & PL (GDCD)</option>
                                </optgroup>

                                <optgroup label="Cấp 3 (THPT): Công nghệ & Tin học">
                                    <option value="Tin học">Tin học</option>
                                    <option value="Công nghệ (Công nghiệp)">Công nghệ (Công nghiệp)</option>
                                    <option value="Công nghệ (Nông nghiệp)">Công nghệ (Nông nghiệp)</option>
                                </optgroup>

                                <optgroup label="Cấp 2 (THCS): Môn Tích hợp">
                                    <option value="Khoa học tự nhiên">Khoa học tự nhiên (Lý-Hóa-Sinh)</option>
                                    <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                                    <option value="Công nghệ">Công nghệ (THCS)</option>
                                </optgroup>

                                <optgroup label="Nghệ thuật & Thể chất (Chung)">
                                    <option value="Âm nhạc">Âm nhạc</option>
                                    <option value="Mỹ thuật">Mỹ thuật</option>
                                    <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                                    <option value="GDQP & AN">Giáo dục QP & AN</option>
                                    <option value="HĐ Trải nghiệm, HN">HĐ Trải nghiệm, Hướng nghiệp</option>
                                </optgroup>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Khối lớp</label>
                          <div className="relative">
                            <select 
                                className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer hover:bg-white"
                                value={state.grade}
                                onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}
                            >
                                <option value="">-- Chọn khối lớp --</option>
                                <optgroup label="Trung học Phổ thông">
                                    <option value="Lớp 10">Lớp 10</option>
                                    <option value="Lớp 11">Lớp 11</option>
                                    <option value="Lớp 12">Lớp 12</option>
                                </optgroup>
                                <optgroup label="Trung học Cơ sở">
                                    <option value="Lớp 6">Lớp 6</option>
                                    <option value="Lớp 7">Lớp 7</option>
                                    <option value="Lớp 8">Lớp 8</option>
                                    <option value="Lớp 9">Lớp 9</option>
                                </optgroup>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                          </div>
                      </div>
                  </div>

                  {/* Upload Zone Modern */}
                  <div className="mt-2">
                      <label className={`relative flex flex-col items-center justify-center w-full h-44 rounded-3xl border-2 border-dashed transition-all cursor-pointer group/upload overflow-hidden
                          ${state.file 
                              ? 'border-indigo-400 bg-indigo-50/50' 
                              : 'border-slate-300 bg-slate-50/50 hover:bg-white hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100'
                          }`}
                      >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center z-10 transition-transform duration-300 group-hover/upload:scale-105">
                              {state.file ? (
                                  <>
                                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-3 text-indigo-600 animate-bounce">
                                          <FileCheck className="w-8 h-8" />
                                      </div>
                                      <p className="text-base font-bold text-indigo-900">{state.file.name}</p>
                                      <p className="text-sm text-indigo-500 font-medium mt-1 bg-indigo-100 px-3 py-1 rounded-full">Đã sẵn sàng</p>
                                  </>
                              ) : (
                                  <>
                                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-3 text-slate-400 group-hover/upload:text-indigo-600 group-hover/upload:shadow-indigo-200 transition-all">
                                          <FileUp className="w-7 h-7" />
                                      </div>
                                      <p className="text-base font-bold text-slate-600 mb-1 group-hover/upload:text-indigo-800">
                                          Thả file Giáo án (.docx) vào đây
                                      </p>
                                      <p className="text-xs text-slate-400 font-medium">Hỗ trợ tốt nhất cho MathType & Hình ảnh</p>
                                  </>
                              )}
                          </div>
                          <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
                      </label>
                  </div>

                  <button
                    disabled={!state.file || state.isProcessing}
                    onClick={handleAnalyze}
                    className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] ${
                      !state.file || state.isProcessing 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50'
                    }`}
                  >
                    {state.isProcessing ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang phân tích dữ liệu...</>
                    ) : (
                      <><Wand2 className="w-5 h-5" /> Kích hoạt AI Phân tích</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SMART EDITOR */}
            {state.step === 'review' && state.generatedContent && (
               <SmartEditor 
                  initialContent={state.generatedContent}
                  onConfirm={handleFinalizeAndDownload}
                  onCancel={() => setState(prev => ({ ...prev, step: 'upload', generatedContent: null }))}
               />
            )}
            
            {/* STEP 3: DONE */}
            {state.step === 'done' && state.result && (
              <div className="bg-white/90 backdrop-blur rounded-[2rem] p-10 shadow-2xl border border-white animate-fade-in flex flex-col items-center text-center gap-6">
                 <div className="relative">
                    <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <Sparkles className="w-10 h-10" />
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Xử lý thành công!</h3>
                    <p className="text-base text-slate-500">Giáo án đã được tích hợp Năng lực số hoàn chỉnh.</p>
                 </div>
                 
                 <div className="flex gap-4 w-full justify-center mt-2">
                     <button 
                        onClick={() => setState(prev => ({ ...prev, step: 'upload', result: null, generatedContent: null }))}
                        className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
                     >
                        <ArrowLeft className="w-5 h-5" /> Làm bài khác
                     </button>
                     <button 
                        onClick={() => {
                           if (state.result) {
                              const url = URL.createObjectURL(state.result.blob);
                              const a = document.createElement('a');
                              a.href = url; a.download = state.result.fileName; a.click();
                           }
                        }}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-base flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1 hover:shadow-indigo-500/30"
                     >
                        <Download className="w-5 h-5" /> Tải về máy ngay
                     </button>
                 </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LOGS & TIPS */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             
             {/* BLOCK 1: SYSTEM LOGS (TERMINAL STYLE BUT CLEAN) */}
             <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-white flex flex-col h-[350px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-60 pointer-events-none"></div>

                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4 relative z-10">
                   <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-slate-100 rounded-lg">
                        <Activity className="w-4 h-4 text-slate-600" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nhật ký hệ thống</h4>
                   </div>
                   <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                   </div>
                </div>

                <div className="space-y-3 font-mono text-xs leading-relaxed overflow-y-auto custom-scrollbar pr-2 flex-1 scroll-smooth relative z-10">
                   {state.logs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 mt-4 opacity-60">
                          <Terminal className="w-8 h-8" />
                          <span className="italic">Hệ thống đang chờ lệnh...</span>
                      </div>
                   ) : (
                      state.logs.map((log, i) => (
                          <div key={i} className="flex gap-3 animate-fade-in items-start group">
                              <span className="text-slate-400 shrink-0 select-none text-[10px] mt-0.5 font-medium">
                                 {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <div className={`flex-1 break-words pb-1 border-b border-slate-50 ${
                                 log.includes("❌") ? "text-rose-600 font-bold" : 
                                 log.includes("✓") || log.includes("✨") ? "text-emerald-600 font-bold" : 
                                 "text-slate-600 font-medium"
                              }`}>
                                {log}
                              </div>
                          </div>
                      ))
                   )}
                   {state.isProcessing && (
                     <div className="flex gap-2 items-center text-indigo-600 animate-pulse mt-2 bg-indigo-50 p-2 rounded-lg w-fit">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
                        <span className="text-xs font-bold ml-1">AI đang xử lý tác vụ...</span>
                     </div>
                   )}
                </div>
             </div>

             {/* BLOCK 2: PEDAGOGICAL CORNER */}
             <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-6 shadow-xl text-white relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2 relative z-10">
                    <GraduationCap className="w-5 h-5 text-cyan-400" /> 
                    GÓC SƯ PHẠM
                </h4>
                
                <div className="space-y-3 relative z-10">
                    {[
                        "Smart Studio: Cho phép thầy cô biên tập nội dung AI trước khi xuất.",
                        "Context Aware: AI tự động tìm vị trí phù hợp nhất trong bài dạy.",
                        "Tool Suggestion: Gợi ý công cụ số (Padlet, Kahoot...) theo đặc thù môn.",
                        "Format Keeper: Giữ nguyên 100% công thức MathType & Hình ảnh gốc."
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3 text-xs text-slate-300 items-start">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shadow shadow-cyan-500/50 shrink-0"></div>
                            <span className="leading-relaxed">{item}</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;