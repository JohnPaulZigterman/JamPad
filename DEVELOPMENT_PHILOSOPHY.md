# JamPad Development Philosophy

The readable catalogue-style philosophy document now lives at:

`public/philosophy.html`

Run the app and open `/philosophy.html`, or use the `Field Guide` link in the JamPad header.

## Current North Star

JamPad is a compact generative trip-hop instrument, not a miniature DAW.

It should feel beginner-friendly on the surface, disproportionately powerful underneath, and opinionated enough to make musical choices without burying the user in configuration. When tradeoffs happen, lightly prioritize playable hardware instrument over composition partner or sample lab. The feeling should sit somewhere between playing an instrument and playing a slightly cryptic game that does not quite want to tell you all of its rules.

## Current Tech Trees

- **Pocket Instrument:** compact, tactile, hardware-like performance surface.
- **Taste Engine:** probability with memory, role awareness, key awareness, moods, and controlled misbehavior.
- **Crate Workshop:** curated sample crates first, then fast user import, tagging, and key-matching tools.

## Current Rule

If a feature does not help the machine make, shape, preserve, or interrupt generative trip-hop performances, it waits.

When proposing future work, the Field Guide should behave like a catalogue. Ideas should be browseable as bundles: automation and macros, beginner compression, sample organization, style directions, tutorial modes, and architecture paths. The user should be able to pick a handful and turn them into a long-term dev plan.

The machine should mostly preserve a vibe, with slightly unstable interruptions. Surprise is welcome when it feels like a musical stinger, fill, rupture, or phrase mutation, not when it constantly erases the user's sense of place.

## Current Build Note

The `Taste Engine` now treats key and source tempo as musical taste signals. JamPad should prefer compatible samples automatically, stretch loops toward the session tempo, and keep that intelligence behind compact beginner-facing controls.

Conway's Game of Life is now a reference model for the machine's behavior: simple local rules should create surprising global form. Lanes can eventually behave like neighboring cells, where silence, loops, fills, and anchors are born, persist, or die based on nearby musical context rather than isolated randomness.

The `Taste Engine` should also breathe in phrases. Clips and silences should tend to repeat long enough to feel intentional before handing control back to probability, especially in Sparse and Groove states.

Tempo snapping is now a playback promise, not just a selection hint. Looped samples should lock to the global BPM using the closest half-time, normal-time, or double-time interpretation, with clean stretching doing the work under the hood.

The `Taste Engine` also owns automatic mix hygiene. Samples should be gain-staged by role and normalized conservatively before the user ever reaches for manual volume controls.

The current hybrid plan is `Faceplate Instrument + Hidden Rules Engine`: build the playable hardware surface first, while quietly wiring musical ecology into the probability machine. The first implementation adds Director macros, hidden-rule tells, and ecology tags that steer anchors, vamps, stingers, ruptures, dropouts, and bridges.

The machine can rest, but it should not go fully dead while playing. If any unmuted lane is available, the generator should preserve at least one sounding channel; total silence should be an intentional user act, not an accidental extended state.

Each lane now has tiny `RND` and `STK` behavior controls. Per-channel randomness should make a lane more exploratory; per-channel stickiness should make clips and rests loop longer. These are faceplate controls because they make the box feel playable without exposing a rules editor.

The `Crate Workshop` now includes a 50-sample Loopcloud export import path. Exported/pitch-locked samples may have unreliable filename keys, so their keys are treated as uncertain hints instead of hard harmonic truth.

The default crate should be curated, not maximal. Samples that feel too harsh, too novelty-coded, too high-energy, too specific, or too far outside the smoky trip-hop center should be removed from the active starter list even if the files remain available for later recovery.

`Play the Internet` is viable as a speculative Crate Workshop direction if it stays source-aware, license-aware, and user-approved. Public sources such as Internet Archive expose searchable metadata and item file lists, which means JamPad could tune into public-domain or Creative Commons audio, preview fragments, analyze them, and turn approved material into local crate clips. The user should feel like they are loosely playing a strange radio, not like the app is silently scraping unknown copyrighted material.

## Workflow Rule

Every major direction should be placed on the user workflow map: open, play, steer, intervene, commit, or build. If a feature creates a new path, the Field Guide should show that path before the app grows around it.

## Conway Rule

Prefer tiny rules that generate readable emergence: stable forms, oscillators, gliders, and controlled extinction. A feature inspired by cellular automata should make JamPad feel more alive and teachable, not more abstract or difficult.

## Beginner Power Rule

Every automation or macro should reduce beginner effort while preserving expert leverage. Hide busy machinery behind musical controls, but keep the system inspectable when the user wants to understand or customize it.

Fundamental controls and hyper-useful macros belong on the surface. Literal advanced controls can live in unobtrusive menus, and the expressive macro layer should be able to interact with the deeper literal layer.

Discovery stays in the foreground. Tutorials should be easy to find and musically useful, but JamPad should first invite play, listening, experimentation, and a little rule-hunting.

## Cryptic Game Rule

JamPad can be mysterious, but it should never be hostile. The user should sense hidden rules, rewards, and emergent behaviors, while the surface stays playable enough that not knowing the full system remains pleasurable.

## Internet Radio Rule

If JamPad reaches outside the local crate, it must show enough provenance to be trustworthy: source, license, creator/title when available, and why the machine thinks the sound belongs. The control can remain cryptic and musical, but the rights trail cannot.
