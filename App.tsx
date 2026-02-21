import React, { useState, useEffect } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download,
  BookOpen, GraduationCap, Sparkles, ChevronRight,
  Smartphone, Zap, Layers, Cpu, Phone, Info, Clock, CheckCircle2
} from 'lucide-react';
import { AppState, SubjectType, GradeType, GeneratedNLSContent } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt, PEDAGOGY_MODELS } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';
import SmartEditor from './components/SmartEditor';

type IntegrationMode = 'NLS' | 'NAI';

const App: React.FC = () => {
  const APP_VERSION = "v2.1.4-OFFICIAL";
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
      addLog("✓ Đã lưu API Key hệ thống."); 
    } else { 
      alert("Vui lòng nhập Key!"); 
    }
  };
  
  const handleEditKey = () => setIsKeySaved(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setState(prev => ({ ...prev, file, result: null, generatedContent: null, step: 'upload', logs: [`✓ Đã nạp file: ${file.name}`] }));
    } else { 
      alert("Hệ thống chỉ hỗ trợ file Word (.docx)!"); 
    }
  };

  const addLog = (msg: string) => { setState(prev => ({ ...prev, logs: [...prev.logs, msg] })); };

  const handleAnalyze = async () => {
    if (!userApiKey.trim()) { alert("Vui lòng nhập API Key!"); return; }
    if (!state.file || !state.subject || !state.grade) { alert("Anh vui lòng chọn đầy đủ thông tin Môn và Lớp!"); return; }

    setState(prev => ({ ...prev, isProcessing: true, logs: [`🚀 Khởi động Core ${APP_VERSION} (Tốc độ cao)...`] }));

    try {
      const modelName = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS]?.name || "Linh hoạt";
      addLog(`⚙️ Chiến lược: ${modelName}`);
      addLog(`🔍 Đang đọc cấu trúc file bài ${state.subject}...`);
      const textContext = await extractTextFromDocx(state.file);
      const prompt = createIntegrationTextPrompt(textContext, state.subject, state.grade, mode, pedagogy);
      const generatedContent = await generateCompetencyIntegration(prompt, userApiKey);
      addLog(`✓ AI đã hoàn thành thiết thiết kế nội dung.`);
      setState(prev => ({ ...prev, isProcessing: false, generatedContent, step: 'review' }));
    } catch (error) {
      addLog(`❌ Lỗi: ${error instanceof Error ? error.message : "Xung đột hệ thống"}`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleFinalizeAndDownload = async (finalContent: GeneratedNLSContent) => {
    if (!state.file) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "⚡ Đang chèn dữ liệu (Thuật toán nhanh)..."] }));
    try {
      const startTime = performance.now();
      const newBlob = await injectContentIntoDocx(state.file, finalContent, mode, (m) => addLog(`→ ${m}`));
      const duration = ((performance.now() - startTime) / 1000).toFixed(1);
      addLog(`✨ Đã chèn xong trong ${duration}s!`);

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        step: 'done', 
        result: { fileName: `Nang-cap-${mode}-${state.file?.name}`, blob: newBlob }, 
        logs: [...prev.logs, "✓ Sẵn sàng tải về."] 
      }));
    } catch (error) {
       addLog(`❌ Lỗi đóng gói: ${error instanceof Error ? error.message : "Đóng gói thất bại"}`);
       setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center selection:bg-indigo-100 selection:text-indigo-900">
      
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-fade-in-left { animation: fadeInLeft 0.3s ease-out forwards; }
        .animate-blink { animation: blink 1s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 20px; }
      `}</style>

      {/* HEADER */}
      <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                      <h2 className="font-bold text-slate-800 text-lg leading-tight tracking-tight">NLS Integrator Pro</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">{APP_VERSION} SPEED</span>
                        <span className="text-[10px] text-slate-400">| GV. Đặng Mạnh Hùng</span>
                      </div>
                  </div>
              </div>

              <div className="flex items-center justify-end shrink-0">
                  {isKeySaved ? (
                      <div className="flex items-center gap-2 bg-emerald-50/80 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                          <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </div>
                          <span className="text-emerald-700 font-bold text-xs">AI Ready</span>
                          <button onClick={handleEditKey} className="ml-2 text-[10px] text-slate-400 hover:text-indigo-600 underline">Đổi</button>
                      </div>
                  ) : (
                      <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Nhập Gemini API Key..." className="text-xs px-2 outline-none w-40" />
                        <button onClick={saveKeyToLocal} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700">Lưu</button>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="w-full max-w-7xl px-4 py-8 flex flex-col gap-8">
        
        {/* STEPPER */}
        <div className="flex justify-center">
             <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100">
                <div className={`flex items-center gap-2 ${state.step === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] border-current">1</span> Tải lên</div>
                <div className="w-8 h-px bg-slate-200"></div>
                <div className={`flex items-center gap-2 ${state.step === 'review' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] border-current">2</span> AI Thiết kế</div>
                <div className="w-8 h-px bg-slate-200"></div>
                <div className={`flex items-center gap-2 ${state.step === 'done' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}><span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] border-current">3</span> Tải về</div>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {state.step === 'upload' && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden ring-1 ring-slate-100 animate-fade-in-up">
                  <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          <span>Thiết lập Giáo án</span>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button onClick={() => setMode('NLS')} className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mode === 'NLS' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}><Smartphone className="w-4 h-4" /> Năng lực Số</button>
                          <button onClick={() => setMode('NAI')} className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${mode === 'NAI' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}><Zap className="w-4 h-4" /> Năng lực AI</button>
                      </div>
                  </div>

                  <div className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Môn học (GDPT 2018)</label>
                              <select className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold appearance-none" value={state.subject} onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                                  <option value="">-- Chọn môn học --</option>
                                  <optgroup label="Môn học Bắt buộc (THPT)">
                                      <option value="Toán">Toán học</option>
                                      <option value="Ngữ văn">Ngữ văn</option>
                                      <option value="Lịch sử">Lịch sử</option>
                                      <option value="Tiếng Anh">Tiếng Anh</option>
                                      <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                                      <option value="Giáo dục quốc phòng và an ninh">GD Quốc phòng & An ninh</option>
                                      <option value="Hoạt động trải nghiệm, hướng nghiệp">HĐ Trải nghiệm, hướng nghiệp</option>
                                  </optgroup>
                                  <optgroup label="Môn học Lựa chọn (Tự chọn)">
                                      <option value="Địa lí">Địa lí</option>
                                      <option value="Vật lí">Vật lí</option>
                                      <option value="Hóa học">Hóa học</option>
                                      <option value="Sinh học">Sinh học</option>
                                      <option value="Tin học">Tin học</option>
                                      <option value="Công nghệ">Công nghệ</option>
                                      <option value="Giáo dục kinh tế và pháp luật">GD Kinh tế & Pháp luật</option>
                                      <option value="Âm nhạc">Âm nhạc</option>
                                      <option value="Mỹ thuật">Mỹ thuật</option>
                                  </optgroup>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Khối lớp</label>
                              <select className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold appearance-none" value={state.grade} onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
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

                      <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Layers className="w-3 h-3" /> Mô hình Sư phạm</label>
                          <div className="relative">
                            <select 
                                className="w-full p-4 rounded-xl border-2 border-indigo-50 bg-indigo-50/30 text-sm font-bold text-indigo-900 outline-none appearance-none"
                                value={pedagogy}
                                onChange={(e) => setPedagogy(e.target.value)}
                            >
                                {Object.entries(PEDAGOGY_MODELS).map(([key, value]) => (
                                    <option key={key} value={key}>{value.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                          </div>
                      </div>

                      <label className={`relative overflow-hidden flex flex-col items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${state.file ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                          <div className="flex flex-col items-center justify-center text-center p-4 z-10">
                              <FileUp className={`w-10 h-10 mb-2 ${state.file ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <span className="text-sm font-bold text-slate-600">{state.file ? state.file.name : "Nhấn để nạp file giáo án (.docx)"}</span>
                              <p className="text-[10px] text-slate-400 mt-1">Hệ thống sẵn sàng xử lý file môn {state.subject || "học"}</p>
                          </div>
                          <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
                      </label>

                      <button 
                        disabled={!state.file || state.isProcessing} 
                        onClick={handleAnalyze} 
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-slate-200 shadow-lg transition-all"
                      >
                        {state.isProcessing ? <Clock className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                        {state.isProcessing ? "Đang xử lý..." : "Kích hoạt AI & Tích hợp ngay"}
                      </button>
                  </div>
              </div>
            )}

            {state.step === 'review' && state.generatedContent && (
               <SmartEditor initialContent={state.generatedContent} onConfirm={handleFinalizeAndDownload} onCancel={() => setState(prev => ({ ...prev, step: 'upload', generatedContent: null }))} />
            )}
            
            {state.step === 'done' && state.result && (
              <div className="bg-white rounded-3xl p-10 shadow-2xl shadow-indigo-100/50 border border-white flex flex-col items-center text-center animate-fade-in-up">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-200"><CheckCircle2 className="w-10 h-10" /></div>
                  <h3 className="text-2xl font-bold text-slate-800">Tuyệt vời! Đã hoàn thiện.</h3>
                  <p className="text-slate-500 mt-2 mb-8 max-w-md">Giáo án đã được tích hợp năng lực số cho {state.subject} {state.grade} chuẩn GDPT 2018.</p>
                  <div className="flex gap-4">
                      <button onClick={() => setState(prev => ({ ...prev, step: 'upload', result: null, generatedContent: null }))} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 border border-slate-200">Làm bài khác</button>
                      <button onClick={() => { if (state.result) { const url = URL.createObjectURL(state.result.blob); const a = document.createElement('a'); a.href = url; a.download = state.result.fileName; a.click(); } }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-transform hover:-translate-y-1"><Download className="w-4 h-4" /> Tải về máy (.docx)</button>
                  </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
             <div className="bg-[#1e1e2e] rounded-2xl p-5 shadow-2xl h-[380px] flex flex-col border border-slate-700 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider font-mono"><Cpu className="w-3.5 h-3.5 text-indigo-400" /> AI Terminal Status</div>
                    <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div><div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 font-mono text-[11px] leading-relaxed">
                   {state.logs.length === 0 && <span className="text-slate-600 italic">&gt;&gt; Chờ lệnh từ anh Hùng...</span>}
                   {state.logs.map((log, i) => (
                     <div key={i} className="flex gap-3 animate-fade-in-left text-indigo-100">
                       <span className="text-slate-600 shrink-0 select-none">[{new Date().toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span>
                       <span>{log.replace("✓ ", "").replace("🚀 ", "")}</span>
                     </div>
                   ))}
                   {state.isProcessing && (
                     <div className="flex items-center gap-2 text-indigo-400 animate-pulse mt-2">
                       <Clock className="animate-spin w-4 h-4" />
                       <span>Hệ thống đang chèn dữ liệu...</span>
                     </div>
                   )}
                </div>
             </div>
             
             <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 flex-1">
                <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide"><GraduationCap className="w-4 h-4 text-indigo-500" /> Thông tin Tác giả</h4>
                <div className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                      <p className="text-xs font-bold text-indigo-700 mb-1 flex items-center gap-2">Tác giả: Đặng Mạnh Hùng</p>
                      <p className="text-[11px] text-slate-600">Giáo viên Trường THPT Lý Nhân Tông</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-bold"><Phone className="w-3.5 h-3.5" /> 097 8386 357</p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-800">Phiên bản: {APP_VERSION}</p>
                        <p className="text-[10px] text-indigo-600 mt-1 leading-relaxed">Phần mềm tối ưu xử lý Word tốc độ cao cho cấp THCS & THPT.</p>
                      </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-auto py-6 text-center border-t border-slate-100 bg-white/50">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">© 2026 NLS Integrator Pro — Cung cấp bởi GV. Đặng Mạnh Hùng — THPT Lý Nhân Tông</p>
      </div>
    </div>
  );
};

export default App;