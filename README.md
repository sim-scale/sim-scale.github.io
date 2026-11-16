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

The 42-second overview uses original project clips, with chapter labels, English
captions and a native HTML transcript. Provenance is recorded next to the MP4.
Category videos isolate object imagery; control names and explanations are native
HTML so they remain readable at mobile sizes.

`real-world-results.json` transcribes the manuscript's separate complete-system and
asset-source tables at the source commit below. Scores include partial credit and
retain all unavailable cells and source footnotes. The asset-source study uses human
source demonstrations and unmatched training budgets; do not combine it with the
complete-system study or describe these scores as full-task success rates.

`simulation-results.json` transcribes the manuscript simulation table at commit
`25eb94316d645e83a0952723a194939587728849`. It retains unavailable comparisons,
both policy backends, all three evaluation sources, and reported standard errors.
The evaluation controls compare training asset sources with demonstration
generation held fixed. Related-work comparisons describe scope rather than
claiming measured token or throughput advantages.
