/**
 * Utility for color detection and normalization from Google Sheets.
 */

// Common hex values from Google Sheets color picker palette (purples/violets/magentas)
const GOOGLE_SHEETS_PURPLE_HEXES = new Set([
  '#9900ff', '#8e7cc3', '#674ea7', '#351c75', '#20124d',
  '#b4a7d6', '#d9d2e9',
  '#a64d79', '#741b47', '#4c1130', '#c27ba0', '#d5a6bd', '#ead1dc',
  '#800080', '#8a2be2', '#9400d3', '#9932cc', '#ba55d3', '#8000ff',
  '#7c3aed', '#6d28d9', '#5b21b6', '#a855f7', '#9333ea', '#7e22ce',
  '#4a148c', '#6a1b9a', '#7b1fa2', '#8e24aa', '#9c27b0', '#ab47bc',
]);

/**
 * Checks whether a given color (hex, rgb, or named) is purple / violet.
 * Robust against any Google Sheets color palette selection or custom hex codes.
 */
export function isPurpleColor(color?: string | null): boolean {
  if (!color) return false;
  const c = color.trim().toLowerCase();

  // Exclude defaults, grays, black, white, transparent
  if (
    !c ||
    c === '#ffffff' ||
    c === '#fff' ||
    c === 'white' ||
    c === '#000000' ||
    c === '#000' ||
    c === 'black' ||
    c === '#434343' ||
    c === 'transparent'
  ) {
    return false;
  }

  // Check known Sheets purple palette codes
  if (GOOGLE_SHEETS_PURPLE_HEXES.has(c)) {
    return true;
  }

  // Keyword match
  if (
    c.includes('purple') ||
    c.includes('violet') ||
    c.includes('fuchsia') ||
    c.includes('magenta') ||
    c.includes('plum') ||
    c.includes('orchid')
  ) {
    return true;
  }

  // Parse HEX
  let r = 0,
    g = 0,
    b = 0;
  const hex6 = c.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex6) {
    r = parseInt(hex6[1], 16);
    g = parseInt(hex6[2], 16);
    b = parseInt(hex6[3], 16);
  } else {
    const hex3 = c.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
    if (hex3) {
      r = parseInt(hex3[1] + hex3[1], 16);
      g = parseInt(hex3[2] + hex3[2], 16);
      b = parseInt(hex3[3] + hex3[3], 16);
    } else {
      const rgb = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (rgb) {
        r = parseInt(rgb[1], 10);
        g = parseInt(rgb[2], 10);
        b = parseInt(rgb[3], 10);
      } else {
        return false;
      }
    }
  }

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  const l = (max + min) / 2;

  // Too low saturation or extreme lightness is not purple
  if (delta < 0.08 || l < 0.08 || l > 0.94) {
    return false;
  }

  let h = 0;
  if (max === rNorm) {
    h = ((gNorm - bNorm) / delta) % 6;
  } else if (max === gNorm) {
    h = (bNorm - rNorm) / delta + 2;
  } else {
    h = (rNorm - gNorm) / delta + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = delta / (1 - Math.abs(2 * l - 1));

  // Purple / Violet / Fuchsia / Orchid spans from 248° to 335°
  const isPurpleHue = h >= 248 && h <= 335;
  const isPurpleRgb = b >= g && (r > g * 0.9 || b > g * 1.2);

  return isPurpleHue && isPurpleRgb && s >= 0.14;
}
