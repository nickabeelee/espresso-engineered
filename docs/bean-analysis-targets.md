# Bean Analysis Target Calculation

This document describes how the Bean Analysis charts compute the target value and success band for ratio and brew time.

## Overview

For each chart, the system calculates:
- **Target value**: the center of the success band and the value shown in the chart header.
- **Success band width**: the span around the target value that visually highlights the "best" range.

Defaults:
- Ratio target fallback: `1:2.0`
- Brew time target fallback: `30s`

## Data Inputs

Each chart uses the plotted brew points:
- Ratio chart uses each brew's `ratio` (x) and `rating` (y).
- Brew time chart uses each brew's `brew_time_s` (x) and `rating` (y).

Points without x or y values are excluded before the calculation.

## Target Selection

1. Collect all ratings from the plotted points.
2. Compute the **75th percentile** rating threshold.
3. Select points whose rating is **>= 75th percentile**.
4. If fewer than 3 points qualify, use **all points** as the pool.
5. Compute the **median** of the pool's x-values.
6. If no data exists, use the fallback target.

## Success Band Width

1. From the same pool of x-values used for the target:
2. Compute the **10th percentile** and **90th percentile**.
3. The band width is `p90 - p10`.
4. If the spread is too small, apply a fallback minimum:
   - Ratio band minimum: `0.12`
   - Brew time band minimum: `2.5`

## Axis Alignment

The x-axis tick values are set to:
- Minimum x-value
- **Target x-value**
- Maximum x-value

This ensures the axis labels reflect the same value shown in the chart header.
