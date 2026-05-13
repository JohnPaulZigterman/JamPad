# JamPad Development Philosophy

The readable catalogue-style philosophy document now lives at:

`public/philosophy.html`

Run the app and open `/philosophy.html`, or use the `Field Guide` link in the JamPad header.

## Current North Star

JamPad is a compact generative trip-hop instrument, not a miniature DAW.

It should feel beginner-friendly on the surface, disproportionately powerful underneath, and opinionated enough to make musical choices without burying the user in configuration.

## Current Tech Trees

- **Pocket Instrument:** compact, tactile, hardware-like performance surface.
- **Taste Engine:** probability with memory, role awareness, key awareness, moods, and controlled misbehavior.
- **Crate Workshop:** curated sample crates first, then fast user import, tagging, and key-matching tools.

## Current Rule

If a feature does not help the machine make, shape, preserve, or interrupt generative trip-hop performances, it waits.

## Current Build Note

The `Taste Engine` now treats key and source tempo as musical taste signals. JamPad should prefer compatible samples automatically, stretch loops toward the session tempo, and keep that intelligence behind compact beginner-facing controls.

Conway's Game of Life is now a reference model for the machine's behavior: simple local rules should create surprising global form. Lanes can eventually behave like neighboring cells, where silence, loops, fills, and anchors are born, persist, or die based on nearby musical context rather than isolated randomness.

The `Taste Engine` should also breathe in phrases. Clips and silences should tend to repeat long enough to feel intentional before handing control back to probability, especially in Sparse and Groove states.

Tempo snapping is now a playback promise, not just a selection hint. Looped samples should lock to the global BPM using the closest half-time, normal-time, or double-time interpretation, with clean stretching doing the work under the hood.

The `Taste Engine` also owns automatic mix hygiene. Samples should be gain-staged by role and normalized conservatively before the user ever reaches for manual volume controls.

The `Crate Workshop` now includes a 50-sample Loopcloud export import path. Exported/pitch-locked samples may have unreliable filename keys, so their keys are treated as uncertain hints instead of hard harmonic truth.

## Workflow Rule

Every major direction should be placed on the user workflow map: open, play, steer, intervene, commit, or build. If a feature creates a new path, the Field Guide should show that path before the app grows around it.

## Conway Rule

Prefer tiny rules that generate readable emergence: stable forms, oscillators, gliders, and controlled extinction. A feature inspired by cellular automata should make JamPad feel more alive and teachable, not more abstract or difficult.
