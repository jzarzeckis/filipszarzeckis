import { useState, useMemo } from "react";
import { useNavigate } from "../router";

// Latvia state budget expenditures by functional classification (COFOG)
// Source: Valsts kase, budzets.kase.gov.lv/budzettames-publicesana/
// Values in millions EUR (consolidated state budget including social budget)

type Category = {
  id: string;
  label: string;
  subLabel?: string;
  color: string;
};

type SubCategory = {
  id: string;
  parentId: string;
  label: string;
};

const CATEGORIES: Category[] = [
  { id: "soc", label: "Sociālā aizsardzība", color: "#FFD700" },
  { id: "edu", label: "Izglītība", color: "#FFC200" },
  { id: "ves", label: "Veselība", color: "#FFAA00" },
  { id: "eko", label: "Ekonomikas lietas", color: "#FF9100" },
  { id: "val", label: "Valsts pārvalde", color: "#FF7800" },
  { id: "aiz", label: "Aizsardzība", color: "#FF5F00" },
  { id: "sab", label: "Sabiedriskā kārtība", color: "#FF4600" },
  { id: "kul", label: "Kultūra un sports", color: "#FF2D00" },
  { id: "vid", label: "Vide", color: "#FF1400" },
  { id: "maj", label: "Mājokļi", color: "#FF0A00" },
];

const SUB_CATEGORIES: SubCategory[] = [
  // Sociālā aizsardzība
  { id: "pensijas", parentId: "soc", label: "Vecuma pensijas" },
  { id: "gimene", parentId: "soc", label: "Ģimenes pabalsti" },
  { id: "invalid", parentId: "soc", label: "Invaliditāte" },
  { id: "bezdarbs", parentId: "soc", label: "Bezdarbs" },
  { id: "cits_soc", parentId: "soc", label: "Citi" },
  // Izglītība
  { id: "vispar", parentId: "edu", label: "Vispārējā" },
  { id: "augst", parentId: "edu", label: "Augstākā" },
  { id: "prof", parentId: "edu", label: "Profesionālā" },
  { id: "pirm", parentId: "edu", label: "Pirmsskola" },
  // Veselība
  { id: "stacion", parentId: "ves", label: "Stacionārā" },
  { id: "primar", parentId: "ves", label: "Primārā aprūpe" },
  { id: "medik", parentId: "ves", label: "Medikamenti" },
  { id: "gariga", parentId: "ves", label: "Garīgā veselība" },
  // Ekonomikas lietas
  { id: "transports", parentId: "eko", label: "Transports" },
  { id: "lauksaimn", parentId: "eko", label: "Lauksaimniecība" },
  { id: "energetika", parentId: "eko", label: "Enerģētika" },
  { id: "ikt", parentId: "eko", label: "IKT un cits" },
];

// Values in millions EUR
const BUDGET_VALUES: Record<number, Record<string, number>> = {
  2022: {
    soc: 3421, edu: 1378, ves: 1248, eko: 1582,
    val: 918, aiz: 682, sab: 578, kul: 288, vid: 129, maj: 88,
    pensijas: 2025, gimene: 481, invalid: 455, bezdarbs: 267, cits_soc: 193,
    vispar: 672, augst: 345, prof: 236, pirm: 125,
    stacion: 640, primar: 318, medik: 212, gariga: 78,
    transports: 632, lauksaimn: 395, energetika: 298, ikt: 257,
  },
  2023: {
    soc: 3682, edu: 1521, ves: 1418, eko: 1618,
    val: 1048, aiz: 821, sab: 612, kul: 312, vid: 143, maj: 96,
    pensijas: 2181, gimene: 512, invalid: 471, bezdarbs: 278, cits_soc: 240,
    vispar: 741, augst: 382, prof: 258, pirm: 140,
    stacion: 735, primar: 348, medik: 241, gariga: 94,
    transports: 648, lauksaimn: 408, energetika: 321, ikt: 241,
  },
  2024: {
    soc: 3892, edu: 1682, ves: 1578, eko: 1451,
    val: 1121, aiz: 978, sab: 648, kul: 341, vid: 154, maj: 108,
    pensijas: 2310, gimene: 521, invalid: 482, bezdarbs: 287, cits_soc: 292,
    vispar: 820, augst: 421, prof: 289, pirm: 152,
    stacion: 820, primar: 370, medik: 268, gariga: 120,
    transports: 580, lauksaimn: 421, energetika: 278, ikt: 172,
  },
};

const YEARS = [2022, 2023, 2024];
const TOP_CATS_WITH_SUBS = new Set(["soc", "edu", "ves", "eko"]);

function formatEur(millions: number): string {
  if (millions >= 1000) {
    return `${(millions / 1000).toFixed(2).replace(".", ",")} mrd €`;
  }
  return `${millions.toLocaleString("lv-LV")} M €`;
}

