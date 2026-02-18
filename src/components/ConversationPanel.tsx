import { useState, useRef } from "react";
import { Send, Loader2, Trash2 } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { clearAiElements, writeToCanvas, clearAiGroup } from "@/lib/canvas";
import { sendToAmp } from "@/lib/amp";
import type { AmpResponse } from "@/lib/amp";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
}

interface ConversationPanelProps {
  api: ExcalidrawImperativeAPI | null;
}

function applyCorrections(api: ExcalidrawImperativeAPI, response: AmpResponse) {
  let totalElements = 0;
  for (const c of response.corrections) {
    if (c.action === "add" && c.elements?.length) {
      totalElements += writeToCanvas(api, c.elements, "correction").elementCount;
    } else if (c.action === "remove" && c.removeGroupId) {
      clearAiGroup(api, c.removeGroupId);
    }
  }
  return totalElements;
}

export function ConversationPanel({ api }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    if (!input.trim() || !api || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const elements = api.getSceneElements();
      const canvasJson = JSON.stringify({ elements });

      const response = await sendToAmp(userMessage, canvasJson);
      const count = applyCorrections(api, response);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: count > 0
            ? `${response.message} (${count} elements added)`
            : response.message,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: e instanceof Error ? e.message : "Unknown error" },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Conversation</h2>
        {messages.length > 0 && (
          <button
            onClick={() => { clearAiElements(api!); setMessages([]); }}
            className="text-muted-foreground hover:text-foreground"
            title="Clear AI elements and chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Draw something on the canvas, then ask the AI to help improve it.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground ml-8"
                : msg.role === "error"
                  ? "bg-destructive/10 text-destructive mr-8"
                  : "bg-muted text-muted-foreground mr-8"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-8">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Ask about your diagram…"
            disabled={!api || isLoading}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!api || isLoading || !input.trim()}
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
