# NISRA Dashboard Template

A reusable template for NISRA statisticians to build interactive static dashboards. Built with HTML, modular JavaScript, and R for data preparation.

---

## 1. Overview

This repository is a **template and toolkit** for creating data-driven dashboards. It provides:
- Reusable helper functions for charts, maps, and layouts
- A modular JavaScript architecture
- R scripts for data preprocessing
- Pre-configured styling and accessibility features

**Recommended workflow**: Fork this repository and build your dashboard in your fork. This allows you to receive updates to the template (new features, accessibility improvements, branding changes) and pull them into your fork as needed.

For a fully worked example, see the [dashboard-demo repository](https://github.com/NISRA-Tech-Lab/dashboard-demo).

---

## 2. Folder Structure
```
repo-root/
├── assets/                # CSS, images, icons
├── public/                # Data and map styles
│   ├── data/data.json     # Preprocessed data for charts
│   └── map/               # GeoJSON and map style
├── src/                   # JavaScript source
│   ├── utils/             # Reusable helper functions
│   ├── *.js               # Page-specific scripts
│   └── r/                 # R scripts for data preparation
│       ├── data.R
│       └── pivot_long.R
├── *.html                 # Dashboard pages
└── dashboard-template.Rproj # RStudio project file
```

---

## 3. How Modularisation Works

Each HTML page loads a **corresponding JS module**:
```html
<script type="module" src="src/page.js"></script>
```

The JS module:
- Imports shared helpers from `src/utils/`
- Fetches data from `public/data/data.json`
- Builds charts, maps, and interactive elements
- Wires up event listeners and interactions

This modular approach keeps your code organized and reusable across multiple pages.

---

## 4. Worked Example

For a complete, fully-worked example with production-ready implementations, see the [dashboard-demo repository](https://github.com/NISRA-Tech-Lab/dashboard-demo). This demonstrates how to:
- Structure data for different chart types
- Implement interactive features
- Customize layouts and branding
- Apply accessibility standards

---

## 5. Getting Started (Recommended Workflow)

### Step 1: Fork This Repository
- Go to [NISRA-Tech-Lab/dashboard-template](https://github.com/NISRA-Tech-Lab/dashboard-template)
- Click the **Fork** button (top-right) to create your own copy
- This allows you to pull future updates from the template while maintaining your own customizations

### Step 2: Clone Your Fork in VS Code
- Open VS Code → `View > Command Palette` → `Git: Clone`
- Paste your fork's URL:
```
https://github.com/YOUR_USERNAME/dashboard-template
```
(Replace `YOUR_USERNAME` with your GitHub username)

### Step 3: Install Live Server Extension
- In VS Code, go to Extensions → Search for **Live Server** → Install

### Step 4: Run the Dashboard
- Open `index.html` in VS Code
- Click **Go Live** (bottom-right corner)
- The site will open in your browser with auto-refresh on changes

### Reference Implementation
For detailed implementation examples and best practices, explore the [dashboard-demo repository](https://github.com/NISRA-Tech-Lab/dashboard-demo).

---

## 6. Data Preparation (`src/r/`)
Run in RStudio:
```r
source("src/r/data.R")
source("src/r/pivot_long.R")
```
This regenerates `public/data/data.json` from the data sources.

---

## 7. Adding a New Page

1. Duplicate an existing HTML file to use as a template
2. Create a matching JS module in `src/` with the same name
3. Import utilities as needed:
```js
import { readData } from './utils/read-data.js';
import { createBarChart } from './utils/charts.js';
import { populateInfoBoxes } from './utils/info-boxes.js';
```
4. Link the JS in your HTML:
```html
<script type="module" src="src/new-page.js"></script>
```

For complete page implementation examples, see the [dashboard-demo repository](https://github.com/NISRA-Tech-Lab/dashboard-demo).

---

## 8. Utilities Reference (`src/utils/`)

Each file in `src/utils/` provides reusable helper functions:

- **charts.js**: Chart creation and data shaping functions
- **read-data.js**: Loads preprocessed JSON data
- **update-years.js**: Updates year spans in DOM
- **insert-value.js**: Inserts calculated values into elements
- **info-boxes.js**: Creates accordion-style info boxes
- **page-layout.js**: Inserts header, footer, and navigation
- **plot-map.js**: Renders interactive maps
- **load-shapes.js**: Fetches and loads GeoJSON shapes
- **download-button.js**: Adds CSV/data download functionality
- **expand-buttons.js**: Inserts expand/collapse controls
- **reshape-for-treemap.js**: Reformats data for treemap visualizations
- **to-title-case.js**: Converts strings to title case
- **wrap-label.js**: Wraps long chart labels for readability
- **get-nested.js**: Safely accesses nested object properties

For detailed function signatures and usage examples, see the [dashboard-demo repository](https://github.com/NISRA-Tech-Lab/dashboard-demo).

---

## 9. Accessibility & Best Practices
- Use **high-contrast colours**.
- Add **ARIA roles** for interactive elements.
- Ensure charts have **text alternatives** for screen readers.
- Test responsiveness on mobile and desktop.

---

## 10. How to Add a New Chart or Info Box

### Adding a New Chart
1. Identify the HTML page where you want the chart
2. Add a `<canvas>` element inside the appropriate section:
```html
<canvas id="my-chart" class="chart-canvas"></canvas>
```
3. In the corresponding JS file:
   - Import chart utilities:
```js
import { createBarChart, createLineChart } from "./utils/charts.js";
import { readData } from "./utils/read-data.js";
```
   - Fetch data and prepare chart data:
```js
const data = await readData("YourDataKey");
const chartData = {/* formatted data for chart */};
```
   - Render the chart:
```js
createBarChart({ chart_data: chartData, canvas_id: "my-chart" });
```

For complete examples, see the [dashboard-demo repository](https://github.com/NISRA-Tech-Lab/dashboard-demo).

### Adding a New Info Box
1. In the HTML page, ensure there is a container for info boxes:
```html
<div id="info-boxes"></div>
```
2. In the JS file, use `populateInfoBoxes`:
```js
import { populateInfoBoxes } from "./utils/info-boxes.js";

populateInfoBoxes([
  "Title 1", "Title 2"
], [
  "<p>Content for box 1</p>",
  "<p>Content for box 2</p>"
]);
```
This will dynamically create accordion-style info boxes with your content.

### Adding a New Value Using `insertValue`
1. In the HTML page, create a `<span>` element with a unique ID:
```html
<p><span id="my-value"></span> descriptive text</p>
```
2. In the JS file, after fetching data, call `insertValue`:
```js
import { insertValue } from "./utils/insert-value.js";
insertValue("my-value", calculatedValue);
```
This will insert the value dynamically into the span.

---
