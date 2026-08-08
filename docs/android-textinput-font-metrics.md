# Why TextInput text was clipped at the top on one tester's phone

This documents the root cause of a bug found during preview-build testing: on one tester's Redmi
(HyperOS, Chinese locale), the content of **every** text field rendered shifted upward and cut off
at the field's top edge. A logged bodyweight of `77` showed as the bottom halves of two digits, the
placeholder `0` showed as a `U`, and a typed search query lost its top third.

The same APK was correct on the developer's own Android phone and on the local emulator. Every
`<Text>` label on the affected device rendered perfectly. Only `TextInput` was wrong, and only on
that one device.

That combination is the whole diagnosis, and this document is the chain that explains it.

---

## 1. A `<TextInput>` is two pieces of machinery that must agree

React Native does not draw text fields. When you write

```tsx
<TextInput style={{ fontSize: 15, paddingVertical: 10 }} />
```

RN creates a real Android `EditText` — the same native widget a Kotlin app would use — and hands
the drawing to it. But RN still has to know **how tall the field is**, because your layout is
flexbox and Yoga needs a number before it can position everything around the field. So two
different pieces of code are involved:

| Job | Who does it | Decides |
| --- | --- | --- |
| **Measure** | RN's own text measurement (`TextLayoutManager`), feeding Yoga | the height of the box in your layout |
| **Draw** | the native `EditText` | where the glyphs are painted inside that box |

The contract between them is implicit and unchecked: RN assumes the line it measured is the line
the widget will draw. Nothing verifies it. If they disagree, nothing errors — the text just lands
in the wrong place.

**Fonts are where they can disagree.** A typeface carries vertical metrics (ascent, descent), and
those vary a lot between fonts at the same nominal size. Roboto at 15sp lays out a line about
17-18dp tall. A CJK family such as MiSans or Noto Sans CJK lays out roughly 22-26dp at the *same*
15sp, because CJK fonts reserve much more vertical room. Same number in the style, ~40% taller line.

## 2. The two halves resolve the font differently

Both quotes below are from React Native 0.81.5 in `node_modules`, read directly rather than taken
from documentation.

**Measuring** — `ReactAndroid/.../views/text/TextLayoutManager.kt:619-625`:

```kotlin
private fun scratchPaintWithAttributes(...): TextPaint {
  val paint = checkNotNull(textPaintInstance.get())
  paint.setTypeface(null)          // null == Typeface.DEFAULT
  ...
  updateTextPaint(paint, baseTextAttributes, context)
```

and `updateTextPaint` only overrides that typeface when the style supplies a `fontFamily`,
`fontWeight` or `fontStyle`. So without a `fontFamily`, **measurement uses `Typeface.DEFAULT`** —
the Android framework's built-in fallback font.

**Drawing** — `ReactAndroid/.../views/textinput/ReactEditText.kt:597`:

```kotlin
val newTypeface = applyStyles(typeface, fontStyle, fontWeight, fontFamily, context.assets)
```

The first argument is the widget's **current** typeface — the one the `EditText` was born holding,
supplied by the Android **theme**. RN restyles it (applying your `fontWeight`), it never replaces
it. And `ReactTypefaceUtils.applyStyles` only discards that base typeface when a `fontFamily` name
is given:

```kotlin
return if (fontFamilyName == null) {
    typefaceStyle.apply(typeface ?: Typeface.DEFAULT)
} else {
    ReactFontManager.getInstance().getTypeface(fontFamilyName, typefaceStyle, assetManager)
}
```

So: **the box is measured with `Typeface.DEFAULT`; the glyphs are drawn with the theme's typeface.**
On stock Android those are the same font, the disagreement is zero, and nothing shows. The bug is
what happens when a device makes them different.

## 3. Why one phone and not the others

Android is open source and every manufacturer ships a modified build of it — MIUI/HyperOS on
Xiaomi/Redmi, One UI on Samsung, ColorOS on OPPO. Those builds change framework defaults, including
**which font the theme assigns to text widgets**. Three ways the two typefaces come apart:

