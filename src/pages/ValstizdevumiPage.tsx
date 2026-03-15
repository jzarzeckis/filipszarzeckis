import { useState, useMemo } from "react";
import { useNavigate } from "../router";

// Latvia state budget — revenues and expenditures
// Source: Valsts kase, budzets.kase.gov.lv/budzettames-publicesana/
// Values in millions EUR (consolidated state budget including social budget)
// Revenue figures are approximate estimates; expenditure figures from prior COFOG classification.

type RevenueSource = {
  id: string;
  label: string;
  color: string;
};

type Category = {
  id: string;
  label: string;
  color: string;
};

type SubCategory = {
  id: string;
  parentId: string;
  label: string;
};

const REVENUE_SOURCES: RevenueSource[] = [
  { id: "pvn",         label: "PVN",              color: "#4ade80" },
  { id: "vsaoi",       label: "Soc. iemaksas",    color: "#34d399" },
  { id: "iin",         label: "IIN",               color: "#6ee7b7" },
  { id: "akcizes",     label: "Akcīzes un muitas", color: "#a3e635" },
  { id: "uin",         label: "UIN",               color: "#bef264" },
  { id: "es_fondi",    label: "ES fondi",          color: "#93c5fd" },
  { id: "obligacijas", label: "Obligācijas",       color: "#fbbf24" },
  { id: "citi_ien",    label: "Citi ieņēmumi",    color: "#fb923c" },
];

const CATEGORIES: Category[] = [
  { id: "soc", label: "Sociālā aizsardzība",  color: "#FFD700" },
  { id: "edu", label: "Izglītība",             color: "#FFC200" },
  { id: "ves", label: "Veselība",              color: "#FFAA00" },
  { id: "eko", label: "Ekonomikas lietas",     color: "#FF9100" },
  { id: "val", label: "Valsts pārvalde",       color: "#FF7800" },
  { id: "aiz", label: "Aizsardzība",           color: "#FF5F00" },
  { id: "sab", label: "Sabiedriskā kārtība",   color: "#FF4600" },
  { id: "kul", label: "Kultūra un sports",     color: "#FF2D00" },
  { id: "vid", label: "Vide",                  color: "#FF1400" },
  { id: "maj", label: "Mājokļi",              color: "#FF0A00" },
  { id: "par", label: "Parāda apkalpošana",    color: "#CC0000" },
];

const SUB_CATEGORIES: SubCategory[] = [
  // Sociālā aizsardzība
  { id: "pensijas",  parentId: "soc", label: "Vecuma pensijas" },
  { id: "gimene",    parentId: "soc", label: "Ģimenes pabalsti" },
  { id: "invalid",   parentId: "soc", label: "Invaliditāte" },
  { id: "bezdarbs",  parentId: "soc", label: "Bezdarbs" },
  { id: "cits_soc",  parentId: "soc", label: "Citi" },
  // Izglītība
  { id: "vispar",    parentId: "edu", label: "Vispārējā" },
  { id: "augst",     parentId: "edu", label: "Augstākā" },
  { id: "prof",      parentId: "edu", label: "Profesionālā" },
  { id: "pirm",      parentId: "edu", label: "Pirmsskola" },
  // Veselība
  { id: "stacion",   parentId: "ves", label: "Stacionārā" },
  { id: "primar",    parentId: "ves", label: "Primārā aprūpe" },
  { id: "medik",     parentId: "ves", label: "Medikamenti" },
  { id: "gariga",    parentId: "ves", label: "Garīgā veselība" },
  // Ekonomikas lietas
  { id: "transports",  parentId: "eko", label: "Transports" },
  { id: "lauksaimn",   parentId: "eko", label: "Lauksaimniecība" },
  { id: "energetika",  parentId: "eko", label: "Enerģētika" },
  { id: "ikt",         parentId: "eko", label: "IKT un cits" },
];

