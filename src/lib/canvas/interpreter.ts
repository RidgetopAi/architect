import type { CanvasSemantics, SemanticNode, SemanticConnection } from "./serializer";

function describeShape(node: SemanticNode): string {
  const shape = node.shape ?? node.type;
  const label = node.label ? ` labeled "${node.label}"` : "";
  const pos = `at (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`;
  const size = `${Math.round(node.size.width)}×${Math.round(node.size.height)}`;
  const ai = node.isAiGenerated ? " [AI-generated]" : "";
  return `${shape}${label} ${pos}, size ${size}${ai}`;
}

function describeConnection(
  conn: SemanticConnection,
  nodesById: Map<string, SemanticNode>
): string {
  const from = conn.fromId
    ? nodesById.get(conn.fromId)?.label ?? `element ${conn.fromId.slice(0, 8)}`
    : "unattached";
  const to = conn.toId
    ? nodesById.get(conn.toId)?.label ?? `element ${conn.toId.slice(0, 8)}`
    : "unattached";
  const label = conn.label ? ` labeled "${conn.label}"` : "";
  const ai = conn.isAiGenerated ? " [AI-generated]" : "";
  return `connection from "${from}" → "${to}"${label}${ai}`;
}

function describeSpatialRelationships(nodes: SemanticNode[]): string {
  if (nodes.length < 2) return "";

  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y);
  const topRow = sorted.filter(
    (n) => Math.abs(n.position.y - sorted[0].position.y) < 50
  );
  const hasGrid =
    topRow.length > 1 &&
    sorted.length > topRow.length;

  if (hasGrid) {
    return "Elements appear arranged in a grid-like layout.";
  }

  const isVertical =
    sorted.every(
      (n, i) =>
        i === 0 ||
        Math.abs(n.position.x - sorted[i - 1].position.x) < 100
    ) && sorted.length > 2;

  if (isVertical) {
    return "Elements are arranged in a vertical sequence (top to bottom).";
  }

  const isSortedHorizontal = [...nodes]
    .sort((a, b) => a.position.x - b.position.x)
    .every(
      (n, i, arr) =>
        i === 0 ||
        Math.abs(n.position.y - arr[i - 1].position.y) < 100
    );

  if (isSortedHorizontal && nodes.length > 2) {
    return "Elements are arranged in a horizontal sequence (left to right).";
  }

  return "";
}

export function interpretCanvas(semantics: CanvasSemantics): string {
  const { nodes, connections } = semantics;

  if (nodes.length === 0 && connections.length === 0) {
    return "The canvas is empty.";
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const lines: string[] = [];

  lines.push(semantics.summary);
  lines.push("");

  // Spatial layout
  const spatial = describeSpatialRelationships(nodes);
  if (spatial) {
    lines.push(`Layout: ${spatial}`);
    lines.push("");
  }

  // Shapes
  const shapes = nodes.filter((n) => n.type === "shape");
  if (shapes.length > 0) {
    lines.push("Shapes:");
    for (const s of shapes) {
      lines.push(`  - ${describeShape(s)}`);
    }
    lines.push("");
  }

  // Text labels
  const texts = nodes.filter((n) => n.type === "text");
  if (texts.length > 0) {
    lines.push("Text labels:");
    for (const t of texts) {
      lines.push(`  - "${t.label}" at (${Math.round(t.position.x)}, ${Math.round(t.position.y)})`);
    }
    lines.push("");
  }

  // Connections
  if (connections.length > 0) {
    lines.push("Connections:");
    for (const c of connections) {
      lines.push(`  - ${describeConnection(c, nodesById)}`);
    }
    lines.push("");
  }

  // AI elements
  const aiNodes = nodes.filter((n) => n.isAiGenerated);
  const aiConns = connections.filter((c) => c.isAiGenerated);
  if (aiNodes.length > 0 || aiConns.length > 0) {
    lines.push(
      `AI-generated elements: ${aiNodes.length} shapes, ${aiConns.length} connections`
    );
  }

  return lines.join("\n").trim();
}
