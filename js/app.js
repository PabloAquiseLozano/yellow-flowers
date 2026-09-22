(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var form = document.getElementById('intro-form');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var current = 0;

  var fieldName = document.getElementById('field-name');
  var fieldZodiac = document.getElementById('field-zodiac');
  var fieldColor = document.getElementById('field-color');
  var colorSwatch = document.getElementById('color-swatch');
  var colorLabel = document.getElementById('color-label');

  // Bucket a hex color by hue into a named family + representative secondary-flower color.
  // Source of truth for these buckets: MASTER.md "Secundario" table.
  function hexToHue(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var d = max - min;
    if (d === 0) return { hue: 0, sat: 0 };
    var hue;
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = hue * 60;
    if (hue < 0) hue += 360;
    var l = (max + min) / 2;
    var sat = d / (1 - Math.abs(2 * l - 1));
    return { hue: hue, sat: sat };
  }

  var FLOWER_FAMILIES = [
    { max: 15, name: 'Rojo intenso', flower: 'rose', color: '#C81E3A' },
    { max: 45, name: 'Naranja cálido', flower: 'marigold', color: '#F2793B' },
    { max: 70, name: 'Amarillo dorado', flower: null, color: '#F5B700' },
    { max: 170, name: 'Verde fresco', flower: 'clover', color: '#4C9A5B' },
    { max: 255, name: 'Azul sereno', flower: 'forgetmenot', color: '#4A7FD6' },
    { max: 300, name: 'Morado místico', flower: 'lavender', color: '#8C5FD6' },
    { max: 345, name: 'Rosa cálido', flower: 'tulip', color: '#E85D75' },
    { max: 361, name: 'Rojo intenso', flower: 'rose', color: '#C81E3A' }
  ];
  var NEUTRAL_FAMILY = { name: 'Blanco/gris neutro', flower: 'daisy', color: '#F4F1E8' };

  function classifyColor(hex) {
    var hs = hexToHue(hex);
    if (hs.sat < 0.15) return NEUTRAL_FAMILY;
    for (var i = 0; i < FLOWER_FAMILIES.length; i++) {
      if (hs.hue < FLOWER_FAMILIES[i].max) return FLOWER_FAMILIES[i];
    }
    return NEUTRAL_FAMILY;
  }

  function updateColorPreview() {
    var hex = fieldColor.value;
    var family = classifyColor(hex);
    colorSwatch.style.background = hex;
    colorLabel.textContent = family.name;
  }
  fieldColor.addEventListener('input', updateColorPreview);
  updateColorPreview();

  if (window.skySetBlurStep) window.skySetBlurStep(0, steps.length);

  function goToStep(index) {
    var ease = prefersReduced ? 'none' : 'power2.out';
    var dur = prefersReduced ? 0.01 : 0.35;
    var outgoing = steps[current];
    var incoming = steps[index];

    function activate() {
      outgoing.classList.remove('active');
      incoming.classList.add('active');
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
      current = index;
      if (window.skySetBlurStep) window.skySetBlurStep(index, steps.length);
      var firstField = incoming.querySelector('input, select, textarea');
      if (firstField) firstField.focus({ preventScroll: true });
    }

    if (prefersReduced || typeof gsap === 'undefined') {
      activate();
      return;
    }
    gsap.to(outgoing, {
      opacity: 0, y: -10, duration: dur, ease: ease,
      onComplete: function () {
        activate();
        gsap.fromTo(incoming, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: dur, ease: ease });
      }
    });
  }

  function validateStep(index) {
    if (index === 0) return fieldName.value.trim().length > 0;
    if (index === 1) return !!fieldZodiac.value;
    return true;
  }

  form.addEventListener('click', function (e) {
    var next = e.target.closest('[data-next]');
    var back = e.target.closest('[data-back]');
    if (next) {
      if (!validateStep(current)) {
        var invalidField = steps[current].querySelector('input:required, select:required');
        if (invalidField) invalidField.reportValidity ? invalidField.reportValidity() : invalidField.focus();
        return;
      }
      if (current < steps.length - 1) goToStep(current + 1);
    } else if (back) {
      if (current > 0) goToStep(current - 1);
    }
  });

  // Enter key on the name field advances instead of submitting.
  fieldName.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (validateStep(0)) goToStep(1);
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(1)) return;

    var data = {
      name: fieldName.value.trim() || 'amigo',
      zodiac: fieldZodiac.value,
      colorHex: fieldColor.value,
      family: classifyColor(fieldColor.value)
    };

    var formScreen = document.getElementById('form-screen');
    var gardenScreen = document.getElementById('garden-screen');

    function reveal() {
      formScreen.hidden = true;
      gardenScreen.hidden = false;
      window.gardenInit(data);
    }

    if (prefersReduced || typeof gsap === 'undefined') {
      reveal();
      return;
    }
    gsap.to(formScreen, {
      opacity: 0, scale: 0.95, duration: 0.6, ease: 'power2.out',
      onComplete: reveal
    });
  });
})();