// Values in millions EUR
// Revenue totals are balanced to match expenditure totals per year.
const BUDGET_VALUES: Record<number, Record<string, number>> = {
  2022: {
    // Expenditures (total: 10 577 M€)
    soc: 3421, edu: 1378, ves: 1248, eko: 1582,
    val: 918, aiz: 682, sab: 578, kul: 288, vid: 129, maj: 88, par: 265,
    pensijas: 2025, gimene: 481, invalid: 455, bezdarbs: 267, cits_soc: 193,
    vispar: 672, augst: 345, prof: 236, pirm: 125,
    stacion: 640, primar: 318, medik: 212, gariga: 78,
    transports: 632, lauksaimn: 395, energetika: 298, ikt: 257,
    // Revenue sources (total: 10 577 M€)
    pvn: 2900, vsaoi: 1820, iin: 1130, akcizes: 820,
    uin: 620, es_fondi: 1500, obligacijas: 860, citi_ien: 927,
  },
  2023: {
    // Expenditures (total: 11 621 M€)
    soc: 3682, edu: 1521, ves: 1418, eko: 1618,
    val: 1048, aiz: 821, sab: 612, kul: 312, vid: 143, maj: 96, par: 350,
    pensijas: 2181, gimene: 512, invalid: 471, bezdarbs: 278, cits_soc: 240,
    vispar: 741, augst: 382, prof: 258, pirm: 140,
    stacion: 735, primar: 348, medik: 241, gariga: 94,
    transports: 648, lauksaimn: 408, energetika: 321, ikt: 241,
    // Revenue sources (total: 11 621 M€)
    pvn: 3200, vsaoi: 2050, iin: 1390, akcizes: 870,
    uin: 720, es_fondi: 1200, obligacijas: 1300, citi_ien: 891,
  },
  2024: {
    // Expenditures (total: 12 393 M€)
    soc: 3892, edu: 1682, ves: 1578, eko: 1451,
    val: 1121, aiz: 978, sab: 648, kul: 341, vid: 154, maj: 108, par: 440,
    pensijas: 2310, gimene: 521, invalid: 482, bezdarbs: 287, cits_soc: 292,
    vispar: 820, augst: 421, prof: 289, pirm: 152,
    stacion: 820, primar: 370, medik: 268, gariga: 120,
    transports: 580, lauksaimn: 421, energetika: 278, ikt: 172,
    // Revenue sources (total: 12 393 M€)
    pvn: 3420, vsaoi: 2280, iin: 1580, akcizes: 960,
    uin: 760, es_fondi: 1100, obligacijas: 1560, citi_ien: 733,
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

  const svgW = 1100;
  const svgH = 640;
  const padTop = 60;
  const padBot = 24;
  const nodeW = 18;
  const gap = 5;

  // Column x positions (left edge of each node bar)
  const revColX = 120;    // Revenue source nodes
  const budgetColX = 305; // Central budget node
  const catColX = 535;    // Expenditure category nodes
  const subColX = 850;    // Sub-category nodes
  const labelPad = 8;

  const layout = useMemo(() => {
    const vals = BUDGET_VALUES[year]!;
    const availH = svgH - padTop - padBot;

    // Expenditure totals
    const catTotal = CATEGORIES.reduce((s, c) => s + (vals[c.id] ?? 0), 0);
    const catGapTotal = gap * (CATEGORIES.length - 1);
    const catBarsH = availH - catGapTotal;

    // Budget node: height = catBarsH, centered to account for category gaps
    const budgetH = catBarsH;
    const budgetY0 = padTop + catGapTotal / 2;
    const budgetY1 = budgetY0 + budgetH;

    // Revenue nodes: stacked with gaps, aligned to same vertical extent as budget bar
    const revTotal = REVENUE_SOURCES.reduce((s, r) => s + (vals[r.id] ?? 0), 0);
    const revGapTotal = gap * (REVENUE_SOURCES.length - 1);
    const revBarsH = budgetH - revGapTotal;

    let revY = budgetY0;
    const revNodes = REVENUE_SOURCES.map((src) => {
      const v = vals[src.id] ?? 0;
      const h = (v / revTotal) * revBarsH;
      const node = { ...src, y0: revY, y1: revY + h, h, value: v };
      revY += h + gap;
      return node;
    });

    // Revenue → Budget links
    // Source side: the actual revenue bar positions (with gaps between bars).
    // Target side: stacked continuously at budget bar left edge, proportional to value.
    let revLinkTargetY = budgetY0;
    const revToBudgetLinks = revNodes.map((rev) => {
      const targetH = (rev.value / revTotal) * budgetH;
      const ty0 = revLinkTargetY;
      const ty1 = ty0 + targetH;
      revLinkTargetY = ty1;
      return {
        id: rev.id,
        color: rev.color,
        sx0: revColX + nodeW,
        sy0: rev.y0,
        sy1: rev.y1,
        tx0: budgetColX,
        ty0,
        ty1,
      };
    });

    // Category nodes
    let catY = padTop;
    const catNodes = CATEGORIES.map((cat) => {
      const v = vals[cat.id] ?? 0;
      const h = (v / catTotal) * catBarsH;
      const node = { ...cat, y0: catY, y1: catY + h, h, value: v };
      catY += h + gap;
      return node;
    });

    // Budget → Category links: stacked continuously at budget right edge
    let budgetLinkY = budgetY0;
    const budgetToCatLinks = catNodes.map((cat) => {
      const sy0 = budgetLinkY;
      const sy1 = sy0 + cat.h;
      budgetLinkY = sy1;
      return {
        id: cat.id,
        color: cat.color,
        sx0: budgetColX + nodeW,
        sy0,
        sy1,
        tx0: catColX,
        ty0: cat.y0,
        ty1: cat.y1,
      };
    });

    // Sub-category nodes (for top 4 categories)
    const subNodes: Array<{
      id: string; parentId: string; label: string; color: string;
      y0: number; y1: number; h: number; value: number;
    }> = [];
    const catToSubLinks: Array<{
      id: string; color: string;
      sx0: number; sy0: number; sy1: number;
      tx0: number; ty0: number; ty1: number;
    }> = [];

    TOP_CATS_WITH_SUBS.forEach((catId) => {
      const catNode = catNodes.find((c) => c.id === catId)!;
      const subs = SUB_CATEGORIES.filter((s) => s.parentId === catId);
      const subTotal = subs.reduce((s, sub) => s + (vals[sub.id] ?? 0), 0);
      const subGapTotal = gap * (subs.length - 1);
      const subAvailH = catNode.h - subGapTotal;

      let subY = catNode.y0;
      let subLinkY = catNode.y0;

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
          sx0: catColX + nodeW,
          sy0,
          sy1,
          tx0: subColX,
          ty0: subY,
          ty1: subY + h,
        });
        subY += h + gap;
      });
    });

    return {
      revNodes, revToBudgetLinks,
      budgetY0, budgetY1,
      catNodes, catTotal,
      budgetToCatLinks,
      subNodes, catToSubLinks,
    };
  }, [year]);

  const {
    revNodes, revToBudgetLinks,
    budgetY0, budgetY1,
    catNodes, catTotal,
    budgetToCatLinks,
    subNodes, catToSubLinks,
  } = layout;

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
          Valsts budžets
        </h1>
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
        {/* === REVENUE → BUDGET LINKS === */}
        {revToBudgetLinks.map((link) => (
          <path
            key={link.id}
            d={bandPath(link.sx0, link.sy0, link.sy1, link.tx0, link.ty0, link.ty1)}
            fill={link.color}
            opacity={hovered === null || hovered === link.id ? 0.30 : 0.07}
            style={{ transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(link.id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* === BUDGET → CATEGORY LINKS === */}
        {budgetToCatLinks.map((link) => (
          <path
            key={link.id}
            d={bandPath(link.sx0, link.sy0, link.sy1, link.tx0, link.ty0, link.ty1)}
            fill={link.color}
            opacity={hovered === null || hovered === link.id ? 0.30 : 0.07}
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
            opacity={hovered === null || hovered === link.id ? 0.30 : 0.07}
            style={{ transition: "opacity 0.15s" }}
          />
        ))}

        {/* === REVENUE SOURCE NODES === */}
        {revNodes.map((rev) => {
          const isHov = hovered === rev.id;
          const midY = (rev.y0 + rev.y1) / 2;
          return (
            <g
              key={rev.id}
              onMouseEnter={() => setHovered(rev.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              {/* EUR total above node */}
              <text
                x={revColX + nodeW / 2}
                y={rev.y0 - 3}
                textAnchor="middle"
                fill={rev.color}
                fontSize={7}
                opacity={isHov ? 1 : 0.65}
                fontWeight={isHov ? "bold" : "normal"}
              >
                {formatEur(rev.value)}
              </text>
              {/* Node bar */}
              <rect
                x={revColX}
                y={rev.y0}
                width={nodeW}
                height={rev.h}
                fill={rev.color}
                opacity={isHov ? 1 : 0.85}
              />
              {/* Label to the left */}
              <text
                x={revColX - labelPad}
                y={midY + 4}
                textAnchor="end"
                fill={rev.color}
                fontSize={10}
                opacity={isHov ? 1 : 0.8}
                fontWeight={isHov ? "bold" : "normal"}
              >
                {rev.label}
              </text>
            </g>
          );
        })}

        {/* === BUDGET NODE (center) === */}
        <rect
          x={budgetColX}
          y={budgetY0}
          width={nodeW}
          height={budgetY1 - budgetY0}
          fill="#FFD700"
          opacity={0.9}
        />
        <text
          x={budgetColX + nodeW / 2}
          y={budgetY0 - 18}
          textAnchor="middle"
          fill="#FFD700"
          fontSize={10}
          opacity={0.7}
          letterSpacing={1}
        >
          VALSTS
        </text>
        <text
          x={budgetColX + nodeW / 2}
          y={budgetY0 - 6}
          textAnchor="middle"
          fill="#FFD700"
          fontSize={10}
          opacity={0.7}
          letterSpacing={1}
        >
          BUDŽETS
        </text>
        <text
          x={budgetColX + nodeW / 2}
          y={budgetY1 + 14}
          textAnchor="middle"
          fill="#FFD700"
          fontSize={9}
          opacity={0.6}
        >
          {formatEur(catTotal)}
        </text>

        {/* === CATEGORY NODES === */}
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
                x={hasSubs ? catColX + nodeW / 2 : catColX + nodeW + labelPad}
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
                x={catColX}
                y={cat.y0}
                width={nodeW}
                height={cat.h}
                fill={cat.color}
                opacity={isHov ? 1 : 0.85}
              />
              {/* Label to the right (categories without sub-nodes) */}
              {!hasSubs && (
                <text
                  x={catColX + nodeW + labelPad}
                  y={midY + 4}
                  fill={cat.color}
                  fontSize={11}
                  opacity={isHov ? 1 : 0.8}
                >
                  {cat.label}
                </text>
              )}
              {/* Label to the left (categories with sub-nodes — between budget and category cols) */}
              {hasSubs && (
                <text
                  x={catColX - labelPad}
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

        {/* === SUB-CATEGORY NODES === */}
        {subNodes.map((sub) => {
          const midY = (sub.y0 + sub.y1) / 2;
          return (
            <g key={sub.id}>
              <text
                x={subColX + nodeW / 2}
                y={sub.y0 - 3}
                textAnchor="middle"
                fill={sub.color}
                fontSize={8}
                opacity={0.65}
              >
                {formatEur(sub.value)}
              </text>
              <rect
                x={subColX}
                y={sub.y0}
                width={nodeW}
                height={sub.h}
                fill={sub.color}
                opacity={0.8}
              />
              <text
                x={subColX + nodeW + labelPad}
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

        {/* Column headers */}
        <text x={revColX + nodeW / 2} y={padTop - 44} textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.4} letterSpacing={1}>IEŅĒMUMI</text>
        <text x={catColX + nodeW / 2} y={padTop - 44} textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.4} letterSpacing={1}>IZDEVUMI</text>

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
