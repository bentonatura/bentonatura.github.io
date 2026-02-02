---
layout: page
permalink: /preprints/
title: Preprints
description:
years: [2026]
nav: true
nav_order: 4
---
<!-- _pages/preprints.md -->

<div class="publications">

{%- for y in page.years %}
  {% bibliography -f preprints -q @*[year={{y}}]* %}
{% endfor %}

</div>
