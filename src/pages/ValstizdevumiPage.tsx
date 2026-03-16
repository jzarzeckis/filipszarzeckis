import { useState, useMemo } from "react";
import { useNavigate } from "../router";

// Latvia state budget — revenues and expenditures
// Source: Valsts kase, budzets.kase.gov.lv/budzettames-publicesana/
// Values in millions EUR — approximate estimates from public budget documents.
// No public API is available; values are hardcoded and can be updated manually.
//
// The diagram shows two separate budget nodes:
//   • Valsts budžets — funded by all revenues except VSAOI
//   • VSAA (Valsts sociālās apdrošināšanas aģentūra) — funded by VSAOI contributions
//     plus a state subsidy (dotācija) transferred from Valsts budžets.
//     VSAA pays all social-protection expenditure (pensijas, ģimene, invaliditāte, bezdarbs).

type RevenueSource = { id: string; label: string; color: string };
type Category      = { id: string; label: string; color: string };
type SubCategory   = { id: string; parentId: string; label: string };

const REVENUE_SOURCES: RevenueSource[] = [
  { id: "vsaoi",       label: "Soc. iemaksas",     color: "#34d399" },
  { id: "pvn",         label: "PVN",               color: "#4ade80" },
  { id: "iin",         label: "IIN",               color: "#6ee7b7" },
  { id: "akcizes",     label: "Akcīzes un muitas",  color: "#a3e635" },
  { id: "uin",         label: "UIN",               color: "#bef264" },
  { id: "es_fondi",    label: "ES fondi",           color: "#93c5fd" },
  { id: "obligacijas", label: "Obligācijas",        color: "#fbbf24" },
  { id: "citi_ien",    label: "Citi ieņēmumi",      color: "#fb923c" },
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

// Categories that have sub-items shown (large enough to be readable)
const CATS_WITH_SUBS = new Set(["soc", "edu", "ves", "eko", "val", "aiz", "sab", "kul"]);

const SUB_CATEGORIES: SubCategory[] = [
  // Sociālā aizsardzība (soc) — 6 items
  { id: "pensijas",    parentId: "soc", label: "Vecuma pensijas" },
  { id: "gimene",      parentId: "soc", label: "Ģimenes pabalsti" },
  { id: "invalid",     parentId: "soc", label: "Invaliditāte" },
  { id: "bezdarbs",    parentId: "soc", label: "Bezdarbs" },
  { id: "slimibas",    parentId: "soc", label: "Slimības pabalsti" },
  { id: "cits_soc",    parentId: "soc", label: "Citi sociālie" },

  // Izglītība (edu) — 4 items
  { id: "vispar",      parentId: "edu", label: "Vispārējā izglītība" },
  { id: "augst",       parentId: "edu", label: "Augstākā izglītība" },
  { id: "prof",        parentId: "edu", label: "Profesionālā izglītība" },
  { id: "pirm",        parentId: "edu", label: "Pirmsskola" },

  // Veselība (ves) — 4 items
  { id: "stacion",     parentId: "ves", label: "Stacionārā aprūpe" },
  { id: "primar",      parentId: "ves", label: "Primārā aprūpe" },
  { id: "medik",       parentId: "ves", label: "Medikamenti" },
  { id: "gariga",      parentId: "ves", label: "Garīgā veselība" },

  // Ekonomikas lietas (eko) — 4 items
  { id: "transports",  parentId: "eko", label: "Transports" },
  { id: "lauksaimn",   parentId: "eko", label: "Lauksaimniecība" },
  { id: "energetika",  parentId: "eko", label: "Enerģētika" },
  { id: "ikt",         parentId: "eko", label: "IKT un citi" },

  // Valsts pārvalde (val) — 5 items
  { id: "val_fin",     parentId: "val", label: "Finanšu ministrija" },
  { id: "val_kan",     parentId: "val", label: "Valsts kanceleja" },
  { id: "val_saeima",  parentId: "val", label: "Saeima" },
  { id: "val_arl",     parentId: "val", label: "Ārlietu ministrija" },
  { id: "val_citi",    parentId: "val", label: "Citi" },

  // Aizsardzība (aiz) — 3 items
  { id: "aiz_nbs",     parentId: "aiz", label: "Nac. bruņotie spēki" },
  { id: "aiz_gvarde",  parentId: "aiz", label: "Nacionālā gvarde" },
  { id: "aiz_infra",   parentId: "aiz", label: "Militārā infrastruktūra" },

  // Sabiedriskā kārtība (sab) — 4 items
  { id: "sab_pol",     parentId: "sab", label: "Policija" },
  { id: "sab_rob",     parentId: "sab", label: "Robežsardze" },
  { id: "sab_uguns",   parentId: "sab", label: "Ugunsdzēsēji" },
  { id: "sab_tiesu",   parentId: "sab", label: "Tiesu vara" },

  // Kultūra un sports (kul) — 3 items
  { id: "kul_kult",    parentId: "kul", label: "Kultūra" },
  { id: "kul_sports",  parentId: "kul", label: "Sports" },
  { id: "kul_mediji",  parentId: "kul", label: "Mediji" },
];

// Values in millions EUR.
// All sub-category values are balanced so they sum to their parent category total.
const BUDGET_VALUES: Record<number, Record<string, number>> = {
  2022: {
    // Categories
    soc: 3421, edu: 1378, ves: 1248, eko: 1582,
    val: 918,  aiz: 682,  sab: 578,  kul: 288,  vid: 129, maj: 88, par: 265,
    // soc subs (sum = 3421)
    pensijas: 2025, gimene: 481, invalid: 455, bezdarbs: 267, slimibas: 122, cits_soc: 71,
    // edu subs (sum = 1378)
    vispar: 672, augst: 345, prof: 236, pirm: 125,
    // ves subs (sum = 1248)
    stacion: 640, primar: 318, medik: 212, gariga: 78,
    // eko subs (sum = 1582)
    transports: 632, lauksaimn: 395, energetika: 298, ikt: 257,
    // val subs (sum = 918)
    val_fin: 262, val_kan: 148, val_saeima: 80, val_arl: 98, val_citi: 330,
    // aiz subs (sum = 682)
    aiz_nbs: 492, aiz_gvarde: 112, aiz_infra: 78,
    // sab subs (sum = 578)
    sab_pol: 248, sab_rob: 128, sab_uguns: 112, sab_tiesu: 90,
    // kul subs (sum = 288)
    kul_kult: 165, kul_sports: 82, kul_mediji: 41,
    // Revenue sources
    pvn: 2900, vsaoi: 1820, iin: 1130, akcizes: 820,
    uin: 620, es_fondi: 1500, obligacijas: 860, citi_ien: 927,
  },
  2023: {
    // Categories
    soc: 3682, edu: 1521, ves: 1418, eko: 1618,
    val: 1048, aiz: 821,  sab: 612,  kul: 312,  vid: 143, maj: 96, par: 350,
    // soc subs (sum = 3682)
    pensijas: 2181, gimene: 512, invalid: 471, bezdarbs: 278, slimibas: 148, cits_soc: 92,
    // edu subs (sum = 1521)
    vispar: 741, augst: 382, prof: 258, pirm: 140,
    // ves subs (sum = 1418)
    stacion: 735, primar: 348, medik: 241, gariga: 94,
    // eko subs (sum = 1618)
    transports: 648, lauksaimn: 408, energetika: 321, ikt: 241,
    // val subs (sum = 1048)
    val_fin: 295, val_kan: 165, val_saeima: 88, val_arl: 112, val_citi: 388,
    // aiz subs (sum = 821)
    aiz_nbs: 598, aiz_gvarde: 128, aiz_infra: 95,
    // sab subs (sum = 612)
    sab_pol: 265, sab_rob: 138, sab_uguns: 118, sab_tiesu: 91,
    // kul subs (sum = 312)
    kul_kult: 178, kul_sports: 88, kul_mediji: 46,
    // Revenue sources
    pvn: 3200, vsaoi: 2050, iin: 1390, akcizes: 870,
    uin: 720, es_fondi: 1200, obligacijas: 1300, citi_ien: 891,
  },
  2024: {
    // Categories
    soc: 3892, edu: 1682, ves: 1578, eko: 1451,
    val: 1121, aiz: 978,  sab: 648,  kul: 341,  vid: 154, maj: 108, par: 440,
    // soc subs (sum = 3892)
    pensijas: 2310, gimene: 521, invalid: 482, bezdarbs: 287, slimibas: 180, cits_soc: 112,
    // edu subs (sum = 1682)
    vispar: 820, augst: 421, prof: 289, pirm: 152,
    // ves subs (sum = 1578)
    stacion: 820, primar: 370, medik: 268, gariga: 120,
    // eko subs (sum = 1451)
    transports: 580, lauksaimn: 421, energetika: 278, ikt: 172,
    // val subs (sum = 1121)
    val_fin: 320, val_kan: 180, val_saeima: 95, val_arl: 125, val_citi: 401,
    // aiz subs (sum = 978)
    aiz_nbs: 720, aiz_gvarde: 148, aiz_infra: 110,
    // sab subs (sum = 648)
    sab_pol: 285, sab_rob: 148, sab_uguns: 125, sab_tiesu: 90,
    // kul subs (sum = 341)
    kul_kult: 195, kul_sports: 95, kul_mediji: 51,
    // Revenue sources
    pvn: 3420, vsaoi: 2280, iin: 1580, akcizes: 960,
    uin: 760, es_fondi: 1100, obligacijas: 1560, citi_ien: 733,
  },
};

const YEARS = [2022, 2023, 2024];

function formatEur(millions: number): string {
  if (millions >= 1000) {
    return `${(millions / 1000).toFixed(2).replace(".", ",")} mrd €`;
  }
  return `${millions.toLocaleString("lv-LV")} M €`;
}

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

  const svgW   = 1160;
  const svgH   = 2200;
  const padTop = 70;
  const padBot = 30;
  const nodeW  = 16;
  const gap    = 5;

  // Column x-positions (left edge of bar)
  const revColX       = 90;   // revenue sources
  const valstsBudgetX = 295;  // Valsts budžets node
  const vsaaBudgetX   = 460;  // VSAA budžets node
  const catColX       = 650;  // expenditure categories
  const subColX       = 930;  // sub-categories
  const labelPad      = 8;

  const layout = useMemo(() => {
    const vals    = BUDGET_VALUES[year]!;
    const availH  = svgH - padTop - padBot;

    // ── totals ────────────────────────────────────────────────
    const catTotal    = CATEGORIES.reduce((s, c) => s + (vals[c.id] ?? 0), 0);
    const catGapTotal = gap * (CATEGORIES.length - 1);
    const catBarsH    = availH - catGapTotal;

    const budgetH  = catBarsH;
    const budgetY0 = padTop + catGapTotal / 2;

    // ── key values ────────────────────────────────────────────
    const socVal      = vals["soc"]   ?? 0;
    const vsaoiVal    = vals["vsaoi"] ?? 0;
    const dotaciyaVal = socVal - vsaoiVal;

    // ── VSAA node ─────────────────────────────────────────────
    const vsaaH  = (socVal / catTotal) * budgetH;
    const vsaaY0 = budgetY0;
    const vsaaY1 = vsaaY0 + vsaaH;

    // ── Valsts budžets node ───────────────────────────────────
    const valstsBudgetVal = catTotal - socVal;
    const valstsBudgetH   = (valstsBudgetVal / catTotal) * budgetH;
    const valstsBudgetY0  = vsaaY1;
    const valstsBudgetY1  = valstsBudgetY0 + valstsBudgetH;

    // ── Revenue nodes ─────────────────────────────────────────
    const revTotal    = catTotal;
    const revGapTotal = gap * (REVENUE_SOURCES.length - 1);
    const revBarsH    = budgetH - revGapTotal;

    let revY = budgetY0;
    const revNodes = REVENUE_SOURCES.map((src) => {
      const v = vals[src.id] ?? 0;
      const h = (v / revTotal) * revBarsH;
      const node = { ...src, y0: revY, y1: revY + h, h, value: v };
      revY += h + gap;
      return node;
    });

    // ── Revenue → VSAA (VSAOI only) ───────────────────────────
    const vsaoiNode    = revNodes.find((r) => r.id === "vsaoi")!;
    const vsaoiTargetH = (vsaoiVal / socVal) * vsaaH;
    const vsaoiToVsaaLink = {
      id: "vsaoi_to_vsaa",
      color: "#34d399",
      sx0: revColX + nodeW, sy0: vsaoiNode.y0, sy1: vsaoiNode.y1,
      tx0: vsaaBudgetX,     ty0: vsaaY0,       ty1: vsaaY0 + vsaoiTargetH,
    };

    // ── Revenue → Valsts budžets (all non-VSAOI) ──────────────
    const valstsBudgetIncome = catTotal - vsaoiVal;
    let   revToValtsY        = valstsBudgetY0;
    const revToValtsLinks    = revNodes
      .filter((r) => r.id !== "vsaoi")
      .map((rev) => {
        const targetH = (rev.value / valstsBudgetIncome) * valstsBudgetH;
        const ty0     = revToValtsY;
        const ty1     = ty0 + targetH;
        revToValtsY   = ty1;
        return {
          id:    rev.id,
          color: rev.color,
          sx0: revColX + nodeW, sy0: rev.y0, sy1: rev.y1,
          tx0: valstsBudgetX,   ty0,          ty1,
        };
      });

    // ── Dotācija: Valsts → VSAA ───────────────────────────────
    const dotaciyaH    = (dotaciyaVal / valstsBudgetIncome) * valstsBudgetH;
    const dotaciyaLink = {
      id:    "dotaciya",
      color: "#a8a8a8",
      sx0: valstsBudgetX + nodeW, sy0: valstsBudgetY0,        sy1: valstsBudgetY0 + dotaciyaH,
      tx0: vsaaBudgetX,           ty0: vsaaY0 + vsaoiTargetH, ty1: vsaaY1,
      value: dotaciyaVal,
    };

    // ── Category nodes ────────────────────────────────────────
    let catY = padTop;
    const catNodes = CATEGORIES.map((cat) => {
      const v = vals[cat.id] ?? 0;
      const h = (v / catTotal) * catBarsH;
      const node = { ...cat, y0: catY, y1: catY + h, h, value: v };
      catY += h + gap;
      return node;
    });

    // ── VSAA → soc ────────────────────────────────────────────
    const socNode       = catNodes.find((c) => c.id === "soc")!;
    const vsaaToSocLink = {
      id:    "vsaa_to_soc",
      color: "#FFD700",
      sx0: vsaaBudgetX + nodeW, sy0: vsaaY0,     sy1: vsaaY1,
      tx0: catColX,             ty0: socNode.y0,  ty1: socNode.y1,
    };

    // ── Valsts budžets → non-soc categories ───────────────────
    const nonSocAvailH   = valstsBudgetH - dotaciyaH;
    let   valstsToCatY   = valstsBudgetY0 + dotaciyaH;
    const nonSocCatNodes = catNodes.filter((c) => c.id !== "soc");
    const valstsToCatLinks = nonSocCatNodes.map((cat) => {
      const srcH = (cat.value / valstsBudgetVal) * nonSocAvailH;
      const sy0  = valstsToCatY;
      const sy1  = sy0 + srcH;
      valstsToCatY = sy1;
      return {
        id:    cat.id,
        color: cat.color,
        sx0: valstsBudgetX + nodeW, sy0, sy1,
        tx0: catColX,               ty0: cat.y0, ty1: cat.y1,
      };
    });

    // ── Sub-category nodes ────────────────────────────────────
    const subNodes: Array<{
      id: string; parentId: string; label: string; color: string;
      y0: number; y1: number; h: number; value: number;
    }> = [];
    const catToSubLinks: Array<{
      id: string; color: string;
      sx0: number; sy0: number; sy1: number;
      tx0: number; ty0: number; ty1: number;
    }> = [];

    CATS_WITH_SUBS.forEach((catId) => {
      const catNode   = catNodes.find((c) => c.id === catId)!;
      const subs      = SUB_CATEGORIES.filter((s) => s.parentId === catId);
      const subTotal  = subs.reduce((s, sub) => s + (vals[sub.id] ?? 0), 0);
      const subAvailH = catNode.h - gap * (subs.length - 1);

      let subY     = catNode.y0;
      let subLinkY = catNode.y0;

      subs.forEach((sub) => {
        const sv  = vals[sub.id] ?? 0;
        const h   = (sv / subTotal) * subAvailH;
        const sy0 = subLinkY;
        const sy1 = sy0 + h;
        subLinkY  = sy1;

        subNodes.push({
          id: sub.id, parentId: catId, label: sub.label,
          color: catNode.color, y0: subY, y1: subY + h, h, value: sv,
        });
        catToSubLinks.push({
          id: sub.id, color: catNode.color,
          sx0: catColX + nodeW, sy0, sy1,
          tx0: subColX,         ty0: subY, ty1: subY + h,
        });
        subY += h + gap;
      });
    });

    return {
      revNodes,
      vsaoiToVsaaLink,
      revToValtsLinks,
      dotaciyaLink,
      vsaaY0, vsaaY1, vsaaH,
      valstsBudgetY0, valstsBudgetY1, valstsBudgetH,
      vsaaToSocLink,
      valstsToCatLinks,
      catNodes, catTotal,
      socVal, vsaoiVal, dotaciyaVal, valstsBudgetVal,
      subNodes, catToSubLinks,
    };
  }, [year]);

  const {
    revNodes,
    vsaoiToVsaaLink,
    revToValtsLinks,
    dotaciyaLink,
    vsaaY0, vsaaY1, vsaaH,
    valstsBudgetY0, valstsBudgetY1, valstsBudgetH,
    vsaaToSocLink,
    valstsToCatLinks,
    catNodes, catTotal,
    socVal, vsaoiVal, dotaciyaVal, valstsBudgetVal,
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
      {/* ── Header ── */}
      <div style={{ width: "100%", maxWidth: svgW, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            color: "#FFD700", background: "transparent",
            border: "1px solid #FFD700", padding: "0.4rem 1rem",
            fontSize: "0.8rem", letterSpacing: "0.08em",
            cursor: "pointer", fontFamily: "inherit",
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
                border: "1px solid #FFD700", padding: "0.3rem 0.7rem",
                fontSize: "0.75rem", letterSpacing: "0.06em",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sankey SVG (scrollable container) ── */}
      <div style={{ width: "100%", maxWidth: svgW, overflowY: "auto" }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ width: "100%", display: "block", overflow: "visible" }}
        >
          {/* Revenue → Valsts budžets bands */}
          {revToValtsLinks.map((link) => (
            <path
              key={link.id}
              d={bandPath(link.sx0, link.sy0, link.sy1, link.tx0, link.ty0, link.ty1)}
              fill={link.color}
              opacity={hovered === null || hovered === link.id ? 0.28 : 0.06}
              style={{ transition: "opacity 0.15s" }}
              onMouseEnter={() => setHovered(link.id)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

          {/* VSAOI → VSAA band */}
          <path
            d={bandPath(
              vsaoiToVsaaLink.sx0, vsaoiToVsaaLink.sy0, vsaoiToVsaaLink.sy1,
              vsaoiToVsaaLink.tx0, vsaoiToVsaaLink.ty0, vsaoiToVsaaLink.ty1,
            )}
            fill={vsaoiToVsaaLink.color}
            opacity={hovered === null || hovered === "vsaoi_to_vsaa" ? 0.35 : 0.07}
            style={{ transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered("vsaoi_to_vsaa")}
            onMouseLeave={() => setHovered(null)}
          />

          {/* Valsts budžets → VSAA dotācija band */}
          <path
            d={bandPath(
              dotaciyaLink.sx0, dotaciyaLink.sy0, dotaciyaLink.sy1,
              dotaciyaLink.tx0, dotaciyaLink.ty0, dotaciyaLink.ty1,
            )}
            fill={dotaciyaLink.color}
            opacity={hovered === null || hovered === "dotaciya" ? 0.38 : 0.10}
            style={{ transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered("dotaciya")}
            onMouseLeave={() => setHovered(null)}
          />

          {/* VSAA → soc band */}
          <path
            d={bandPath(
              vsaaToSocLink.sx0, vsaaToSocLink.sy0, vsaaToSocLink.sy1,
              vsaaToSocLink.tx0, vsaaToSocLink.ty0, vsaaToSocLink.ty1,
            )}
            fill={vsaaToSocLink.color}
            opacity={hovered === null || hovered === "vsaa_to_soc" ? 0.28 : 0.06}
            style={{ transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered("vsaa_to_soc")}
            onMouseLeave={() => setHovered(null)}
          />

          {/* Valsts budžets → category bands */}
          {valstsToCatLinks.map((link) => (
            <path
              key={link.id}
              d={bandPath(link.sx0, link.sy0, link.sy1, link.tx0, link.ty0, link.ty1)}
              fill={link.color}
              opacity={hovered === null || hovered === link.id ? 0.28 : 0.06}
              style={{ transition: "opacity 0.15s" }}
              onMouseEnter={() => setHovered(link.id)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

          {/* Category → sub-category bands */}
          {catToSubLinks.map((link) => (
            <path
              key={link.id}
              d={bandPath(link.sx0, link.sy0, link.sy1, link.tx0, link.ty0, link.ty1)}
              fill={link.color}
              opacity={hovered === null || hovered === link.id ? 0.28 : 0.06}
              style={{ transition: "opacity 0.15s" }}
            />
          ))}

          {/* ── Revenue source nodes ── */}
          {revNodes.map((rev) => {
            const isHov = hovered === rev.id || (rev.id === "vsaoi" && hovered === "vsaoi_to_vsaa");
            const midY  = (rev.y0 + rev.y1) / 2;
            return (
              <g
                key={rev.id}
                onMouseEnter={() => setHovered(rev.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                <text x={revColX + nodeW / 2} y={rev.y0 - 3}
                  textAnchor="middle" fill={rev.color} fontSize={9}
                  opacity={isHov ? 1 : 0.65} fontWeight={isHov ? "bold" : "normal"}
                >
                  {formatEur(rev.value)}
                </text>
                <rect x={revColX} y={rev.y0} width={nodeW} height={rev.h}
                  fill={rev.color} opacity={isHov ? 1 : 0.85}
                />
                <text x={revColX - labelPad} y={midY + 4}
                  textAnchor="end" fill={rev.color} fontSize={11}
                  opacity={isHov ? 1 : 0.8} fontWeight={isHov ? "bold" : "normal"}
                >
                  {rev.label}
                </text>
              </g>
            );
          })}

          {/* ── VSAA budget node ── */}
          <rect x={vsaaBudgetX} y={vsaaY0} width={nodeW} height={vsaaH}
            fill="#34d399" opacity={0.9}
          />
          <text x={vsaaBudgetX + nodeW / 2} y={vsaaY0 - 18}
            textAnchor="middle" fill="#34d399" fontSize={9} opacity={0.85} letterSpacing={1}
          >
            VSAA
          </text>
          <text x={vsaaBudgetX + nodeW / 2} y={vsaaY0 - 6}
            textAnchor="middle" fill="#34d399" fontSize={8} opacity={0.65}
          >
            {formatEur(socVal)}
          </text>
          <text
            x={vsaaBudgetX + nodeW / 2}
            y={vsaaY1 + 14}
            textAnchor="middle"
            fill="#34d399"
            fontSize={8}
            opacity={hovered === "dotaciya" ? 0.9 : 0.4}
            style={{ transition: "opacity 0.15s" }}
          >
            VSAOI + Dotācija
          </text>

          {/* ── Valsts budžets node ── */}
          <rect x={valstsBudgetX} y={valstsBudgetY0} width={nodeW} height={valstsBudgetH}
            fill="#FFD700" opacity={0.9}
          />
          <text x={valstsBudgetX + nodeW / 2} y={valstsBudgetY0 - 18}
            textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.7} letterSpacing={1}
          >
            VALSTS
          </text>
          <text x={valstsBudgetX + nodeW / 2} y={valstsBudgetY0 - 6}
            textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.7} letterSpacing={1}
          >
            BUDŽETS
          </text>
          <text x={valstsBudgetX + nodeW / 2} y={valstsBudgetY1 + 14}
            textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.6}
          >
            {formatEur(valstsBudgetVal)}
          </text>

          {/* ── Dotācija annotation ── */}
          <text
            x={(valstsBudgetX + nodeW + vsaaBudgetX) / 2}
            y={(dotaciyaLink.sy0 + dotaciyaLink.ty1) / 2 + 4}
            textAnchor="middle"
            fill="#c0c0c0"
            fontSize={8}
            opacity={hovered === "dotaciya" ? 0.95 : 0.45}
            style={{ transition: "opacity 0.15s" }}
          >
            Dotācija {formatEur(dotaciyaVal)}
          </text>

          {/* ── Category nodes ── */}
          {catNodes.map((cat) => {
            const isHov   = hovered === cat.id || (cat.id === "soc" && hovered === "vsaa_to_soc");
            const midY    = (cat.y0 + cat.y1) / 2;
            const hasSubs = CATS_WITH_SUBS.has(cat.id);
            return (
              <g
                key={cat.id}
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                <text
                  x={hasSubs ? catColX + nodeW / 2 : catColX + nodeW + labelPad}
                  y={cat.y0 - 4}
                  textAnchor={hasSubs ? "middle" : "start"}
                  fill={cat.color} fontSize={9}
                  opacity={isHov ? 1 : 0.75} fontWeight={isHov ? "bold" : "normal"}
                >
                  {formatEur(cat.value)}
                </text>
                <rect x={catColX} y={cat.y0} width={nodeW} height={cat.h}
                  fill={cat.color} opacity={isHov ? 1 : 0.85}
                />
                {!hasSubs && (
                  <text x={catColX + nodeW + labelPad} y={midY + 4}
                    fill={cat.color} fontSize={11}
                    opacity={isHov ? 1 : 0.8}
                  >
                    {cat.label}
                  </text>
                )}
                {hasSubs && (
                  <text x={catColX - labelPad} y={midY + 4}
                    textAnchor="end" fill={cat.color} fontSize={11}
                    opacity={isHov ? 1 : 0.8}
                  >
                    {cat.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Sub-category nodes ── */}
          {subNodes.map((sub) => {
            const midY = (sub.y0 + sub.y1) / 2;
            return (
              <g key={sub.id}>
                <text x={subColX + nodeW / 2} y={sub.y0 - 3}
                  textAnchor="middle" fill={sub.color} fontSize={9} opacity={0.65}
                >
                  {formatEur(sub.value)}
                </text>
                <rect x={subColX} y={sub.y0} width={nodeW} height={sub.h}
                  fill={sub.color} opacity={0.8}
                />
                <text x={subColX + nodeW + labelPad} y={midY + 4}
                  fill={sub.color} fontSize={10} opacity={0.75}
                >
                  {sub.label}
                </text>
              </g>
            );
          })}

          {/* Column headers */}
          <text x={revColX + nodeW / 2} y={padTop - 50}
            textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.4} letterSpacing={1}
          >
            IEŅĒMUMI
          </text>
          <text x={catColX + nodeW / 2} y={padTop - 50}
            textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.4} letterSpacing={1}
          >
            IZDEVUMI
          </text>
          <text x={subColX + nodeW / 2} y={padTop - 50}
            textAnchor="middle" fill="#FFD700" fontSize={8} opacity={0.4} letterSpacing={1}
          >
            DETAĻAS
          </text>

          {/* Total label */}
          <text x={catColX + nodeW / 2} y={padTop - 38}
            textAnchor="middle" fill="#FFD700" fontSize={9} opacity={0.55}
          >
            {formatEur(catTotal)}
          </text>

          {/* Data source note */}
          <text x={svgW - 4} y={svgH - 6} textAnchor="end"
            fill="#FFD700" fontSize={8} opacity={0.3}
          >
            Avots: budzets.kase.gov.lv · aplēses
          </text>
        </svg>
      </div>
    </div>
  );
}
