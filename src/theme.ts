export type Theme = "dark" | "light";

export interface ThemeColors {
  panelBg: string;
  panelBorder: string;
  textColor: string;
  textShadow: string;
  subtleTextShadow: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  inputBg: string;
  inputBorder: string;
  inputPlaceholder: string;
  btnBg: string;
  btnHoverBg: string;
  btnBorder: string;
  tabInactiveBg: string;
  tabInactiveColor: string;
  tabActiveBg: string;
  tabActiveColor: string;
  // Caustics
  causticTop: string;
  causticMid: string;
  causticLow: string;
  // Prismatic edge
  prismGradient: string;
  // Specular
  specularSweep: string;
  specularEdge: string;
  rimLight: string;
  // Panel shadow
  panelShadow: string;
  // Misc
  bottomGrabber: string;
  accentGlow: string;
}

const dark: ThemeColors = {
  panelBg: "linear-gradient(170deg, #1a1f2e 0%, #151d2b 35%, #182230 70%, #131b28 100%)",
  panelBorder: "1px solid rgba(255,255,255,0.12)",
  textColor: "rgba(255,255,255,0.95)",
  textShadow: "0 1px 4px rgba(0,0,0,0.7)",
  subtleTextShadow: "0 1px 2px rgba(0,0,0,0.5)",
  cardBg: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.1)",
  cardShadow: "0 1px 3px rgba(0,0,0,0.15)",
  inputBg: "rgba(255,255,255,0.12)",
  inputBorder: "rgba(255,255,255,0.18)",
  inputPlaceholder: "rgba(255,255,255,0.35)",
  btnBg: "rgba(255,255,255,0.15)",
  btnHoverBg: "rgba(255,255,255,0.25)",
  btnBorder: "rgba(255,255,255,0.18)",
  tabInactiveBg: "transparent",
  tabInactiveColor: "rgba(255,255,255,0.5)",
  tabActiveBg: "rgba(255,255,255,0.25)",
  tabActiveColor: "rgba(255,255,255,1)",
  causticTop: "radial-gradient(ellipse 55% 50% at 45% 40%, rgba(147,197,253,0.1) 0%, rgba(96,165,250,0.04) 25%, transparent 55%)",
  causticMid: "radial-gradient(ellipse 55% 50% at 55% 45%, rgba(6,182,212,0.12) 0%, rgba(34,211,238,0.05) 25%, transparent 55%)",
  causticLow: "radial-gradient(ellipse 50% 45% at 40% 40%, rgba(59,130,246,0.06) 0%, rgba(37,99,235,0.03) 28%, transparent 55%)",
  prismGradient: `linear-gradient(155deg,
    rgba(255,255,255,0.5) 0%,
    rgba(167,243,248,0.35) 15%,
    rgba(34,211,238,0.25) 35%,
    rgba(255,255,255,0.35) 52%,
    rgba(167,243,248,0.22) 70%,
    rgba(255,255,255,0.45) 100%
  ) border-box`,
  specularSweep: "linear-gradient(140deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 25%, transparent 50%)",
  specularEdge: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 15%, transparent 30%)",
  rimLight: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 30%, transparent 60%)",
  panelShadow: `none`,
  bottomGrabber: "rgba(255,255,255,0.2)",
  accentGlow: "0 0 8px rgba(34,211,238,0.12)",
};

const light: ThemeColors = {
  panelBg: "linear-gradient(170deg, #f8fafc 0%, #f1f5f9 35%, #f5f8fc 70%, #eef2f6 100%)",
  panelBorder: "1px solid rgba(0,0,0,0.08)",
  textColor: "rgba(15,23,42,0.92)",
  textShadow: "none",
  subtleTextShadow: "none",
  cardBg: "rgba(0,0,0,0.03)",
  cardBorder: "rgba(0,0,0,0.08)",
  cardShadow: "0 1px 2px rgba(0,0,0,0.06)",
  inputBg: "rgba(0,0,0,0.04)",
  inputBorder: "rgba(0,0,0,0.12)",
  inputPlaceholder: "rgba(15,23,42,0.35)",
  btnBg: "rgba(0,0,0,0.06)",
  btnHoverBg: "rgba(0,0,0,0.12)",
  btnBorder: "rgba(0,0,0,0.1)",
  tabInactiveBg: "transparent",
  tabInactiveColor: "rgba(15,23,42,0.45)",
  tabActiveBg: "rgba(0,0,0,0.1)",
  tabActiveColor: "rgba(15,23,42,0.95)",
  causticTop: "radial-gradient(ellipse 55% 50% at 45% 40%, rgba(147,197,253,0.18) 0%, rgba(96,165,250,0.08) 25%, transparent 55%)",
  causticMid: "radial-gradient(ellipse 55% 50% at 55% 45%, rgba(56,189,248,0.15) 0%, rgba(14,165,233,0.06) 25%, transparent 55%)",
  causticLow: "radial-gradient(ellipse 50% 45% at 40% 40%, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 28%, transparent 55%)",
  prismGradient: `linear-gradient(155deg,
    rgba(255,255,255,0.9) 0%,
    rgba(186,230,253,0.6) 15%,
    rgba(56,189,248,0.5) 35%,
    rgba(255,255,255,0.7) 52%,
    rgba(186,230,253,0.45) 70%,
    rgba(255,255,255,0.85) 100%
  ) border-box`,
  specularSweep: "linear-gradient(140deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 25%, transparent 50%)",
  specularEdge: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 15%, transparent 30%)",
  rimLight: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)",
  panelShadow: `none`,
  bottomGrabber: "rgba(0,0,0,0.15)",
  accentGlow: "0 0 8px rgba(56,189,248,0.15)",
};

export const themes: Record<Theme, ThemeColors> = { dark, light };