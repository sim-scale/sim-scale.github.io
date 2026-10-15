# Sim Scale website

Source for the Sim Scale research website at https://sim-scale.github.io/.

The site uses no third-party analytics, externally hosted fonts, or copied media assets.

This project is not affiliated with SimScale GmbH or simscale.com.

Preview locally with `python -m http.server 8000`, then open http://localhost:8000.
No build step or JavaScript dependencies are required.

The browser playground selects 128 precompiled meshes evaluated from the original
mug and mug-tree Python generators (64 explicit parameter combinations per family).
It does not approximate or interpolate geometry. The manifest stores source hashes,
exact parameters, mesh hashes and counts. OBJ exports use meters and a Z-up axis.
This is a geometry preview, not simulator-physics or robot-task validation.
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
