---
title: "CSS Container Queries for Responsive Components"
description: "Container queries allow components to respond to their container's size rather than the viewport, enabling true component-based responsive design."
pubDate: 2024-11-20
tags: ["css", "responsive-design", "container-queries", "modern-css"]
category: "css"
difficulty: "intermediate"
lang: "en"
---

## The Problem

Traditional media queries respond to viewport size, but sometimes you need components to adapt based on their container's size instead.

## The Solution

```css
/* Define containment context */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Query the container instead of viewport */
@container card (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }
  
  .card-image {
    width: 200px;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
  
  .card-image {
    width: 100%;
  }
}
```

## Browser Support

- Chrome 105+
- Firefox 110+
- Safari 16+

Use `@supports (container-type: inline-size)` for progressive enhancement.

## Why This Matters

Container queries enable truly modular, reusable components that adapt to their context rather than the global viewport. Perfect for design systems and component libraries.
