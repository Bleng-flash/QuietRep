// Border-radius token scale.
// Circular elements (DayCircle: 18, TabBar FAB: 32) use half-their-dimension radii
// for perfect circles and are intentionally NOT on this scale.
export const radius = {
  xs: 4,  // list entry rows
  s: 6,   // small badges/pills
  m: 10,  // inputs, controls, search bar
  l: 12,  // cards, dashed action buttons
  xl: 14, // modal dialogs
} as const;
