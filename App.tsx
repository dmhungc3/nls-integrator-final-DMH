import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Download, Sparkles, GraduationCap, Cpu, CheckCircle2, 
  Play, Settings, BookOpen, Layers, Zap, Sliders 
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v5.0-PRO-FEATURES"; 
  
  // Thêm state cho cấu hình NLS nâng cao
  const [nlsConfig, setNlsConfig] = useState({
    trend: 'none', // none, ai, stem, robotics
    level: 'basic' // basic (Cơ bản), advanced (Nâng cao)
  });

  const [activeConfigTab, setActiveConfigTab] = useState<'subjects' | 'nls'>('subjects');

  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: 'Lớp 10' as GradeType, 
    isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  const [userApiKey, setUserApiKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.logs]);

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file || !state.subject) {
        addLog("🔴 Vui lòng chọn Môn học và File giáo án!");
        setActiveConfigTab('subjects');
        return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: [`🚀 Đang phân tích môn ${state.subject} (${nlsConfig.level === 'advanced' ? 'Nâng cao' : 'Cơ bản'})...`] }));
    
    try {
      const text = await extractTextFromDocx(state.file);
      // Truyền thêm cấu hình Trend và Level vào hàm xử lý
      const content = await generateCompetencyIntegration(
        createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), 
        userApiKey,
        nlsConfig.trend, 
        nlsConfig.level
      );
      addLog("✨ Đã thiết kế xong Năng lực số.");
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e: any) { 
      addLog(`🔴 Lỗi: ${e.message}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const handleDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    addLog("⬇️ Đang xuất file Word...");
    try {
      const blob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', addLog);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `NLS-${nlsConfig.level}-${state.file.name}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      addLog("✅ Tải xuống thành công!");
      setState(prev => ({ ...prev, step: 'done' }));
    } catch (e: any) { addLog(`🔴 Lỗi file: ${e.message}`); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg"><Sparkles size={22}/></div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-800">NLS Integrator</h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">{APP_VERSION}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="Nhập API Key..." className="border border-slate-200 rounded-xl px-4 py-2 text-sm w-56 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
            <button onClick={() => localStorage.setItem('gemini_api_key', userApiKey)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-all">Lưu</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Cấu hình */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
              {/* Tabs Switcher */}
              <div className="flex border-b border-slate-100">
                <button onClick={() => setActiveConfigTab('subjects')} className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${activeConfigTab === 'subjects' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <BookOpen size={16}/> 1. Chọn Môn & Lớp
                </button>
                <button onClick={() => setActiveConfigTab('nls')} className={`flex-1 py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${activeConfigTab === 'nls' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Zap size={16}/> 2. Xu hướng & Cấp độ
                </button>
              </div>

              <div className="p-8">
                {/* TAB 1: MÔN HỌC */}
                {activeConfigTab === 'subjects' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Nhóm Bắt buộc</label>
                        <select className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 cursor-pointer" 
                          onChange={e => { if(e.target.value) setState(prev => ({...prev, subject: e.target.value as SubjectType})) }}
                          value={['Toán', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Giáo dục thể chất', 'GDQP&AN', 'Hoạt động trải nghiệm'].includes(state.subject) ? state.subject : ''}
                        >
                          <option value="">-- Chọn môn bắt buộc --</option>
                          <option value="Toán">Toán học</option>
                          <option value="Ngữ văn">Ngữ văn</option>
                          <option value="Tiếng Anh">Tiếng Anh</option>
                          <option value="Lịch sử">Lịch sử</option>
                          <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                          <option value="GDQP&AN">GD Quốc phòng & An ninh</option>
                          <option value="Hoạt động trải nghiệm">HĐ Trải nghiệm, hướng nghiệp</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Nhóm Tự chọn (Lựa chọn)</label>
                        <select className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 cursor-pointer"
                          onChange={e => { if(e.target.value) setState(prev => ({...prev, subject: e.target.value as SubjectType})) }}
                          value={['Vật lý', 'Hóa học', 'Sinh học', 'Địa lý', 'GDKT&PL', 'Tin học', 'Công nghệ', 'Âm nhạc', 'Mỹ thuật'].includes(state.subject) ? state.subject : ''}
                        >
                          <option value="">-- Chọn môn lựa chọn --</option>
                          <option value="Vật lý">Vật lý</option>
                          <option value="Hóa học">Hóa học</option>
                          <option value="Sinh học">Sinh học</option>
                          <option value="Địa lý">Địa lý</option>
                          <option value="GDKT&PL">GD Kinh tế & Pháp luật</option>
                          <option value="Tin học">Tin học</option>
                          <option value="Công nghệ">Công nghệ</option>
                          <option value="Âm nhạc">Âm nhạc</option>
                          <option value="Mỹ thuật">Mỹ thuật</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Khối lớp</label>
                      <select className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 cursor-pointer" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                        <option value="Lớp 10">Lớp 10 (THPT)</option>
                        <option value="Lớp 11">Lớp 11 (THPT)</option>
                        <option value="Lớp 12">Lớp 12 (THPT)</option>
                        <option value="Lớp 6">Lớp 6 (THCS)</option>
                        <option value="Lớp 7">Lớp 7 (THCS)</option>
                        <option value="Lớp 8">Lớp 8 (THCS)</option>
                        <option value="Lớp 9">Lớp 9 (THCS)</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setActiveConfigTab('nls')} className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">Tiếp tục: Cấu hình NLS &rarr;</button>
                    </div>
                  </div>
                )}

                {/* TAB 2: CẤU HÌNH NLS */}
                {activeConfigTab === 'nls' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2"><Zap size={14}/> Xu hướng Mới</label>
                        <select className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 cursor-pointer" value={nlsConfig.trend} onChange={e => setNlsConfig(prev => ({...prev, trend: e.target.value}))}>
                          <option value="none">Không áp dụng (Tiêu chuẩn)</option>
                          <option value="ai">Trí tuệ nhân tạo (AI Generative)</option>
                          <option value="robotics">Robotics & Tự động hóa</option>
                          <option value="stem">Giáo dục STEM/STEAM</option>
                          <option value="design">Thiết kế đồ họa & Multimedia</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2"><Sliders size={14}/> Cấp độ NLS</label>
                        <div className="flex gap-2">
                          <button onClick={() => setNlsConfig(prev => ({...prev, level: 'basic'}))} className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${nlsConfig.level === 'basic' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                            Cơ bản
                            <span className="block text-[9px] font-normal mt-1 opacity-80">Sử dụng công cụ có sẵn</span>
                          </button>
                          <button onClick={() => setNlsConfig(prev => ({...prev, level: 'advanced'}))} className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${nlsConfig.level === 'advanced' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                            Nâng cao
                            <span className="block text-[9px] font-normal mt-1 opacity-80">Sáng tạo & Giải quyết vấn đề</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl h-36 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all relative group mt-4">
                      <FileUp className="text-indigo-400 mb-2 group-hover:-translate-y-1 transition-transform" size={40}/>
                      <span className="text-sm font-bold text-indigo-900">{state.file ? state.file.name : "Nạp giáo án (.docx) để bắt đầu"}</span>
                      <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
                    </div>

                    <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-black shadow-xl shadow-indigo-200 flex justify-center items-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98]">
                      {state.isProcessing ? <Cpu className="animate-spin"/> : <Play/>} KÍCH HOẠT HỆ THỐNG
                    </button>
                  </div>
                )}
              </div>
            </div>

            {state.generatedContent && (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/><h2 className="font-black text-lg text-slate-800">Kết quả phân tích</h2></div>
                  <button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"><Download size={16}/> TẢI VỀ MÁY</button>
                </div>
                <div className="bg-slate-50 p-1 rounded-2xl max-h-96 overflow-y-auto border border-slate-200 custom-scrollbar">
                  {state.generatedContent.activities_integration.map((act, i) => (
                    <div key={i} className="mb-3 pl-4 border-l-4 border-indigo-500 bg-white p-5 rounded-r-xl shadow-sm">
                      <span className="font-black text-[10px] uppercase text-slate-400 block mb-2 tracking-wider border-b pb-2">Chèn vào: {act.anchor_text}</span>
                      <p className="font-medium text-indigo-900 text-sm leading-relaxed">👉 {act.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Logs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]"><GraduationCap size={14}/> Tác giả</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">MH</div>
                <div><p className="font-bold text-slate-800 text-base">Đặng Mạnh Hùng</p><p className="text-[11px] text-slate-500 font-bold uppercase">THPT Lý Nhân Tông</p></div>
              </div>
            </div>
            <div className="bg-[#0f172a] p-6 rounded-3xl shadow-2xl h-[450px] flex flex-col text-xs font-mono text-slate-400 border border-slate-800">
              <div className="border-b border-slate-700 pb-4 mb-4 font-bold text-indigo-400 uppercase flex gap-2 items-center tracking-widest"><Cpu size={14} className="text-emerald-400 animate-pulse"/> System Logs</div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {state.logs.map((l, i) => <div key={i} className="flex gap-2 leading-relaxed border-l-2 border-slate-700 pl-3"><span>[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit'})}]</span><span className={l.includes("🔴")?"text-rose-400":"text-slate-300"}>{l.replace("👉","")}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;