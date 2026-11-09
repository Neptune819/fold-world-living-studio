# Moon Tides

Creative Coding 2.0 for Fold World Living Studio, 9 November 2026.

This work develops the moon-sea and astronomical instruments of the earlier Fold World scene into a hand-responsive canvas artwork. Move one hand to steer the stars; pinch thumb and index finger to gather them, then open the pinch to release a ripple. Pointer and touch interaction remain available without camera access.

## Runtime

Serve this directory over HTTPS or localhost. No build step, account, API key, server inference or external runtime CDN is required. Camera access is opt-in and only video is requested. Frames remain inside the page and are neither recorded nor uploaded. The Stop camera button releases all camera tracks. Leaving or hiding the work stops the camera. The page pauses drawing while hidden.

The embedded host can post a same-origin message `{type: 'moon-tides-visibility', visible: false}` when closing the artwork, or `visible: true` to resume it. When removing the iframe entirely, its document and camera are also discarded.

## Model and mapping

Google MediaPipe Hand Landmarker uses a pretrained ML model to estimate 21 hand keypoints. The average of wrist and finger-base keypoints supplies the mirrored attraction point. Thumb-to-index distance divided by wrist-to-middle-base distance supplies a scale-normalized pinch measure. Separate close and release thresholds reduce repeated triggering. The pretrained model supplies visual perception; the art rules are explicit JavaScript and Canvas 2D. No custom model training or reinforcement learning is claimed.

Model inference is capped at approximately 12.5 frames per second on CPU; drawing is independent. This avoids competing with the enclosing Three.js scene for a GPU inference context. The camera preview has an optional 21-point overlay and can be hidden.

## Frozen dependencies

- `@mediapipe/tasks-vision` **0.10.21**, Apache 2.0, official npm tarball: https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.21.tgz
- SDK files copied from that exact package: `vision_bundle.mjs`, SIMD and non-SIMD runtime loader JavaScript and WASM.
- Hand Landmarker **float16 version 1**: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
- Official documentation: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker?tab=Web
- MediaPipe license: `vendor/LICENSE.apache-2.0.txt`.

The original canvas visuals and interaction code were developed with AI coding assistance. `window.moonTides.status` exposes read-only actual runtime state for verification; pointer mode is explicitly labelled and never presented as camera recognition.
