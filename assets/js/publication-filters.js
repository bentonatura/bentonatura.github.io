// Publications page: the subtitle's Conferences · Journals · Thesis links
// filter the list, by the paper's conference or journal badge; under Journals
// the papers are regrouped by the year they appeared in the journal. The
// filter is kept in the address (#conferences, ...); clicking it again shows
// everything.
(function () {
  const links = document.querySelectorAll(".pub-filter");
  const papers = document.querySelector(".publications.by-year.publications");
  const thesis = document.querySelector(".publications.by-year.thesis");
  if (!links.length || !papers || !thesis) return;

  const hasBadge = { conferences: "a.conference", journals: "a.journal" };
  let journalView = null; // the regrouped list while Journals is on

  // move the journal papers into year groups by journal year, leaving a
  // placeholder where each came from
  function showJournalView() {
    const byYear = {};
    papers.querySelectorAll("ol.bibliography > li").forEach(function (paper) {
      const badge = paper.querySelector(".venues a.journal");
      if (!badge) return;
      const placeholder = document.createComment("journal paper");
      paper.before(placeholder);
      paper.journalPlaceholder = placeholder;
      (byYear[badge.dataset.year] = byYear[badge.dataset.year] || []).push(paper);
    });
    journalView = document.createElement("div");
    journalView.className = "publications by-year journal-view";
    Object.keys(byYear)
      .sort((a, b) => b - a)
      .forEach(function (year) {
        const group = document.createElement("section");
        group.className = "year-group";
        group.innerHTML = '<h2 class="year"></h2><ol class="bibliography"></ol>';
        group.querySelector("h2").textContent = year;
        byYear[year].forEach((paper) => group.querySelector("ol").append(paper));
        journalView.append(group);
      });
    papers.after(journalView);
  }

  function hideJournalView() {
    journalView.querySelectorAll("ol.bibliography > li").forEach(function (paper) {
      paper.journalPlaceholder.replaceWith(paper);
    });
    journalView.remove();
    journalView = null;
  }

  function apply(filter) {
    links.forEach(function (link) {
      const active = link.dataset.filter === filter;
      link.classList.toggle("active", active);
      link.setAttribute("aria-pressed", active);
      link.title = active ? "Show all publications" : "";
    });
    if (journalView && filter !== "journals") hideJournalView();
    if (!journalView && filter === "journals") showJournalView();
    papers.classList.toggle("pub-hidden", filter === "thesis" || filter === "journals");
    thesis.classList.toggle("pub-hidden", filter in hasBadge);
    papers.querySelectorAll(".year-group").forEach(function (group) {
      let any = false;
      group.querySelectorAll("ol.bibliography > li").forEach(function (paper) {
        const shown = filter !== "conferences" || paper.querySelector(".venues a.conference") !== null;
        paper.classList.toggle("pub-hidden", !shown);
        any = any || shown;
      });
      group.classList.toggle("pub-hidden", !any);
    });
  }

  function fromHash() {
    const filter = location.hash.slice(1);
    apply([...links].some((link) => link.dataset.filter === filter) ? filter : null);
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const filter = link.classList.contains("active") ? null : link.dataset.filter;
      history.replaceState(null, "", filter ? "#" + filter : location.pathname + location.search);
      apply(filter);
    });
  });
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
