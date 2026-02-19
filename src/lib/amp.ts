import type { ElementSkeleton } from "./canvas/writer";

interface CorrectionInstruction {
  action: "add" | "remove";
  elements?: ElementSkeleton[];
  removeGroupId?: string;
  explanation: string;
}

export interface AmpResponse {
  corrections: CorrectionInstruction[];
  message: string;
}

export async function sendToAmp(
  prompt: string,
  canvasJson: string
): Promise<AmpResponse> {
  const res = await fetch("/api/amp/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, canvasJson }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `amp error (${res.status})`);
  }

  return res.json();
}
