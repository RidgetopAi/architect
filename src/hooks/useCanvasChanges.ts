import { useEffect, useRef, useCallback } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

type ChangeCallback = () => void;

export function useCanvasChanges(
  api: ExcalidrawImperativeAPI | null,
  callback: ChangeCallback,
  debounceMs = 500
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(callback, debounceMs);
  }, [callback, debounceMs]);

  useEffect(() => {
    if (!api) return;
    const unsubscribe = api.onChange?.(debouncedCallback);
    return () => {
      unsubscribe?.();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [api, debouncedCallback]);
}
