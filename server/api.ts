import type { Plugin } from "vite";
import type { IncomingMessage } from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { loadEnv } from "vite";

const CANVAS_DIR = path.resolve(process.cwd(), "canvases");
const PROJECT_DIR = process.cwd();

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function runAmp(
  prompt: string,
  canvasJson: string,
  env: Record<string, string>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ampEnv = { ...process.env, ...env };
    const child = spawn(
      "amp",
      ["--dangerously-allow-all", "-x", prompt],
      { cwd: PROJECT_DIR, env: ampEnv, stdio: ["pipe", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`amp exited ${code}: ${stderr || stdout}`));
      } else {
        resolve(stdout.trim());
      }
    });

    child.on("error", (err) => reject(err));

    child.stdin.write(canvasJson);
    child.stdin.end();
  });
}

export function canvasApiPlugin(): Plugin {
  return {
    name: "canvas-api",
    configureServer(server) {
      const env = loadEnv("development", PROJECT_DIR, "");

      // Serve canvas files
      server.middlewares.use("/canvases", (req, res, next) => {
        if (req.method !== "GET") return next();
        const safeName = path.basename(req.url || "/");
        const filePath = path.join(CANVAS_DIR, safeName);
        if (fs.existsSync(filePath)) {
          res.setHeader("Content-Type", "application/json");
          res.end(fs.readFileSync(filePath, "utf-8"));
        } else {
          res.statusCode = 404;
          res.end("Not found");
        }
      });

      // Save canvas
      server.middlewares.use("/api/canvas/save", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        try {
          const body = JSON.parse(await readBody(req));
          if (!body.filename || !body.data) {
            res.statusCode = 400;
            res.end("Missing filename or data");
            return;
          }
          const safeName = path.basename(body.filename);
          const filePath = path.join(CANVAS_DIR, safeName);
          if (!fs.existsSync(CANVAS_DIR)) {
            fs.mkdirSync(CANVAS_DIR, { recursive: true });
          }
          fs.writeFileSync(filePath, JSON.stringify(body.data, null, 2));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 500;
          res.end(String(e));
        }
      });

      // Amp headless prompt
      server.middlewares.use("/api/amp/prompt", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        try {
          const { prompt, canvasJson } = JSON.parse(await readBody(req));
          if (!prompt) {
            res.statusCode = 400;
            res.end("Missing prompt");
            return;
          }

          const ampKey = env.AMP_API_KEY;
          if (!ampKey) {
            res.statusCode = 500;
            res.end("AMP_API_KEY not set in .env");
            return;
          }

          const raw = await runAmp(prompt, canvasJson ?? "{}", {
            AMP_API_KEY: ampKey,
          });

          // amp may return text with the JSON embedded — extract it
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          let parsed: { corrections?: unknown[]; message?: string } | null = null;

          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch {
              // extracted text wasn't valid JSON — fall through
            }
          }

          if (!parsed || !Array.isArray(parsed.corrections)) {
            // Model responded with plain text or malformed JSON
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              corrections: [],
              message: parsed?.message || raw.slice(0, 2000),
            }));
            return;
          }

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(parsed));
        } catch (e) {
          res.statusCode = 500;
          res.end(e instanceof Error ? e.message : String(e));
        }
      });
    },
  };
}
