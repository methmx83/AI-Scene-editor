import React, { useEffect, useState } from "react";
import {
  Layout,
  FlaskConical,
  Settings,
  Terminal,
  Cpu,
  Database,
  Zap,
  Undo2,
  Redo2,
  Mic,
} from "lucide-react";

import AssetLibraryView from "../../features/assets/AssetLibraryView";
import PreviewStage from "../../features/preview/PreviewStage";
import ComfyPanel from "../../features/comfy/ComfyPanel";
import TimelineDock from "../../features/timeline/TimelineDock";

// Placeholder Views
function SettingsView() {
  return (
    <div className="h-full p-6 text-zinc-300">
      <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
        Settings
      </h2>
      <p className="mt-2 text-xs text-zinc-500">
        Kommt später. Lokal. Ohne API-Key-Zirkus.
      </p>
    </div>
  );
}

function LabView() {
  return (
    <div className="h-full p-6 text-zinc-300">
      <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
        Lab
      </h2>
      <p className="mt-2 text-xs text-zinc-500">
        Später: ComfyUI Tools/Debug/Workflow-Inspector.
      </p>
    </div>
  );
}

function VoiceView() {
  return (
    <div className="h-full p-6 text-zinc-300">
      <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
        Voice (Local)
      </h2>
      <p className="mt-2 text-xs text-zinc-500">
        Später: lokale TTS/SVC (Ollama oder eigene Pipeline). Kein Cloud-Kram.
      </p>
    </div>
  );
}

type ActiveView = "studio" | "voice" | "lab" | "settings";

export default function AppShell() {
  const [activeView, setActiveView] = useState<ActiveView>("studio");

  // UI-only Undo/Redo (nur fürs Feeling, echte Commands kommen später)
  const [pastCount, setPastCount] = useState(0);
  const [futureCount, setFutureCount] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          // redo
          if (futureCount > 0) {
            setPastCount((p) => p + 1);
            setFutureCount((f) => Math.max(0, f - 1));
          }
        } else {
          // undo
          if (pastCount > 0) {
            setPastCount((p) => Math.max(0, p - 1));
            setFutureCount((f) => f + 1);
          }
        }
      } else if (e.key.toLowerCase() === "y") {
        // redo
        if (futureCount > 0) {
          setPastCount((p) => p + 1);
          setFutureCount((f) => Math.max(0, f - 1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pastCount, futureCount]);

  // Dummy project/system status (kommt später aus echtem Store)
  const projectName = "AI-Scene-editor";
  const comfyOnline = false;

  return (
    <div className="flex flex-col h-screen bg-[#050506] text-zinc-100 select-none font-sans overflow-hidden">
      <header className="h-14 border-b border-[#1a1a1e] bg-[#0d0d0f] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-500/20">
              S
            </div>
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                SceneEditor <span className="text-blue-500">Local</span>
              </h1>
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                <Database size={8} /> {projectName}
              </span>
            </div>
          </div>

          <div className="flex items-center bg-[#050506] rounded-xl p-1 border border-[#1a1a1e]">
            <NavBtn
              active={activeView === "studio"}
              onClick={() => setActiveView("studio")}
              icon={<Layout size={14} />}
              label="Studio"
            />
            <NavBtn
              active={activeView === "voice"}
              onClick={() => setActiveView("voice")}
              icon={<Mic size={14} />}
              label="Voice"
            />
            <NavBtn
              active={activeView === "lab"}
              onClick={() => setActiveView("lab")}
              icon={<FlaskConical size={14} />}
              label="Lab"
            />
            <NavBtn
              active={activeView === "settings"}
              onClick={() => setActiveView("settings")}
              icon={<Settings size={14} />}
              label="Configs"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-[#1a1a1e] rounded-lg p-1 border border-white/5">
            <button
              onClick={() => {
                if (pastCount > 0) {
                  setPastCount((p) => Math.max(0, p - 1));
                  setFutureCount((f) => f + 1);
                }
              }}
              disabled={pastCount === 0}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={() => {
                if (futureCount > 0) {
                  setPastCount((p) => p + 1);
                  setFutureCount((f) => Math.max(0, f - 1));
                }
              }}
              disabled={futureCount === 0}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-4 bg-[#1a1a1e]/50 px-3 py-1.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  comfyOnline ? "bg-green-500" : "bg-red-500"
                } animate-pulse`}
              />
              <span className="text-[8px] font-black uppercase text-zinc-500">
                Comfy Bridge
              </span>
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div className="flex items-center gap-2 text-blue-500">
              <Cpu size={10} />
              <span className="text-[8px] font-black uppercase">
                Local GPU
              </span>
            </div>
          </div>

          <button className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5">
            Render Scene
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {activeView === "studio" ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex overflow-hidden">
              <AssetLibraryView />
              <div className="flex-1 flex flex-col min-w-0 border-x border-[#1a1a1e]">
                <PreviewStage />
              </div>
              <div className="w-[340px] hidden xl:block shrink-0">
                <ComfyPanel />
              </div>
            </div>
            <TimelineDock />
          </div>
        ) : activeView === "voice" ? (
          <VoiceView />
        ) : activeView === "lab" ? (
          <LabView />
        ) : (
          <SettingsView />
        )}
      </main>

      <footer className="h-6 bg-[#0d0d0f] border-t border-[#1a1a1e] px-4 flex items-center justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-2">
            <Zap size={10} className="text-yellow-500" /> Neural Pipeline: UI
          </span>
          <span className="flex items-center gap-2">
            <Terminal size={10} /> IO Bridge: Pending
          </span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-zinc-500 italic">LOCAL-SHELL</span>
          <div className="w-24 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 w-1/4" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavBtn(props: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const { active, onClick, icon, label } = props;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
        active
          ? "bg-[#1a1a1e] text-white shadow-md"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {icon} {label}
    </button>
  );
}