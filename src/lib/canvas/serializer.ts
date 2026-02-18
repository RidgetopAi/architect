import type { ExcalidrawElement } from "@excalidraw/excalidraw/types";

export interface SemanticNode {
  id: string;
  type: "shape" | "text" | "arrow" | "line" | "image" | "frame";
  shape?: string;
  label?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  groupId?: string;
  containerId?: string;
  isAiGenerated: boolean;
}

export interface SemanticConnection {
  id: string;
  fromId: string | null;
  toId: string | null;
  label?: string;
  isAiGenerated: boolean;
}

export interface CanvasSemantics {
  nodes: SemanticNode[];
  connections: SemanticConnection[];
  summary: string;
}

const SHAPE_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "freedraw",
]);

const CONNECTOR_TYPES = new Set(["arrow", "line"]);

function isAiElement(el: ExcalidrawElement): boolean {
  return el.groupIds?.some((g) => g.startsWith("ai-")) ?? false;
}

function getTextForContainer(
  containerId: string,
  elements: readonly ExcalidrawElement[]
): string | undefined {
  const textEl = elements.find(
    (el) =>
      el.type === "text" &&
      (el as ExcalidrawElement & { containerId?: string }).containerId ===
        containerId
  );
  return textEl
    ? (textEl as ExcalidrawElement & { text?: string }).text
    : undefined;
}

export function serializeCanvas(
  elements: readonly ExcalidrawElement[]
): CanvasSemantics {
  const visible = elements.filter((el) => !el.isDeleted);
  const nodes: SemanticNode[] = [];
  const connections: SemanticConnection[] = [];

  for (const el of visible) {
    if (CONNECTOR_TYPES.has(el.type)) {
      const binding = el as ExcalidrawElement & {
        startBinding?: { elementId: string } | null;
        endBinding?: { elementId: string } | null;
      };
      connections.push({
        id: el.id,
        fromId: binding.startBinding?.elementId ?? null,
        toId: binding.endBinding?.elementId ?? null,
        label: getTextForContainer(el.id, visible),
        isAiGenerated: isAiElement(el),
      });
    } else if (el.type === "text") {
      const textEl = el as ExcalidrawElement & {
        containerId?: string;
        text?: string;
      };
      if (textEl.containerId) continue; // bound text handled by its container
      nodes.push({
        id: el.id,
        type: "text",
        label: textEl.text,
        position: { x: el.x, y: el.y },
        size: { width: el.width, height: el.height },
        isAiGenerated: isAiElement(el),
      });
    } else if (el.type === "frame") {
      nodes.push({
        id: el.id,
        type: "frame",
        label: (el as ExcalidrawElement & { name?: string }).name ?? undefined,
        position: { x: el.x, y: el.y },
        size: { width: el.width, height: el.height },
        isAiGenerated: isAiElement(el),
      });
    } else if (el.type === "image") {
      nodes.push({
        id: el.id,
        type: "image",
        position: { x: el.x, y: el.y },
        size: { width: el.width, height: el.height },
        isAiGenerated: isAiElement(el),
      });
    } else {
      nodes.push({
        id: el.id,
        type: "shape",
        shape: el.type,
        label: getTextForContainer(el.id, visible),
        position: { x: el.x, y: el.y },
        size: { width: el.width, height: el.height },
        groupId: el.groupIds?.[0],
        isAiGenerated: isAiElement(el),
      });
    }
  }

  const shapeCount = nodes.filter((n) => n.type === "shape").length;
  const textCount = nodes.filter((n) => n.type === "text").length;
  const connCount = connections.length;
  const summary = `Canvas contains ${nodes.length} elements (${shapeCount} shapes, ${textCount} text labels, ${connCount} connections)`;

  return { nodes, connections, summary };
}
