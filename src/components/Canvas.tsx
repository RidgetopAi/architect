import { useState, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

interface CanvasProps {
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
}

export function Canvas({ onApiReady }: CanvasProps) {
  const [, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      setApi(api);
      onApiReady?.(api);
    },
    [onApiReady]
  );

  return (
    <div className="h-full w-full">
      <Excalidraw excalidrawAPI={handleApi} />
    </div>
  );
}
