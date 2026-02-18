import { useState, useCallback, useRef, useEffect } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Canvas } from "./components/Canvas";
import { ConversationPanel } from "./components/ConversationPanel";
import { Header } from "./components/Header";
import { serializeCanvas, writeToCanvas, clearAiElements } from "./lib/canvas";

const AI_GROUP_PREFIX = "ai-";

const CANVAS_DIR = "canvases";
const DEFAULT_CANVAS = "default.excalidraw.json";

export default function App() {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleApiReady = useCallback((excalidrawApi: ExcalidrawImperativeAPI) => {
    apiRef.current = excalidrawApi;
    setApi(excalidrawApi);
    loadCanvas(excalidrawApi);

    // Expose dev tools on window for round-trip testing
    if (import.meta.env.DEV) {
      (window as Record<string, unknown>).__architect = {
        api: excalidrawApi,
        serialize: () => serializeCanvas(excalidrawApi.getSceneElements()),
        write: (skeletons: Parameters<typeof writeToCanvas>[1], mode?: "correction" | "annotation") =>
          writeToCanvas(excalidrawApi, skeletons, mode),
        clearAi: () => clearAiElements(excalidrawApi),
      };
    }
  }, []);

  async function loadCanvas(api: ExcalidrawImperativeAPI) {
    try {
      const res = await fetch(`/${CANVAS_DIR}/${DEFAULT_CANVAS}`);
      if (res.ok) {
        const data = await res.json();
        if (data.elements) {
          api.updateScene({ elements: data.elements });
        }
      }
    } catch {
      // No saved canvas yet — start fresh
    }
  }

  const saveCanvas = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;

    setIsSaving(true);
    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const data = {
        type: "excalidraw",
        version: 2,
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
      };
      await fetch(`/api/canvas/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: DEFAULT_CANVAS, data }),
      });
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Auto-save with debounce
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveCanvas, 2000);
  }, [saveCanvas]);

  // Ctrl+S handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveCanvas();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveCanvas]);

  // Listen for canvas changes to trigger auto-save
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    const unsubscribe = api.onChange?.(scheduleSave);
    return () => {
      unsubscribe?.();
    };
  }, [scheduleSave]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <Header
        isSaving={isSaving}
        onSave={saveCanvas}
        onClearAi={() => api && clearAiElements(api)}
        hasAiElements={
          api?.getSceneElements().some((el) =>
            el.groupIds?.some((g) => g.startsWith(AI_GROUP_PREFIX))
          ) ?? false
        }
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1">
          <Canvas onApiReady={handleApiReady} />
        </main>
        <aside className="w-80 border-l">
          <ConversationPanel api={api} />
        </aside>
      </div>
    </div>
  );
}
