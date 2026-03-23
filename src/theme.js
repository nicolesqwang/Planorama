// ── Color utilities ─────────────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      default: h = ((r-g)/d + 4)/6;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  let r,g,b;
  if (s===0) { r=g=b=l; }
  else {
    const hue2rgb = (p,q,t) => {
      if(t<0)t+=1; if(t>1)t-=1;
      if(t<1/6)return p+(q-p)*6*t;
      if(t<1/2)return q;
      if(t<2/3)return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return "#"+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");
}

// Generate a full harmonious theme from any hex color.
// The hue is extracted from the picked color; everything else is derived
// using the same proportions as the hand-crafted preset themes.
export function generateThemeFromColor(hex) {
  const [h] = hexToHsl(hex);
  return {
    name: "Custom",
    swatch: hslToHex(h, 55, 78),
    primary:      hslToHex(h, 48, 33),
    primaryHover: hslToHex(h, 48, 26),
    onPrimary:    hslToHex(h, 30, 95),
    bgPage:       hslToHex(h, 18, 98),
    bgCard:       hslToHex(h, 22, 95),
    bgInput:      hslToHex(h, 30, 89),
    bgAccent:     hslToHex(h, 30, 83),
    border:       hslToHex(h, 24, 74),
    textDark:     hslToHex(h, 45, 22),
    textMed:      hslToHex(h, 28, 40),
    textMuted:    hslToHex(h, 18, 57),
  };
}

// ── Preset themes ────────────────────────────────────────────────
export const THEMES = {
  green: {
    name: "Green",
    swatch: "#4A5C35",
    primary: "#4A5C35",
    primaryHover: "#3D4D2C",
    onPrimary: "#EEF1DE",
    bgPage: "#FAFBF6",
    bgCard: "#F4F5EC",
    bgInput: "#E5E9CA",
    bgAccent: "#D6DAB2",
    border: "#C0C5A0",
    textDark: "#3A4A28",
    textMed: "#6B7255",
    textMuted: "#8A9170",
  },
  blush: {
    name: "Blush",
    swatch: "#F5D0D8",
    primary: "#9B3558",
    primaryHover: "#852D4B",
    onPrimary: "#FDEEF5",
    bgPage: "#FEF9FA",
    bgCard: "#FAF1F4",
    bgInput: "#F2DCE4",
    bgAccent: "#E8C8D4",
    border: "#D8AABC",
    textDark: "#5C1A30",
    textMed: "#8A4560",
    textMuted: "#A87080",
  },
  lavender: {
    name: "Lavender",
    swatch: "#D8CFF0",
    primary: "#5B3D9E",
    primaryHover: "#4D3388",
    onPrimary: "#F0EEFF",
    bgPage: "#FAFAFF",
    bgCard: "#F3F0FB",
    bgInput: "#E5DDFA",
    bgAccent: "#D5CBF0",
    border: "#BEB0E0",
    textDark: "#2E1A5A",
    textMed: "#6850A0",
    textMuted: "#9080B8",
  },
  periwinkle: {
    name: "Periwinkle",
    swatch: "#C8D5F0",
    primary: "#2E4FA0",
    primaryHover: "#254288",
    onPrimary: "#EEF2FF",
    bgPage: "#F8FAFF",
    bgCard: "#EDF2FD",
    bgInput: "#DAEAF8",
    bgAccent: "#C8D8F2",
    border: "#A8C0E4",
    textDark: "#1A2E5C",
    textMed: "#3A5090",
    textMuted: "#7080B0",
  },
  mint: {
    name: "Mint",
    swatch: "#C4EDD4",
    primary: "#256845",
    primaryHover: "#1D5538",
    onPrimary: "#E8FAF0",
    bgPage: "#F6FDF8",
    bgCard: "#EDF8F2",
    bgInput: "#D8F0E4",
    bgAccent: "#C0E8D0",
    border: "#9CD0B4",
    textDark: "#1A3D28",
    textMed: "#357055",
    textMuted: "#65A880",
  },
  sky: {
    name: "Sky",
    swatch: "#BDE8F0",
    primary: "#1E6880",
    primaryHover: "#18576A",
    onPrimary: "#E8F7FA",
    bgPage: "#F5FCFE",
    bgCard: "#E8F5FA",
    bgInput: "#D0ECF5",
    bgAccent: "#B8E4F0",
    border: "#90CCDA",
    textDark: "#1A3848",
    textMed: "#2A6878",
    textMuted: "#5898B0",
  },
  butter: {
    name: "Butter",
    swatch: "#F5EDB8",
    primary: "#7A6818",
    primaryHover: "#655510",
    onPrimary: "#FEFBE8",
    bgPage: "#FEFDF5",
    bgCard: "#FCF8E8",
    bgInput: "#F4EAC8",
    bgAccent: "#EAE0B0",
    border: "#D2C498",
    textDark: "#483810",
    textMed: "#7A6830",
    textMuted: "#A09050",
  },
  peach: {
    name: "Peach",
    swatch: "#F5D4BC",
    primary: "#9A4820",
    primaryHover: "#803C18",
    onPrimary: "#FFF0E8",
    bgPage: "#FEF9F5",
    bgCard: "#FBF0E8",
    bgInput: "#F5DEC8",
    bgAccent: "#ECCAB8",
    border: "#D0AC88",
    textDark: "#4A2010",
    textMed: "#904020",
    textMuted: "#B07050",
  },
};

export const DEFAULT_THEME_KEY = "green";

function applyThemeObj(theme) {
  const root = document.documentElement;
  root.style.setProperty("--t-primary",       theme.primary);
  root.style.setProperty("--t-primary-hover",  theme.primaryHover);
  root.style.setProperty("--t-on-primary",     theme.onPrimary);
  root.style.setProperty("--t-bg-page",        theme.bgPage);
  root.style.setProperty("--t-bg-card",        theme.bgCard);
  root.style.setProperty("--t-bg-input",       theme.bgInput);
  root.style.setProperty("--t-bg-accent",      theme.bgAccent);
  root.style.setProperty("--t-border",         theme.border);
  root.style.setProperty("--t-text-dark",      theme.textDark);
  root.style.setProperty("--t-text-med",       theme.textMed);
  root.style.setProperty("--t-text-muted",     theme.textMuted);
}

export function applyTheme(themeKey, overrideTheme = null) {
  applyThemeObj(overrideTheme || THEMES[themeKey] || THEMES.green);
}
