export const MAX_SIM_YEARS = 500;
export const MAX_TICK = 1000;
export const MAX_DEBRIS = 30;

export const WASTE_TYPES = [
  {
    id: "paper",
    name: "Kertas & kardus",
    material: "Serat kertas",
    durationYears: 0.25,
    durationLabel: "sekitar 3 bulan",
    shortDuration: "3 bln",
    buoyancy: "sink",
    endMode: "dissolve",
    color: "#8a5a36",
    tint: "#f7ede1",
    fact: "Kertas dan kardus cepat lunak di air laut dan terurai dalam sekitar 3 bulan.",
  },
  {
    id: "bag",
    name: "Kantong plastik",
    material: "Plastik tipis (HDPE/LDPE)",
    durationYears: 20,
    durationLabel: "sekitar 20 tahun",
    shortDuration: "20 thn",
    buoyancy: "midwater",
    endMode: "microplastic",
    color: "#c75a24",
    tint: "#fff0e4",
    fact: "Kantong plastik melayang seperti ubur-ubur dan pecah menjadi mikroplastik dalam sekitar 20 tahun.",
  },
  {
    id: "bottle",
    name: "Botol plastik",
    material: "Plastik PET",
    durationYears: 450,
    durationLabel: "sekitar 450 tahun",
    shortDuration: "450 thn",
    buoyancy: "surface",
    endMode: "microplastic",
    color: "#0e7692",
    tint: "#dff7fa",
    fact: "Botol plastik PET dapat bertahan di laut hingga sekitar 450 tahun sebelum menjadi serpihan kecil.",
  },
  {
    id: "can",
    name: "Kaleng aluminium",
    material: "Logam aluminium",
    durationYears: 500,
    durationLabel: "hingga 500 tahun",
    shortDuration: "500 thn",
    buoyancy: "sink",
    endMode: "dissolve",
    color: "#5557a6",
    tint: "#efefff",
    fact: "Kaleng aluminium tenggelam ke dasar laut dan butuh hingga 500 tahun untuk berkarat dan hancur.",
  },
  {
    id: "foam",
    name: "Styrofoam",
    material: "Busa polistirena",
    durationYears: 9999,
    durationLabel: "sangat lama (>500 thn)",
    shortDuration: ">500 thn",
    buoyancy: "surface",
    endMode: "microplastic",
    color: "#436b5d",
    tint: "#eaf5f0",
    fact: "Styrofoam mengapung di permukaan dan nyaris tidak bisa terurai secara alami di laut.",
  },
];

export const MILESTONES = [
  { label: "0", years: 0 },
  { label: "3 bln", years: 0.25 },
  { label: "20 thn", years: 20 },
  { label: "100 thn", years: 100 },
  { label: "450 thn", years: 450 },
  { label: "500 thn", years: 500 },
];

export const SPEED_OPTIONS = [
  { value: 1, label: "1x" },
  { value: 3, label: "3x" },
  { value: 5, label: "5x" },
];

const SEGMENTS = [
  { t0: 0, t1: 250, y0: 0, y1: 1 },
  { t0: 250, t1: 500, y0: 1, y1: 20 },
  { t0: 500, t1: 750, y0: 20, y1: 100 },
  { t0: 750, t1: 1000, y0: 100, y1: 500 },
];

export function tickToYears(tick) {
  const clamped = Math.max(0, Math.min(MAX_TICK, tick));
  for (const seg of SEGMENTS) {
    if (clamped <= seg.t1) {
      const ratio = (clamped - seg.t0) / (seg.t1 - seg.t0);
      return seg.y0 + ratio * (seg.y1 - seg.y0);
    }
  }
  return MAX_SIM_YEARS;
}

export function yearsToTick(years) {
  const clamped = Math.max(0, Math.min(MAX_SIM_YEARS, years));
  for (const seg of SEGMENTS) {
    if (clamped <= seg.y1) {
      const ratio = (clamped - seg.y0) / (seg.y1 - seg.y0);
      return seg.t0 + ratio * (seg.t1 - seg.t0);
    }
  }
  return MAX_TICK;
}

export function formatSimTime(years) {
  if (years < 1) {
    const months = Math.round(years * 12);
    return {
      value: String(months),
      padded: String(months).padStart(3, "0"),
      unit: "bln",
      longUnit: "bulan",
      prefix: "Bulan ke",
    };
  }
  const rounded = Math.round(years);
  return {
    value: String(rounded),
    padded: String(rounded).padStart(3, "0"),
    unit: "thn",
    longUnit: "tahun",
    prefix: "Tahun ke",
  };
}

export function getDecayStage(decay, wasteType) {
  if (decay < 0.25) {
    return { key: "intact", label: "Masih utuh", tone: "intact" };
  }
  if (decay < 0.65) {
    return { key: "weathered", label: "Mulai rapuh", tone: "weathered" };
  }
  if (decay < 1) {
    return { key: "fragmenting", label: "Terpecah", tone: "fragmenting" };
  }
  if (wasteType.endMode === "microplastic") {
    return { key: "microplastic", label: "Mikroplastik", tone: "microplastic" };
  }
  return { key: "dissolved", label: "Terurai", tone: "dissolved" };
}
