---
layout: page
permalink: /publications/
title: Publications
description: Conference and journal papers, and my PhD thesis.
nav: true
nav_order: 3
---
<!-- _pages/publications.md -->

{% include publications_by_year.liquid file="papers" section="Publications" %}

<div class="publications by-year thesis">
  <section class="year-group">
    <h2 class="year">Thesis</h2>
    {% bibliography -f thesis --group_by none %}
  </section>
</div>
