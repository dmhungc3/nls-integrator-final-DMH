import React, { useState, useEffect } from 'react';
import { GeneratedNLSContent, ActivityItem } from '../types';
import { Save, PenTool, CheckCircle, Trash2, Plus, ChevronRight } from 'lucide-react';

interface SmartEditorProps {
  initialContent: GeneratedNLSContent;
  onConfirm: (finalContent: GeneratedNLSContent) => void;
  onCancel: () => void;
}

type Tab = 'objectives' | 'materials' | 'activities' | 'appendix';

const SmartEditor: React.FC<SmartEditorProps> = ({ initialContent, onConfirm, onCancel }) => {
  // QUAN TRỌNG: Khởi tạo state từ initialContent của AI
  const [content, setContent] = useState<GeneratedNLSContent>(initialContent);
  const [activeTab, setActiveTab] = useState<Tab>('objectives');

  // Lệnh tự động điền dữ liệu khi AI vừa tính toán xong
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const updateField = (field: keyof GeneratedNLSContent, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const updateActivity = (index: number, field: keyof ActivityItem, value: string) => {
    const newActivities = [...content.activities_integration];
    newActivities[index] = { ...newActivities[index], [field]: value };
    updateField('activities_integration', newActivities);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] animate-fade-in-up">
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl"><PenTool className="w-6 h-6 text-indigo-600" /></div>
            <div>
                <h3 className="font-bold text-xl text-slate-800">Smart Studio</h3>
                <p className="text-xs text-slate-500">Dữ liệu đã được AI tự động điền bên dưới</p>
            </div>
        </div>
        <div className="flex gap-4">
             <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 font-bold hover:text-rose-500 transition-colors">Hủy bỏ</button>
             <button onClick={() => onConfirm(content)} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                <Save className="w-4 h-4" /> Xác nhận tích hợp
             </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 bg-slate-50/50 border-r border-slate-100 p-5 flex flex-col gap-2 shrink-0">
            {[
                { id: 'objectives', label: '1. Mục tiêu NLS', icon: '🎯' },
                { id: 'materials', label: '2. Học liệu số', icon: '💻' },
                { id: 'activities', label: '3. Hoạt động lẻ', icon: '⚡', badge: content.activities_integration?.length || 0 },
                { id: 'appendix', label: '4. Phụ lục cuối', icon: '📊' },
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between ${activeTab === tab.id ? 'bg-white shadow-xl text-indigo-600 font-bold ring-1 ring-black/5' : 'text-slate-500 hover:bg-white/60'}`}>
                    <span className="flex items-center gap-3"><span className="text-xl">{tab.icon}</span> <span className="text-sm">{tab.label}</span></span>
                    {tab.badge !== undefined && <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-black">{tab.badge}</span>}
                </button>
            ))}
        </div>

        <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
            {activeTab === 'objectives' && (
                <div className="space-y-4 animate-fade-in">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Nội dung AI đề xuất (Chèn vào phần I. Mục tiêu):</label>
                    <textarea value={content.objectives_addition} onChange={(e) => updateField('objectives_addition', e.target.value)} className="w-full h-80 p-6 rounded-2xl border border-slate-200 focus:border-indigo-500 text-sm leading-relaxed text-slate-700 bg-slate-50/30 outline-none transition-all" />
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="space-y-4 animate-fade-in">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Nội dung AI đề xuất (Chèn vào phần II. Học liệu):</label>
                    <textarea value={content.materials_addition} onChange={(e) => updateField('materials_addition', e.target.value)} className="w-full h-40 p-6 rounded-2xl border border-slate-200 focus:border-indigo-500 text-sm text-slate-700 bg-slate-50/30 outline-none transition-all" />
                </div>
            )}

            {activeTab === 'activities' && (
                <div className="space-y-4 animate-fade-in">
                    {content.activities_integration.map((activity, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                            <input value={activity.anchor_text} onChange={(e) => updateActivity(index, 'anchor_text', e.target.value)} className="w-full p-3 rounded-xl border border-slate-100 text-sm bg-slate-50 font-bold text-indigo-600" placeholder="Câu mốc trong file gốc..." />
                            <textarea value={activity.content} onChange={(e) => updateActivity(index, 'content', e.target.value)} className="w-full p-4 rounded-xl border border-indigo-50 text-sm font-medium bg-indigo-50/20 h-28 outline-none" placeholder="Nội dung tích hợp..." />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SmartEditor;