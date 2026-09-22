(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scene = document.getElementById('sky-scene');
  var dayBg = scene.querySelector('.sky-gradient--day');
  var nightBg = scene.querySelector('.sky-gradient--night');
  var flash = scene.querySelector('.sky-flash');
  var sun = scene.querySelector('.sun-el');
  var moon = scene.querySelector('.moon-el');
  var clouds = scene.querySelector('.clouds');
  var stars = scene.querySelector('.stars');

  // Sun and moon share one fixed slot, set once in CSS (top/left, in %) so it
  // never drifts with aspect ratio. Hiding one is a `transform: translateY`
  // + fade, never a change to `top` itself — animating `top` forces layout
  // every frame, which is exactly what motion-principles rung 1 forbids.
  function hiddenOffset() { return Math.max(320, window.innerHeight * 0.55); }

  var isNight = false;

  gsap.set(nightBg, { opacity: 0 });
  gsap.set(moon, { y: hiddenOffset(), opacity: 0 });
  gsap.set(stars, { opacity: 0 });

  window.skyIsNight = function () { return isNight; };

  window.skySetMood = function (nightMode, animate) {
    if (nightMode === isNight) return;
    isNight = nightMode;
    // Single source of truth for the mood attribute every token in tokens.css
    // reads — anything that flips day/night calls this instead of touching
    // the attribute itself, so the visuals can never drift out of sync with it.
    document.body.dataset.mood = nightMode ? 'night' : 'day';
    var dur = prefersReduced || animate === false ? 0.01 : 1.3;
    var ease = 'power2.inOut';
    var offset = hiddenOffset();

    // A brief tinted wash — the gradient crossfade alone reads as a flat
    // dissolve, not a change in light. Warm pulse going to dusk, cool pulse
    // going to dawn, timed to peak as the old sky is half-gone.
    gsap.killTweensOf(flash);
    flash.style.background = nightMode
      ? 'radial-gradient(ellipse at 25% 15%, rgba(255,150,90,0.55), transparent 65%)'
      : 'radial-gradient(ellipse at 25% 15%, rgba(160,200,255,0.5), transparent 65%)';
    gsap.timeline()
      .set(flash, { opacity: 0 })
      .to(flash, { opacity: 1, duration: dur * 0.4, ease: 'sine.out' })
      .to(flash, { opacity: 0, duration: dur * 0.7, ease: 'sine.in' });

    if (nightMode) {
      // Sun sets first, moon rises shortly after — a beat of dusk between them.
      gsap.to(sun, { y: offset, opacity: 0, duration: dur, ease: ease });
      gsap.to(dayBg, { opacity: 0, duration: dur * 1.1, ease: 'sine.inOut' });
      gsap.to(nightBg, { opacity: 1, duration: dur * 1.1, ease: 'sine.inOut' });
      gsap.to(clouds, { opacity: 0, duration: dur * 0.8 });
      gsap.to(moon, { y: 0, opacity: 1, duration: dur, ease: ease, delay: dur * 0.25 });
      gsap.to(stars, { opacity: 1, duration: dur, delay: dur * 0.4 });
    } else {
      gsap.to(moon, { y: offset, opacity: 0, duration: dur, ease: ease });
      gsap.to(stars, { opacity: 0, duration: dur * 0.6 });
      gsap.to(nightBg, { opacity: 0, duration: dur * 1.1, ease: 'sine.inOut' });
      gsap.to(dayBg, { opacity: 1, duration: dur * 1.1, ease: 'sine.inOut' });
      gsap.to(sun, { y: 0, opacity: 1, duration: dur, ease: ease, delay: dur * 0.25 });
      gsap.to(clouds, { opacity: 1, duration: dur, delay: dur * 0.4 });
    }
  };

  // Blurred at step 0, sharp by the last step — the landscape "comes into focus"
  // as the visitor reveals more of themselves.
  window.skySetBlurStep = function (stepIndex, totalSteps) {
    var t = totalSteps > 1 ? stepIndex / (totalSteps - 1) : 1;
    var blurPx = 16 * (1 - t);
    gsap.to(scene, {
      filter: 'blur(' + blurPx + 'px)',
      duration: prefersReduced ? 0.01 : 0.6,
      ease: 'power2.out'
    });
  };

  gsap.set(scene, { filter: 'blur(16px)' });

  // Click the moon to bring back the sun, click the sun to bring on the moon.
  sun.addEventListener('click', function () { window.skySetMood(true); });
  moon.addEventListener('click', function () { window.skySetMood(false); });
})();
