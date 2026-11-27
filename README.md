# Scope readout preview

[![VS Code Marketplace](https://vsmarketplacebadges.dev/version/waldek.scopeviz.svg)](https://marketplace.visualstudio.com/items?itemName=waldek.scopeviz)
[![Installs](https://vsmarketplacebadges.dev/installs-short/waldek.scopeviz.svg)](https://marketplace.visualstudio.com/items?itemName=waldek.scopeviz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**See if your extension helps or harms — and what to change.** Open any Scope readout JSON file and get an interactive breakdown of lift/drag metrics, prioritized action cards, and supporting evidence — right inside VS Code.

## Why

Raw Scope readout JSON is painful to read. Scrolling through nested scorecard data, behavior analyses, and per-run details to understand what's working and what isn't kills your flow. This extension turns that JSON into a navigable dashboard so you can diagnose extension impact in seconds instead of minutes.

## Features

- **One-click preview**: click the graph icon in the editor title bar on any readout JSON file
- **Lift or drag at a glance**: every profile is compared against the readout's baseline on one 0–100% scale. Bars span the scores of a profile's runs from worst to best, a solid line marks the average, and dots show how many runs landed on each score. The baseline's range is drawn behind every row.
- **Plain verdicts**: Lift, Drag, Unclear, Expensive lift (lift that costs over 50% more) and Best lift, with the score and cost change per run next to each
- **What to change**: prioritized Fix, Create and Constraint cards with root cause, affected runs and evidence
- **Supporting evidence**: a criteria-by-profile table, behaviors per profile, and every run with its criteria results and a link to its trajectory
- **Live reload**: the preview updates as you edit the source file
- **DevAX design language**: matches [Developer Agent Experience](https://microsoft.github.io/agent-experience/), in light or dark to follow your VS Code theme

## Getting Started

1. Install the extension
2. Open a Scope readout `.json` file
3. Click the **graph icon** in the editor title bar (or run `Scope readout preview: Open Readout Preview` from the Command Palette)

The preview opens in a side panel so you can read the readout alongside the raw JSON.

## Requirements

- [ATIF Visualizer](https://marketplace.visualstudio.com/items?itemName=waldek.atif-visualizer) extension (installed automatically as a dependency)
