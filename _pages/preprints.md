---
layout: page
permalink: /preprints/
title: Preprints 
description: 
years: [2023] 
nav: false 
nav_order: 3
---
<!-- _pages/publications.md -->

<div class="publications">

{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f preprints -q @*[year={{y}}]* %}
{% endfor %}

</div>
