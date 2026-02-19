import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const TEMPLATE_GROUP_PREFIX = "tpl-";
const TEMPLATE_STROKE = "#9b59b6";
const TEMPLATE_LABEL_COLOR = "#9b59b6";

type TemplateName = "desktop" | "mobile";

interface TemplateRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

function makeTemplateId(name: TemplateName): string {
  return `${TEMPLATE_GROUP_PREFIX}${name}`;
}

const DESKTOP_RECTS: TemplateRect[] = [
  // Viewport frame — 1440×900
  { x: 0, y: 0, width: 1440, height: 900 },
  // Top nav
  { x: 0, y: 0, width: 1440, height: 60, label: "Nav" },
  // Sidebar
  { x: 0, y: 60, width: 260, height: 780, label: "Sidebar" },
  // Main content
  { x: 260, y: 60, width: 1180, height: 780, label: "Content" },
  // Footer
  { x: 0, y: 840, width: 1440, height: 60, label: "Footer" },
];

const MOBILE_RECTS: TemplateRect[] = [
  // Viewport frame — 390×844 (iPhone 14)
  { x: 1600, y: 0, width: 390, height: 844 },
  // Status bar
  { x: 1600, y: 0, width: 390, height: 44, label: "Status Bar" },
  // Top nav
  { x: 1600, y: 44, width: 390, height: 56, label: "Nav" },
  // Main content
  { x: 1600, y: 100, width: 390, height: 644, label: "Content" },
  // Bottom tab bar
  { x: 1600, y: 744, width: 390, height: 100, label: "Tab Bar" },
];

const TEMPLATES: Record<TemplateName, TemplateRect[]> = {
  desktop: DESKTOP_RECTS,
  mobile: MOBILE_RECTS,
};

function buildSkeletons(rects: TemplateRect[], groupId: string) {
  const elements: Record<string, unknown>[] = [];

  for (const rect of rects) {
    elements.push({
      type: "rectangle" as const,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      strokeColor: TEMPLATE_STROKE,
      strokeStyle: "dashed",
      backgroundColor: "transparent",
      fillStyle: "solid",
      opacity: 40,
      locked: true,
      groupIds: [groupId],
    });

    if (rect.label) {
      elements.push({
        type: "text" as const,
        x: rect.x + 8,
        y: rect.y + 4,
        text: rect.label,
        fontSize: 12,
        fontFamily: 3,
        strokeColor: TEMPLATE_LABEL_COLOR,
        opacity: 50,
        locked: true,
        groupIds: [groupId],
      });
    }
  }

  return elements;
}

export function showTemplate(api: ExcalidrawImperativeAPI, name: TemplateName) {
  const groupId = makeTemplateId(name);

  // Remove existing template elements for this name first
  hideTemplate(api, name);

  const skeletons = buildSkeletons(TEMPLATES[name], groupId);
  const excalidrawElements = convertToExcalidrawElements(
    skeletons as Parameters<typeof convertToExcalidrawElements>[0]
  );

  const existing = api.getSceneElements();
  api.updateScene({ elements: [...existing, ...excalidrawElements] });
}

export function hideTemplate(api: ExcalidrawImperativeAPI, name: TemplateName) {
  const groupId = makeTemplateId(name);
  const elements = api.getSceneElements();
  const filtered = elements.filter(
    (el) => !el.groupIds?.includes(groupId)
  );
  api.updateScene({ elements: filtered });
}

export function hasTemplate(api: ExcalidrawImperativeAPI, name: TemplateName): boolean {
  const groupId = makeTemplateId(name);
  return api.getSceneElements().some((el) => el.groupIds?.includes(groupId));
}

export function isTemplateElement(groupIds: readonly string[] | undefined): boolean {
  return groupIds?.some((g) => g.startsWith(TEMPLATE_GROUP_PREFIX)) ?? false;
}

export { TEMPLATE_GROUP_PREFIX };
export type { TemplateName };
