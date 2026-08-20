# NISRA Dashboard Demo

> ### 💀 _Part of the [NISRA Dashboard Skeleton](https://datavis.nisra.gov.uk/techlab/drpvze/dashboard-skeleton.html)_

A fully worked example demonstrating how to build interactive statistical dashboards using the **NISRA Dashboard Template**.

This repository is intended as a **learning resource**. It contains complete dashboard pages showing how the template's helper functions can be combined to create interactive charts, maps, tables and other dashboard components.

> **Looking to build your own dashboard?**
>
> Start with the **NISRA Dashboard Template**:
>
> **[https://github.com/NISRA-Tech-Lab/dashboard-template](https://github.com/NISRA-Tech-Lab/dashboard-template)**

---

# 1. Overview

This repository is a working implementation of the **NISRA Dashboard Template**.

Where the template provides the reusable framework and helper functions, this repository demonstrates how those helpers are used together to create complete dashboard pages.

The examples are intended to help users:

* understand the project structure
* learn how the helper functions are used
* see complete implementations of charts, maps and tables
* reuse patterns in their own dashboards

To create a new dashboard, **fork the Dashboard Template repository**, not this one.

---

# 2. Relationship to the Dashboard Template

The two repositories have different purposes.

| Repository             | Purpose                        |
| ---------------------- | ------------------------------ |
| **dashboard-template** | Build a new dashboard          |
| **dashboard-demo**     | Learn how the template is used |

The reusable helper functions live in the template.

This repository simply demonstrates how those helpers are used to build complete dashboard pages.

**Dashboard Template**

[https://github.com/NISRA-Tech-Lab/dashboard-template](https://github.com/NISRA-Tech-Lab/dashboard-template)

---

# 3. Project Structure

```
repo-root/
├── assets/
├── public/
│   ├── data/
│   └── map/
├── src/
│   ├── utils/
│   └── *.js
├── *.html
└── README.md
```

The overall structure is intentionally very similar to the Dashboard Template so that it is easy to compare the two repositories.

---

# 4. Understanding a Dashboard Page

Almost every dashboard page consists of two files with the same name.

```
population-estimates.html
population-estimates.js

age-structure.html
age-structure.js

migration.html
migration.js
```

Together these define a single dashboard page.

### The HTML file

The HTML file defines the page layout.

It contains the cards, placeholders and containers that determine where charts, maps, tables and other components will appear.

Most of the page content is inserted dynamically by JavaScript.

### The JavaScript file

The matching JavaScript file contains the page logic.

Typically it will:

* load the required data
* prepare and filter the data
* create charts
* build tables
* render maps
* populate information boxes
* add download buttons
* update shared page elements

Once you understand one page, you will find the rest of the repository follows the same pattern.

---

# 5. Learning from the Examples

The repository is designed to be explored.

A good way to learn is to open the matching HTML and JavaScript files side by side.

Follow the flow through the JavaScript:

1. Load the data.
2. Prepare the data.
3. Call the helper functions.
4. Populate the page.

Each page demonstrates a different combination of reusable helper functions supplied by the Dashboard Template.

---

# 6. Helper Functions in Action

The helper functions are located in the **Dashboard Template** and imported into each page.

Throughout this repository you will find examples of helpers including:

* `readData()`
* `barChart()`
* `lineChart()`
* `pieChart()`
* `treemapChart()`
* `plotMap()`
* `insertTable()`
* `populateInfoBoxes()`
* `downloadButton()`
* `updateYearSpans()`

Reading the page JavaScript alongside these helper functions is the easiest way to understand how the framework is intended to be used.

---

# 7. Running the Demo

Clone the repository and open it in Visual Studio Code.

Install the **Live Server** extension if required.

Open `index.html` and click **Go Live** to launch the dashboard in your browser.

---

# 8. Building Your Own Dashboard

This repository is provided as a reference implementation.

If you want to create your own dashboard, begin with the **Dashboard Template** rather than this repository.

The template contains:

* the reusable helper functions
* the project structure
* starter HTML pages
* data preparation scripts
* shared styling and accessibility features

**Dashboard Template**

[https://github.com/NISRA-Tech-Lab/dashboard-template](https://github.com/NISRA-Tech-Lab/dashboard-template)

You can then refer back to this repository whenever you need a complete working example of a particular chart, map or dashboard component.

---

# 9. Repository Philosophy

The examples in this repository are written to be easy to read and understand.

The code favours clarity over cleverness, with extensive comments explaining how each helper function works and how the different parts of a dashboard fit together.

Where appropriate, the comments compare JavaScript concepts with familiar R equivalents to make the examples more accessible for statisticians who are new to JavaScript.

---

# 10. Further resources

- [Dashboard demo wireframe](https://datavis.nisra.gov.uk/techlab/drpvze/nisra-dashboard-demo-wireframe.pptx) - A Powerpoint presentation containing elements that can be used to in dashboard planning
- [NISRA Dashboard BuildR](https://github.com/NISRA-Tech-Lab/dashboard-buildr) - An R package that can be used to interact with this template to automate some basic dashboard buiilding tasks.
