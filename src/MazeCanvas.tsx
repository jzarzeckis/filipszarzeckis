import { useEffect, useRef } from "react";
import { scaleSequential } from "d3-scale";
import { interpolateRgbBasis } from "d3-interpolate";

const N = 1,
  S = 2,
  W = 4,
  E = 8;

const CELL_SIZE = 4;
const CELL_SPACING = 4;
const STEP = CELL_SIZE + CELL_SPACING;

function generateMaze(width: number, height: number): Uint8Array {
  const size = width * height;
  const cells = new Uint8Array(size);
  const inMaze = new Uint8Array(size);
  const remaining: number[] = [];
  for (let i = 0; i < size; i++) remaining.push(i);
  const previous = new Int32Array(size).fill(-1);

  const start = remaining.pop()!;
  inMaze[start] = 1;

  while (!loopErasedRandomWalk());
  return cells;

  function loopErasedRandomWalk(): boolean {
    let i0: number, i1: number, x0: number, y0: number;

    do {
      const idx = remaining.pop();
      if (idx === undefined) return true;
      i0 = idx;
    } while (inMaze[i0]);

    previous[i0] = i0;

    while (true) {
      x0 = i0 % width;
      y0 = (i0 / width) | 0;

      i1 = (Math.random() * 4) | 0;
      if (i1 === 0) {
        if (y0 <= 0) continue;
        i1 = i0 - width;
      } else if (i1 === 1) {
        if (y0 >= height - 1) continue;
        i1 = i0 + width;
      } else if (i1 === 2) {
        if (x0 <= 0) continue;
        i1 = i0 - 1;
      } else {
        if (x0 >= width - 1) continue;
        i1 = i0 + 1;
      }

      if (previous[i1]! >= 0) eraseWalk(i0, i1);
      else previous[i1] = i0;

      if (inMaze[i1]) {
        while (previous[i1] !== i1) {
          i0 = previous[i1]!;
          if (i1 === i0 + 1) {
            cells[i0] = cells[i0]! | E;
            cells[i1] = cells[i1]! | W;
          } else if (i1 === i0 - 1) {
            cells[i0] = cells[i0]! | W;
            cells[i1] = cells[i1]! | E;
          } else if (i1 === i0 + width) {
            cells[i0] = cells[i0]! | S;
            cells[i1] = cells[i1]! | N;
          } else {
            cells[i0] = cells[i0]! | N;
            cells[i1] = cells[i1]! | S;
          }
          inMaze[i1] = 1;
          previous[i1] = -1;
          i1 = i0;
        }
        inMaze[i1] = 1;
        previous[i1] = -1;
        return false;
      }

      i0 = i1;
    }
  }

  function eraseWalk(i0: number, i2: number) {
    let i1: number;
    do {
      i1 = previous[i0]!;
      previous[i0] = -1;
      i0 = i1;
    } while (i1 !== i2);
  }
}

function computeTree(cells: Uint8Array, width: number, height: number) {
  const size = width * height;
  const parents = new Int32Array(size).fill(-1);
  const distances = new Int32Array(size).fill(0);
  const root = (height - 1) * width;

  parents[root] = root;
  distances[root] = 0;
  const frontier = [root];
  let maxDistance = 0;

  while (frontier.length > 0) {
    const i0 = frontier.pop()!;
    const d = distances[i0]! + 1;
    let i1: number;

    if (cells[i0]! & E && parents[(i1 = i0 + 1)]! === -1) {
      parents[i1] = i0;
      distances[i1] = d;
      if (d > maxDistance) maxDistance = d;
      frontier.push(i1);
    }
    if (cells[i0]! & W && parents[(i1 = i0 - 1)]! === -1) {
      parents[i1] = i0;
      distances[i1] = d;
      if (d > maxDistance) maxDistance = d;
      frontier.push(i1);
    }
    if (cells[i0]! & S && parents[(i1 = i0 + width)]! === -1) {
      parents[i1] = i0;
      distances[i1] = d;
      if (d > maxDistance) maxDistance = d;
      frontier.push(i1);
    }
    if (cells[i0]! & N && parents[(i1 = i0 - width)]! === -1) {
      parents[i1] = i0;
      distances[i1] = d;
      if (d > maxDistance) maxDistance = d;
      frontier.push(i1);
    }
  }

  return { parents, distances, maxDistance };
}

