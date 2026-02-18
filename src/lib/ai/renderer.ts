import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelResponse } from "./connector";
import { writeToCanvas, clearAiGroup } from "../canvas/writer";

export interface RenderResult {
  groupIds: string[];
  totalElements: number;
  message: string;
}

export function applyCorrections(
  api: ExcalidrawImperativeAPI,
  response: ModelResponse
): RenderResult {
  const groupIds: string[] = [];
  let totalElements = 0;

  for (const correction of response.corrections) {
    switch (correction.action) {
      case "add": {
        if (correction.elements && correction.elements.length > 0) {
          const result = writeToCanvas(api, correction.elements, "correction");
          groupIds.push(result.groupId);
          totalElements += result.elementCount;
        }
        break;
      }
      case "remove": {
        if (correction.removeGroupId) {
          clearAiGroup(api, correction.removeGroupId);
        }
        break;
      }
      case "modify": {
        // Remove old + add new
        if (correction.removeGroupId) {
          clearAiGroup(api, correction.removeGroupId);
        }
        if (correction.elements && correction.elements.length > 0) {
          const result = writeToCanvas(api, correction.elements, "correction");
          groupIds.push(result.groupId);
          totalElements += result.elementCount;
        }
        break;
      }
    }
  }

  return {
    groupIds,
    totalElements,
    message: response.message,
  };
}
