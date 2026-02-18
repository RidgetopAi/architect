import type { ElementSkeleton } from "../canvas/writer";

export interface CorrectionInstruction {
  action: "add" | "remove" | "modify";
  elements?: ElementSkeleton[];
  removeGroupId?: string;
  explanation: string;
}

export interface ModelResponse {
  corrections: CorrectionInstruction[];
  message: string;
}

export interface ModelRequest {
  canvasDescription: string;
  userPrompt: string;
  model?: string;
}

const SYSTEM_PROMPT = `You are an AI assistant that helps users improve their diagrams on an Excalidraw canvas. 
You receive a description of what's on the canvas and a user request.
You respond with structured corrections as JSON.

Your response must be valid JSON with this shape:
{
  "corrections": [
    {
      "action": "add",
      "elements": [
        {
          "type": "rectangle" | "ellipse" | "diamond" | "text" | "arrow" | "line",
          "x": number,
          "y": number,
          "width": number (for shapes),
          "height": number (for shapes),
          "label": { "text": "string" } (optional, for shapes),
          "start": { "id": "element-id" } (for arrows),
          "end": { "id": "element-id" } (for arrows)
        }
      ],
      "explanation": "Why this was added"
    }
  ],
  "message": "Summary of changes made"
}

Available actions:
- "add": Add new elements to the canvas
- "remove": Remove a group of AI elements by removeGroupId
- "modify": Currently not supported, suggest adding replacement elements

Keep coordinates reasonable (0-2000 range). Standard element sizes: rectangles ~200x80, text ~100x30.
Place new elements near existing ones but avoid overlapping.`;

export async function sendToModel(request: ModelRequest): Promise<ModelResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "No API key configured. Set VITE_OPENAI_API_KEY in your .env file."
    );
  }

  const model = request.model ?? "gpt-4o";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `## Current Canvas State\n${request.canvasDescription}\n\n## User Request\n${request.userPrompt}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Model API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from model");
  }

  return JSON.parse(content) as ModelResponse;
}

function getApiKey(): string | null {
  return import.meta.env.VITE_OPENAI_API_KEY ?? null;
}