export function MazeCanvas() {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const base = baseRef.current!;
    const path = pathRef.current!;
    const baseCtx = base.getContext("2d")!;
    const pathCtx = path.getContext("2d")!;

    let cw: number,
      ch: number,
      ml: number,
      mt: number;
    let cells: Uint8Array,
      parents: Int32Array,
      distances: Int32Array;
    let maxDist: number,
      hoverIdx = -1;
    let colorFn: (d: number) => string;
    let resizeTimer: ReturnType<typeof setTimeout>;

    function init() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      for (const c of [base, path]) {
        c.width = vw * dpr;
        c.height = vh * dpr;
        c.style.width = vw + "px";
        c.style.height = vh + "px";
      }
      baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pathCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cw = Math.floor((vw - CELL_SPACING) / STEP);
      ch = Math.floor((vh - CELL_SPACING) / STEP);
      ml = Math.round((vw - cw * CELL_SIZE - (cw + 1) * CELL_SPACING) / 2);
      mt = Math.round((vh - ch * CELL_SIZE - (ch + 1) * CELL_SPACING) / 2);

      cells = generateMaze(cw, ch);
      const tree = computeTree(cells, cw, ch);
      parents = tree.parents;
      distances = tree.distances;
      maxDist = tree.maxDistance;

      colorFn = scaleSequential(
        interpolateRgbBasis(["#4c1d95", "#2563eb", "#0d9488", "#f59e0b"]),
      ).domain([0, maxDist]);

      hoverIdx = -1;
      render();
    }

    // --- drawing helpers (work in translated space) ---

    function fillCell(ctx: CanvasRenderingContext2D, i: number) {
      const x = i % cw;
      const y = (i / cw) | 0;
      ctx.fillRect(
        x * CELL_SIZE + (x + 1) * CELL_SPACING,
        y * CELL_SIZE + (y + 1) * CELL_SPACING,
        CELL_SIZE,
        CELL_SIZE,
      );
    }

    function fillEast(ctx: CanvasRenderingContext2D, i: number) {
      const x = i % cw;
      const y = (i / cw) | 0;
      ctx.fillRect(
        (x + 1) * STEP,
        y * CELL_SIZE + (y + 1) * CELL_SPACING,
        CELL_SPACING,
        CELL_SIZE,
      );
    }

    function fillSouth(ctx: CanvasRenderingContext2D, i: number) {
      const x = i % cw;
      const y = (i / cw) | 0;
      ctx.fillRect(
        x * CELL_SIZE + (x + 1) * CELL_SPACING,
        (y + 1) * STEP,
        CELL_SIZE,
        CELL_SPACING,
      );
    }

    // --- render full maze ---

    function render() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      baseCtx.fillStyle = "#000";
      baseCtx.fillRect(0, 0, vw, vh);
      baseCtx.save();
      baseCtx.translate(ml, mt);

      for (let y = 0, i = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++, i++) {
          baseCtx.fillStyle = colorFn(distances[i]!);
          fillCell(baseCtx, i);
          if (cells[i]! & S) {
            baseCtx.fillStyle = colorFn(
              (distances[i]! + distances[i + cw]!) / 2,
            );
            fillSouth(baseCtx, i);
          }
          if (cells[i]! & E) {
            baseCtx.fillStyle = colorFn(
              (distances[i]! + distances[i + 1]!) / 2,
            );
            fillEast(baseCtx, i);
          }
        }
      }

      baseCtx.restore();
      pathCtx.clearRect(0, 0, vw, vh);
    }

    // --- path overlay ---

    function drawPath(target: number) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      pathCtx.clearRect(0, 0, vw, vh);
      pathCtx.save();
      pathCtx.translate(ml, mt);
      pathCtx.fillStyle = "#fff";

      let cur = target;
      while (true) {
        const par = parents[cur]!;
        fillCell(pathCtx, cur);
        if (par === cur - 1) fillEast(pathCtx, par);
        else if (par === cur + 1) fillEast(pathCtx, cur);
        else if (par === cur - cw) fillSouth(pathCtx, par);
        else if (par === cur + cw) fillSouth(pathCtx, cur);
        else break;
        cur = par;
      }

      pathCtx.restore();
    }

    // --- event handlers ---

    function cellFromCoords(cx: number, cy: number): number {
      const x = Math.max(
        0,
        Math.min(cw - 1, Math.floor((cx - ml - CELL_SPACING) / STEP)),
      );
      const y = Math.max(
        0,
        Math.min(ch - 1, Math.floor((cy - mt - CELL_SPACING) / STEP)),
      );
      return y * cw + x;
    }

    function onMouseMove(e: MouseEvent) {
      const idx = cellFromCoords(e.clientX, e.clientY);
      if (idx !== hoverIdx) {
        hoverIdx = idx;
        drawPath(hoverIdx);
      }
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      const idx = cellFromCoords(t.clientX, t.clientY);
      hoverIdx = idx;
      drawPath(hoverIdx);
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      const idx = cellFromCoords(t.clientX, t.clientY);
      if (idx !== hoverIdx) {
        hoverIdx = idx;
        drawPath(hoverIdx);
      }
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 100);
    }

    // --- bootstrap ---

    init();

    // Use window-level listeners so events fire regardless of which element
    // the cursor is over, and touch events work reliably on iOS.
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const layerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000",
        cursor: "crosshair",
      }}
    >
      <canvas ref={baseRef} style={layerStyle} />
      <canvas ref={pathRef} style={layerStyle} />
    </div>
  );
}
