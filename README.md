# 1944 Chronographe Rattrapante — Vintage Analog Stopwatch

A zero-dependency web application recreating a **1940s Swiss mechanical pocket stopwatch (*rattrapante* / split-seconds chronograph)** with a lap function and a vintage timekeeper's clipboard ledger.

## Features

- **1940s Pocket Chronograph Dial & Case**:
  - Brushed nickel-chrome pocket case, hinged bow loop, knurled 12 o'clock crown, angled side pushers, and domed Hesalite crystal glare.
  - Aged ivory enamel dial with a 300-division (`1/5` second / 18,000 vph) *chemin-de-fer* railroad track, peripheral decimal markers, sunken 30-minute register (with 3/6/9-minute aviation/telegraph tariff marks), and sunken 12-hour register.
  - Heat-blued Breguet *pomme* main sweep hand paired with a crimson *rattrapante* split-seconds lap hand that sweeps in lockstep until the first lap, then clamps to mark each recorded split on the dial.
- **Mechanical Escapement & Sound Synthesis**:
  - Realistic 5 Hz (18,000 vibrations/hour) Swiss lever escapement hand impulse and heart-cam flyback reset sweep.
  - Synthesized Web Audio API mechanical crown clicks, rattrapante clamp snaps, and pallet-fork ticks (toggleable via `M` or the **TICKS ON** switch).
- **Lap Timing & Timekeeper's Log**:
  - Tracks individual split deltas, cumulative elapsed time, and automatically stamps **BEST** (fastest) and **SLOW** (slowest) laps.
- **Strictly Internal Ephemeral State**:
  - All timing and lap state lives purely in JavaScript memory (`localStorage`, `sessionStorage`, cookies, and URL parameters are never written). Refreshing the browser tab resets the stopwatch cleanly.

## Running Locally

You can open `index.html` directly in any modern browser, or serve the directory locally with Python:

```bash
cd stopwatch-1940s
python3 -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

## Controls & Shortcuts

| Action | Watch Hardware | Console / Keyboard |
| --- | --- | --- |
| **Start / Stop** | Top Crown (12 o'clock) | **START / STOP** or `Space` |
| **Lap / Split** | Left Pusher (10:30) | **LAP / SPLIT** or `L` |
| **Reset** (when paused) | Right Pusher (1:30) | **RESET** or `R` |
| **Mute / Unmute Ticks** | — | **TICKS ON / MUTED** or `M` |
