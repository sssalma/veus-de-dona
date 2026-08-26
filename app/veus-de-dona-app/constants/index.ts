import { Platform } from "react-native";

/**
 * Paleta de l'aplicació: "violeta com a tinta".
 *
 * Paper crema i tinta amb una ombra d'aubergínia. El fosc no és un negre
 * neutre sinó que comparteix temperatura amb el violeta, de manera que el
 * color del moviment feminista -que en una app que es diu Veus de Dona és
 * significat i no decoració- deixa de ser un accent solitari i tenyeix també
 * les capçaleres, els botons plens i el vel de les fotografies. De lluny es
 * llegeix com a negre; de prop, el conjunt té temperatura.
 *
 * Tots els parells de color superen els mínims de les WCAG 2.2. Ràtios sobre
 * `bg`, mesurades amb la fórmula de luminància relativa:
 *
 *   text            14,06:1        accent           6,67:1
 *   textSecondary    5,86:1        love             5,76:1
 *   controlBorder    3,54:1  (mínim 3 per a vores de controls, criteri 1.4.11)
 *
 * `border` és per a separadors decoratius, que no tenen mínim exigit;
 * `controlBorder` per a vores de camps i botons, que sí.
 *
 * Cap pantalla ha d'escriure un color a mà: tot el que calgui es defineix aquí
 * perquè un canvi de paleta sigui un canvi d'un sol fitxer.
 */
export const COLORS = {
  // fons
  bg: "#faf8f4",
  // Lila translúcid en lloc d'un to sòlid: es compon amb el que hi ha a sota,
  // de manera que insinua el color sense competir amb el paper. S'usa per al
  // fons dels camps de text, per a l'estat premut de les targetes i per a les
  // superfícies que s'aixequen un pas per damunt del fons.
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

  // punt de la ubicació de l'usuari al mapa: es manté blau perquè no es pugui
  // confondre amb els pins de parada, que fan servir l'accent
  userDot: "#4A90D9",

  // text clar sobre fons foscos i sobre el vel de les fotografies
  onDark: "#FFFFFF",
};

/**
 * Vel fosc que se superposa a les fotografies de parada perquè el títol s'hi
 * llegeixi sigui quina sigui la imatge. Porta la mateixa ombra d'aubergínia
 * que la tinta. En el pitjor cas possible -una fotografia blanca pura- el text
 * blanc sobre el tram més opac encara dona 9,4:1.
 */
export const VEL_RGB = "30,20,42";

// El projecte no empaqueta cap tipografia pròpia: es fan servir les famílies
// del sistema, que sí que existeixen a tots dos sistemes operatius.
export const FONTS = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  sans: Platform.select({ ios: "System", android: "sans-serif", default: "sans-serif" }),
};

/**
 * Els dos nivells de capçalera de l'aplicació.
 *
 * Hi havia sis mides diferents de títol de pantalla -de 13 a 24- i vuit
 * espaiats diferents als rètols de secció, tot per al mateix paper. Definir-ho
 * aquí és el que fa que un canvi de tipografia torni a ser un canvi d'un sol
 * fitxer, igual que passa amb la paleta.
 *
 * Tres pantalles no els fan servir, i és a posta:
 *
 *   - El mapa porta un títol de 43 caràcters i el necessita més petit i en
 *     versaletes perquè càpiga al costat dels controls.
 *   - La fitxa de parada escriu el nom de la parada en blanc sobre la
 *     fotografia: és un títol de contingut, no la barra de la pantalla.
 *   - Les pantalles d'accés no tenen títol sinó el nom de l'aplicació en
 *     cursiva, que és una marca i no un encapçalament.
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
 * Dades del projecte que la pantalla d'informació ensenya.
 *
 * El correu es deixa buit a posta: al lloc web del projecte no n'hi ha cap de
 * públic, i no se'n pot posar un d'inventat. Mentre estigui buit, la pantalla
 * no dibuixa l'apartat de contacte; en el moment que se n'hi escrigui un, hi
 * apareix sol.
 */
export const PROJECTE = {
  web: "https://sites.google.com/view/veusdedona/",
  correu: "",
  repositori: "https://github.com/sssalma/veus-de-dona",
};

// Longitud mínima de contrasenya. El servidor imposa exactament la mateixa
// regla a app/schemas/usuari.py, de manera que no es pot evitar cridant l'API
// directament: aquí només serveix per avisar l'usuari abans d'enviar.
export const PASSWORD_MIN_LENGTH = 8;
