import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Download, Sparkles, GraduationCap, Cpu, CheckCircle2, 
  BookOpen, Smartphone, Zap, ListChecks, RefreshCw, Layers, Info
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v4.4.0-FUTURE"; 
  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: '' as GradeType, isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  const [activeTab, setActiveTab] = useState<'objectives' | 'materials' | 'activities' | 'matrix'>('activities');
  const [userApiKey, setUserApiKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file || !state.subject || !state.grade) {
      addLog("🔴 Thầy cần chọn Môn, Lớp và File."); return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: ["🚀 Đang khởi động AI chuyên gia..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), userApiKey);
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
      addLog("✨ Tích hợp Năng lực số hoàn tất!");
    } catch { addLog("🔴 Lỗi API."); setState(prev => ({ ...prev, isProcessing: false })); }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center border border-indigo-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200"><Sparkles size={30}/></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">NLS Integrator Future</h1>
            <p className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full inline-block uppercase tracking-widest">{APP_VERSION}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="Nhập Gemini Key..." className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-48 md:w-64 transition-all"/>
          <button onClick={() => {localStorage.setItem('gemini_api_key', userApiKey); addLog("✅ Đã lưu Key.");}} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black transition-all">Lưu</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {state.step === 'upload' && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14} className="text-indigo-500"/> Danh mục Môn học</label>
                  <select className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none" value={state.subject} onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                    <option value="">-- Chọn môn --</option>
                    <optgroup label="CƠ BẢN (GDPT 2018)">
                      <option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Lịch sử">Lịch sử</option><option value="Địa lý">Địa lý</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option><option value="GD Kinh tế & Pháp luật">GD Kinh tế & Pháp luật</option>
                    </optgroup>
                    <optgroup label="XU HƯỚNG TƯƠNG LAI & STEM">
                      <option value="Khoa học máy tính">Khoa học máy tính (AI/Data)</option>
                      <option value="Robotics">Robotics & Tự động hóa</option>
                      <option value="STEM">Hoạt động STEM trải nghiệm</option>
                      <option value="Thiết kế đồ họa">Thiết kế đồ họa & Đa phương tiện</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} className="text-indigo-500"/> Khối lớp</label>
                  <select className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                    <option value="">-- Chọn lớp --</option>
                    <option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option>
                    <option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option>
                  </select>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-indigo-50 bg-indigo-50/10 rounded-[2rem] cursor-pointer hover:bg-indigo-50/30 transition-all group">
                <FileUp size={60} className="text-indigo-400 mb-4 group-hover:-translate-y-2 transition-transform"/>
                <p className="text-lg font-black text-slate-700">{state.file ? state.file.name : "Nạp giáo án của thầy (.docx)"}</p>
                <input type="file" accept=".docx" className="hidden" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
              </label>

              <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                {state.isProcessing ? <RefreshCw className="animate-spin"/> : <Zap/>} TÍCH HỢP NĂNG LỰC SỐ NGAY
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3"><Info size={20} className="text-indigo-400"/><h3 className="font-black uppercase tracking-tight text-sm">Năng lực số (NLS) là gì?</h3></div>
                <button onClick={async () => {
                  const blob = await injectContentIntoDocx(state.file!, state.generatedContent!, 'NLS', addLog);
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `NLS-${state.file!.name}`; a.click();
                }} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg"><Download size={16}/> Tải file Word chuẩn</button>
              </div>
              
              <div className="p-6 bg-indigo-50 text-indigo-900 text-xs font-medium leading-relaxed border-b border-indigo-100">
                🚀 <span className="font-black">NLS</span> là khả năng sử dụng công cụ số (AI, GeoGebra, LMS...) để giải quyết vấn đề. 
                Trong phần xem trước dưới đây, các nội dung có chữ <span className="text-red-600 font-bold">"👉 [TÍCH HỢP NLS]"</span> sẽ được hệ thống "nối" (chèn tự động) vào ngay sau các tiêu đề hoặc đoạn văn tương ứng trong giáo án Word của thầy.
              </div>

              <div className="flex border-b bg-white overflow-x-auto">
                {[{id: 'activities', label: '3. Nối vào Hoạt động', icon: Zap}, {id: 'objectives', label: '1. Nối vào Mục tiêu', icon: BookOpen}, {id: 'materials', label: '2. Nối vào Thiết bị', icon: Smartphone}, {id: 'matrix', label: '4. Thêm Phụ lục', icon: ListChecks}].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 min-w-[150px] py-5 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === t.id ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <t.icon size={14}/> {t.label}
                  </button>
                ))}
              </div>
              
              <div className="p-8 h-[450px] overflow-y-auto bg-white custom-scrollbar">
                {activeTab === 'activities' ? (
                  <div className="space-y-6">
                    {state.generatedContent.activities_integration.map((act, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-3 text-slate-500 font-black text-[10px] uppercase border-b pb-2">📍 Vị trí nối: {act.anchor_text}</div>
                        <p className="text-sm text-indigo-700 font-bold italic leading-relaxed">👉 {act.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-emerald-800 font-bold whitespace-pre-wrap leading-relaxed bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 italic">
                    {activeTab === 'objectives' ? state.generatedContent.objectives_addition : activeTab === 'materials' ? state.generatedContent.materials_addition : state.generatedContent.appendix_table}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2"><GraduationCap size={40} className="text-slate-50 opacity-10"/></div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]">Tác giả phần mềm</h4>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">MH</div>
              <div><p className="font-black text-slate-800 text-lg leading-tight">Đặng Mạnh Hùng</p><p className="text-[11px] text-slate-500 font-bold italic uppercase">Lý Nhân Tông - Bắc Ninh</p></div>
            </div>
          </div>
          
          <div className="bg-[#0f172a] p-6 rounded-3xl shadow-2xl h-[400px] flex flex-col font-mono text-[10px] border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 text-indigo-400 font-bold uppercase tracking-widest"><Cpu size={14} className="animate-pulse"/> System Logs</div>
            <div className="flex-1 overflow-y-auto space-y-2 text-slate-400 custom-scrollbar pr-2">
              {state.logs.map((l, i) => <div key={i} className="leading-relaxed border-l-2 border-slate-700 pl-3">[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit'})}] {l}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;