import { Platform } from "react-native";

/**
 * Paleta de l'aplicació: paper crema i tinta violeta.
 *
 * El fosc comparteix temperatura amb el violeta, color del moviment feminista.
 *
 * Tots els parells de color superen els mínims de les WCAG 2.2. Ràtios sobre
 * `bg`:
 *
 *   text            14,06:1        accent           6,67:1
 *   textSecondary    5,86:1        love             5,76:1
 *   controlBorder    3,54:1  (mínim 3 per a vores de controls, criteri 1.4.11)
 *
 * `border` és per a separadors decoratius, que no tenen mínim exigit;
 * `controlBorder` per a vores de camps i botons, que sí.
 *
 * Cap pantalla escriu colors directament: totes fan servir aquestes constants.
 */
export const COLORS = {
  // fons
  bg: "#faf8f4",
  // Lila translúcid: es compon amb el que hi ha a sota. Fons dels camps de
  // text, estat premut de les targetes i superfícies elevades un pas.
  lightBg: "rgba(95,75,155,0.06)",
  darkBg: "#2e2140",

  // text
  text: "#2e2140",
  textSecondary: "#675c78",

  // línies
  border: "#e4dcef",
  controlBorder: "#8a7f9c",

  // colors amb significat
  accent: "#5f4b9b",
  love: "#9c4a30",

  // fons dels estats actius, cadascun amb el seu color de text al davant
  likeBg: "#F7EDE9",      // amb love         -> 5,31:1
  visitedBg: "#EAE5F5",   // amb accent       -> 5,74:1
  badgeBg: "#E8E2F0",     // amb badgeText    -> 5,59:1
  badgeText: "#5f4b9b",
  tagBg: "#ece7f3",       // amb tagText      -> 6,01:1
  tagText: "#5d5170",

  // punt de la ubicació de l'usuari al mapa: es manté blau
  userDot: "#4A90D9",

  // text clar sobre fons foscos i sobre el vel de les fotografies
  onDark: "#FFFFFF",
};

/**
 * Vel fosc sobre les fotografies de parada perquè el títol sempre sigui llegible.
 */
export const VEL_RGB = "30,20,42";

// El projecte no empaqueta cap tipografia pròpia: es fan servir les famílies
// del sistema, existents als dos sistemes operatius.
export const FONTS = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  sans: Platform.select({ ios: "System", android: "sans-serif", default: "sans-serif" }),
};

/**
 * Els dos nivells de capçalera de l'aplicació.
 */
export const TITOL_PANTALLA = {
  fontFamily: FONTS.serif,
  fontSize: 20,
  fontWeight: "600",
  color: COLORS.text,
  lineHeight: 26,
} as const;

export const ROTUL_SECCIO = {
  fontFamily: FONTS.sans,
  fontSize: 11,
  fontWeight: "700",
  letterSpacing: 1,
  textTransform: "uppercase",
  color: COLORS.textSecondary,
} as const;

/**
 * El nom de l'aplicació.
 */
export const APP = {
  nom: "TarraDona",
  subtitol: "Literària",
};

/**
 * Dades del projecte que ensenya la pantalla d'informació.
 */
export const PROJECTE = {
  web: "https://sites.google.com/view/veusdedona/",
  correu: "",
  repositori: "https://github.com/sssalma/veus-de-dona",
};

// Longitud mínima de contrasenya per avisar l'usuari abans d'enviar.
export const PASSWORD_MIN_LENGTH = 8;
