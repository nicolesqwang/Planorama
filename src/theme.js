export const THEMES = {
  green: {
    name: "Green",
    swatch: "#4A5C35",
    primary: "#4A5C35",
    primaryHover: "#3D4D2C",
    onPrimary: "#EEF1DE",
    bgPage: "#F7F8EE",
    bgCard: "#F4F5E8",
    bgInput: "#E9ECCF",
    bgAccent: "#DDE0C0",
    border: "#C3C7A6",
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
    bgPage: "#FEF8FA",
    bgCard: "#FDF3F6",
    bgInput: "#F9E8EE",
    bgAccent: "#F2D5E0",
    border: "#E4B8CC",
    textDark: "#5C1A30",
    textMed: "#8A4560",
    textMuted: "#B07888",
  },
  lavender: {
    name: "Lavender",
    swatch: "#D8CFF0",
    primary: "#5B3D9E",
    primaryHover: "#4D3388",
    onPrimary: "#F0EEFF",
    bgPage: "#F9F7FF",
    bgCard: "#F5F2FC",
    bgInput: "#EDE8FA",
    bgAccent: "#DDD5F5",
    border: "#C5B8E8",
    textDark: "#2E1A5A",
    textMed: "#6850A0",
    textMuted: "#9580C0",
  },
  periwinkle: {
    name: "Periwinkle",
    swatch: "#C8D5F0",
    primary: "#2E4FA0",
    primaryHover: "#254288",
    onPrimary: "#EEF2FF",
    bgPage: "#F5F7FE",
    bgCard: "#EFF3FC",
    bgInput: "#E3ECFA",
    bgAccent: "#D0DDF5",
    border: "#B0C4E8",
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
    bgPage: "#F5FDF8",
    bgCard: "#EEF9F3",
    bgInput: "#E0F5EA",
    bgAccent: "#C8EDD8",
    border: "#A5D8BE",
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
    bgPage: "#F3FBFE",
    bgCard: "#EBF8FB",
    bgInput: "#D8F0F7",
    bgAccent: "#BDE8F0",
    border: "#98D0DC",
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
    bgPage: "#FEFDF2",
    bgCard: "#FDFAE8",
    bgInput: "#F8F2D5",
    bgAccent: "#F0E8B8",
    border: "#D8CCA0",
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
    bgCard: "#FDF3EC",
    bgInput: "#F9E8D8",
    bgAccent: "#F0D4BC",
    border: "#D8B898",
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
