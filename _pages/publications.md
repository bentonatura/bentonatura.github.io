---
layout: page
permalink: /publications/
title: Publications
description: Conferences · Journals · Thesis
nav: true
nav_order: 3
header_art: central_path # animated illustration, _includes/central_path.liquid
---
<!-- _pages/publications.md -->

{% include publications_by_year.liquid file="papers" section="Publications" %}

<div class="publications by-year thesis">
  <section class="year-group">
    <h2 class="year">Thesis</h2>
    {% bibliography -f thesis --group_by none %}
  </section>
</div>
