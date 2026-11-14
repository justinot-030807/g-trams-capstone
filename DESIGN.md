---
name: G-TRAMS
description: Municipal Tricycle Franchising & Regulatory System for the Local Government Unit of Gasan, Marinduque
colors:
  gasan-maroon: "#9E2A2B"
  gasan-maroon-deep: "#7A1B22"
  gasan-maroon-tint: "#FDF2F4"
  gasan-gold: "#D4AF37"
  gasan-gold-accessible-on-maroon: "#F5E6B3"
  warm-alabaster: "#F6F5F3"
  pure-paper: "#FFFFFF"
  sand-hairline: "#E4E1DC"
  ink-charcoal: "#1F1D1B"
  slate-taupe: "#6B6761"
  obsidian-earth: "#14110F"
  dark-stone: "#1C1917"
  dark-umber: "#2E2A27"
  dark-parchment: "#F6F5F3"
  dark-ash: "#A8A29E"
  civic-green: "#15803D"
  amber-ochre: "#B45309"
  crimson-alert: "#B91C1C"
  neutral-zinc: "#4B5563"
typography:
  display:
    fontFamily: "\"IBM Plex Sans\", system-ui, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "\"IBM Plex Sans\", system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "\"IBM Plex Sans\", system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "\"IBM Plex Sans\", system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "\"IBM Plex Mono\", ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.gasan-maroon}"
    textColor: "{colors.pure-paper}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.gasan-maroon-deep}"
  card-surface:
    backgroundColor: "{colors.pure-paper}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.pure-paper}"
    textColor: "{colors.ink-charcoal}"
    rounded: "{rounded.md}"
    height: "44px"
---

# Design System: G-TRAMS

## Overview

**Creative North Star: "The Civic Ledger"**

G-TRAMS (Gasan Tricycle Records & Application Management System) pairs formal Philippine municipal authority with legible, resilient digital record-keeping across five civic roles: Citizens/Operators, TODA Presidents, Municipal Cashiers, LLSA I Licensing Staff, and System Administrators. Every screen prioritizes verifiable civic records, zero-ambiguity status signaling, and legible accessibility on both municipal office desktops and outdoor mobile phones.

Visual authority relies on warm alabaster paper (`#F6F5F3`), crisp 1px sand borders (`#E4E1DC`), Gasan Heritage Maroon (`#9E2A2B`) strictly reserved for primary actions and brand landmarks, and Gasan Gold (`#D4AF37` / `#F5E6B3`) for dark-mode focus and high-contrast trim.

**Key Characteristics:**
- Warm limestone-and-paper neutrals (`#F6F5F3`, `#FFFFFF`, `#14110F`, `#1C1917`) with zero cool slate/blue-gray drift.
- Precision tabular numerals via `IBM Plex Mono` for OR numbers, plate numbers, fees, counts, and timestamps.
- Strictly 4 semantic status bands (Active, In-Progress, Danger, Neutral) with WCAG AA text-and-icon pairing.
- Restrained elevation backed by subtle 1px hairline borders rather than drop-shadow haze or accent `border-l-4` bars.

## Colors

The palette avoids cold gray or neon SaaS gradients in favor of warm paper surfaces in light mode and warm obsidian charcoal in dark mode.

### Primary
- **Gasan Maroon** (`#9E2A2B`): Primary action buttons, sidebar landmark container, active tab highlights, and light-mode focus outlines. Never used as body copy on `#1C1917` dark surfaces without a light override.
- **Gasan Maroon Deep** (`#7A1B22`): Primary hover/pressed button fill and dark gradient framing.
- **Gasan Gold** (`#D4AF37`): Accent borders, active dark-mode focus rings, and large display badges.
- **Gasan Gold Accessible Trim** (`#F5E6B3`): Small text and badge labels over `#9E2A2B` backgrounds to exceed 7:1 contrast.

### Neutral
- **Warm Alabaster** (`#F6F5F3`): Light canvas background (`--color-canvas`).
- **Pure Paper** (`#FFFFFF`): Elevated cards, modals, and form fields (`--color-surface`).
- **Sand Hairline** (`#E4E1DC`): Subtle 1px structural borders (`--color-border`).
- **Ink Charcoal** (`#1F1D1B`): Primary body and table copy on light canvas (`>14:1` contrast).
- **Slate Taupe** (`#6B6761`): Secondary metadata, helper captions, and accessible unchecked icon strokes (`>=4.6:1` on white).
- **Obsidian Earth** (`#14110F`) & **Dark Stone** (`#1C1917`): Warm dark-mode canvas and surface panels paired with `#2E2A27` borders, `#F6F5F3` text, and `#A8A29E` secondary labels.

