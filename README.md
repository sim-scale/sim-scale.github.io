# Sim Scale website

Source for the Sim Scale research website at https://sim-scale.github.io/.

The site uses no third-party analytics, externally hosted fonts, or copied media assets.

This project is not affiliated with SimScale GmbH or simscale.com.

Preview locally with `python -m http.server 8000`, then open http://localhost:8000.
No build step is required. The generator playground fetches Pyodide from a CDN.

The browser playground runs the original AssetEngine Python generators of the paper:
the mug of Fig. 3 and the 20 categories of the appendix figures. When the playground
nears the viewport, a Web Worker loads Pyodide 0.27.7 and NumPy from the jsDelivr CDN,
unpacks `media/generators/webgen.zip` (the generators, the Articraft SDK they build on,
under its Apache-2.0 license, and a small runtime), and uses manifold 3.5.3 (vendored,
Apache-2.0) for mesh Booleans. The controls are the major parameters of the paper
figures over their widened ranges, and every change runs the generator again; nothing
is precomputed or interpolated. Unused CAD and solver imports are stubbed, and the one
generator that uses CadQuery (refrigerator) gets a small box-and-Boolean replacement.
In a native check, all 21 generators give the same vertices as the original
pipeline, to float32 rounding. OBJ exports use meters and a Z-up axis. This is a
geometry preview, not simulator-physics or robot-task validation.
The renderer vendors Three.js 0.169.0 locally; its license is in vendor/.

The page text follows the paper. Figures in `media/paper/` are rendered from the paper PDFs.
`figures.js` steps a highlight through parts of these figures, and rebuilds the paper's bar
charts from their plotted values (task scores in %, averaged as stated in each caption), so the
bars animate and the real-world charts can switch between the two policy backends.

The Method section is an animated overview (inputs, the two engines, and their outputs as videos)
followed by two short players that step through AssetEngine and DemoEngine on HangMug, with images
from the paper's method figure. `media/method/assets-field.mp4` (mugs and mug trees sampled from the website's generators),
`human-demo.mp4` (the recorded HangMug teleoperation, mug_twin demo_1), and `demos.mp4` (recorded HangMug
demonstrations on 20 sampled mug and mug-tree pairs) are Blender renders in the lighting and materials of
the opening video, with the robot posed by forward kinematics of its URDF from the recorded joint states. `method.js` runs the overview and the players.

Category videos isolate object imagery; control names and explanations are native
HTML so they remain readable at mobile sizes. Baseline rollout clips in
`media/comparisons/` are selected illustrations, not success-rate estimates.
