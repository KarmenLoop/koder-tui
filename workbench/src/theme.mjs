import { mix, scale, spectrum } from "./cli.mjs";

export const C = {
  text: [226, 230, 242],
  soft: [176, 182, 204],
  dim: [128, 134, 158],
  faint: [84, 90, 114],
  accent: [120, 190, 255],
  cyan: [38, 214, 255],
  violet: [176, 132, 255],
  ok: [96, 220, 140],
  warn: [255, 200, 90],
  bad: [255, 110, 120],
  headerBg: [17, 19, 28],
  panelBg: [22, 24, 34],
  codeBg: [28, 31, 44],
  selectBg: [44, 52, 86],
  border: [70, 76, 104],
};

export { mix, scale, spectrum };

// Hue that drifts with time: t in [0, 1) walks the spectrum and back.
export function drift(offset, phase) {
  const t = (offset + phase) % 2;
  return spectrum(t <= 1 ? t : 2 - t);
}

export function gradient(text, { from = 0, to = 1, bold = false, bright = 1, phase = 0 } = {}) {
  const chars = [...text];
  const span = Math.max(1, chars.length - 1);
  return chars.map((ch, i) => ({
    text: ch,
    style: { fg: scale(phase ? drift(from + (to - from) * (i / span), phase) : spectrum(from + (to - from) * (i / span)), bright), bold },
  }));
}
