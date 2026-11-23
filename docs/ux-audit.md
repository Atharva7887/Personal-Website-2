# Motion and UX audit

Branch `redesign`. Checklist: Disney's principles, origin awareness, rubber banding, door threshold,
interruptible motion, Fitts, Hick, Von Restorff, frequency of use, peak-end. Verified in headless Chrome at
1440x900 and 375x812, including hover and press, interrupted hovers and `prefers-reduced-motion`.
All CSS and JS animation stops under reduced motion (the global `@media (prefers-reduced-motion)` block in
`src/index.css`, `useReducedMotion`, `useMagnet`, `ShapeIcon`).

Status: **Pass** (already right), **Fixed** (changed here), **N/A**, **Left** (deliberately kept).

## Home (`/`)

| Item | Status | Evidence |
|---|---|---|
| Exaggeration | Pass | Hero letters dip then overshoot, `letter-in` (index.css:111); 11vw contact headline |
| Squash and stretch | Pass | `.btn` active:scale-[0.94] (index.css:50); Off the clock cards now squeeze on press |
| Anticipation | Pass | Hero type dips before rising; intro count before the curtain lifts |
| Slow in / slow out | Fixed | Service shapes started and stopped dead; now spin up and wind down (`ShapeIcon.tsx:29`) |
| Follow-through, overlap | Pass | Hero words stagger 70 ms (`--i`), reveals stagger 80 ms, CTA overshoots home (`motion.ts` leave) |
| Arcs | Pass | Particles ease and swirl (`particleScene.ts:178`) |
| Timing | Pass | Hovers 150-300 ms, reveals 800 ms, dock 500 ms |
| Secondary action | Pass | Marquee, ping dot, particles; the "Copied" label now pops (`CopyEmail.tsx`) |
| Solid drawing | Pass | One radius scale (3xl cards, full pills), one shadow family |
| Origin awareness | Pass | Dock slides up from its edge; project heading nudges toward the arrow it points at |
| Rubber banding | Left | Page scroll is native/Lenis (lerp 0.1); nothing on the page has a hard limit to soften |
| Door threshold | Fixed | Studio and Play cards lift 4 px on hover, picture leans in to 1.04, press squeezes the card and pushes the picture to 1.09 (`OffTheClock.tsx`); pages now cross-fade (`@view-transition`, index.css:271) |
| Interruptible | Fixed | Magnet button snapped ~26 px on entry; now eases in and retargets (measured 0 to -26 px over ~160 ms, `motion.ts:53`). Card hover and leave retarget mid-way (checked at 50 ms: scale 0.994, image 1.064, not snapped) |
| Fitts | Fixed | Logo links were 22-28 px wide, footer "Studio" 42 px: all now 44 px (Hero, Dock, Sections). Phone: nothing under 44 px except the hidden skip link |
| Hick | Pass | Header 4 choices, hero 2, Off the clock 2 |
| Von Restorff | Fixed | Studio was an equal twin of the game; it now has the wider card and the only accent button |
| Frequency of use | Pass | "Let's talk" and Work/Services/About sit in the header and the dock |
| Peak-end | Pass | Hero entrance is the peak; the ending is a full-bleed accent section, 64 px email button, copy button, links, back to top in the corner |

## Studio (`/studio/`)

| Item | Status | Evidence |
|---|---|---|
| Exaggeration | Pass | Loader's 16vw counter, big intro headline |
| Squash and stretch | Fixed | Places switcher, stop list and sit button had no press; now squeeze (`Studio.tsx`) |
| Anticipation | Pass | Loader counts up and lifts away; click squash in the scene |
| Slow in / slow out | Pass | `cubic-bezier(.2,.8,.2,1)` on card, rail, loader; OrbitControls damping 0.08 |
| Follow-through, overlap | Fixed | Card shell enters once; the words swap on their own 380 ms slide in the direction of travel (`.studio-swap`, `Studio.tsx:543`) |
| Arcs | Pass | Camera moves between stops on eased paths (scene) |
| Timing | Pass | Card 600 ms, swap 380 ms, wheel gesture lock 650 ms |
| Secondary action | Pass | Scroll dot cue, lights follow Pune time, hover label |
| Solid drawing | Pass | Same white card, shadow and radius for card and credits |
| Origin awareness | Fixed | Tour card and credits popover scaled from their centre; now `origin-bottom-left` and `origin-top-left` (credits measured at `0px 0px`) |
| Rubber banding | Fixed | Walk stick knob stretches 28% past the rim and springs back on release (`Studio.tsx:745`). Camera limits belong to three.js controls: Left |
| Door threshold | Pass | Intro asks "Take the tour / Look around myself", then where to stand, before the camera moves |
| Interruptible | Fixed | Every step used to remount the card (old one vanished, new one faded from 0). Stepping three times in 120 ms now keeps one card node and swaps text from 25% opacity (measured) |
| Fitts | Fixed | Place switcher 40, stop list 40, sit button 36, logo 28 wide: all 44. What remains under 44 are inline credit links |
| Hick | Fixed | 12 stops listed while a card is open competed with it; the list now sits at 60% until hovered or focused. Intro is 2 choices, then 3 |
| Von Restorff | Fixed | While touring, the card is the one bright thing; at the last stop its action is a solid accent button |
| Frequency of use | Pass | Next/Back at the card's bottom edge, Close and Lights top right, scroll and arrows step |
| Peak-end | Fixed | Tour ends on "Let's grab a coffee" with a real Email me button instead of a text link (`Studio.tsx:555`) |

