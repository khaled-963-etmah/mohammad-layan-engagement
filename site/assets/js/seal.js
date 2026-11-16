/* M&L wax seal.
 * The envelope artwork and opening video both carry the template's "D&A" monogram.
 * - Still envelope: drawn from envelope-clean.png (letters removed by inpainting) + engraved M&L.
 * - Opening video: every frame is drawn to a canvas, the letters are covered with a clean-wax
 *   patch (seal-patch.png) and M&L is engraved on top, following the seal as the flap opens.
 *   Keyframes were calibrated frame by frame against the 720x1280 video.
 */
(function () {
  "use strict";
  var W = 720, H = 1280, SC = 720 / 941, CX = 466, CY = 870; // still image -> video pixels; seal centre in still
  // [time s, seal centre x, seal centre y, scale, vertical squash]  (video pixels)
  var K = [[0,357,666,1,1],[3.4,359,664,1,1],[5.1,357,658,1,1],[5.3,357,655,1.02,1],[5.46,357,645,1.05,1],
           [5.67,357,632,1.08,1],[5.88,357,596,1.1,1],[6.08,357,560,1.12,1],[6.29,357,524,1.12,1],[6.46,357,488,1.12,1],
           [6.67,357,457,1.12,1],[6.88,357,428,1.12,.97],[7.08,357,404,1.12,.95],[7.29,357,380,1.12,.93],[7.5,357,356,1.12,.88],
           [7.63,357,340,1.12,.8],[7.83,357,272,1.12,.6],[8.04,357,248,1.12,.5],[8.2,357,235,1.12,.45]];
  function at(t) {
    var i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
    var a = K[i], b = K[i + 1], f = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
    return a.map(function (v, j) { return v + (b[j] - v) * f; });
  }

  function load(src) { return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }

  // gold-foil monogram pressed into the wax, auto-fitted inside the seal's inner circle.
  // Returned canvas covers a 340x340 still-pixel box centred on the seal (rendered at 2x).
  var R_IN = 104; // radius of the pressed ring (still pixels); letters stay inside it
  function monogram() {
    var S = 2, N = 340;
    // 1) compose letters at a nominal size on a scratch canvas
    var t = document.createElement("canvas"); t.width = t.height = 700;
    var tx = t.getContext("2d"); tx.textAlign = "center"; tx.textBaseline = "alphabetic";
    var parts = [["M", 170, 296, 330], ["&", 96, 362, 352], ["L", 170, 410, 410]];
    function each(fn) { parts.forEach(function (p) { tx.font = p[1] + "px Pinyon, 'Pinyon Script', cursive"; fn(p); }); }
    each(function (p) { tx.fillText(p[0], p[2], p[3]); });
    var d = tx.getImageData(0, 0, 700, 700).data, x0 = 700, y0 = 700, x1 = 0, y1 = 0;
    for (var y = 0; y < 700; y += 2) for (var x = 0; x < 700; x += 2) if (d[(y * 700 + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    // 2) fit the composition inside the ring
    var bw = x1 - x0, bh = y1 - y0, fit = Math.min((R_IN * 1.78) / bw, (R_IN * 1.62) / bh);
    var c = document.createElement("canvas"); c.width = c.height = N * S;
    var x = c.getContext("2d"); x.scale(S, S); x.translate(N / 2, N / 2);

    // pressed ring (debossed: shadow on the upper-left inner edge, light on the lower-right)
    function ring(r, dx, dy, col, w) { x.beginPath(); x.arc(dx, dy, r, 0, Math.PI * 2); x.strokeStyle = col; x.lineWidth = w; x.stroke(); }
    ring(R_IN + 6, -1, -1.2, "rgba(120,90,50,.28)", 2.2);
    ring(R_IN + 6, 1, 1.2, "rgba(255,252,244,.95)", 2.2);
    ring(R_IN + 6, 0, 0, "rgba(196,160,96,.55)", .9);
    // tiny dots on the ring at the four quarters
    [0, 1, 2, 3].forEach(function (k) { var an = k * Math.PI / 2 + Math.PI / 4; x.beginPath(); x.arc(Math.cos(an) * (R_IN + 6), Math.sin(an) * (R_IN + 6), 2.2, 0, Math.PI * 2); x.fillStyle = "#c9a35a"; x.fill(); });

    x.save();
    x.scale(fit, fit); x.translate(-(x0 + bw / 2), -(y0 + bh / 2) - 4 / fit);
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    var g = x.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "#f3dc9c"); g.addColorStop(.3, "#d0a043"); g.addColorStop(.55, "#94641c"); g.addColorStop(.8, "#dcb260"); g.addColorStop(1, "#a8782a");
    function draw(dx, dy, style, blur) {
      parts.forEach(function (p) {
        x.font = p[1] + "px Pinyon, 'Pinyon Script', cursive";
        x.save(); if (blur) { x.shadowColor = style; x.shadowBlur = blur; }
        x.fillStyle = style; x.fillText(p[0], p[2] + dx, p[3] + dy);
        x.lineWidth = p[1] / 70; x.strokeStyle = style; x.lineJoin = "round"; x.strokeText(p[0], p[2] + dx, p[3] + dy);
        x.restore();
      });
    }
    var k = 1 / fit;
    draw(-1.3 * k, -1.5 * k, "rgba(95,62,20,.55)", 1.5 * k);   // groove shadow
    draw(1.3 * k, 1.6 * k, "rgba(255,251,240,.95)", 1 * k);    // lit lower edge of the groove
    draw(0, 0, g, 0);                                         // gold foil
    // fine highlight along the top of the strokes
    x.globalCompositeOperation = "source-atop"; x.globalAlpha = .45;
    var hg = x.createLinearGradient(0, y0, 0, y1); hg.addColorStop(0, "#fff7dd"); hg.addColorStop(.35, "rgba(255,247,221,0)");
    x.fillStyle = hg; x.fillRect(x0 - 50, y0 - 50, bw + 100, bh + 100);
    x.restore();
    return c;
  }

  function seal(ctx, p, patch, mono) {
    ctx.save();
    ctx.translate(p[1], p[2]); ctx.scale(SC * p[3], SC * p[3] * p[4]);
    if (patch) ctx.drawImage(patch, -170, -170, 340, 340);
    ctx.drawImage(mono, -170, -170, 340, 340);
    ctx.restore();
  }

  var still = document.getElementById("weiCanvas"), vc = document.getElementById("vidCanvas");
  var overlay = document.getElementById("weiOverlay");
  var v = document.getElementById("weiVideo");
  var fontReady = (document.fonts && document.fonts.load) ? document.fonts.load("100px Pinyon") : Promise.resolve();

  Promise.all([load("assets/img/envelope-clean.webp"), load("assets/img/seal-patch.webp"), fontReady]).then(function (r) {
    var env = r[0], patch = r[1], mono = monogram();
    var sx = still.getContext("2d"), p0 = at(0), t0 = performance.now();
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stars = [[-150, -95, 0], [158, -60, 1.7], [140, 120, 3.1], [-135, 130, 4.4], [5, -175, 2.3], [-178, 20, 5.6], [182, 30, .8]];
    function star(x, y, r, a) {
      sx.save(); sx.translate(x, y); sx.globalAlpha = a; sx.fillStyle = "#fff3cf";
      sx.shadowColor = "rgba(255,214,140,.9)"; sx.shadowBlur = 8;
      sx.beginPath(); sx.moveTo(0, -r); sx.quadraticCurveTo(0, 0, r, 0); sx.quadraticCurveTo(0, 0, 0, r); sx.quadraticCurveTo(0, 0, -r, 0); sx.quadraticCurveTo(0, 0, 0, -r); sx.fill();
      sx.restore();
    }
    function paintStill(now) {
      var t = (now - t0) / 1000;
      if (env) sx.drawImage(env, 0, 0, W, H);
      sx.save(); sx.translate(p0[1], p0[2]); sx.scale(SC, SC);
      // soft breathing glow around the seal, inviting a tap
      var ga = reduce ? .18 : .14 + .12 * Math.sin(t * 2.1);
      var glow = sx.createRadialGradient(0, 0, 120, 0, 0, 215);
      glow.addColorStop(0, "rgba(255,226,160," + ga + ")"); glow.addColorStop(1, "rgba(255,226,160,0)");
      sx.fillStyle = glow; sx.beginPath(); sx.arc(0, 0, 215, 0, Math.PI * 2); sx.fill();
      sx.restore();
      seal(sx, p0, null, mono);
      if (!reduce) {
        // glint sweeping across the seal every 4 s
        var ph = (t % 4) / 1.1;
        if (ph < 1) {
          sx.save(); sx.translate(p0[1], p0[2]); sx.scale(SC, SC);
          sx.beginPath(); sx.arc(0, 0, 150, 0, Math.PI * 2); sx.clip();
          var gx = -260 + ph * 520, lg = sx.createLinearGradient(gx - 60, -60, gx + 60, 60);
          lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(.5, "rgba(255,250,230,.55)"); lg.addColorStop(1, "rgba(255,255,255,0)");
          sx.globalCompositeOperation = "lighter"; sx.fillStyle = lg; sx.fillRect(-200, -200, 400, 400);
          sx.restore();
        }
        // twinkling sparkles around the rim
        sx.save(); sx.translate(p0[1], p0[2]); sx.scale(SC, SC);
        stars.forEach(function (s) { var a = Math.max(0, Math.sin(t * 1.6 + s[2])); if (a > .05) star(s[0], s[1], 5 + 6 * a, a * .95); });
        sx.restore();
      }
    }
    paintStill(t0);
    (function loop(now) {
      if (overlay.style.display === "none") return;
      paintStill(now || performance.now());
      if (!reduce) requestAnimationFrame(loop);
    })();
    still.classList.add("ready");

    var cx = vc.getContext("2d");
    function frame(t) {
      if (v.readyState < 2) return;
      cx.drawImage(v, 0, 0, W, H);
      seal(cx, at(t), patch, mono);
    }
    if ("requestVideoFrameCallback" in v) {
      var cb = function (now, meta) { frame(meta.mediaTime); v.requestVideoFrameCallback(cb); };
      v.requestVideoFrameCallback(cb);
    } else {
      (function loop() { frame(v.currentTime); requestAnimationFrame(loop); })();
    }
    v.addEventListener("loadeddata", function () { frame(0); });
    v.addEventListener("seeked", function () { frame(v.currentTime); });
  });

  // safety net: if the opening video can't play (slow network, old browser), go straight to the invitation
  function skip() {
    ["weiOverlay", "weiVideoWrap"].forEach(function (id) { var el = document.getElementById(id); el.style.transition = "opacity .8s"; el.style.opacity = "0"; el.style.pointerEvents = "none"; setTimeout(function () { el.style.display = "none"; }, 800); });
    window.dispatchEvent(new Event("webgencyIntroDone"));
    var hero = document.getElementById("fadeVideo"); if (hero) { var p = hero.play(); if (p && p.catch) p.catch(function () {}); }
  }
  var armed = false;
  function arm() {
    if (armed) return; armed = true;
    // still downloading on a slow connection: keep waiting (up to 15 s); loaded but not playing: skip
    var waited = 0;
    (function check() {
      if (v.currentTime > 0.2) return;
      var loading = v.readyState < 3 && v.networkState === 2;
      if (waited >= 15000 || (!loading && waited >= 4500)) return skip();
      waited += 1500; setTimeout(check, 1500);
    })();
  }
  overlay.addEventListener("click", arm); overlay.addEventListener("touchstart", arm, { passive: true });
  v.addEventListener("error", function () { if (armed) skip(); });
})();
