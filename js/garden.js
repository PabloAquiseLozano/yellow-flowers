(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- shapes
  // Every species is built from the same two primitives (an oval "petal" and
  // a round "center") — species read as different flowers through COUNT,
  // RING LAYOUT and SIZE, not through bespoke geometry per species.

  function el(tag, styles) {
    var e = document.createElement('div');
    if (styles) Object.assign(e.style, styles);
    return e;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Used only if data-list/frases.json can't be fetched (e.g. opened as a
  // local file:// page, where fetch has no server to talk to).
  var FALLBACK_MESSAGES = [
    'Que cada día te sorprenda algo pequeño y bonito.',
    'Mereces la misma paciencia que le das a los demás.',
    'Floreces incluso cuando no te das cuenta.',
    'Hoy es un buen día para ser amable contigo.',
    'Tu ritmo también es un ritmo válido.'
  ];

  // A petal anchored at (0,0) of `parent`, pointing outward at `angleDeg`,
  // `distance`px from center. Returns the petal element (bloom target);
  // the wrapping anchor carries the static rotation so GSAP only ever
  // touches the child's own transform (scale/opacity).
  function addPetal(parent, angleDeg, distance, w, h, color, radius) {
    var anchor = el(parent, {
      position: 'absolute', left: '50%', top: '50%', width: '0', height: '0',
      transform: 'rotate(' + angleDeg + 'deg)'
    });
    parent.appendChild(anchor);
    var petal = el(parent, {
      position: 'absolute', left: (-w / 2) + 'px', top: (-distance - h) + 'px',
      width: w + 'px', height: h + 'px', background: color,
      borderRadius: (radius || '50% 50% 50% 50% / 65% 65% 35% 35%')
    });
    anchor.appendChild(petal);
    return petal;
  }

  function addCenter(parent, d, color) {
    var c = el(parent, {
      position: 'absolute', left: '50%', top: '50%', width: d + 'px', height: d + 'px',
      marginLeft: (-d / 2) + 'px', marginTop: (-d / 2) + 'px',
      borderRadius: '50%', background: color
    });
    parent.appendChild(c);
    return c;
  }

  // Ring of evenly-spaced petals, jittered slightly for a hand-grown look.
  function petalRing(head, count, distance, w, h, color, startAngle) {
    var petals = [];
    for (var i = 0; i < count; i++) {
      var angle = (startAngle || 0) + (i / count) * 360 + (Math.random() * 8 - 4);
      petals.push(addPetal(head, angle, distance, w, h, color));
    }
    return petals;
  }

  function shade(hex, percent) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.max(0, ((n >> 16) & 255) + percent));
    var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + percent));
    var b = Math.min(255, Math.max(0, (n & 255) + percent));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function relLum(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    function c(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
  }
  function contrastRatio(a, b) {
    var l1 = relLum(a), l2 = relLum(b);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  // The user's color picker can hand us anything from near-white to near-black,
  // and it ends up as real text (the name reveal) or a shape that must read
  // against a background it wasn't chosen with in mind (daisy petals). Nudge
  // it toward black or white — whichever the background calls for — until it
  // clears a minimum contrast, instead of trusting the raw picked value.
  function readableOn(hex, bgHex, minRatio) {
    var bgLight = relLum(bgHex) > 0.5;
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var step = bgLight ? -16 : 16;
    for (var i = 0; i < 14; i++) {
      var cur = '#' + [r, g, b].map(function (v) {
        return Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
      }).join('');
      if (contrastRatio(cur, bgHex) >= (minRatio || 4.5)) return cur;
      r += step; g += step; b += step;
    }
    return bgLight ? '#2A2210' : '#FDF6E3';
  }

  // Each species returns { petals: [elements to bloom-in], stemH, hasHead }.
  var SPECIES = {
    main: function (head, color) {
      addCenter(head, 20, shade(color, -40));
      return petalRing(head, 12, 11, 9, 26, color);
    },
    daisy: function (head, color) {
      addCenter(head, 12, '#E8A93A');
      // Pure white + a hairline edge — a near-white petal has plenty of
      // luminance contrast on paper, but no visible edge against a similarly
      // pale cream background, so it reads as invisible rather than white.
      var petals = petalRing(head, 8, 7, 8, 17, '#FFFFFF');
      petals.forEach(function (p) { p.style.boxShadow = '0 0 0 1px rgba(58, 46, 18, 0.18)'; });
      return petals;
    },
    rose: function (head, color) {
      var outer = petalRing(head, 6, 8, 15, 22, shade(color, -15));
      var inner = petalRing(head, 5, 3, 10, 14, shade(color, 20), 20);
      return outer.concat(inner);
    },
    tulip: function (head, color) {
      var petals = [];
      [-18, 0, 18].forEach(function (a) {
        petals.push(addPetal(head, a, 2, 15, 30, color, '50% 50% 50% 50% / 75% 75% 15% 15%'));
      });
      return petals;
    },
    marigold: function (head, color) {
      var p = petalRing(head, 8, 10, 7, 16, shade(color, -10));
      p = p.concat(petalRing(head, 6, 5, 6, 12, color, 20));
      p = p.concat(petalRing(head, 3, 1, 5, 8, shade(color, 15), 40));
      return p;
    },
    clover: function (head, color) {
      var p = [];
      [0, 120, 240].forEach(function (a) {
        p.push(addPetal(head, a, 1, 16, 20, color, '50% 50% 50% 0% / 50% 50% 50% 50%'));
      });
      return p;
    },
    forgetmenot: function (head, color) {
      var p = [];
      var blooms = [[-10, -6], [10, -4], [0, 6], [-14, 8], [12, 10]];
      blooms.forEach(function (pos) {
        var mini = el(head, { position: 'absolute', left: (50 + pos[0]) + '%', top: (50 + pos[1]) + '%', width: 0, height: 0 });
        head.appendChild(mini);
        p = p.concat(petalRing(mini, 5, 3, 3, 6, color));
        addCenter(mini, 2.5, '#F7D774');
      });
      return p;
    },
    lavender: function (head, color) {
      var p = [];
      var buds = 7;
      for (var i = 0; i < buds; i++) {
        var t = i / (buds - 1);
        var y = -t * 34;
        var size = 8 - t * 3;
        var bud = el(head, {
          position: 'absolute', left: '50%', top: '50%',
          marginLeft: (-size / 2 + (Math.random() * 3 - 1.5)) + 'px', marginTop: (y - size / 2) + 'px',
          width: size + 'px', height: (size * 1.3) + 'px', borderRadius: '45%', background: shade(color, -t * 20)
        });
        head.appendChild(bud);
        p.push(bud);
      }
      return p;
    }
  };

  var STEM_H = { main: 92, daisy: 60, rose: 78, tulip: 74, marigold: 82, clover: 26, forgetmenot: 46, lavender: 96 };
  var HEAD_OFFSET_Y = { clover: -6 };

  function buildLeaf(color) {
    return el(null, {
      position: 'absolute', width: '14px', height: '22px', background: color,
      borderRadius: '0% 100% 0% 100%'
    });
  }

  function buildFlower(species, color, stemColor) {
    var stemH = STEM_H[species] || 80;
    var wrap = el(null, { position: 'absolute', bottom: '0', transformOrigin: 'bottom center', willChange: 'transform' });

    var stem = el(wrap, {
      position: 'absolute', left: '50%', bottom: '0', width: '4px', height: stemH + 'px',
      marginLeft: '-2px', background: stemColor, borderRadius: '2px',
      transformOrigin: 'bottom center', transform: 'scaleY(0)'
    });
    wrap.appendChild(stem);

    var leaves = [];
    if (species !== 'clover' && species !== 'forgetmenot') {
      [0.35, 0.62].forEach(function (t, i) {
        var leaf = buildLeaf(stemColor);
        var side = i === 0 ? -1 : 1;
        leaf.style.left = '50%';
        leaf.style.bottom = (stemH * t) + 'px';
        leaf.style.transformOrigin = side < 0 ? '100% 50%' : '0% 50%';
        leaf.style.marginLeft = side < 0 ? '-15px' : '1px';
        leaf.style.transform = 'rotate(' + (side * 45) + 'deg) scale(0)';
        wrap.appendChild(leaf);
        leaves.push(leaf);
      });
    }

    var head = el(wrap, {
      // Scale only — no opacity here. Opacity is the petals' own job; fading
      // both the container and its children multiplies the two together,
      // so the center dot (a direct, unanimated child) reads as "done"
      // while the petals are still individually mid-fade.
      position: 'absolute', left: '50%', bottom: (stemH + (HEAD_OFFSET_Y[species] || 0)) + 'px',
      width: '0', height: '0', transform: 'scale(0)'
    });
    wrap.appendChild(head);
    var petals = SPECIES[species](head, color);

    return { wrap: wrap, stem: stem, leaves: leaves, head: head, petals: petals };
  }

  // ------------------------------------------------------------- name text
  // One continuous gradient across the whole word — splitting into per-letter
  // spans breaks `background-clip: text` (the parent has no glyphs of its own
  // left to clip to), so the title animates in as a single unit instead of
  // letter-by-letter.
  function animateName(container, name, colors, motion) {
    container.textContent = name;
    container.style.backgroundImage = 'linear-gradient(90deg, ' + colors.join(', ') + ')';

    if (prefersReduced || typeof gsap === 'undefined') {
      gsap && gsap.set(container, { opacity: 1, y: 0, scale: 1 });
      return;
    }
    gsap.fromTo(container,
      { opacity: 0, y: 30, scale: 0.85 },
      { opacity: 1, y: 0, scale: 1, duration: motion.bloomDur * 1.6, ease: motion.bloomEase }
    );
  }

  // ------------------------------------------------------------------ init
  window.gardenInit = function (data) {
    var scene = document.getElementById('garden-scene');
    // Day/night is now whatever the visitor left the sun/moon toggle at —
    // there's no mood field anymore, sky.js is the single source of truth.
    var isNight = window.skyIsNight ? window.skyIsNight() : false;
    if (window.skySetBlurStep) window.skySetBlurStep(1, 1); // fully sharp behind the garden

    var motion = isNight
      ? { growDur: 1.1, bloomDur: 0.7, bloomEase: 'power2.out', stagger: 0.18, swayAmp: 3, swaySpeed: 0.35, tiltLerp: 0.03 }
      : { growDur: 0.6, bloomDur: 0.5, bloomEase: 'back.out(1.7)', stagger: 0.05, swayAmp: 6, swaySpeed: 1.0, tiltLerp: 0.09 };

    var accent = '#F5B700';
    var secondaryHex = data.family.color;
    var bgHex = isNight ? '#1B1730' : '#FFF8E7';
    var inkHex = isNight ? '#F5EFE0' : '#3A2E12';
    var stemGreen = isNight ? '#3E6B3A' : '#4C8C3F';

    // -------------------------------------------------------------- layout
    var flowers = [];
    var sceneW = scene.clientWidth || window.innerWidth;
    var sceneH = scene.clientHeight || window.innerHeight;
    var sizeFactor = 1;
    var curveAmplitude = 0;
    var fillDepth = 0;
    var groundEl = document.getElementById('garden-ground');
    var secondarySpecies = data.family.flower;

    function place(species, color, xPct, scale, depth) {
      var f = buildFlower(species, color, stemGreen);
      f.wrap.style.left = xPct + '%';
      // Two things stack into the root offset: the hill's own curve (a
      // gentle bump matching the ground SVG's raised middle, so flowers on
      // the ridge actually sit ON it instead of floating above/below a flat
      // line) and depth INTO the green area, going DOWN from the ridge, not
      // up past it — `.garden-scene`'s own `bottom` is already calibrated to
      // the curve's MIDPOINT, so the bump must swing both ways around it
      // (negative at the edges, positive at the center) to land back on the
      // real curve. A one-sided 0-to-+amplitude bump (the previous version)
      // is always at or above that midpoint, which is why flowers away from
      // the very edges floated above the visible hill.
      var curveBump = curveAmplitude * (Math.sin(Math.PI * (xPct / 100)) - 0.5);
      var foreground = depth * fillDepth;
      f.wrap.style.bottom = (curveBump - foreground) + 'px';
      f.wrap.style.transform += ' scale(' + scale + ')';
      f.wrap.style.zIndex = String(Math.round(scale * 10)); // bigger (nearer) flowers already sort to the front via scale
      f.baseX = xPct;
      f.phase = Math.random() * Math.PI * 2;
      f.speed = motion.swaySpeed * (0.8 + Math.random() * 0.4);

      var rotator = el(null, { position: 'absolute', inset: '0', transformOrigin: 'bottom center' });
      while (f.wrap.firstChild) rotator.appendChild(f.wrap.firstChild);
      f.wrap.appendChild(rotator);
      f.rotator = rotator;

      f.head.style.cursor = 'pointer';
      f.head.style.pointerEvents = 'auto';
      f.head.addEventListener('click', function () { revealMessage(f); });

      scene.appendChild(f.wrap);
      flowers.push(f);
      return f;
    }

    function clearField() {
      flowers.length = 0;
      while (scene.firstChild) scene.removeChild(scene.firstChild);
    }

    // Scales with the full scene width, both in COUNT and in SIZE, so a wide
    // desktop viewport reads as a fuller, bigger field edge to edge instead
    // of the same mobile-sized handful stretched across more space — and
    // re-runs on resize so it stays true if the window changes after the
    // garden is already showing, not just at the size it happened to load at.
    function buildField(animateGrowth) {
      clearField();
      sceneW = scene.clientWidth || window.innerWidth;
      sizeFactor = Math.max(1, Math.min(1.6, sceneW / 1000));

      var groundH = groundEl.clientHeight || window.innerHeight * 0.36;
      // The ground SVG's own path (viewBox 0 0 400 200) swings from y=20 at
      // the edges to y=4 at the center — 16 of 200 units, 8% of the ground's
      // height. Kept slightly under that on purpose: better a flower sits a
      // little inside the grass than for the approximation to overshoot the
      // real bezier curve and float above it.
      curveAmplitude = groundH * 0.07;
      fillDepth = groundH * 0.85; // reaches down near the viewport's bottom edge — the whole green area, not just a band under the ridge

      var mainCount = Math.max(20, Math.min(46, Math.round(sceneW / 50)));
      for (var i = 0; i < mainCount; i++) {
        var x = 4 + (i / (mainCount - 1)) * 92 + (Math.random() * 5 - 2.5);
        var depth = Math.random();
        // Bigger toward the foreground (depth 1, near the viewport bottom),
        // smaller up on the ridge (depth 0) — simple perspective, and it
        // also makes near flowers z-sort in front since z-index follows scale.
        var scale = (0.75 + Math.random() * 0.55) * sizeFactor * (0.6 + depth * 0.4);
        place('main', accent, x, scale, depth);
      }

      if (secondarySpecies) {
        var secCount = Math.max(8, Math.min(22, Math.round(sceneW / 80)));
        for (var j = 0; j < secCount; j++) {
          var sx = 3 + (j / (secCount - 1)) * 94 + (Math.random() * 6 - 3);
          var sdepth = Math.random();
          var sscale = (0.55 + Math.random() * 0.4) * sizeFactor * (0.6 + sdepth * 0.4);
          place(secondarySpecies, secondaryHex, sx, sscale, sdepth);
        }
      }

      if (animateGrowth) {
        flowers.forEach(function (f, idx) {
          var d = idx * motion.stagger;
          var tl = gsap.timeline({ delay: prefersReduced ? 0 : d });
          tl.to(f.stem, { scaleY: 1, duration: prefersReduced ? 0.01 : motion.growDur, ease: 'power2.out' });
          if (f.leaves.length) {
            tl.to(f.leaves, {
              scale: 1, duration: prefersReduced ? 0.01 : 0.35, ease: 'back.out(1.7)', stagger: 0.1
            }, prefersReduced ? 0 : '-=' + (motion.growDur * 0.5));
          }
          tl.to(f.head, {
            scale: 1, duration: prefersReduced ? 0.01 : motion.bloomDur, ease: motion.bloomEase
          }, prefersReduced ? 0 : '-=0.2');
          tl.fromTo(f.petals,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: prefersReduced ? 0.01 : motion.bloomDur, ease: motion.bloomEase, stagger: motion.stagger * 0.5 },
            prefersReduced ? 0 : '-=' + (motion.bloomDur * 0.6)
          );
        });
      } else {
        // A resize rebuild: no replaying the whole grow choreography every
        // time a window edge is dragged — show the field already in bloom.
        flowers.forEach(function (f) {
          gsap.set(f.stem, { scaleY: 1 });
          if (f.leaves.length) gsap.set(f.leaves, { scale: 1 });
          gsap.set(f.head, { scale: 1 });
          gsap.set(f.petals, { scale: 1, opacity: 1 });
        });
      }

      if (messagePool) assignMessages(messagePool);
    }

    buildField(true);

    // Rebuilding clears the currently-open message (its flower may no longer
    // exist) and brings the name back, so the screen never gets stuck showing
    // a message with nothing behind it to have produced it.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        clearTimeout(hideMessageTimer);
        messageShown = false;
        messageCard.hidden = true;
        if (typeof gsap !== 'undefined') gsap.set(nameEl, { opacity: 1 });
        buildField(false);
      }, 250);
    });

    // --------------------------------------------------------------- name
    var nameEl = document.getElementById('garden-name');
    // 3:1 (WCAG's large-text threshold) instead of 4.5:1 — this is a big
    // decorative gradient headline, not body copy, and the stricter bar was
    // darkening the accent gold until it nearly matched the other stop.
    var nameColors = [readableOn(accent, bgHex, 3), readableOn(secondaryHex, bgHex, 3), inkHex];
    animateName(nameEl, data.name, nameColors, motion);

    // ------------------------------------------------------------ pointer
    // Sway + pointer-tilt rotate a dedicated inner rotator, never the wrap's
    // own `scale(...)` transform (set once at layout and left alone).
    var pointer = { x: sceneW / 2, y: sceneH / 2 };
    var tilt = 0;
    window.addEventListener('pointermove', function (e) { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

    function animateSway() {
      requestAnimationFrame(animateSway);
      var t = performance.now() / 1000;
      var targetTilt = prefersReduced ? 0 : ((pointer.x / (window.innerWidth || 1)) - 0.5) * 14;
      tilt += (targetTilt - tilt) * 0.04;
      flowers.forEach(function (f) {
        var sway = prefersReduced ? 0 : Math.sin(t * f.speed + f.phase) * motion.swayAmp;
        f.rotator.style.transform = 'rotate(' + (sway + tilt) + 'deg)';
      });
    }
    animateSway();

    // ------------------------------------------------------------ messages
    // One message per rendered flower — however many that turned out to be
    // for this screen size — sliced from a shuffled data-list/frases.json so
    // a 1000-message file still only spends as many as there are flowers to
    // click. Falls back to a tiny built-in set if the fetch can't run at all.
    // Cached in messagePool so a resize rebuild reuses it instead of re-fetching.
    var messagePool = null;
    fetch('data-list/frases.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        var pool = Array.isArray(json) ? json.map(function (item) { return item.mensaje; }) : [];
        messagePool = pool.length ? pool : FALLBACK_MESSAGES;
        assignMessages(messagePool);
      })
      .catch(function () {
        messagePool = FALLBACK_MESSAGES;
        assignMessages(messagePool);
      });

    function assignMessages(pool) {
      var picks = shuffle(pool);
      flowers.forEach(function (f, i) { f.message = picks[i % picks.length]; });
    }

    // --------------------------------------------------------------- click
    var messageCard = document.getElementById('message-card');
    var messageCardName = document.getElementById('message-card-name');
    var messageCardText = document.getElementById('message-card-text');
    var messageShown = false;
    var hideMessageTimer = null;

    function burst(x, y, color) {
      for (var i = 0; i < 18; i++) {
        (function () {
          var dot = el(scene, {
            position: 'absolute', left: x + 'px', top: y + 'px', width: '6px', height: '6px',
            borderRadius: '50%', background: Math.random() > 0.5 ? color : accent, pointerEvents: 'none'
          });
          scene.appendChild(dot);
          var angle = Math.random() * Math.PI * 2;
          var dist = 40 + Math.random() * 60;
          var dur = prefersReduced ? 0.01 : 0.7 + Math.random() * 0.3;
          if (typeof gsap === 'undefined') { dot.remove(); return; }
          gsap.to(dot, {
            x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 30, opacity: 0, duration: dur, ease: 'power2.out',
            onComplete: function () { dot.remove(); }
          });
        })();
      }
    }

    // The name and the message card share one slot (see their matching
    // top/left/transform in main.css): clicking a flower fades the name OUT
    // and the message IN, in place, and a few seconds later fades back —
    // never both visible at once, never a separate popup floating elsewhere.
    function revealMessage(f) {
      var rect = f.head.getBoundingClientRect();
      var sceneRect = scene.getBoundingClientRect();
      burst(rect.left - sceneRect.left + rect.width / 2, rect.top - sceneRect.top + rect.height / 2, secondaryHex);

      if (typeof gsap !== 'undefined') {
        gsap.to(f.head, { scale: 1.3, duration: prefersReduced ? 0.01 : 0.35, ease: 'back.out(2)', yoyo: true, repeat: 1 });
      }

      messageCardName.textContent = data.name;
      messageCardText.textContent = f.message || FALLBACK_MESSAGES[0];

      // A single timer id, always cleared via clearTimeout — clicking another
      // flower before the auto-hide fires resets the same wait, instead of
      // stacking a second hide behind the first one's back.
      clearTimeout(hideMessageTimer);

      if (!messageShown) {
        messageShown = true;
        messageCard.hidden = false;
        if (typeof gsap === 'undefined') {
          nameEl.style.opacity = 0;
        } else {
          gsap.killTweensOf(nameEl);
          gsap.killTweensOf(messageCard);
          gsap.to(nameEl, { opacity: 0, duration: prefersReduced ? 0.01 : 0.35, ease: 'sine.out' });
          gsap.fromTo(messageCard,
            { opacity: 0, scale: prefersReduced ? 1 : 0.96 },
            { opacity: 1, scale: 1, duration: prefersReduced ? 0.01 : 0.4, ease: 'sine.out', delay: prefersReduced ? 0 : 0.2 }
          );
        }
      }
      // Already showing a message: swap the text silently, no re-fade — only the timer resets.

      hideMessageTimer = setTimeout(function () {
        messageShown = false;
        if (typeof gsap === 'undefined') {
          messageCard.hidden = true;
          nameEl.style.opacity = 1;
          return;
        }
        gsap.to(messageCard, {
          opacity: 0, duration: prefersReduced ? 0.01 : 0.35, ease: 'sine.out',
          onComplete: function () { messageCard.hidden = true; }
        });
        gsap.to(nameEl, { opacity: 1, duration: prefersReduced ? 0.01 : 0.4, ease: 'sine.out', delay: prefersReduced ? 0 : 0.15 });
      }, 3200);
    }
  };
})();
