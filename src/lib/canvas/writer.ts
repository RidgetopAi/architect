import {
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export interface ElementSkeleton {
  type: "rectangle" | "ellipse" | "diamond" | "text" | "arrow" | "line";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  label?: { text: string };
  start?: { id: string };
  end?: { id: string };
  strokeColor?: string;
  backgroundColor?: string;
  groupIds?: string[];
}

export const AI_GROUP_PREFIX = "ai-";
const AI_STROKE_COLOR = "#e67e22";
const AI_ANNOTATION_COLOR = "#27ae60";

function generateAiGroupId(): string {
  return `${AI_GROUP_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeSkeleton(skel: ElementSkeleton, strokeColor: string, groupId: string) {
  const base = {
    ...skel,
    strokeColor: skel.strokeColor ?? strokeColor,
    groupIds: [groupId, ...(skel.groupIds ?? [])],
    x: skel.x ?? 0,
    y: skel.y ?? 0,
  };

  if (skel.type === "text") {
    // Text elements need top-level `text`, not `label`
    const text = skel.text ?? skel.label?.text ?? "Text";
    return { ...base, type: "text" as const, text, width: undefined, height: undefined };
  }

  if (skel.type === "arrow" || skel.type === "line") {
    // Linear elements: pass start/end if present, label for arrows
    return {
      ...base,
      type: skel.type,
      start: skel.start,
      end: skel.end,
      label: skel.label,
    };
  }

  // Shapes (rectangle, ellipse, diamond): label stays as-is
  return {
    ...base,
    type: skel.type,
    width: skel.width ?? 200,
    height: skel.height ?? 80,
    label: skel.label,
  };
}

export function writeToCanvas(
  api: ExcalidrawImperativeAPI,
  skeletons: ElementSkeleton[],
  mode: "correction" | "annotation" = "correction"
) {
  const groupId = generateAiGroupId();
  const strokeColor =
    mode === "correction" ? AI_STROKE_COLOR : AI_ANNOTATION_COLOR;

  const prepared = skeletons
    .filter((s) => s && s.type)
    .map((skel) => sanitizeSkeleton(skel, strokeColor, groupId));

  const excalidrawElements = convertToExcalidrawElements(
    prepared as Parameters<typeof convertToExcalidrawElements>[0]
  );

  const existing = api.getSceneElements();
  api.updateScene({
    elements: [...existing, ...excalidrawElements],
  });

  return { groupId, elementCount: excalidrawElements.length };
}

export function clearAiElements(api: ExcalidrawImperativeAPI) {
  const elements = api.getSceneElements();
  const filtered = elements.filter(
    (el) => !el.groupIds?.some((g) => g.startsWith(AI_GROUP_PREFIX))
  );
  api.updateScene({ elements: filtered });
}

export function clearAiGroup(api: ExcalidrawImperativeAPI, groupId: string) {
  const elements = api.getSceneElements();
  const filtered = elements.filter(
    (el) => !el.groupIds?.includes(groupId)
  );
  api.updateScene({ elements: filtered });
}