## Play (`/play/`)

| Item | Status | Evidence |
|---|---|---|
| Exaggeration | Pass | 15vw title, 14vw time on win |
| Squash and stretch | Pass | `.btn` squeeze; ball squash is in the scene |
| Anticipation | Pass | Start screen before rolling |
| Slow in / slow out | Pass | Cards use ease-out-back curves |
| Follow-through, overlap | Fixed | Score digit pops on each orb; win screen staggers time, text, buttons (`Play.tsx`) |
| Arcs | Pass | Rolling physics |
| Timing | Fixed | Pickup card left instantly at 4.2 s; now fades from 3.8 s (`card-out`) |
| Secondary action | Fixed | Counter pop (above) |
| Solid drawing | Pass | Same card language as the rest of the site |
| Origin awareness | Fixed | Pickup card and hint pop from bottom-centre. The card also jumped sideways mid-pop because the keyframes replaced its translate; now centred with auto margins |
| Rubber banding | Fixed | Touch stick knob stretches past the rim, input stays clamped (`Play.tsx:122`) |
| Door threshold | Pass | Start screen explains the game before "Start rolling" |
| Interruptible | Fixed | A second orb now re-runs the card (`key={card}`) instead of swapping text under an old timer |
| Fitts | Fixed | Logo 28 px wide, now 44 |
| Hick | Pass | Start: 2; win: 3 with a single white primary |
| Von Restorff | Pass | White primary button on dark; volt hint pill |
| Frequency of use | Pass | Controls hint at the bottom, counter top right |
| Peak-end | Fixed | Win screen arrives in stages instead of a cut |

## 404 (`/nope/`)

| Item | Status | Evidence |
|---|---|---|
| Exaggeration, squash and stretch, anticipation | Pass | Dots arrive scattered then assemble; stretch with speed; a click scatters them |
| Slow in / slow out, follow-through | Pass | Spring physics with damping (`NotFound.tsx` tick) |
| Arcs, timing, secondary action | Pass | Dots return on springs; the "you are here" label follows the stray dot |
| Solid drawing | Pass | Same ink and volt palette |
| Origin awareness | Pass | Burst radiates from the click point |
| Rubber banding | Pass | The whole page is a spring |
| Door threshold | N/A | No big transition |
| Interruptible | Pass | Velocity-based; any pointer input redirects the dots |
| Fitts | Fixed | Logo 28 px wide, now 44. The in-sentence "home page" link is inline text; the 48 px button below carries the target |
| Hick | Left | Four ways back; the first is the only solid one |
| Von Restorff | Pass | Ink primary among ghosts; one accent dot |
| Frequency of use | Pass | Home is first |
| Peak-end | Pass | Joke ending and a large home button |

## Sitemap (`/sitemap/`)

| Item | Status | Evidence |
|---|---|---|
| Disney principles (all nine) | N/A | A static index: nothing moves beyond link colour |
| Origin, rubber banding, door, interruptible | N/A | No transitions |
| Fitts | Fixed | `sitemap.xml` link was 18 px high, now 44; rows already 48 px |
| Hick | Pass | Three titled groups |
| Von Restorff | N/A | Every row is equal by design |
| Frequency of use | Pass | Main group first |
| Peak-end | Left | Ends on the machine link; a utility page |

## Case studies (`/work/<slug>/`)

| Item | Status | Evidence |
|---|---|---|
| Exaggeration | Pass | 8.5rem title |
| Squash and stretch | Pass | `.btn` squeeze |
| Slow in / slow out, timing | Pass | Eased arrow and colour transitions |
| Follow-through | Fixed | "Next project" arrow overshoots on hover and pushes further on press (`CaseStudy.tsx`) |
| Anticipation, arcs, secondary action | Pass | Particle shape turns slowly beside the title |
| Solid drawing | Pass | Same facts grid and radius |
| Origin awareness | Pass | Arrow moves toward where the next page is |
| Rubber banding | Left | Gallery strip scrolls natively; stopping scroll chaining would be worse |
| Door threshold | Fixed | Next-project press nudge plus the new page cross-fade |
| Interruptible | Pass | Hover is a CSS transition and retargets |
| Fitts | Fixed | Breadcrumb "Work" was 20 px high, now 44; the next-project block is huge |
| Hick | Pass | One next action |
| Von Restorff | Pass | First link is the ink button, the rest ghost |
| Frequency of use | Pass | Header and dock persist |
| Peak-end | Pass | Next project, then the shared Contact ending |

## Left on purpose

- Three.js camera limits, orbit and walk collisions (`src/three/**`): out of scope.
- Inline links in running text (credits, 404 sentence) stay under 44 px high; their own rows or buttons carry the target.
- The Studio stop list is still 12 rows while a card is open (dimmed, grouped by place); collapsing it would hide the frequent jump-to action on desktop. It is hidden under 768 px.
- The Work list keeps seven equal rows: they are the portfolio.
