# PhilInspect visual regression coverage

The source-of-truth inventory is
[`docs/design-system/figma-screen-matrix.md`](../../docs/design-system/figma-screen-matrix.md).

## Contract

- Browser tests use deterministic fictional fixtures, never real provider data.
- Desktop references render at `1440x1000`.
- Responsive shell checks render at `1024x768`, `768x1024`, `390x844`, and
  `360x800`.
- Screenshot names must exactly match the matrix.
- Dynamic timestamps, generated IDs, and animations must be stabilized before
  capture.
- Visual fixtures may expose UI state through an explicit test-only mechanism;
  they must not bypass server authorization or enable mutations in deployed
  staging.
- Updating a reference image requires a documented Figma comparison. A changed
  screenshot alone is not evidence of correctness.

## Intended layout

```text
tests/visual/
  README.md
  philinspect.visual.spec.ts
  snapshots/
    chromium/
```

The visual suite will be added after the functional routes and deterministic
factories exist. Until then, the matrix records each screen as `missing` or
`partial`; it must not be marked `matched` based only on the current generic
route renderer.
