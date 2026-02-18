import type { Plugin } from "vite";
import fs from "fs";
import path from "path";

const CANVAS_DIR = path.resolve(process.cwd(), "canvases");

export function canvasApiPlugin(): Plugin {
  return {
    name: "canvas-api",
    configureServer(server) {
      // Serve canvas files for loading
      server.middlewares.use("/canvases", (req, res, next) => {
        if (req.method !== "GET") return next();
        const url = req.url || "/";
        const safeName = path.basename(url);
        const filePath = path.join(CANVAS_DIR, safeName);
        if (fs.existsSync(filePath)) {
          res.setHeader("Content-Type", "application/json");
          res.end(fs.readFileSync(filePath, "utf-8"));
        } else {
          res.statusCode = 404;
          res.end("Not found");
        }
      });

      server.middlewares.use("/api/canvas/save", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const { filename, data } = JSON.parse(body);
            if (!filename || !data) {
              res.statusCode = 400;
              res.end("Missing filename or data");
              return;
            }

            const safeName = path.basename(filename);
            const filePath = path.join(CANVAS_DIR, safeName);

            if (!fs.existsSync(CANVAS_DIR)) {
              fs.mkdirSync(CANVAS_DIR, { recursive: true });
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, path: filePath }));
          } catch (e) {
            res.statusCode = 500;
            res.end(String(e));
          }
        });
      });
    },
  };
}
