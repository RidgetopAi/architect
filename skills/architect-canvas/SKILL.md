---
name: architect-canvas
description: Read and write Excalidraw canvas files for the Architect AI visual canvas project. Use this skill to programmatically create diagrams, read canvas contents, or modify existing drawings.
---

# Architect Canvas Skill

Read, write, and manipulate Excalidraw canvas files stored in `~/projects/architect/canvases/`.

## Canvas File Format

Canvas files are `.excalidraw.json` files with this structure:

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [...],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": null
  }
}
```

## Reading a Canvas

```bash
cat ~/projects/architect/canvases/default.excalidraw.json | jq '.elements | length'
```

To get a human-readable description, parse the elements:
- Each element has `type`, `x`, `y`, `width`, `height`, `groupIds`
- Text elements have a `text` field
- Arrows have `startBinding` and `endBinding` with `elementId`
- AI-generated elements have groupIds starting with `"ai-"`

## Writing Elements

To add elements to a canvas, append to the elements array. Each element needs:
- `id`: unique string
- `type`: "rectangle" | "ellipse" | "diamond" | "text" | "arrow" | "line" | "freedraw"
- `x`, `y`: position coordinates
- `width`, `height`: dimensions
- `strokeColor`: color string (default "#1e1e1e")
- `backgroundColor`: fill color (default "transparent")
- `groupIds`: array of group IDs

### AI Element Convention
- AI corrections: orange stroke (`#e67e22`), groupId prefix `ai-`
- AI annotations: green stroke (`#27ae60`), groupId prefix `ai-`

## Example: Create a Simple Diagram

```bash
cat > ~/projects/architect/canvases/my-diagram.excalidraw.json << 'EOF'
{
  "type": "excalidraw",
  "version": 2,
  "elements": [
    {
      "id": "box1",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "roundness": { "type": 3 },
      "isDeleted": false,
      "boundElements": null,
      "link": null,
      "locked": false
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": null
  }
}
EOF
```

## Project Structure

```
~/projects/architect/
├── canvases/           # Canvas files (.excalidraw.json)
├── src/
│   ├── lib/canvas/     # Serializer, writer
│   ├── lib/amp.ts      # Amp headless connector
│   └── components/     # React components (Canvas, Header, ConversationPanel)
├── server/             # Vite dev API (save/load + amp subprocess)
└── AGENTS.md           # Instructions for headless amp agent
```
