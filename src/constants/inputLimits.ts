// Guards against absurd inputs.

// Upper bound for a single rep value (planned or logged).
export const MAX_REPS = 100;

// Upper bound for a single logged weight, in whichever unit it was logged in.
// Deliberately unit-agnostic: one cap covers both kg and lbs rather than converting at
// validation time. Generous enough for heavy machine work in either. One-line adjustable.
export const MAX_WEIGHT = 1500;
