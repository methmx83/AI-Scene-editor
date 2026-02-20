
import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";

type Track = { id: string; name: string; type: "video" | "overlay" | "audio" | "text" };

const TRACKS: Track[] = [
  { id: "t1", name: "Video Track", type: "video" },
  { id: "t2", name: "Overlay", type: "overlay" },
  { id: "t3", name: "Audio", type: "audio" },
];

export default function TimelineDock() {
  const [droppedAssets, setDroppedAssets] = useState<string[]>([]);

  const rows = useMemo(() => TRACKS, []);

  return (
    <div className="h-72 bg-[#0d0d0f] border-t border-[#1a1a1e] flex">
      <div className="w-56 border-r border-[#1a1a1e] p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Tracks
          </div>
          <button
            className="p-1.5 rounded-lg bg-zinc-900/40 border border-white/5 text-zinc-400 hover:text-white transition-all"
            title="Add Track (UI-only)"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {rows.map((t) => (
            <div
              key={t.id}
              className="px-3 py-2 rounded-xl bg-zinc-900/30 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400"
            >
              {t.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-3 overflow-hidden">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Timeline
        </div>

        <div
          className="mt-3 h-[220px] rounded-2xl border border-[#1a1a1e] bg-[#050506] relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const payload = e.dataTransfer.getData("application/x-asset");
            if (!payload) return;
            try {
              const { assetId } = JSON.parse(payload) as { assetId: string };
              setDroppedAssets((prev) => [assetId, ...prev].slice(0, 10));
            } catch {}
          }}
        >
          {/* fake grid */}
          <div className="absolute inset-0 opacity-40">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-zinc-800"
                style={{ left: `${(i / 24) * 100}%` }}
              />
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-600">
                Drop Assets Here
              </div>
              <div className="mt-2 text-[11px] text-zinc-700">
                (UI-only) Dropped: {droppedAssets.length}
              </div>

              {droppedAssets.length > 0 && (
                <div className="mt-3 text-[10px] text-zinc-600 font-mono max-w-[520px] mx-auto truncate">
                  {droppedAssets.join(" · ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
