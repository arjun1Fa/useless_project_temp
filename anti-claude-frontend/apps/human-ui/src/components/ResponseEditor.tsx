import React, { useState, useRef } from 'react';
import { Send, Image, Upload, X, Check, Sparkles, AlertCircle } from 'lucide-react';

interface ResponseEditorProps {
  onSubmit: (text: string, attachmentDataUrl?: string) => void;
  onDraftChange: (text: string, hasAttachment: boolean) => void;
  isSubmitting?: boolean;
}

export const ResponseEditor: React.FC<ResponseEditorProps> = ({
  onSubmit,
  onDraftChange,
  isSubmitting = false,
}) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onDraftChange(val, !!attachment);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setAttachment(result);
        onDraftChange(text, true);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onDraftChange(text, false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;
    onSubmit(text, attachment || undefined);
    setText('');
    setAttachment(null);
    setAttachmentName('');
    onDraftChange('', false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-[#131825] border border-[#1f273d] rounded-2xl shadow-xl flex flex-col space-y-4"
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Wingman Deliverable Editor
        </label>
        <span className="text-[11px] font-mono text-slate-400">
          {text.length} characters (Real-time synced to Anti-Claude)
        </span>
      </div>

      {/* Main Text Area */}
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type your essay paragraphs, pickup line advice, or excuse letter here... (Don't let him get expelled, bro)"
        rows={4}
        disabled={isSubmitting}
        className="w-full p-4 bg-[#0a0d14] border border-[#1f273d] rounded-xl text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none selection:bg-cyan-500 selection:text-black"
      />

      {/* Attachment Preview (if uploaded) */}
      {attachment && (
        <div className="relative p-3 bg-[#0a0d14] border border-cyan-800/60 rounded-xl flex items-center gap-3">
          <img
            src={attachment}
            alt="Upload proof"
            className="w-16 h-16 object-cover rounded-lg border border-slate-800"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">{attachmentName}</div>
            <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Ready for Gemini Multimodal Vision Analysis
            </div>
          </div>
          <button
            type="button"
            onClick={removeAttachment}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-slate-400 hover:text-rose-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar & Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg bg-[#1a2133] hover:bg-[#242d45] border border-[#2b3754] text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <Image className="w-4 h-4 text-cyan-400" />
            Attach Screenshot / Proof
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || (!text.trim() && !attachment)}
          className="px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Transmitting to Anti-Claude...' : 'Send Deliverable to Save Bro'}
        </button>
      </div>
    </form>
  );
};
