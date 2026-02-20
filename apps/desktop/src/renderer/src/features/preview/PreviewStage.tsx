import React, { useState } from "react";
import { Pencil, Trash2, Maximize, Zap } from "lucide-react";

export default function PreviewStage() {
  const [proxyMode, setProxyMode] = useState(true);
  const [annotating, setAnnotating] = useState(false);

  return (
    <div className="h-full flex flex-col bg-[#050506]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1e] bg-[#0d0d0f]">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Preview
          </span>
          {proxyMode && (
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
              <Zap size={10} /> Proxy Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded-lg border border-white/5 transition-all ${
              annotating ? "bg-blue-600/20 text-white" : "bg-zinc-900/40 text-zinc-400 hover:text-white"
            }`}
            onClick={() => setAnnotating((v) => !v)}
            title="Annotate (UI-only)"
          >
            <Pencil size={14} />
          </button>
          <button
            className="p-2 rounded-lg border border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white transition-all"
            onClick={() => setProxyMode((v) => !v)}
            title="Toggle Proxy"
          >
            <Zap size={14} />
          </button>
          <button
            className="p-2 rounded-lg border border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white transition-all"
            onClick={() => {}}
            title="Clear (UI-only)"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="p-2 rounded-lg border border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white transition-all"
            onClick={() => {}}
            title="Fullscreen (UI-only)"
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[80%] max-w-[980px] aspect-video rounded-2xl border border-[#1a1a1e] bg-[#0b0b0c] flex items-center justify-center text-zinc-700">
          <div className="text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-600">
              No Media Loaded
            </div>
            <div className="mt-2 text-[11px] text-zinc-700">
              UI-only Stage. Engine kommt gleich.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
