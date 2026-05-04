# Scope readout preview

[![VS Code Marketplace](https://vsmarketplacebadges.dev/version/waldek.scopeviz.svg)](https://marketplace.visualstudio.com/items?itemName=waldek.scopeviz)
[![Installs](https://vsmarketplacebadges.dev/installs-short/waldek.scopeviz.svg)](https://marketplace.visualstudio.com/items?itemName=waldek.scopeviz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**See if your extension helps or harms — and what to change.** Open any Scope readout JSON file and get an interactive breakdown of lift/drag metrics, prioritized action cards, and supporting evidence — right inside VS Code.

## Why

Raw Scope readout JSON is painful to read. Scrolling through nested scorecard data, behavior analyses, and per-run details to understand what's working and what isn't kills your flow. This extension turns that JSON into a navigable dashboard so you can diagnose extension impact in seconds instead of minutes.

## Features

- **One-click preview** — click the graph icon in the editor title bar on any readout JSON file
- **Lift / Drag section** — profile comparison table showing deltas, selection status, and token costs
- **What to Change section** — prioritized action cards with root cause, affected runs, and fix targets
- **Supporting Evidence section** — expandable scores, behaviors, and individual run details
- **Live reload** — preview updates automatically as you edit the source file
- **Native VS Code look** — uses your theme colors, codicons, and standard UI patterns

## Getting Started

1. Install the extension
2. Open a Scope readout `.json` file
3. Click the **graph icon** in the editor title bar (or run `Scope readout preview: Open Readout Preview` from the Command Palette)

The preview opens in a side panel so you can read the readout alongside the raw JSON.

## Requirements

- [ATIF Visualizer](https://marketplace.visualstudio.com/items?itemName=waldek.atif-visualizer) extension (installed automatically as a dependency)
