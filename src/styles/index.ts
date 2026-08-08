// Colour-free tokens stay static and are imported directly from @/styles.
export { radius } from './radius';
export {
  COMPACT_INPUT_SLACK,
  INPUT_SLACK,
  SCREEN_TOP_GAP,
  SET_LABEL_COLUMN_WIDTH,
  SET_REMOVE_COLUMN_WIDTH,
  spacing
} from './spacing';

// Colour-bearing tokens (colors, layout, typography, picker) are NOT exported here — they
// are theme-reactive and must be read from useTheme() (src/context/ThemeContext.tsx) so
// they repaint when the mode toggles. The palette registry + types are exposed for the
// theme layer and anywhere a mode needs to be reasoned about.
export { palettes } from './colors';
export type { Palette, ThemeMode } from './colors';

