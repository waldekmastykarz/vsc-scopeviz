# Scopeviz

Visualizes Scope readout JSON files — answers **"Does my extension help or harm?"** and **"What do I change where?"**

## Features

- Opens a webview preview alongside readout JSON files
- **Lift / Drag** section: profile comparison table showing deltas, selection status, and token costs
- **What to Change** section: prioritized action cards with root cause, affected runs, and fix targets
- **Supporting Evidence** section: expandable scores, behaviors, and individual run details
- Live-reloads when the source JSON is saved

## Usage

1. Open a Scope readout `.json` file
2. Click the graph icon in the editor title bar, or run **Scopeviz: Open Readout Preview** from the Command Palette

## Requirements

- [ATIF Visualizer](https://marketplace.visualstudio.com/items?itemName=waldek.atif-visualizer) extension (installed automatically as a dependency)