1. **A vendor font picker.** Xiaomi's Themes and Samsung's "Font style" let the user replace the
   system UI font. Depending on how the vendor applies it, the theme's font changes while
   `Typeface.DEFAULT` does not.
2. **A CJK UI font.** On a Chinese-locale device the UI font is a CJK family, whose line box is
   dramatically taller at the same `sp` (section 1).
3. **Accessibility → Bold text** (Android 12+). The framework applies a `fontWeightAdjustment` when
   a `TextView`/`EditText` resolves its typeface from theme attributes. RN's measuring paint never
   sees that adjustment.

The developer's own phone and the emulator sit in none of these categories, which is why extensive
local testing could not surface it. This is the characteristic shape of an OEM bug: invisible until
the build reaches a third device.

## 4. Why the text moves *up*, not down

A too-small box would intuitively clip the *bottom*. It clipped the top, and that detail identifies
the mechanism.

An `EditText` can scroll its own content — that is how a long single-line value slides sideways as
you type. When the field is focused, Android calls the internal `bringPointIntoView(caret)`, whose
job is to make the line containing the text cursor fully visible: *if the bottom of that line falls
below the visible area, scroll down until it doesn't.*

When the drawn line is **taller than the box**, that rule can never be satisfied, but it still
scrolls by the difference. Scrolling the content down moves the text **up**, and the glyph tops
slide out of the field, where the widget clips them. The scroll position is just a number on the
widget, so it persists after the field loses focus — which is why the clipped `77` stayed clipped
with the keyboard closed.

## 5. Why `<Text>` was fine, and why iOS cannot have this bug

A `<Text>` is measured and drawn from the same text layout. Whatever font it uses, the box RN
computes matches the line that gets painted. A taller font just makes a taller box — invisible.

**`TextInput` is the only component in React Native whose box comes from one font and whose glyphs
come from another**, so it is the only one that can mismatch. The tester's screenshots — labels
perfect, every field broken — are that fact rendered on a screen.

iOS cannot reproduce it. There, RN's measurement builds an `NSAttributedString` measured with a
`UIFont` via CoreText, and `RCTUITextView` renders that same attributed string with that same font
object: one font, one layout path, no room to disagree. iOS also has no vendor-modified builds and
no user-swappable system font. Dynamic Type scaling applies to measurement and rendering together.

## 6. The fix: never let a field hug its measured line

The mismatch is React Native's, but the app had turned it into a guaranteed failure. Every input
style sized the field to the measured line *exactly*:

- `layout.inputField` had `paddingVertical` but no height floor, so the space available to the line
  was precisely the measured line height.
- The search bars put the padding on the wrapper `View` and left the input at its bare measured
  height.
- `SessionHeader`'s title input had no padding at all.

Slack everywhere: **zero**. A mismatch of one pixel clipped.

The fix converts that padding into interior room instead of adding height. Every single-line input
now carries:

```ts
...INPUT_SLACK,          // or COMPACT_INPUT_SLACK for the dense set rows
```

which is the three properties bundled as one spreadable token:

```ts
paddingVertical: 0,
minHeight: INPUT_MIN_HEIGHT,        // or COMPACT_INPUT_MIN_HEIGHT
textAlignVertical: 'center',
```

**They were originally written out by hand at each field, and that was a mistake — see section 8.**

Pinning the floor at the height the field already had means the layout is unchanged on screen, but
the ~20dp that used to be reserved as padding above and below the line is now room the centred line
is free to grow into. A drawn line taller than measured sits centred with less air around it
instead of scrolling up and clipping. The floors live in `src/styles/spacing.ts` and are multiplied
by `PixelRatio.getFontScale()` so the slack stays proportional when the user scales text up.

