export const THEMES = {
  green: {
    name: "Green",
    swatch: "#4A5C35",
    primary: "#4A5C35",
    primaryHover: "#3D4D2C",
    onPrimary: "#EEF1DE",
    bgPage: "#FAFBF6",      // near-white with faint green tint
    bgCard: "#F4F5EC",      // very light
    bgInput: "#E5E9CA",     // sidebar — distinct but softer
    bgAccent: "#D6DAB2",    // hover states
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
    bgPage: "#FEF9FA",      // near-white with faint pink tint
    bgCard: "#FAF1F4",      // very light pink
    bgInput: "#F2DCE4",     // sidebar
    bgAccent: "#E8C8D4",    // hover
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
    bgPage: "#FAFAFF",      // near-white with faint purple tint
    bgCard: "#F3F0FB",      // very light purple
    bgInput: "#E5DDFA",     // sidebar
    bgAccent: "#D5CBF0",    // hover
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
    bgPage: "#F8FAFF",      // near-white with faint blue tint
    bgCard: "#EDF2FD",      // very light blue
    bgInput: "#DAEAF8",     // sidebar
    bgAccent: "#C8D8F2",    // hover
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
    bgPage: "#F6FDF8",      // near-white with faint mint
    bgCard: "#EDF8F2",      // very light mint
    bgInput: "#D8F0E4",     // sidebar
    bgAccent: "#C0E8D0",    // hover
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
    bgPage: "#F5FCFE",      // near-white with faint sky blue
    bgCard: "#E8F5FA",      // very light sky
    bgInput: "#D0ECF5",     // sidebar
    bgAccent: "#B8E4F0",    // hover
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
    bgPage: "#FEFDF5",      // near-white with faint butter
    bgCard: "#FCF8E8",      // very light butter
    bgInput: "#F4EAC8",     // sidebar
    bgAccent: "#EAE0B0",    // hover
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
    bgPage: "#FEF9F5",      // near-white with faint peach
    bgCard: "#FBF0E8",      // very light peach
    bgInput: "#F5DEC8",     // sidebar
    bgAccent: "#ECCAB8",    // hover
    border: "#D0AC88",
    textDark: "#4A2010",
    textMed: "#904020",
    textMuted: "#B07050",
  },
};

export const DEFAULT_THEME_KEY = "green";

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.green;
  const root = document.documentElement;
  root.style.setProperty("--t-primary", theme.primary);
  root.style.setProperty("--t-primary-hover", theme.primaryHover);
  root.style.setProperty("--t-on-primary", theme.onPrimary);
  root.style.setProperty("--t-bg-page", theme.bgPage);
  root.style.setProperty("--t-bg-card", theme.bgCard);
  root.style.setProperty("--t-bg-input", theme.bgInput);
  root.style.setProperty("--t-bg-accent", theme.bgAccent);
  root.style.setProperty("--t-border", theme.border);
  root.style.setProperty("--t-text-dark", theme.textDark);
  root.style.setProperty("--t-text-med", theme.textMed);
  root.style.setProperty("--t-text-muted", theme.textMuted);
}
