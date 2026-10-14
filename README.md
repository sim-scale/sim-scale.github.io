# Sim Scale website

Source for the Sim Scale research website at https://sim-scale.github.io/.

The site uses no third-party analytics, externally hosted fonts, or copied media assets.

This project is not affiliated with SimScale GmbH or simscale.com.

Preview locally with `python -m http.server 8000`, then open http://localhost:8000.
No build step or JavaScript dependencies are required.

The browser asset playground is an illustrative procedural mesh generator,
with geometry controls, orbit interaction, sampling, and OBJ export in millimeters.
It does not invoke the research AssetEngine or validate simulation readiness.

`simulation-results.json` transcribes the manuscript simulation table at commit
`25eb94316d645e83a0952723a194939587728849`. It retains unavailable comparisons,
both policy backends, all three evaluation sources, and reported standard errors.
The evaluation controls compare training asset sources with demonstration
generation held fixed. Related-work comparisons describe scope rather than
claiming measured token or throughput advantages.