Two details about that multiplier, both documented at the constants. It is a **launch-time
snapshot** — read once at module load, which is guaranteed to be before the first render because
`Dimensions` fills itself synchronously from the native constants, but which also means a font-size
change mid-session does not refresh it (the Activity is recreated, the JS context is not). That
degrades gracefully in both directions, so it is not worth threading a live `fontScale` through
every style factory. And it is **clamped to [1, 2]**, because `getFontScale()` falls back to the
pixel *density* if the native `fontScale` is ever missing — a 2.75 density would quietly turn a 40dp
field into a 110dp one.

Two properties worth keeping:

- **It is font-agnostic.** It does not care which of the three causes in section 3 is active on a
  given device, and it covers any future measure-vs-draw discrepancy as well.
- **It preserves user choice.** Setting `fontFamily` on every input would also work — both halves
  would then resolve the same named family through the same `ReactFontManager` cache entry — but it
  can stop honouring the system font the user deliberately chose, and it silently disables the
  Bold-text accessibility adjustment inside fields.

## 7. Rules that follow

- **Every single-line `TextInput` spreads one slack token** — `INPUT_SLACK` for standard bordered
  fields, `COMPACT_INPUT_SLACK` for the dense set rows and the session title. A new input picks one;
  it never sizes itself from padding alone, and it never re-types the three properties (section 8).
- **Never use `includeFontPadding: false`** to "fix" input alignment. It is the most-copied remedy
  online and it is backwards here: it shrinks the measured box, which makes clipping *more* likely.
- **Padding on a wrapper is not slack for the field inside it.** The `EditText`'s own box is what
  clips, so the floor belongs on the input, not on the bar around it.
- **Two devices are not a test matrix.** This class of bug is invisible on stock Android by
  construction. A build that has only run on a Pixel-like device and an emulator has not been tested
  against OEM font substitution at all.

## 8. Sequel (2026-08-08): the fix was correct and applied incompletely

The original fix wrote the three properties out by hand at each field. Four months later an audit of
CLAUDE.md against the code found **three of the ten input sites carrying only two of the three**:

| Field | Floor | `textAlignVertical` | `paddingVertical: 0` |
|---|---|---|---|
| `picker.searchInput` (PickerModal **and** ExerciseListScreen) | yes | yes | **missing** |
| `WorkoutEditor.nameInput` | yes | yes | **missing** |
| `SessionHeader.nameInput` | yes | yes | **missing** |

A fourth, `WorkoutFabMenu.searchInput`, used `padding: 0` instead — correct in effect, but a
different idiom for the same job, which is how a reader loses track of what the rule even is.

**The omitted property is the one that looks redundant, and it is not.** This app runs the New
Architecture, where `AndroidTextInputComponentDescriptor` reads the **theme's** default TextInput
padding and applies it as the component's default padding. A field with no padding style therefore
keeps Android's theme padding, and its usable interior is `minHeight - themePadding` rather than
`minHeight` — the slack quietly reduced by exactly the amount the rule exists to remove. Invisible
on a device whose UI font matches `Typeface.DEFAULT`, which is the same blind spot that caused the
original bug.

**Why it happened, and the general lesson.** The rule was stated as prose and re-implemented by hand
at every call site. A field satisfying two thirds of it compiles, renders correctly on the
developer's device, and reads as finished. Nothing anywhere could tell you it was wrong.

**A safety rule that must be applied identically in N places should be one spreadable token, not a
sentence in a document.** The three properties are now `INPUT_SLACK` / `COMPACT_INPUT_SLACK` in
`src/styles/spacing.ts`, next to the explanation of why they exist, and the bare
`INPUT_MIN_HEIGHT` / `COMPACT_INPUT_MIN_HEIGHT` constants are now **module-private** — not exported
at all, so a component cannot take the floor without the rest. Partial application went from "easy
to write by accident" to "unavailable".

Corollary worth carrying to any similar rule: **prose in a doc cannot enforce anything.** If
correctness depends on N properties always travelling together, make them travel together in code.
