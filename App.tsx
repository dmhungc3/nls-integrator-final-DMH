import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Download, Sparkles, GraduationCap, Cpu, CheckCircle2, 
  Play, Settings, BookOpen, Layers, Info 
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v3.3-STABLE-PRO"; 
  const [state, setState] = useState<AppState>({
    file: null, subject: 'Toán' as SubjectType, grade: 'Lớp 10' as GradeType, 
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
    if (!userApiKey || !state.file) {
        addLog("🔴 Thiếu API Key hoặc File giáo án."); return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: ["⏳ Đang xử lý giáo án..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(
        createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), 
        userApiKey
      );
      addLog("✅ Đã thiết kế NLS thành công!");
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e: any) { 
      addLog(`🔴 Lỗi: ${e.message}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const handleDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    addLog("⬇️ Đang tạo file Word...");
    try {
      const blob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', addLog);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `NLS-${state.file.name}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      addLog("✅ Tải xuống thành công!");
      setState(prev => ({ ...prev, step: 'done' }));
    } catch (e: any) { addLog(`🔴 Lỗi file: ${e.message}`); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header v3.3 */}
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200"><Sparkles size={22}/></div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-800 tracking-tight">NLS Integrator</h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-100">{APP_VERSION}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="Nhập API Key..." className="border border-slate-200 rounded-xl px-4 py-2 text-sm w-56 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
            <button onClick={() => localStorage.setItem('gemini_api_key', userApiKey)} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md">Lưu</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Điều khiển */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-700"><Settings size={20} className="text-indigo-500"/> Cấu hình bài dạy</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14}/> Môn học</label>
                  <select className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 cursor-pointer transition-all" value={state.subject} onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                    <option value="">-- Chọn môn --</option>
                    <optgroup label="CƠ BẢN (GDPT 2018)">
                      <option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Lịch sử">Lịch sử</option><option value="Địa lý">Địa lý</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option><option value="GD Kinh tế & Pháp luật">GD Kinh tế & Pháp luật</option>
                    </optgroup>
                    <optgroup label="XU HƯỚNG MỚI">
                      <option value="AI">Trí tuệ nhân tạo (AI)</option><option value="Robotics">Robotics & STEM</option><option value="Đồ họa">Thiết kế Đồ họa</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Khối lớp</label>
                  <select className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 cursor-pointer transition-all" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                    <option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option>
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl h-44 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all relative group">
                <FileUp className="text-indigo-400 mb-3 group-hover:-translate-y-1 transition-transform" size={40}/>
                <span className="text-sm font-bold text-indigo-900">{state.file ? state.file.name : "Nạp giáo án Word (.docx)"}</span>
                <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </div>

              <button disabled={!state.file || state.isProcessing} onClick={handleAnalyze} className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-xl font-black shadow-xl shadow-indigo-200 flex justify-center items-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98]">
                {state.isProcessing ? <Cpu className="animate-spin"/> : <Play/>} BẮT ĐẦU TÍCH HỢP
              </button>
            </div>

            {state.generatedContent && (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/><h2 className="font-black text-lg text-slate-800">Kết quả phân tích</h2></div>
                  <button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"><Download size={16}/> TẢI VỀ MÁY</button>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4 flex gap-3 items-start">
                  <Info size={20} className="text-indigo-600 shrink-0 mt-0.5"/>
                  <p className="text-xs text-indigo-900 leading-relaxed font-medium">Hệ thống sẽ tự động <b>"nối"</b> nội dung Năng lực số (NLS) vào sau các mục: Mục tiêu, Thiết bị và các Hoạt động dạy học trong file Word của thầy.</p>
                </div>

                <div className="bg-slate-50 p-1 rounded-xl max-h-80 overflow-y-auto border border-slate-200 custom-scrollbar">
                  {state.generatedContent.activities_integration.map((act, i) => (
                    <div key={i} className="mb-3 pl-4 border-l-4 border-indigo-500 bg-white p-4 rounded-r-xl shadow-sm">
                      <span className="font-black text-[10px] uppercase text-slate-400 block mb-1 tracking-wider">Vị trí chèn: {act.anchor_text}</span>
                      <p className="font-medium text-slate-700 text-sm leading-relaxed">👉 {act.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Logs & Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]"><GraduationCap size={14}/> Tác giả</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">MH</div>
                <div><p className="font-bold text-slate-800 text-base">Đặng Mạnh Hùng</p><p className="text-[11px] text-slate-500 font-bold uppercase">THPT Lý Nhân Tông</p></div>
              </div>
            </div>
            <div className="bg-[#0f172a] p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col text-xs font-mono text-indigo-300 border border-slate-800">
              <div className="border-b border-slate-700 pb-4 mb-4 font-bold text-slate-500 uppercase flex gap-2 items-center tracking-widest"><Cpu size={14} className="text-emerald-400 animate-pulse"/> System Logs</div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {state.logs.map((l, i) => (
                  <div key={i} className="flex gap-2 leading-relaxed border-l-2 border-slate-700 pl-3">
                    <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit'})}]</span>
                    <span className={l.includes("🔴") ? "text-rose-400" : "text-slate-300"}>{l.replace("👉", "")}</span>
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