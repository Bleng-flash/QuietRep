# QuietRep

A gym workout logger for iOS and Android. Plan your training, log it as you lift, and watch it add up.

QuietRep is built around one loop: **plan a workout, do it, review it.** No feeds, no streaks, no
social layer. Just the barbell maths, kept out of your way while you are between sets.

> **Pre-release.** Everything lives on your phone — no account, no sign-in, no sync. That also means
> no backup yet: uninstalling the app takes your training log with it.

<!-- Screenshots go here — the single highest-value addition to this page. -->

---

## Plan your training

**Build an exercise library.** QuietRep ships with a set of common lifts, and you can add your own —
just a name and a muscle group. Names stay unique, so you never end up with two "Incline Press"
entries drifting apart.

**Turn exercises into workouts.** A workout is an ordered list of exercises, each with its own sets
and rep ranges. Target a range (8-12) or a fixed number (5 and 5). Drag to reorder, tap to swap
something out. The same exercise can sit in several workouts with completely different schemes —
heavy triples in one, back-off sets in another.

**Arrange workouts into a weekly split.** Seven days, and each day takes as many workouts as you
want. Leave a day empty and it is a rest day. Mark one split active and QuietRep knows what today
is supposed to look like.

Splits are snapshots, not links: assigning a workout to a day copies it in, so tweaking the day's
version never quietly rewrites your original template.

## Log it as you lift

Tap the **+** in the middle of the tab bar and pick how you are starting:

- **Today's workout** — pulled straight from your active split
- **From a workout** — any template, searchable
- **Quick workout** — an empty session you fill in as you go

Then just log. Load and reps per set, with your planned rep range shown faintly as a hint so you know
what you were aiming for. Add a set mid-exercise, drop one, reorder exercises, add something you
decided to throw in, remove something the rack queue made impossible. A timer runs from the moment
you start.

**The session follows you.** Hit minimise and it keeps running as a slim bar above the tab bar while
you browse elsewhere in the app — tap it to jump straight back in. Close the app entirely, come back
tomorrow, and your session is still there waiting.

When you are done, hit Finish and it drops into your history.

## Review what you have done

**Past workouts.** Every finished session, newest first, with the date, how long it took, and how
much you got through. Open one to see every exercise and every set exactly as you logged them.

**By exercise.** The other lens on the same data: pick a lift and see every set you have ever done
of it, session by session, going back as far as your log does. This is where progress actually shows
up — not in a single workout, but in the same movement three months apart.

**This month.** The home screen totals up your workouts, sets, and time trained for the current
month, with the months before it one tap away.

## Track your bodyweight

Log your weight from the home screen in a couple of taps, and see it plotted over time on the profile
tab — all of it, or the last month, three months, or year. Entries are timestamped, so weighing
yourself twice in a day plots as two honest points rather than being averaged away.

## Made to feel right

- **Dark and light** — the whole app, switched from Profile. Dark by default.
- **kg or lbs** — your choice, changeable any time. Sessions remember the unit you actually logged
  them in, and history converts to whatever you are reading in today, so a kg session and an lbs
  session sit side by side and compare directly.
- **Built for one-handed use between sets** — a thumb-reachable start button, drag-and-hold to
  reorder, and a keyboard that gets out of the way instead of burying the button you are reaching for.
- **Hard to lose things by accident** — deleting a workout, a split, or a logged session always asks
  first, while the small stuff you do constantly mid-session stays a single tap.

## Not there yet

QuietRep is still being built. Coming up:

- A starter library of predefined exercises so day one is not a blank page
- Onboarding for first-time users, and a bit more polish and animation throughout
- Export and backup, arriving together with accounts and sync

Deliberately left out for now: rest timers, and one-rep-max estimates. The second one is a choice
rather than a gap — QuietRep shows you what you actually lifted, not a formula's guess at what you
might have.

## Try it

There is no app store build yet. To run it yourself you will need Node and either Android Studio or
Xcode, and a development build — QuietRep uses native modules, so Expo Go will not run it.

```bash
npm install
npx expo run:android    # or: npx expo run:ios
```

After that, `npm start` is all you need day to day.

Developer documentation — architecture, conventions, and the reasoning behind them — lives in
[CLAUDE.md](CLAUDE.md).
