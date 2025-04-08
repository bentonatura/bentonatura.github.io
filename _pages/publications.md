---
layout: page
permalink: /publications/
title: Publications
description: 
years: [2025,2024,2023,2022,2020] 
nav: true
nav_order: 2
---
<!-- _pages/publications.md -->

<div class="publications">


{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f publications -q @*[year={{y}}]* %}
{% endfor %}

</div>
