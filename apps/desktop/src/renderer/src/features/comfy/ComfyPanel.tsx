
import React, { useMemo, useState } from "react";
import { Cpu, FileJson, Upload, Trash2, SlidersHorizontal } from "lucide-react";

type Workflow = {
  id: string;
  name: string;
  parameters: {
    prompt: string;
    width: number;
    height: number;
    fps: number;
    steps: number;
  };
};

const DUMMY_WORKFLOWS: Workflow[] = [
  {
    id: "w1",
    name: "Text-to-Video",
    parameters: { prompt: "cinematic street scene, rain, neon", width: 1280, height: 720, fps: 24, steps: 20 },
  },
  {
    id: "w2",
    name: "Inpaint Face",
    parameters: { prompt: "fix face, realistic skin", width: 1024, height: 576, fps: 0, steps: 15 },
  },
];

export default function ComfyPanel() {
  const [workflows, setWorkflows] = useState<Workflow[]>(DUMMY_WORKFLOWS);
  const [selectedId, setSelectedId] = useState<string>(DUMMY_WORKFLOWS[0]?.id ?? "");

  const selected = useMemo(
    () => workflows.find((w) => w.id === selectedId) ?? null,
    [workflows, selectedId]
  );

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] border-l border-white/5 shadow-2xl overflow-y-auto">
      <div className="p-8 border-b border-white/5 bg-zinc-900/10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
            <Cpu size={14} className="text-blue-500" /> Neural Bridge
          </h2>
          <button
            className="p-2 text-zinc-600 hover:text-white transition-all bg-zinc-900 rounded-xl border border-white/5"
            title="Upload Workflow (UI-only)"
            onClick={() => {}}
          >
            <Upload size={14} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-900/40 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              Server API (offline)
            </span>
          </div>
          <div className="flex-1 bg-zinc-900/40 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
            <span className="text-[7px] font-black text-zinc-600 uppercase">
              GPU Load
            </span>
            <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[6%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        <section className="space-y-5">
          <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block opacity-50">
            Local Workflows
          </label>

          <div className="grid grid-cols-1 gap-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => setSelectedId(wf.id)}
                className={`flex items-center gap-5 p-4 rounded-2xl border text-left transition-all cursor-pointer group ${
                  selectedId === wf.id
                    ? "bg-blue-600/10 border-blue-500/40 text-white shadow-lg"
                    : "bg-[#121214] border-white/5 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                <div
                  className={`p-3 rounded-xl transition-all ${
                    selectedId === wf.id
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 group-hover:text-white"
                  }`}
                >
                  <FileJson size={16} />
                </div>
                <div className="flex-1 truncate">
                  <div className="text-[10px] font-black uppercase tracking-tight truncate">
                    {wf.name}
                  </div>
                  <div className="text-[8px] opacity-40 font-medium">
                    {Object.keys(wf.parameters).length} Params
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkflows((prev) => prev.filter((x) => x.id !== wf.id));
                    if (selectedId === wf.id) setSelectedId(prev[0]?.id ?? "");
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"
                  title="Remove (UI-only)"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {selected && (
          <section className="space-y-6">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-blue-500" /> Config
            </label>

            <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 space-y-6 shadow-inner">
              <div className="space-y-2">
                <label className="text-[8px] text-zinc-600 uppercase font-black">
                  Prompt
                </label>
                <textarea
                  value={selected.parameters.prompt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setWorkflows((prev) =>
                      prev.map((wf) =>
                        wf.id === selected.id
                          ? { ...wf, parameters: { ...wf.parameters, prompt: v } }
                          : wf
                      )
                    );
                  }}
                  className="w-full h-24 bg-zinc-950 border border-white/5 rounded-xl p-3 text-[11px] text-zinc-200 focus:outline-none focus:border-blue-500 transition-all resize-none font-sans"
                  placeholder="Describe scene..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ParamInput
                  label="Width"
                  value={selected.parameters.width}
                  onChange={(v) => patch(selected.id, { width: v })}
                />
                <ParamInput
                  label="Height"
                  value={selected.parameters.height}
                  onChange={(v) => patch(selected.id, { height: v })}
                />
                <ParamInput
                  label="FPS"
                  value={selected.parameters.fps}
                  onChange={(v) => patch(selected.id, { fps: v })}
                />
                <ParamInput
                  label="Steps"
                  value={selected.parameters.steps}
                  onChange={(v) => patch(selected.id, { steps: v })}
                />
              </div>

              <button
                className="w-full py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-[0.99]"
                onClick={() => {}}
              >
                Queue (UI-only)
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );

  function patch(id: string, partial: Partial<Workflow["parameters"]>) {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id ? { ...wf, parameters: { ...wf.parameters, ...partial } } : wf
      )
    );
  }
}

function ParamInput(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const { label, value, onChange } = props;
  return (
    <div className="space-y-2">
      <label className="text-[8px] text-zinc-600 uppercase font-black">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-zinc-200 focus:outline-none focus:border-blue-500 transition-all font-mono"
      />
    </div>
  );
}
