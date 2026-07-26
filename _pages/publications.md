---
layout: page
permalink: /publications/
title: Publications
description:
nav: true
nav_order: 3
---
<!-- _pages/publications.md -->

{%- capture pub_count -%}{% bibliography_count -f papers %}{%- endcapture -%}
<div class="publications enumerated" style="counter-reset: pub-counter {{ pub_count | strip | plus: 1 }};">

{% bibliography -f papers --group_by none %}

</div>
