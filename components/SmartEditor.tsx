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
  // LỆNH QUAN TRỌNG: Tự động điền dữ liệu từ AI vào ô soạn thảo
  const [content, setContent] = useState<GeneratedNLSContent>(initialContent);
  const [activeTab, setActiveTab] = useState<Tab>('objectives');

  // Tự động cập nhật nội dung khi AI vừa tính toán xong
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

  const removeActivity = (index: number) => {
    const newActivities = content.activities_integration.filter((_, i) => i !== index);
    updateField('activities_integration', newActivities);
  };

  const addActivity = () => {
    const newActivities = [
      ...content.activities_integration, 
      { anchor_text: "Chọn một câu mốc...", content: "➤ Nội dung AI tự soạn..." }
    ];
    updateField('activities_integration', newActivities);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] animate-fade-in-up">
      
      {/* Header với nút Xác nhận rõ ràng */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
                <PenTool className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
                <h3 className="font-bold text-xl text-slate-800">Smart Studio</h3>
                <p className="text-xs text-slate-500">Dữ liệu đã được AI tự động điền bên dưới</p>
            </div>
        </div>
        <div className="flex gap-4">
             <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-rose-500 font-bold">
                Hủy bỏ
             </button>
             <button 
                onClick={() => onConfirm(content)}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
             >
                <Save className="w-4 h-4" /> Xác nhận tích hợp
             </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar điều hướng */}
        <div className="w-72 bg-slate-50/50 border-r border-slate-100 p-5 flex flex-col gap-2 shrink-0">
            {[
                { id: 'objectives', label: '1. Mục tiêu NLS', icon: '🎯' },
                { id: 'materials', label: '2. Học liệu số', icon: '💻' },
                { id: 'activities', label: '3. Hoạt động lẻ', icon: '⚡', badge: content.activities_integration?.length || 0 },
                { id: 'appendix', label: '4. Phụ lục cuối', icon: '📊' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between ${
                        activeTab === tab.id 
                        ? 'bg-white shadow-xl text-indigo-600 font-bold ring-1 ring-black/5' 
                        : 'text-slate-500 hover:bg-white/60'
                    }`}
                >
                    <span className="flex items-center gap-3">
                        <span className="text-xl">{tab.icon}</span> 
                        <span className="text-sm">{tab.label}</span>
                    </span>
                    {tab.badge !== undefined && (
                        <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-black">{tab.badge}</span>
                    )}
                </button>
            ))}
        </div>

        {/* Editor Area - Nơi nội dung tự động xuất hiện */}
        <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
            {activeTab === 'objectives' && (
                <div className="space-y-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mục tiêu AI đề xuất:</label>
                    <textarea 
                        value={content.objectives_addition}
                        onChange={(e) => updateField('objectives_addition', e.target.value)}
                        className="w-full h-80 p-6 rounded-2xl border border-slate-200 focus:border-indigo-500 text-sm leading-relaxed text-slate-700 bg-slate-50/30"
                    />
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="space-y-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Học liệu AI đề xuất:</label>
                    <textarea 
                        value={content.materials_addition}
                        onChange={(e) => updateField('materials_addition', e.target.value)}
                        className="w-full h-40 p-6 rounded-2xl border border-slate-200 focus:border-indigo-500 text-sm text-slate-700 bg-slate-50/30"
                    />
                </div>
            )}

            {activeTab === 'activities' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs text-amber-600 font-medium italic">AI đã tự động tìm các vị trí chèn phù hợp bên dưới:</p>
                        <button onClick={addActivity} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Thêm mới</button>
                    </div>
                    {content.activities_integration.map((activity, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative space-y-4">
                            <button onClick={() => removeActivity(index)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"><Trash2 className="w-5 h-5" /></button>
                            <input 
                                value={activity.anchor_text}
                                onChange={(e) => updateActivity(index, 'anchor_text', e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-100 text-sm bg-slate-50 font-bold text-indigo-600"
                                placeholder="Câu mốc trong file gốc..."
                            />
                            <textarea 
                                value={activity.content}
                                onChange={(e) => updateActivity(index, 'content', e.target.value)}
                                className="w-full p-4 rounded-xl border border-indigo-50 text-sm font-medium bg-indigo-50/20 h-28"
                                placeholder="Nội dung tích hợp..."
                            />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'appendix' && (
                <div className="space-y-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ma trận NLS tự động:</label>
                    <textarea 
                        value={content.appendix_table}
                        onChange={(e) => updateField('appendix_table', e.target.value)}
                        className="w-full h-96 p-6 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 bg-slate-50/30"
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SmartEditor;