// Theme registry. Every palette below shares an identical key set, so a component
// styled against one mode renders correctly against any other. The active palette is
// resolved at runtime by ThemeProvider (src/context/ThemeContext.tsx) and consumed via
// the useTheme() hook — never imported statically for colour reads.
export const palettes = {
  dark: {
    // Background
    background: '#0d1210',
    backgroundSubtle: '#111915',

    // Surface
    surface: '#161e1d',
    surfaceRaised: '#1c2828',

    // Border
    border: '#263229',
    borderSubtle: '#1c2620',

    // Text
    text: '#e0e4e8',
    textSubtle: '#7a8088',
    textDisabled: '#323840',
    textInverse: '#0d1210',

    // Primary
    primary: '#32af6e',
    primaryMuted: '#4b9b70',
    primarySubtle: '#0c1e15',

    // Semantic
    error: '#d4614a',
    errorSubtle: '#20100a',
    success: '#5ec490',
    successSubtle: '#0a1e14',
    warning: '#d4a040',
    warningSubtle: '#1e1808',
    info: '#6e96d8',
    infoSubtle: '#0c1228',

    // Utility
    overlay: 'rgba(0, 0, 0, 0.70)',
    skeleton: '#131c17',
    sliderThumb: '#2b3c31',
    sliderTrack: '#1c2620',
    inputBackground: '#111915',
  },
  light: {
    // Background — recessed base is the darkest surface in light mode; elevation climbs to white.
    background: '#eceeed',
    backgroundSubtle: '#f2f4f3',

    // Surface
    surface: '#f8faf9',
    surfaceRaised: '#ffffff',

    // Border
    border: '#d3dad6',
    borderSubtle: '#e3e7e4',

    // Text
    text: '#18211d',
    textSubtle: '#5f6b64',
    textDisabled: '#a8b0aa',
    textInverse: '#ffffff',

    // Primary — deepened green so it stays legible as text/accents on light surfaces.
    primary: '#1f9d5f',
    primaryMuted: '#2f8a5c',
    primarySubtle: '#e2f4ea',

    // Semantic
    error: '#c4472f',
    errorSubtle: '#fbe9e4',
    success: '#2e9d67',
    successSubtle: '#e2f4ea',
    warning: '#b3801f',
    warningSubtle: '#f7edd6',
    info: '#3f6fc0',
    infoSubtle: '#e5ecfa',

    // Utility
    overlay: 'rgba(0, 0, 0, 0.45)',
    skeleton: '#e6e9e7',
    sliderThumb: '#c2ccc6',
    sliderTrack: '#dde2df',
    inputBackground: '#f0f3f1',
  },
  darkPurple: {
    // Background
    background: '#0e0d12',
    backgroundSubtle: '#131219',

    // Surface
    surface: '#181720',
    surfaceRaised: '#201e2a',

    // Border
    border: '#2a2838',
    borderSubtle: '#1e1c28',

    // Text
    text: '#e4e0f0',
    textSubtle: '#7e7a96',
    textDisabled: '#3c3a50',
    textInverse: '#0e0d12',

    // Primary
    primary: '#9d88e0',
    primaryMuted: '#7a68be',
    primarySubtle: '#171428',

    // Semantic
    error: '#d4614a',
    errorSubtle: '#20100a',
    success: '#5ec490',
    successSubtle: '#0a1e14',
    warning: '#d4a040',
    warningSubtle: '#1e1808',
    info: '#6e96d8',
    infoSubtle: '#0c1228',

    // Utility
    overlay: 'rgba(0, 0, 0, 0.70)',
    skeleton: '#15141c',
    sliderThumb: '#302e42',
    sliderTrack: '#1e1c28',
    inputBackground: '#131219',
  },
} as const;

// The two modes the Appearance toggle switches between. darkPurple is an extra seed
// variant, not part of the light/dark toggle.
export type ThemeMode = 'dark' | 'light';

// The resolved colour set for a single mode. Keys come from the dark palette (all palettes
// share them); values are widened to `string` so every palette (each with its own hex
// literals under `as const`) is assignable to this one shared type.
export type Palette = { [Key in keyof typeof palettes.dark]: string };
