# Current DotOS smoked-glass atmosphere

The current background uses `glass-v3/glass-desktop.webp` (16,540 bytes) and
`glass-v3/glass-phone.webp` (6,648 bytes), reusing the original smoked-glass
candidate generated for this project. Source: `artifacts/dotos-glass-original-v2.png`.
The exact original prompt is the Smoked glass direction in
`artifacts/studio-background-directions-v2.json`. No image was generated or
edited for this update; the optimized variants were copied without alteration.

An original WebGL shader now advects the surface with actual scroll distance,
adds a damped scroll wake and follows the cursor with a smoothed material-light
and refraction field. The field changes the material itself; it does not render
circles, lines, particles, a grid or a cursor ornament. A larger overscan supports
scroll parallax, gentle turning and depth. The center remains calm for content.
All original mascots, fonts, layouts and the video sequence are preserved.

The existing one-context pixel/frame budgets, pause and reduced-motion behavior,
hidden-tab suspension, static-image fallback and route cleanup remain in place.
No additional runtime dependencies were added.

Motion references, without copying source or artwork:
[Mercury](https://www.shadcn.io/background/mercury) and
[Smoke](https://www.shadcn.io/background/smoke), shadcn.io;
[hero anim 1 by npdev](https://21st.dev/community/shaders/hero-anim-1-5f22fe63-d0c9-49e9-8794-f385b601ee56), 21st.dev;
[MotionSites backgrounds](https://motionsites.ai/backgrounds).

# Earlier DotOS satin studio atmosphere (historical)

Selected after comparing two original backgrounds on the actual desktop and
phone landing. `studio-v2/satin-desktop.webp` is 44,198 bytes and
`studio-v2/satin-phone.webp` is 15,892 bytes; together they are about 66% smaller
than the previous ink variants. They depict broad black-satin folds with soft
cobalt and sage reflections and a quiet center for the site's real content.

Created with the built-in imagegen tool. Original image:
`artifacts/dotos-satin-original-v2.png`. Exact prompts, candidate provenance and
the selection are recorded in `artifacts/studio-background-directions-v2.json`.
The alternative smoked-glass original and its comparison captures remain in
`artifacts/`; it is not loaded by the website. No reference artwork or source
was copied. Original mascot models, colors, layout, intro sequence and backend
are unchanged.

The existing budgeted `ink-flow.ts` renderer animates this material; the still
WebP remains beneath it as the reduced-motion and graphics-failure fallback.
Pause, video/menu suspension, hidden-tab suspension, device pixel/frame budgets
and resource cleanup are unchanged. No runtime library was added.

References: [Silk, shadcn.io](https://www.shadcn.io/background/silk),
[hero anim 1 by npdev, 21st.dev](https://21st.dev/community/shaders/hero-anim-1-5f22fe63-d0c9-49e9-8794-f385b601ee56),
[MotionSites background gallery](https://motionsites.ai/backgrounds).

# Earlier DotOS pigment atmosphere (historical)

The previous visual landing used `atmosphere-v1/ink-desktop.webp` (133,606 bytes) and the
portrait crop `atmosphere-v1/ink-phone.webp` (42,286 bytes). The original material
was created with the built-in imagegen tool for this project. The prompt and
generation provenance are recorded in `artifacts/atmosphere-art-direction.json`;
the original PNG is retained at `artifacts/dotos-ink-original-v1.png`.
`scripts/prepare-atmosphere-assets.mjs` only crops/encodes these WebP variants.

The material is charcoal pigment with cobalt, sage and restrained peach lighting.
It contains no decorative geometry, grids, lines or particles. The original
`ink-flow.ts` shader gently deforms the texture and moves light across it even
while the visitor is still. Scroll/pointer depth and color washes connect the
sections. One WebGL canvas is capped at 480,000 pixels / 24 fps on desktop and
220,000 pixels / 18 fps on phones; low-memory/save-data devices use a 128,000-pixel,
12 fps budget. Animation stops for pause, video/menu, hidden tabs and reduced
motion. Initial reduced motion uses only the static material. Missing or lost
graphics support reveals the underlying image. Resources are released on route
exit. No library was added; original mascot models and images are unchanged.

Visual references (composition and material only; no source or artwork copied):

- [Smoke, shadcn.io](https://www.shadcn.io/background/smoke): soft continuous
  drift and a calm dark foundation.
- [Silk / hero anim 1 by npdev, 21st.dev](https://21st.dev/community/shaders/hero-anim-1-5f22fe63-d0c9-49e9-8794-f385b601ee56):
  a moving material and gradual light changes.
- [MotionSites background gallery](https://motionsites.ai/backgrounds): ambient
  motion behind foreground content.

# Earlier restored DotOS mascot background (historical)

The current landing uses the original KineticBackdrop/KineticField and layered
character WebPs described below. `crew-backdrop.css` adapts the finish to the
current dark blue interface. The graphite material experiment is no longer used.
The hero also uses the existing interactive BOB model; no mascot model was edited.
Small satellites, waypoint dots, dotted orbit ticks and filled tool markers are
omitted from the current composition. The older motion notes below include
these retained legacy effects; only the mascots and solid contours are shown now.

# Earlier graphite surface

An earlier landing used `dotos-graphite.svg`, an original 256px seamless
fractal-noise tile, and the original CSS in `src/landing/material-background.css`.
The surface combines graphite tones, a diffuse diagonal reflection and fine
matte grain. It introduces no decorative objects or geometric pattern.
Motion changes only reflection transforms and opacity; the texture stays static.
Mouse movement is limited to fine pointers. Hidden tabs, the intro and reduced
motion preferences suspend movement.

References: [Aceternity Spotlight](https://ui.aceternity.com/components/spotlight-new)
and [Noise Background](https://ui.aceternity.com/components/noise-background).
No component source or downloaded artwork was copied.

# Companion orbits background

The original assets and motion below are reused by the current landing.

Two counterbalanced matte metal orbits and a few connecting paths form a shared
space for the four original mascots. BOB navigates, MAX relays a signal, IGGY
scans through a lens, and NOVA catches a small notification packet. The former
workstations, dotted desk surface and everyday studio props are removed.
BOB's corrected hat and NOVA's peach shell, oval black eyes and fitted silver
star pin are retained.

## Design references

- [Floating Paths by Bundui on 21st.dev](https://21st.dev/@bundui/components/floating-paths):
  long, fine paths create continuity across the full composition.
- [Orbits on shadcn.io](https://www.shadcn.io/background/orbits):
  satellites trace rings at independent speeds and in opposite directions.
- [Pixel Art Parallax Backgrounds by BIOMA 2D on itch.io](https://bioma2d.itch.io/pixel-art-parallax-backgrounds):
  separated foreground/background layers move at different depths.

These are visual and motion references. Their source code, illustrations and
paid assets are not included. The paths, orbital bands and tools are original
CSS/SVG; mascot artwork is derived from the project's original Three.js models.

## Artwork and motion
`scripts/render-background-layers.mjs` renders 256px bodies plus tightly cropped
eyes and accessories from the original Three.js models. Ten transparent WebPs
total 20,110 bytes and are shared across the light/dark finishes.
`src/landing/crew-layers.ts` records their exact placement. The current UI does not load atlases.
Independent gaze, blinks, hat and silver pin reactions accompany distinct
12/9/14/11-second activity cycles. A compass needle, expanding relay rings,
moving scanning lens and rising notification follow the actors' actions.
CSS animations only change transform and opacity. Orbital satellites make slow
52/64-second revolutions in opposite directions. Direct transforms animate
cached layers; no inherited CSS properties, fullscreen masks or grain effects
are animated.
BOB and IGGY form the left column; MAX and NOVA form the right column.
Scrolling gives each scene a bounded lift and tilt with a distinct rhythm,
shared across the light/dark finishes without frame-by-frame React updates.
Offscreen dark finishes are hidden and paused. Scroll bursts pause idle decoration
and GL while the cached scenes follow the scroll position smoothly. Dashboard mascots
move at 1.5 times the landing cycle duration; tools and orbital satellites
stay paused, retaining subtle pointer parallax. No extra WebGL contexts run for
the background. Subdued opacity preserves readability.
Gentle scroll and pointer parallax share synchronized visible light/dark phases.
Small phones retain two scenes per side at a smaller size and lower opacity.

Day, Night and Pocket blend the material finishes into the selected dashboard
palette. Light and charcoal landing finishes
share viewport geometry and animation phases. Browser-native section clipping
keeps their edges attached to the scrolling document without a JavaScript mask.

- `paper-grain.svg`: original seamless SVG fractal-noise tile, retained from the
  previous design; the current UI does not render it.
- `brushed-metal.svg`: original directional tile retained from the previous design.
- Character layers: `public/background/crew/*-v4.webp` and NOVA's `*-v5.webp`, derived from the
  project's own Three.js models. Earlier stills/atlases remain for older clients.
- Paths, orbital bands, compass, relay, lens and packet: original SVG/CSS in
  `KineticField.tsx` and `kinetic-background.css`.
- Materials, animation and parallax: original CSS and Motion.

CSS movement pauses in hidden tabs. Reduced motion
leaves a static composition. No external illustrations or AI-generated bitmaps are used.

## MIT notice retained from the earlier Magic UI pattern adaptation

MIT License

Copyright (c) Magic UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
