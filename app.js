/* ==========================================================================
   app.js — Pure In-Memory 1940s Rattrapante Stopwatch Controller
   All state resides strictly in JS memory and is lost upon page refresh.
   ========================================================================== */

(function () {
  'use strict';

  const dial = new window.VintageDial();
  const sound = new window.MechanicalSoundEngine();

  // Strictly internal, ephemeral state (never persisted to storage or URL)
  const state = {
    running: false,
    accumulatedMs: 0,
    startPerfTime: 0,
    laps: [], // Array of { number: number, splitMs: number, totalMs: number }
    lastBeatIndex: -1,
    flyback: null, // { startPerf, duration, fromTotalMs, fromLapMs }
  };

  // DOM Elements
  const crownBtn = document.getElementById('crown-btn');
  const pusherLap = document.getElementById('pusher-lap');
  const pusherReset = document.getElementById('pusher-reset');

  const btnStartStop = document.getElementById('btn-start-stop');
  const btnStartStopLabel = document.getElementById('btn-start-stop-label');
  const btnLap = document.getElementById('btn-lap');
  const btnReset = document.getElementById('btn-reset');
  const btnSound = document.getElementById('btn-sound');
  const btnSoundLabel = document.getElementById('btn-sound-label');

  const statusStamp = document.getElementById('status-stamp');
  const displayTotal = document.getElementById('display-total');
  const displayCurrentLap = document.getElementById('display-current-lap');
  const rattrapanteStatusText = document.getElementById('rattrapante-status-text');
  const lapList = document.getElementById('lap-list');
  const lapSummary = document.getElementById('lap-summary');

  function getElapsedMs(nowPerf = performance.now()) {
    if (!state.running) {
      return state.accumulatedMs;
    }
    return state.accumulatedMs + Math.max(0, nowPerf - state.startPerfTime);
  }

  function getPreviousLapTotalMs() {
    if (state.laps.length === 0) return 0;
    return state.laps[state.laps.length - 1].totalMs;
  }

  function formatTime(ms) {
    const clamped = Math.max(0, ms);
    const totalCentiseconds = Math.floor(clamped / 10);
    const cs = totalCentiseconds % 100;
    const totalSeconds = Math.floor(totalCentiseconds / 100);
    const sec = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;

    const pad2 = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad2(hours)}:${pad2(min)}:${pad2(sec)}.${pad2(cs)}`;
    }
    return `${pad2(min)}:${pad2(sec)}.${pad2(cs)}`;
  }

  function pulseElements(...elements) {
    elements.forEach((el) => {
      if (!el) return;
      el.classList.remove('is-pressed');
      // Force reflow so rapid presses re-trigger mechanical travel
      void el.offsetWidth;
      el.classList.add('is-pressed');
      window.setTimeout(() => el.classList.remove('is-pressed'), 120);
    });
  }

  function toggleStartStop() {
    const now = performance.now();
    state.flyback = null;

    if (!state.running) {
      state.running = true;
      state.startPerfTime = now;
      state.lastBeatIndex = Math.floor(state.accumulatedMs / 200);
      sound.playCrownClick(true);
    } else {
      state.accumulatedMs = getElapsedMs(now);
      state.running = false;
      sound.playCrownClick(false);
    }

    pulseElements(crownBtn, btnStartStop);
    syncControlsUI();
    renderFrame(now);
  }

  function recordLap() {
    if (!state.running) return;

    const now = performance.now();
    const totalMs = getElapsedMs(now);
    const prevTotalMs = getPreviousLapTotalMs();
    const splitMs = Math.max(0, totalMs - prevTotalMs);
    const lapNumber = state.laps.length + 1;

    state.laps.push({
      number: lapNumber,
      splitMs,
      totalMs,
    });

    sound.playSplitClick();
    pulseElements(pusherLap, btnLap);
    renderLapsTable();
    syncControlsUI();
    renderFrame(now);
  }

  function resetWatch() {
    const now = performance.now();
    const currentTotal = getElapsedMs(now);
    if (state.running || currentTotal === 0) return;

    const currentLapMarker =
      state.laps.length > 0 ? getPreviousLapTotalMs() : currentTotal;

    // Trigger authentic heart-cam flyback return sweep to 12 o'clock
    state.flyback = {
      startPerf: now,
      duration: 210,
      fromTotalMs: currentTotal,
      fromLapMs: currentLapMarker,
    };

    state.running = false;
    state.accumulatedMs = 0;
    state.startPerfTime = 0;
    state.laps = [];
    state.lastBeatIndex = -1;

    sound.playResetSnap();
    pulseElements(pusherReset, btnReset);
    renderLapsTable();
    syncControlsUI();
    renderFrame(now);
  }

  function toggleSound() {
    const next = !sound.enabled;
    sound.setEnabled(next);
    btnSound.setAttribute('aria-pressed', String(next));
    btnSoundLabel.textContent = next ? 'TICKS ON' : 'MUTED';
    if (next) {
      sound.playCrownClick(true);
    }
    pulseElements(btnSound);
  }

  function syncControlsUI() {
    const hasElapsed = getElapsedMs() > 0;

    if (state.running) {
      btnStartStop.dataset.running = 'true';
      btnStartStopLabel.textContent = 'STOP';
      statusStamp.dataset.state = 'running';
      statusStamp.textContent = 'RUNNING';

      pusherLap.disabled = false;
      btnLap.disabled = false;

      pusherReset.disabled = true;
      btnReset.disabled = true;
      pusherReset.title = 'Pause stopwatch before resetting';
      btnReset.title = 'Pause stopwatch before resetting';
    } else if (hasElapsed) {
      btnStartStop.dataset.running = 'false';
      btnStartStopLabel.textContent = 'RESUME';
      statusStamp.dataset.state = 'paused';
      statusStamp.textContent = 'PAUSED';

      pusherLap.disabled = true;
      btnLap.disabled = true;

      pusherReset.disabled = false;
      btnReset.disabled = false;
      pusherReset.title = 'Reset to Zero (R)';
      btnReset.title = 'Reset to Zero (R)';
    } else {
      btnStartStop.dataset.running = 'false';
      btnStartStopLabel.textContent = 'START';
      statusStamp.dataset.state = 'idle';
      statusStamp.textContent = 'AT REST';

      pusherLap.disabled = true;
      btnLap.disabled = true;

      pusherReset.disabled = true;
      btnReset.disabled = true;
      pusherReset.title = 'Reset to Zero (R)';
      btnReset.title = 'Reset to Zero (R)';
    }

    if (state.laps.length === 0) {
      rattrapanteStatusText.textContent =
        'Crimson hand sweeps in lockstep until first split.';
    } else {
      const lastLap = state.laps[state.laps.length - 1];
      rattrapanteStatusText.textContent = `Crimson hand clamped at Lap #${String(
        lastLap.number
      ).padStart(2, '0')} (${formatTime(lastLap.totalMs)}).`;
    }

    const count = state.laps.length;
    lapSummary.textContent = `${count} ${count === 1 ? 'SPLIT' : 'SPLITS'} RECORDED`;
  }

  function renderLapsTable() {
    lapList.innerHTML = '';

    if (state.laps.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.className = 'empty-ledger-row';
      emptyTr.innerHTML =
        '<td colspan="4">Press <strong>LAP / SPLIT</strong> (or left watch pusher) while running to record splits.</td>';
      lapList.appendChild(emptyTr);
      return;
    }

    // Determine fastest & slowest split when at least 2 laps exist
    let fastestIdx = -1;
    let slowestIdx = -1;
    if (state.laps.length >= 2) {
      let minSplit = Infinity;
      let maxSplit = -Infinity;
      state.laps.forEach((lap, idx) => {
        if (lap.splitMs < minSplit) {
          minSplit = lap.splitMs;
          fastestIdx = idx;
        }
        if (lap.splitMs > maxSplit) {
          maxSplit = lap.splitMs;
          slowestIdx = idx;
        }
      });
      if (fastestIdx === slowestIdx) {
        fastestIdx = -1;
        slowestIdx = -1;
      }
    }

    // Render newest lap at top of timekeeper's ledger
    for (let i = state.laps.length - 1; i >= 0; i--) {
      const lap = state.laps[i];
      const tr = document.createElement('tr');

      const tdNum = document.createElement('td');
      tdNum.className = 'lap-num-cell';
      tdNum.textContent = `#${String(lap.number).padStart(2, '0')}`;

      const tdSplit = document.createElement('td');
      tdSplit.className = 'lap-split-cell';
      tdSplit.textContent = `+${formatTime(lap.splitMs)}`;

      const tdTotal = document.createElement('td');
      tdTotal.textContent = formatTime(lap.totalMs);

      const tdMark = document.createElement('td');
      if (i === fastestIdx) {
        const badge = document.createElement('span');
        badge.className = 'lap-badge lap-badge--fastest';
        badge.textContent = 'BEST';
        tdMark.appendChild(badge);
      } else if (i === slowestIdx) {
        const badge = document.createElement('span');
        badge.className = 'lap-badge lap-badge--slowest';
        badge.textContent = 'SLOW';
        tdMark.appendChild(badge);
      } else {
        tdMark.textContent = '—';
      }

      tr.append(tdNum, tdSplit, tdTotal, tdMark);
      lapList.appendChild(tr);
    }
  }

  function renderFrame(nowPerf) {
    if (state.flyback) {
      const t = Math.min(1, (nowPerf - state.flyback.startPerf) / state.flyback.duration);
      if (t >= 1) {
        state.flyback = null;
        dial.render(0, 0);
      } else {
        dial.renderFlyback(state.flyback.fromTotalMs, state.flyback.fromLapMs, t);
      }
      displayTotal.textContent = '00:00.00';
      displayCurrentLap.textContent = '00:00.00';
      return;
    }

    const totalMs = getElapsedMs(nowPerf);
    const prevLapTotal = getPreviousLapTotalMs();
    const currentLapMs = Math.max(0, totalMs - prevLapTotal);

    // Crimson rattrapante hand sweeps with main hand until first lap, then holds last lap mark
    const rattrapanteDialMs = state.laps.length > 0 ? prevLapTotal : totalMs;

    // Trigger 5 Hz (200ms) Swiss lever escapement tick sound on each beat boundary
    if (state.running) {
      const beatIndex = Math.floor(totalMs / 200);
      if (beatIndex > state.lastBeatIndex) {
        state.lastBeatIndex = beatIndex;
        sound.playEscapementTick(beatIndex % 2 === 1);
      }
    }

    dial.render(totalMs, rattrapanteDialMs);
    displayTotal.textContent = formatTime(totalMs);
    displayCurrentLap.textContent = formatTime(currentLapMs);
  }

  function animationLoop(nowPerf) {
    if (state.running || state.flyback) {
      renderFrame(nowPerf);
    }
    window.requestAnimationFrame(animationLoop);
  }

  // Event Listeners — Watch Pushers & Console Buttons
  crownBtn.addEventListener('click', toggleStartStop);
  btnStartStop.addEventListener('click', toggleStartStop);

  pusherLap.addEventListener('click', recordLap);
  btnLap.addEventListener('click', recordLap);

  pusherReset.addEventListener('click', resetWatch);
  btnReset.addEventListener('click', resetWatch);

  btnSound.addEventListener('click', toggleSound);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleStartStop();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      recordLap();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      resetWatch();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleSound();
    }
  });

  // Initial render
  syncControlsUI();
  renderFrame(performance.now());
  window.requestAnimationFrame(animationLoop);
})();
