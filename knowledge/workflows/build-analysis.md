# Build Analysis Workflow

Repeatable loop the assistant runs to improve a build.

1. **Snapshot** the current build:
   `snapshotBuild("/mnt/c/Users/jyi46/OneDrive/Documents/Path of Building (PoE2)/Builds/UR HOMO.xml", "builds")`
2. **Baseline**: `const before = evaluateBuild("builds/UR HOMO.xml")`.
3. **Find weak spots**: compare `before` against `knowledge/mechanics.md`
   (uncapped resists, low EHP, DPS bottlenecks) and `knowledge/meta.md`.
4. **Propose** a change (tree node, gem/support swap, item) and produce a modified
   build XML (edit a copy; re-encode with `encodeBuildCode` if sharing).
5. **Re-evaluate**: `const after = evaluateBuild("builds/<variant>.xml")`.
6. **Diff & report**: `diffMetrics(before, after)` → present before/after numbers,
   rough cost (from `crafting/` + sources), and exact steps to apply in PoB2.

Repeat per candidate. Keep accepted changes; discard regressions.
