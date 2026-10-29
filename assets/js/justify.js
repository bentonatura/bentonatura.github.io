// Book-quality justification for the homepage bio: Knuth–Plass line breaking,
// as in TeX. The browser fills justified lines one at a time and stretches
// whatever space is left, which can leave one line with wide gaps; this
// chooses the breaks of each whole paragraph at once so the spacing stays
// even. Each paragraph is split into word and space spans once; on load and
// whenever the column width changes, the breaks are set with <br> and each
// line's spaces are widened with word-spacing (so link underlines stay
// unbroken). Without JavaScript, or if no good breaks exist, the CSS
// justification remains.
(function () {
  const paragraphs = [...document.querySelectorAll(".about-copy p:not(.about-closing)")];
  if (!paragraphs.length || !("ResizeObserver" in window)) return;

  // how far spaces may stretch and shrink, as fractions of a normal space
  // (TeX's defaults for a text font: 1/2 and 1/3)
  const STRETCH = 0.5;
  const SHRINK = 1 / 3;

  // split the text into word and space spans, keeping links and other
  // inline elements; a word with a hyphen ("semi-definite") may break after it
  function prepare(p) {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    nodes.forEach(function (node) {
      const frag = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          const space = document.createElement("span");
          space.className = "kp-space";
          space.textContent = " ";
          frag.append(space);
        } else {
          // after hyphens and soft hyphens (from _plugins/hyphenate.rb)
          part.split(/(?<=[-–—\u00AD])(?=\S)/).forEach(function (piece) {
            const word = document.createElement("span");
            word.className = "kp-word";
            word.textContent = piece;
            frag.append(word);
          });
        }
      });
      node.replaceWith(frag);
    });
  }

  // boxes (words), glue (spaces) and penalties (break points inside words)
  function items(p) {
    const list = [];
    const probe = document.createElement("span");
    probe.textContent = "-";
    p.append(probe);
    const hyphen = probe.getBoundingClientRect().width;
    probe.remove();
    p.querySelectorAll(".kp-word, .kp-space").forEach(function (el) {
      const w = el.getBoundingClientRect().width;
      if (el.classList.contains("kp-space")) {
        // collapsed spaces (e.g. at the start) have no width: no break there
        if (w > 0 && list.length && list[list.length - 1].type === "box") {
          list.push({ type: "glue", el: el, w: w, y: w * STRETCH, z: w * SHRINK });
        }
      } else {
        const prev = list[list.length - 1];
        if (prev && prev.type === "box" && /[-–—]$/.test(prev.el.textContent)) {
          list.push({ type: "penalty", el: prev.el, w: 0, p: 50, flagged: true });
        } else if (prev && prev.type === "box" && /\u00AD$/.test(prev.el.textContent)) {
          list.push({ type: "penalty", el: prev.el, w: hyphen, p: 50, flagged: true, shy: true });
        }
        list.push({ type: "box", el: el, w: w });
      }
    });
    while (list.length && list[list.length - 1].type !== "box") list.pop();
    // no paragraph ending on a scrap of a word ("…optimiza- / tion."): in the
    // last word, only break where at least 5 letters follow
    let lastGlue = list.length - 1;
    while (lastGlue >= 0 && list[lastGlue].type !== "glue") lastGlue--;
    return list.filter(function (it, i) {
      if (it.type !== "penalty" || i < lastGlue) return true;
      const rest = list.slice(i + 1).map((x) => (x.type === "box" ? x.el.textContent : "")).join("");
      return rest.replace(/[^\p{L}]/gu, "").length >= 5;
    });
  }

  // the breaks with the least total "badness" (TeX's demerits), allowing
  // spaces to stretch at most `tolerance` times their stretchability
  function breakpoints(list, width, tolerance) {
    const n = list.length;
    const W = [0], Y = [0], Z = [0]; // sums of widths, stretch, shrink before item i
    list.forEach(function (it, i) {
      W.push(W[i] + (it.type === "penalty" ? 0 : it.w));
      Y.push(Y[i] + (it.type === "glue" ? it.y : 0));
      Z.push(Z[i] + (it.type === "glue" ? it.z : 0));
    });
    // a line starts at the first word after a break
    const startAfter = function (b) {
      let s = b + 1;
      while (s < n && list[s].type !== "box") s++;
      return s;
    };
    const ratio = function (s, b, last) {
      const it = list[b];
      const L = W[b] - W[s] + (it && it.type === "penalty" ? it.w : 0);
      if (L === width) return 0;
      if (L < width) return last ? 0 : Y[b] - Y[s] > 0 ? (width - L) / (Y[b] - Y[s]) : Infinity;
      return Z[b] - Z[s] > 0 ? (width - L) / (Z[b] - Z[s]) : -Infinity;
    };

    let active = [{ b: -1, s: 0, demerits: 0, prev: null, flagged: false }];
    const breakable = [];
    list.forEach(function (it, i) {
      if ((it.type === "glue" && list[i - 1].type === "box") || it.type === "penalty") breakable.push(i);
    });
    breakable.push(n); // the end of the paragraph

    for (const b of breakable) {
      const last = b === n;
      const it = list[b];
      let best = null;
      active = active.filter(function (a) {
        const r = ratio(a.s, b, last);
        if (r < -1) return false; // too long already: no later break works either
        if (r <= tolerance) {
          let d = Math.pow(1 + 100 * Math.pow(Math.abs(r), 3), 2);
          if (it && it.type === "penalty") d += it.p * it.p;
          const flagged = !!(it && it.flagged);
          if (flagged && a.flagged) d += 3000; // no two hyphenated lines in a row
          if (last && a.flagged) d += 5000; // nor a hyphen just before the last line
          const node = { b: b, s: startAfter(b), demerits: a.demerits + d, prev: a, flagged: flagged };
          if (!best || node.demerits < best.demerits) best = node;
        }
        return true;
      });
      if (best) {
        if (last) {
          const lines = [];
          for (let node = best; node.prev; node = node.prev) lines.unshift({ s: node.prev.s, b: node.b });
          return lines.map(function (line) {
            return Object.assign(line, { r: ratio(line.s, line.b, line.b === n) });
          });
        }
        active.push(best);
      }
      if (!active.length) return null;
    }
    return null;
  }

  function reset(p) {
    p.querySelectorAll("br.kp-br, .kp-hyphen").forEach((el) => el.remove());
    p.querySelectorAll(".kp-space").forEach((s) => (s.style.wordSpacing = ""));
  }

  function justify(p) {
    reset(p);
    p.classList.remove("kp-on");
    const width = p.getBoundingClientRect().width; // the column, before measuring
    p.classList.add("kp-on"); // one long line while measuring the words
    const list = items(p);
    // strict first, then looser (TeX's second pass and emergency stretch)
    const lines = breakpoints(list, width, 2) || breakpoints(list, width, 4) || breakpoints(list, width, 10);
    if (!lines) {
      p.classList.remove("kp-on"); // keep the browser's justification
      return;
    }
    lines.forEach(function (line) {
      for (let i = line.s; i < line.b; i++) {
        const it = list[i];
        if (it.type !== "glue") continue;
        const extra = line.r >= 0 ? line.r * it.y : line.r * it.z;
        it.el.style.wordSpacing = extra.toFixed(3) + "px";
      }
      const end = list[line.b];
      if (end) {
        const br = document.createElement("br");
        br.className = "kp-br";
        end.el.after(br);
        if (end.shy) {
          // a forced break shows no hyphen for a soft hyphen: draw one
          const mark = document.createElement("span");
          mark.className = "kp-hyphen";
          mark.textContent = "-";
          end.el.after(mark);
        }
      }
    });
  }

  let width = 0;
  function run() {
    const now = paragraphs[0].parentElement.getBoundingClientRect().width;
    if (now === width) return;
    width = now;
    paragraphs.forEach(justify);
  }

  document.fonts.ready.then(function () {
    paragraphs.forEach(prepare);
    run();
    let frame = 0;
    new ResizeObserver(function () {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    }).observe(paragraphs[0].parentElement);
  });
})();
