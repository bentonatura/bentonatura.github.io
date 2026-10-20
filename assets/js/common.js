$(document).ready(function () {
  // add toggle functionality to abstract, award and bibtex buttons
  $("a.abstract").click(function () {
    $(this).parent().parent().find(".abstract.hidden").toggleClass("open");
    $(this).parent().parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  $(".abstract-toggle").click(function () {
    $(this).parent().find(".abstract.hidden").toggleClass("open");
    $(this).parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().find(".bibtex.hidden.open").toggleClass("open");
    $(this).find(".abstract-chevron").toggleClass("open");
  });
  // clicking anywhere on a paper (not only its title) toggles its abstract,
  // except on links, inside the opened abstract/bibtex, or while selecting text
  $(".publications ol.bibliography li").click(function (e) {
    if ($(e.target).closest("a, button, .abstract-toggle, .hidden").length) return;
    if (window.getSelection().toString()) return;
    $(this).find(".abstract-toggle").first().trigger("click");
  });
  $(".publications ol.bibliography li").has(".abstract-toggle").addClass("has-abstract");

  // arriving at a paper via a link or the search (#entry-key) opens its abstract
  function openAbstractFromHash() {
    if (!window.location.hash) return;
    var entry = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!entry) return;
    var toggle = $(entry).find(".abstract-toggle").first();
    if (toggle.length && !$(entry).find(".abstract.hidden").hasClass("open")) toggle.trigger("click");
  }
  openAbstractFromHash();
  $(window).on("hashchange", openAbstractFromHash);
  // "Copy" in an opened BibTeX block: copy the entry, confirm briefly
  $(".copy-bibtex").click(function (e) {
    e.stopPropagation();
    var button = $(this);
    var text = button.closest(".bibtex").find("pre code").first().text().trim();
    var done = function () {
      button.text("Copied ✓").addClass("copied");
      setTimeout(function () {
        button.text("Copy").removeClass("copied");
      }, 2000);
    };
    var fallback = function () {
      var area = $("<textarea>").val(text).css({ position: "fixed", opacity: 0 }).appendTo("body");
      area[0].select();
      document.execCommand("copy");
      area.remove();
      done();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  });
  $("a.award").click(function () {
    $(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".award.hidden").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  $("a.bibtex").click(function () {
    $(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden").toggleClass("open");
  });
  $("a").removeClass("waves-effect waves-light");

  // open profile social/contact links in new tabs
  $(".contact-icons a").attr("target", "_blank").attr("rel", "noopener noreferrer");

  // bootstrap-toc
  if ($("#toc-sidebar").length) {
    // remove related publications years from the TOC
    $(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
      offset: 100,
    });
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let jupyterTheme = typeof determineComputedTheme !== "undefined" ? determineComputedTheme() : "light";

  $(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (jupyterTheme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });

  // trigger popovers
  $('[data-toggle="popover"]').popover({
    trigger: "hover",
  });
});
