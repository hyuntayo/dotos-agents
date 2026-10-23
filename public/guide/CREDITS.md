# DotOS video guide v12

Original 40-second silent guide rendered from the project's own Three.js mascot
models and animation controller. Updated for the DotOS reskin: black surfaces, glossy character colours,
Unbounded, Golos Text, JetBrains Mono, a text wordmark and borderless mascot scenes. Small decorative
interface/logo dots are removed; the owner retained the banner's large spheres. No external footage,
images, music, user data or network transactions are recorded.

Six chapters: Meet DotOS; Choose a Dot; Memory & Skills; Responsibilities;
Activity & alerts; Your system. The guide explains asset selection, conditions,
intervals and alert delivery without displaying invented prices, balances or
completed checks. The closing address is dotos.si.

Both native Full HD compositions contain 2400 deterministic frames at 60 fps:
1920 x 1080 landscape and 1080 x 1920 portrait. Original mascot models render
at 1200 x 1200. The 29 timed gestures include greetings, working, spins, sleep,
wake and an ensemble finale. Geometry, materials and accessories are unchanged.

Encoded with FFmpeg, H.264 High/yuv420p, CRF 17, slow preset, BT.709, front-loaded
MP4 metadata for inline playback and byte-range seeking. No audio track.
Unbounded, Golos Text and JetBrains Mono are distributed under the SIL Open Font License.
Licences are retained in /fonts/.

Sources: scripts/create-guide-video.mjs, scripts/guide-video-renderer.ts,
scripts/dotos-guide-composition.ts, src/landing/guide-content.ts and the original
model/animation modules. Earlier Dotmates v5/v6 and DotOS v7/v8/v9 files remain historical assets;
the current player loads only dotos-intro-v12 files.