### Named Rules
**The One-Accent Landmark Rule.** Gasan Maroon occupies hero framing, active navigation, and the single primary action per view; cards and status chips rely on neutral hairlines and semantic hues so urgent alerts read immediately.

## Typography

**Display Font:** `"IBM Plex Sans", system-ui, -apple-system, sans-serif`
**Body Font:** `"IBM Plex Sans", system-ui, -apple-system, sans-serif`
**Label/Mono Font:** `"IBM Plex Mono", ui-monospace, monospace`

**Character:** Civic sans-serif clarity paired with tabular monospace discipline so plate codes, OR numbers, and audit timestamps align vertically down tables.

### Hierarchy
- **Display** (`600`, `2.25rem` / `36px`, `1.2`): Public hero and major empty banners.
- **Headline** (`600`, `1.5rem` / `24px`, `1.25`): `PageHeader` titles and dashboard headings.
- **Title** (`600`, `1.125rem` / `18px`, `1.35`): Card headers and modal titles (`DialogTitle`).
- **Body** (`400`, `0.875rem` / `14px`, `1.5`): Form inputs, table cells, and narrative copy (`65–75ch` ceiling).
- **Label** (`600`, `0.6875rem` / `11px`, `0.06em`, `uppercase`): Monospace table headers, badge labels, and timestamps.

### Named Rules
**The Tabular Ledger Rule.** Every currency amount, count, date, plate number, and MTOP number uses `font-mono tabular-nums` so numbers align strictly in tables and KPI cards.

## Layout

Desktop workspace renders a collapsible `Sidebar` (`w-64` expanded, `w-20` collapsed) paired with `TopNavbar` and scrollable main container (`p-3.5 sm:p-6 lg:p-8`). Mobile viewports (`<768px`) convert wide ledger tables into stacked single-column cards (`md:hidden`) to prevent horizontal clipping, hide desktop sidebar behind an explicit slide-over drawer (or `OperatorBottomNav` strictly for Operator / TODA President; Cashiers keep the slide-over drawer), and maintain `min-h-[44px]` touch targets on interactive controls.

## Elevation & Depth

Surfaces are flat-by-default with depth carried by crisp 1px borders (`#E4E1DC` light / `#2E2A27` dark) and minimal subtle shadow (`--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`) in light mode. Shadows never replace borders in dark mode.

## Shapes

Cards use subtle civic corner rounding (`12px` / `rounded-xl` for main cards and dialogs, `8px` / `rounded-lg` for buttons, inputs, and table pills). Structural borders stay `1px` uniform around containers instead of heavy accent `border-l-4` stripes.

## Components

### Buttons
- **Shape:** Gently rounded (`8px`). Minimum touch height `44px` on mobile/form controls.
- **Primary:** Solid `#9E2A2B` fill with white `#FFFFFF` text; `#7A1B22` on hover; accessible focus outline (`2px solid #9E2A2B` light / `#D4AF37` dark).
- **Secondary / Ghost:** Paper `#FFFFFF` (`#1C1917` dark) surface with 1px `#E4E1DC` (`#2E2A27` dark) border and `#1F1D1B` (`#F6F5F3` dark) label.

### Inputs / Fields
- **Style:** `1px` `#E4E1DC` (`#2E2A27` dark) border on `#FFFFFF` (`#14110F` dark), `8px` radius, minimum `44px` height, single custom chevron for `<select>` controls (`appearance-none` when paired with custom icon, zero duplicate browser arrows).
- **Date Inputs:** Standalone `<input type="date">` carries normal 1px border & focus ring; borderless inner reset applies solely inside `.simple-date-picker-input`.

### Dialogs & Notifications
- **Modals & Confirms:** Accessible Radix UI `Dialog` / `AlertDialog` with `Escape` key dismiss, focus trap, `aria-modal="true"`, and zero native browser `alert()`, `confirm()`, or `prompt()`.
- **Toasts:** Non-blocking theme-matched `Sonner` toasts.

## Do's and Don'ts

### Do:
- **Do** use warm `#F6F5F3` / `#14110F` / `#1C1917` / `#2E2A27` neutrals on every panel, modal, and skeleton.
- **Do** validate >= 4.5:1 normal text contrast and >= 3:1 UI border/icon contrast across Light & Dark themes.
- **Do** enforce `44px` minimum touch targets on mobile triggers and convert wide `<768px` tables into readable stacked cards.

### Don't:
- **Don't** use Tailwind numeric `neutral-*` classes (overwritten in `tailwind.config.js`), `slate-*` cool grays, or invalid TWv4 classes (`shadow-xs`, `backdrop-blur-xs`, `py-0.2`).
- **Don't** place thick `border-l-4` left accent borders on cards or callouts, or use `animate-bounce` on floating widgets.
- **Don't** expose native browser `alert()`, `window.confirm()`, or `window.prompt()` popups.