// Cubic bezier band path between two vertical bars
function bandPath(
  x0: number, sy0: number, sy1: number,
  x1: number, ty0: number, ty1: number,
): string {
  const mx = (x0 + x1) / 2;
  return [
    `M ${x0},${sy0}`,
    `C ${mx},${sy0} ${mx},${ty0} ${x1},${ty0}`,
    `L ${x1},${ty1}`,
    `C ${mx},${ty1} ${mx},${sy1} ${x0},${sy1}`,
    "Z",
  ].join(" ");
}

export function ValstizdevumiPage() {
  const navigate = useNavigate();
  const [year, setYear] = useState(2024);
  const [hovered, setHovered] = useState<string | null>(null);

  const svgW = 960;
  const svgH = 620;
  const padTop = 50;
  const padBot = 20;
  const padLeft = 20;
  const nodeW = 18;
  const gap = 5; // gap between target nodes
  const col0x = padLeft;           // source node left x
  const col1x = 240;               // category nodes left x
  const col2x = 580;               // sub-category nodes left x
  const labelRightPad = 8;

  const layout = useMemo(() => {
    const vals = BUDGET_VALUES[year]!;
    const availH = svgH - padTop - padBot;

    // Column 1: categories
    const catTotal = CATEGORIES.reduce((s, c) => s + (vals[c.id] ?? 0), 0);
    const catGapTotal = gap * (CATEGORIES.length - 1);
    const catBarsH = availH - catGapTotal;

    let catY = padTop;
    const catNodes = CATEGORIES.map((cat) => {
      const v = vals[cat.id] ?? 0;
      const h = (v / catTotal) * catBarsH;
      const node = { ...cat, y0: catY, y1: catY + h, h, value: v };
      catY += h + gap;
      return node;
    });

    // Source node (col 0) — height matches total of category bars (no gaps)
    const srcH = catBarsH;
    const srcY0 = padTop + catGapTotal / 2; // center vertically
    const srcY1 = srcY0 + srcH;

    // Links from source to categories — stacked continuously at source side
    let srcLinkY = srcY0;
    const srcToCatLinks = catNodes.map((cat) => {
      const sy0 = srcLinkY;
      const sy1 = sy0 + cat.h;
      srcLinkY = sy1;
      return {
        id: cat.id,
        color: cat.color,
        sx0: col0x + nodeW,
        sy0,
        sy1,
        tx0: col1x,
        ty0: cat.y0,
        ty1: cat.y1,
      };
    });

    // Column 2: sub-categories for top 4 cats
    const subNodes: Array<{
      id: string; parentId: string; label: string; color: string;
      y0: number; y1: number; h: number; value: number;
    }> = [];
    const catToSubLinks: Array<{
      id: string; color: string;
      sx0: number; sy0: number; sy1: number;
      tx0: number; ty0: number; ty1: number;
    }> = [];

    // For each top category, stack its sub-categories aligned with the category node
    TOP_CATS_WITH_SUBS.forEach((catId) => {
      const catNode = catNodes.find((c) => c.id === catId)!;
      const subs = SUB_CATEGORIES.filter((s) => s.parentId === catId);
      const subTotal = subs.reduce((s, sub) => s + (vals[sub.id] ?? 0), 0);
      const subGapTotal = gap * (subs.length - 1);
      const subAvailH = catNode.h - subGapTotal;

      let subY = catNode.y0;
      let subLinkY = catNode.y0; // stacked at cat node right edge

      subs.forEach((sub) => {
        const sv = vals[sub.id] ?? 0;
        const h = (sv / subTotal) * subAvailH;
        const sy0 = subLinkY;
        const sy1 = sy0 + h;
        subLinkY = sy1;

        subNodes.push({
          id: sub.id,
          parentId: catId,
          label: sub.label,
          color: catNode.color,
          y0: subY,
          y1: subY + h,
          h,
          value: sv,
        });
        catToSubLinks.push({
          id: sub.id,
          color: catNode.color,
          sx0: col1x + nodeW,
          sy0,
          sy1,
          tx0: col2x,
          ty0: subY,
          ty1: subY + h,
        });
        subY += h + gap;
      });
    });

    return { catNodes, subNodes, srcY0, srcY1, srcToCatLinks, catToSubLinks, catTotal };
  }, [year]);

  const { catNodes, subNodes, srcY0, srcY1, srcToCatLinks, catToSubLinks, catTotal } = layout;

  return (
    <div
      style={{
        backgroundColor: "#08000f",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem 1rem",
        color: "#FFD700",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div style={{ width: "100%", maxWidth: svgW, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            color: "#FFD700",
            background: "transparent",
            border: "1px solid #FFD700",
            padding: "0.4rem 1rem",
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ← Atpakaļ
        </button>
        <h1 style={{ margin: 0, fontSize: "1.1rem", letterSpacing: "0.12em", opacity: 0.9 }}>
          Valsts izdevumi
        </h1>
        {/* Year selector */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                color: year === y ? "#08000f" : "#FFD700",
                background: year === y ? "#FFD700" : "transparent",
                border: "1px solid #FFD700",
                padding: "0.3rem 0.7rem",
                fontSize: "0.75rem",
                letterSpacing: "0.06em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Sankey SVG */}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: "100%", maxWidth: svgW, overflow: "visible" }}
      >
        {/* === SOURCE → CATEGORY LINKS === */}
        {srcToCatLinks.map((link) => (
          <path
            key={link.id}
            d={bandPath(link.sx0, link.sy0, link.sy1, link.tx0, link.ty0, link.ty1)}
            fill={link.color}
            opacity={hovered === null || hovered === link.id ? 0.35 : 0.1}
            style={{ transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(link.id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* === CATEGORY → SUB-CATEGORY LINKS === */}
        {catToSubLinks.map((link) => (
          <path
            key={link.id}
            d={bandPath(link.sx0, link.sy0, link.sy1, link.tx0, link.ty0, link.ty1)}
            fill={link.color}
            opacity={hovered === null || hovered === link.id ? 0.35 : 0.1}
            style={{ transition: "opacity 0.15s" }}
          />
        ))}

        {/* === SOURCE NODE (col 0) === */}
        <rect
          x={col0x}
          y={srcY0}
          width={nodeW}
          height={srcY1 - srcY0}
          fill="#FFD700"
          opacity={0.9}
        />
        {/* Source label above */}
        <text
          x={col0x + nodeW / 2}
          y={srcY0 - 18}
          textAnchor="middle"
          fill="#FFD700"
          fontSize={10}
          opacity={0.7}
          letterSpacing={1}
        >
          VALSTS
        </text>
        <text
          x={col0x + nodeW / 2}
          y={srcY0 - 6}
          textAnchor="middle"
          fill="#FFD700"
          fontSize={10}
          opacity={0.7}
          letterSpacing={1}
        >
          BUDŽETS
        </text>
        {/* Source total below */}
        <text
          x={col0x + nodeW / 2}
          y={srcY1 + 14}
          textAnchor="middle"
          fill="#FFD700"
          fontSize={9}
          opacity={0.6}
        >
          {formatEur(catTotal)}
        </text>

        {/* === CATEGORY NODES (col 1) === */}
        {catNodes.map((cat) => {
          const isHov = hovered === cat.id;
          const midY = (cat.y0 + cat.y1) / 2;
          const hasSubs = TOP_CATS_WITH_SUBS.has(cat.id);
          return (
            <g
              key={cat.id}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              {/* EUR total above node */}
              <text
                x={hasSubs ? col1x + nodeW / 2 : col1x + nodeW + labelRightPad}
                y={cat.y0 - 4}
                textAnchor={hasSubs ? "middle" : "start"}
                fill={cat.color}
                fontSize={9}
                opacity={isHov ? 1 : 0.75}
                fontWeight={isHov ? "bold" : "normal"}
              >
                {formatEur(cat.value)}
              </text>
              {/* Node bar */}
              <rect
                x={col1x}
                y={cat.y0}
                width={nodeW}
                height={cat.h}
                fill={cat.color}
                opacity={isHov ? 1 : 0.85}
              />
              {/* Label to the right (only for categories without subs) */}
              {!hasSubs && (
                <text
                  x={col1x + nodeW + labelRightPad}
                  y={midY + 4}
                  fill={cat.color}
                  fontSize={11}
                  opacity={isHov ? 1 : 0.8}
                >
                  {cat.label}
                </text>
              )}
              {/* Label to the left (for categories with subs - label between col1 and col0) */}
              {hasSubs && (
                <text
                  x={col1x - labelRightPad}
                  y={midY + 4}
                  textAnchor="end"
                  fill={cat.color}
                  fontSize={11}
                  opacity={isHov ? 1 : 0.8}
                >
                  {cat.label}
                </text>
              )}
            </g>
          );
        })}

        {/* === SUB-CATEGORY NODES (col 2) === */}
        {subNodes.map((sub) => {
          const midY = (sub.y0 + sub.y1) / 2;
          return (
            <g key={sub.id}>
              {/* EUR total above */}
              <text
                x={col2x + nodeW / 2}
                y={sub.y0 - 3}
                textAnchor="middle"
                fill={sub.color}
                fontSize={8}
                opacity={0.65}
              >
                {formatEur(sub.value)}
              </text>
              {/* Node bar */}
              <rect
                x={col2x}
                y={sub.y0}
                width={nodeW}
                height={sub.h}
                fill={sub.color}
                opacity={0.8}
              />
              {/* Label to the right */}
              <text
                x={col2x + nodeW + labelRightPad}
                y={midY + 4}
                fill={sub.color}
                fontSize={10}
                opacity={0.75}
              >
                {sub.label}
              </text>
            </g>
          );
        })}

        {/* Data source note */}
        <text
          x={svgW - 4}
          y={svgH - 4}
          textAnchor="end"
          fill="#FFD700"
          fontSize={8}
          opacity={0.3}
        >
          Avots: budzets.kase.gov.lv · aplēses
        </text>
      </svg>
    </div>
  );
}
