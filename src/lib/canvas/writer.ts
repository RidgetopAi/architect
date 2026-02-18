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
  label?: { text: string };
  start?: { id: string };
  end?: { id: string };
  strokeColor?: string;
  backgroundColor?: string;
  groupIds?: string[];
}

const AI_GROUP_PREFIX = "ai-";
const AI_STROKE_COLOR = "#e67e22"; // orange for AI corrections
const AI_ANNOTATION_COLOR = "#27ae60"; // green for AI annotations

function generateAiGroupId(): string {
  return `${AI_GROUP_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function writeToCanvas(
  api: ExcalidrawImperativeAPI,
  skeletons: ElementSkeleton[],
  mode: "correction" | "annotation" = "correction"
) {
  const groupId = generateAiGroupId();
  const strokeColor =
    mode === "correction" ? AI_STROKE_COLOR : AI_ANNOTATION_COLOR;

  const prepared = skeletons.map((skel) => ({
    ...skel,
    strokeColor: skel.strokeColor ?? strokeColor,
    groupIds: [groupId, ...(skel.groupIds ?? [])],
  }));

  const excalidrawElements = convertToExcalidrawElements(prepared as Parameters<typeof convertToExcalidrawElements>[0]);

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
