import { useState, useCallback, useRef, useEffect } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Canvas } from "./components/Canvas";
import { ConversationPanel } from "./components/ConversationPanel";
import { Header } from "./components/Header";
import { clearAiElements, AI_GROUP_PREFIX, showTemplate, hideTemplate, hasTemplate, isTemplateElement } from "./lib/canvas";

const CANVAS_DIR = "canvases";
const DEFAULT_CANVAS = "default.excalidraw.json";

export default function App() {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [desktopTemplate, setDesktopTemplate] = useState(false);
  const [mobileTemplate, setMobileTemplate] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleApiReady = useCallback((excalidrawApi: ExcalidrawImperativeAPI) => {
    apiRef.current = excalidrawApi;
    setApi(excalidrawApi);
    loadCanvas(excalidrawApi);
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

  const saveCanvas = useCallback(async (): Promise<boolean> => {
    const api = apiRef.current;
    if (!api) return false;

    setIsSaving(true);
    try {
      const elements = api.getSceneElements().filter(
        (el) => !isTemplateElement(el.groupIds)
      );
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
      const res = await fetch(`/api/canvas/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: DEFAULT_CANVAS, data }),
      });
      if (!res.ok) {
        console.error("Save failed:", res.status, await res.text());
        return false;
      }
      return true;
    } catch (e) {
      console.error("Save failed:", e);
      return false;
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

  const toggleTemplate = useCallback((name: "desktop" | "mobile") => {
    const api = apiRef.current;
    if (!api) return;
    if (hasTemplate(api, name)) {
      hideTemplate(api, name);
      (name === "desktop" ? setDesktopTemplate : setMobileTemplate)(false);
    } else {
      showTemplate(api, name);
      (name === "desktop" ? setDesktopTemplate : setMobileTemplate)(true);
    }
  }, []);

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
        desktopTemplate={desktopTemplate}
        mobileTemplate={mobileTemplate}
        onToggleDesktopTemplate={() => toggleTemplate("desktop")}
        onToggleMobileTemplate={() => toggleTemplate("mobile")}
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
