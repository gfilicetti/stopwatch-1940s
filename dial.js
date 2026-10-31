/* ==========================================================================
   dial.js — Precision 1940s Swiss Chronograph SVG Dial & Hand Renderer
   ========================================================================== */

const SVG_NS = 'http://www.w3.org/2000/svg';

class VintageDial {
  constructor() {
    this.mainTicksGroup = document.getElementById('main-dial-ticks');
    this.mainNumeralsGroup = document.getElementById('main-dial-numerals');
    this.minSubTicksGroup = document.getElementById('subdial-minutes-ticks');
    this.hrSubTicksGroup = document.getElementById('subdial-hours-ticks');

    this.handSeconds = document.getElementById('hand-seconds');
    this.handLap = document.getElementById('hand-lap');
    this.handMinutes = document.getElementById('hand-minutes');
    this.handHours = document.getElementById('hand-hours');

    this.buildMainDial();
    this.buildMinutesSubdial();
    this.buildHoursSubdial();
    this.render(0, 0);
  }

  createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
    return el;
  }

  polar(cx, cy, radius, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  buildMainDial() {
    const cx = 250;
    const cy = 250;

    // Outer & inner chemin-de-fer (railroad track) concentric rings
    this.mainTicksGroup.appendChild(
      this.createSvgEl('circle', {
        cx,
        cy,
        r: 222,
        fill: 'none',
        stroke: '#2b241d',
        'stroke-width': 1.15,
      })
    );
    this.mainTicksGroup.appendChild(
      this.createSvgEl('circle', {
        cx,
        cy,
        r: 210,
        fill: 'none',
        stroke: '#2b241d',
        'stroke-width': 0.9,
      })
    );

    // 300 ticks = 60 seconds * 5 subdivisions per second (18,000 vph / 0.2s)
    for (let i = 0; i < 300; i++) {
      const angle = (i / 300) * 360;
      const isFiveSec = i % 25 === 0;
      const isOneSec = i % 5 === 0;
      const isQuarter = i % 75 === 0; // 60, 15, 30, 45

      const rOuter = 222;
      let rInner = 213.5;
      let strokeWidth = 0.72;
      let stroke = '#3a3127';

      if (isFiveSec) {
        rInner = 205.5;
        strokeWidth = 2.3;
        stroke = isQuarter ? '#9e231b' : '#1e1a16';
      } else if (isOneSec) {
        rInner = 210;
        strokeWidth = 1.35;
        stroke = '#231e19';
      }

      const p1 = this.polar(cx, cy, rOuter, angle);
      const p2 = this.polar(cx, cy, rInner, angle);

      this.mainTicksGroup.appendChild(
        this.createSvgEl('line', {
          x1: p1.x.toFixed(2),
          y1: p1.y.toFixed(2),
          x2: p2.x.toFixed(2),
          y2: p2.y.toFixed(2),
          stroke,
          'stroke-width': strokeWidth,
          'stroke-linecap': 'butt',
        })
      );
    }

    // Outer crimson 1/100th-minute (decimal) / 5-sec peripheral markers & Main 5-60 Arabic numerals
    for (let sec = 5; sec <= 60; sec += 5) {
      const angle = (sec / 60) * 360;
      const isQuarter = sec % 15 === 0;

      // Main 5..60 Arabic numeral inside the railroad track
      const numPos = this.polar(cx, cy, 185, angle);
      const numEl = this.createSvgEl('text', {
        x: numPos.x.toFixed(2),
        y: numPos.y.toFixed(2),
        'text-anchor': 'middle',
        class: isQuarter ? 'dial-numeral dial-numeral--red' : 'dial-numeral',
      });
      numEl.textContent = String(sec);
      this.mainNumeralsGroup.appendChild(numEl);

      // Subtle crimson peripheral second/decimal index outside the railroad ring (skipping 30 where FAB. SUISSE sits)
      if (sec !== 30) {
        const outerPos = this.polar(cx, cy, 229.5, angle);
        const rot = angle > 90 && angle < 270 ? angle + 180 : angle;
        const outerEl = this.createSvgEl('text', {
          x: outerPos.x.toFixed(2),
          y: outerPos.y.toFixed(2),
          'text-anchor': 'middle',
          class: 'dial-outer-fifth',
          transform: `rotate(${rot.toFixed(1)} ${outerPos.x.toFixed(2)} ${outerPos.y.toFixed(2)})`,
        });
        const decimalVal = Math.round((sec / 60) * 100);
        outerEl.textContent = decimalVal === 100 ? '100' : String(decimalVal);
        this.mainNumeralsGroup.appendChild(outerEl);
      }
    }
  }

  buildMinutesSubdial() {
    // 30-Minute Register with half-minute ticks (60 graduations)
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 360;
      const isWholeMin = i % 2 === 0;
      const min = i / 2;
      const isFiveMin = i % 10 === 0;
      const isTelegraphMark = isWholeMin && (min === 3 || min === 6 || min === 9);

      const rOuter = 55.5;
      let rInner = 52;
      let strokeWidth = 0.7;
      let stroke = '#3b3228';

      if (isFiveMin) {
        rInner = 47;
        strokeWidth = 1.65;
        stroke = min === 0 ? '#9e231b' : '#1e1a16';
      } else if (isTelegraphMark) {
        // Classic 1940s 3-minute aviation/telephone tariff ticks in crimson
        rInner = 46;
        strokeWidth = 1.35;
        stroke = '#9e231b';
      } else if (isWholeMin) {
        rInner = 49.5;
        strokeWidth = 1.05;
      }

      const p1 = this.polar(0, 0, rOuter, angle);
      const p2 = this.polar(0, 0, rInner, angle);

      this.minSubTicksGroup.appendChild(
        this.createSvgEl('line', {
          x1: p1.x.toFixed(2),
          y1: p1.y.toFixed(2),
          x2: p2.x.toFixed(2),
          y2: p2.y.toFixed(2),
          stroke,
          'stroke-width': strokeWidth,
        })
      );
    }

    for (let m = 5; m <= 30; m += 5) {
      const angle = (m / 30) * 360;
      const pos = this.polar(0, 0, 36.5, angle);
      const txt = this.createSvgEl('text', {
        x: pos.x.toFixed(2),
        y: pos.y.toFixed(2),
        'text-anchor': 'middle',
        class: m === 30 ? 'subdial-numeral subdial-numeral--red' : 'subdial-numeral',
      });
      txt.textContent = String(m);
      this.minSubTicksGroup.appendChild(txt);
    }
  }

  buildHoursSubdial() {
    // 12-Hour Register with half-hour ticks (24 graduations)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * 360;
      const isWholeHour = i % 2 === 0;
      const isMajor = i % 4 === 0;

      const rOuter = 51.5;
      const rInner = isMajor ? 43.5 : isWholeHour ? 46 : 48.5;
      const strokeWidth = isMajor ? 1.6 : isWholeHour ? 1.1 : 0.7;
      const stroke = i === 0 ? '#9e231b' : '#1e1a16';

      const p1 = this.polar(0, 0, rOuter, angle);
      const p2 = this.polar(0, 0, rInner, angle);

      this.hrSubTicksGroup.appendChild(
        this.createSvgEl('line', {
          x1: p1.x.toFixed(2),
          y1: p1.y.toFixed(2),
          x2: p2.x.toFixed(2),
          y2: p2.y.toFixed(2),
          stroke,
          'stroke-width': strokeWidth,
        })
      );
    }

    for (let h = 2; h <= 12; h += 2) {
      const angle = (h / 12) * 360;
      const pos = this.polar(0, 0, 33, angle);
      const txt = this.createSvgEl('text', {
        x: pos.x.toFixed(2),
        y: pos.y.toFixed(2),
        'text-anchor': 'middle',
        class: h === 12 ? 'subdial-numeral subdial-numeral--red' : 'subdial-numeral',
      });
      txt.textContent = String(h);
      this.hrSubTicksGroup.appendChild(txt);
    }
  }

  /**
   * Renders all 4 analog hands for a given total elapsed ms and rattrapante ms.
   * Authentic 18,000 vph (5 Hz = 200ms) discrete mechanical balance-wheel beat
   * or micro-stepped 1/10s mechanical motion. Let's use realistic 10 Hz / 5 Hz
   * mechanical spring-escapement impulse with tiny damped settling so it feels
   * unmistakably like a 1940s mechanical movement!
   */
  render(elapsedMs, lapMarkerMs) {
    const totalSeconds = this.mechanicalSeconds(elapsedMs);
    const lapSeconds = this.mechanicalSeconds(lapMarkerMs);

    const secAngle = (totalSeconds % 60) * 6;
    const lapAngle = (lapSeconds % 60) * 6;

    // Classic 1940s semi-instantaneous / continuous creeping minute & hour registers
    const totalMinutes = elapsedMs / 60000;
    const minAngle = (totalMinutes % 30) * 12;

    const totalHours = elapsedMs / 3600000;
    const hrAngle = (totalHours % 12) * 30;

    this.handSeconds.setAttribute('transform', `rotate(${secAngle.toFixed(3)})`);
    this.handLap.setAttribute('transform', `rotate(${lapAngle.toFixed(3)})`);
    this.handMinutes.setAttribute('transform', `rotate(${minAngle.toFixed(3)})`);
    this.handHours.setAttribute('transform', `rotate(${hrAngle.toFixed(3)})`);
  }

  /**
   * Heart-cam flyback reset: returns every hand to 0 deg along its shortest arc.
   */
  renderFlyback(fromElapsedMs, fromLapMs, progress) {
    const eased = 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 3);
    const returnArc = (deg) => {
      const norm = ((deg % 360) + 360) % 360;
      if (norm === 0) return 0;
      return norm > 180 ? norm + (360 - norm) * eased : norm * (1 - eased);
    };

    const secStart = (this.mechanicalSeconds(fromElapsedMs) % 60) * 6;
    const lapStart = (this.mechanicalSeconds(fromLapMs) % 60) * 6;
    const minStart = ((fromElapsedMs / 60000) % 30) * 12;
    const hrStart = ((fromElapsedMs / 3600000) % 12) * 30;

    this.handSeconds.setAttribute('transform', `rotate(${returnArc(secStart).toFixed(3)})`);
    this.handLap.setAttribute('transform', `rotate(${returnArc(lapStart).toFixed(3)})`);
    this.handMinutes.setAttribute('transform', `rotate(${returnArc(minStart).toFixed(3)})`);
    this.handHours.setAttribute('transform', `rotate(${returnArc(hrStart).toFixed(3)})`);
  }

  /**
   * Simulates an authentic 1940s 18,000 vph (5 beats per second = 200ms per beat)
   * Swiss lever escapement impulse: rests cleanly on each 1/5th-second graduation
   * and snaps forward smoothly during the pallet-fork unlock window.
   */
  mechanicalSeconds(ms) {
    if (ms <= 0) return 0;
    const beatMs = 200; // 1/5th second (18,000 vibrations per hour)
    const restWindow = 162;
    const impulseWindow = beatMs - restWindow; // 38ms impulse

    const beatIndex = Math.floor(ms / beatMs);
    const withinBeat = ms - beatIndex * beatMs;

    let frac = 0;
    if (withinBeat > restWindow) {
      const t = (withinBeat - restWindow) / impulseWindow; // 0..1
      frac = t < 0.75
        ? (t / 0.75) * 1.04
        : 1.04 - ((t - 0.75) / 0.25) * 0.04;
    }

    return ((beatIndex + frac) * beatMs) / 1000;
  }
}

window.VintageDial = VintageDial;
