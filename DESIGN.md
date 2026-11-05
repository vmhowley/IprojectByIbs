---
name: ibPulse
description: "Projects, tickets and what each client is worth, set as the business forms of IBSYSTEMS.SRL."
colors:
  brand: "oklch(0.55 0.215 28)"
  brand-strong: "oklch(0.48 0.2 28)"
  on-brand: "oklch(0.99 0.005 28)"
  st-graphite: "oklch(0.4 0.02 260)"
  st-ochre: "oklch(0.52 0.12 65)"
  st-blue: "oklch(0.47 0.15 255)"
  st-violet: "oklch(0.47 0.16 300)"
  st-green: "oklch(0.48 0.12 150)"
  st-red: "oklch(0.55 0.215 28)"
  desk: "oklch(0.958 0.008 255)"
  paper: "oklch(0.995 0.002 250)"
  raised: "oklch(1 0 0)"
  shelf: "oklch(0.942 0.009 255)"
  well: "oklch(0.974 0.006 255)"
  ink: "oklch(0.21 0.02 260)"
  ink-2: "oklch(0.42 0.018 260)"
  ink-3: "oklch(0.52 0.014 260)"
  rule: "oklch(0.9 0.007 260)"
  rule-strong: "oklch(0.6 0.012 260)"
  rule-field: "oklch(0.8 0.01 260)"
  focus: "oklch(0.55 0.17 255)"
  data: "oklch(0.55 0.1 215)"
typography:
  display:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "3.4rem"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
    fontVariation: '"wdth" 112'
  headline:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
    fontVariation: '"wdth" 108'
  title-page:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  body-dense:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  control-dense:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.07em"
  stamp:
    fontFamily: '"Archivo Variable", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: '"wdth" 82'
  figure:
    fontFamily: '"Red Hat Mono Variable", ui-monospace, "Cascadia Mono", monospace'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: '"tnum" 1'
  figure-total:
    fontFamily: '"Red Hat Mono Variable", ui-monospace, "Cascadia Mono", monospace'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
    fontFeature: '"tnum" 1'
  figure-doc:
    fontFamily: '"Red Hat Mono Variable", ui-monospace, "Cascadia Mono", monospace'
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: '"tnum" 1'
rounded:
  stamp: "5px"
  inner: "6px"
  control: "8px"
  sheet: "12px"
  seal: "9999px"
spacing:
  2xs: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  row: "10px"
  lg: "12px"
  cell: "16px"
  stack: "20px"
  gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.brand-strong}"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.well}"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.st-red}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.st-red}"
    textColor: "{colors.on-brand}"
  button-ghost:
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  segmented:
    rounded: "{rounded.control}"
    padding: "2px"
  segment:
    textColor: "{colors.ink-2}"
    typography: "{typography.control-dense}"
    rounded: "{rounded.inner}"
    padding: "0 10px"
  segment-pressed:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
  filter:
    textColor: "{colors.ink-2}"
    typography: "{typography.control-dense}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "28px"
  filter-active:
    textColor: "{colors.brand-strong}"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "16px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  field-disabled:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink-3}"
  stamp:
    textColor: "{colors.st-graphite}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "0 6px"
    height: "20px"
  stamp-large:
    textColor: "{colors.st-ochre}"
    rounded: "{rounded.stamp}"
    padding: "0 10px"
    height: "28px"
  ledger-head:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    padding: "8px 16px"
  ledger-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "10px 16px"
  ledger-amount:
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
  ledger-total:
    textColor: "{colors.ink}"
    typography: "{typography.figure-total}"
    padding: "10px 16px"
  doc-number:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.figure-doc}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  tab:
    textColor: "{colors.ink-2}"
    typography: "{typography.control-dense}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  tab-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  nav-item-active:
    textColor: "{colors.brand-strong}"
  sidebar:
    backgroundColor: "{colors.paper}"
    width: "240px"
  top-bar:
    backgroundColor: "{colors.paper}"
    height: "56px"
  avatar:
    rounded: "{rounded.seal}"
    size: "28px"
  request-type:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.inner}"
    padding: "0 6px"
    height: "20px"
  empty-state:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "32px 24px"
  modal:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "16px 20px"
  modal-footer:
    backgroundColor: "{colors.well}"
    padding: "12px 20px"
  toast:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sheet}"
    padding: "10px 12px"
  data-bar:
    backgroundColor: "{colors.data}"
    rounded: "{rounded.seal}"
    height: "8px"
---

# Design System: ibPulse

## Overview

**Creative North Star: "The House Forms"**

ibPulse is set as the business forms of IBSYSTEMS.SRL; the stylesheet calls it «Formularios de la casa». A project is a quote, a ticket is a work order, a status is a rubber stamp. Bond-white sheets lie on a cool grey desk, printed in black ink. The logo red is the one printed spot color, kept for the primary action, the head rule of a form and the mark that says where you are. Statuses are framed stamps in six office inks. Amounts are typed entries in a monospaced face, one line per currency, closed by a double accounting rule.

The density is an operator's. Ruled registers with uppercase caption heads, one line per record, 14px body text, 13px secondary text and 11px captions are read at a glance across a full workday on a desktop screen. Every app page has the same anatomy: a letterhead on the desk (title, what the page covers, the page's actions and, where it applies, a numbered box at the top right), then sheets on the desk. Depth is paper on a desk and nothing more: no gradients, no glows, no glass.

This is the second edition of the forms, set for a newer office. Sheets round their corners to 12px and rest on a layered shadow; buttons, fields and the chosen segment rise a hair off the paper; the sidebar is paper like the top bar. Stamps are inked inside their frames, and color now also names people (one hue per name), quantities (one data hue) and the selected record (a blue tint). Density, captions, stamps and the mono figures did not change.

Dark mode is carbon paper: the same variables re-inked as a blue-black desk, slightly lighter carbon sheets, pale ink and a lighter logo red with dark lettering on it. The confirmed rejection, from the direction contract, is the category default of white cards, indigo accents and a row of stat tiles at the top of the page.

**Key Characteristics:**
- Bond sheets (1px rule, 12px corners, a layered resting shadow) on a cool grey desk; sheets never nest.
- One printed spot color, the logo red: primary action, form head rules, the current place.
- Statuses are framed rubber stamps in office inks; priority is a three-tick meter.
- Archivo for every word, Red Hat Mono for codes and amounts, tabular figures wherever numbers line up.
- Ruled registers with uppercase captions; totals sit under a 3px double ink rule, one line per currency.
- Color with a job: stamps inked inside their frames, a hue per person, one data hue, a blue tint on the selected record.
- Carbon-paper dark mode from the same variables, with no per-component overrides.

## Colors

Cool, almost achromatic paper and ink (hue 250 to 262) carrying one saturated logo red and six muted office inks that only ever mean status.

### Primary
- **Logo Red** (oklch(0.55 0.215 28)): the printed spot color. It fills the primary button and the unread counter, draws the 2px head rule across modals and ruled sheets and the 2px top rule of the active folder tab, washes the current nav item and the active filter at 10% (with a Pressed Red label and a Logo Red icon), colors the check of a selected option and the page-load line, and serves as the text caret and (at 22%) the selection tint. On public pages it also prints list numerals, feature icons and the plan mark ("Recomendado para equipos").
- **Pressed Red** (oklch(0.48 0.2 28)): the hover and pressed fill of red buttons.
- **Paper on Red** (oklch(0.99 0.005 28)): lettering on a red fill, including a danger button once it fills.

### Tertiary
The office inks. They are status inks, not accents: each reaches 4.5:1 on paper and on carbon, and appears only in stamps, priority ticks, board-column markers, status bars and their legends, alert figures and field errors. On a stamp the ink also tints the inside of the frame at 12%, and the lettering is the ink pressed deeper (80% ink, 20% Black Ink, mixed in OKLab so the hue holds), which keeps 4.5:1 over that tint.
- **Graphite Ink** (oklch(0.4 0.02 260)): not started or put away: "Pendiente de análisis", "Pendiente", "Archivado"; low priority.
- **Ochre Ink** (oklch(0.52 0.12 65)): waiting on someone: "Pendiente de aprobación", "En revisión", "En espera"; medium priority; the count of tickets waiting for the client.
- **Blue Ink** (oklch(0.47 0.15 255)): "Aprobado".
- **Violet Ink** (oklch(0.47 0.16 300)): work in progress: "En desarrollo", "Activo".
- **Green Ink** (oklch(0.48 0.12 150)): finished: "Completado", "Finalizado"; progress rails; the success toast icon.
- **Stamp Red** (oklch(0.55 0.215 28)): "Cancelado", "Vencido", overdue dates ("venció …"), alert figures, high and critical priority, required-field asterisks, field errors, danger buttons and the error toast icon. It matches Logo Red on paper but is its own token, so carbon paper can tune the two apart.

### Neutral
- **Cool Grey Desk** (oklch(0.958 0.008 255)): the ground of the app, of every page letterhead, of the sign-in pages and of the landing's desk bands.
- **Bond Paper** (oklch(0.995 0.002 250)): every sheet, field, modal, popover and toast, the active folder tab, the sidebar and the top bar.
- **Raised White** (oklch(1 0 0)): what rises off the paper: the chosen segment of a segmented control and the secondary button.
- **Shelf Grey** (oklch(0.942 0.009 255)): board trays (at 60%).
- **Well** (oklch(0.974 0.006 255)): caption head rows of registers, sheet and modal footers, disabled fields, empty states (at 60%), the request-type cell and the search trigger.
- **Black Ink** (oklch(0.21 0.02 260)): text, figures, totals and their double rule, the current step of the route sheet.
- **Ink 2** (oklch(0.42 0.018 260)): secondary text, subtitles, inactive tabs, segments and nav items.
- **Ink 3** (oklch(0.52 0.014 260)): captions, metadata, placeholders, icons at rest and the empty-value dash.
- **Rule** (oklch(0.9 0.007 260)): every hairline: sheet edges, row dividers and the default border.
- **Field Rule** (oklch(0.8 0.01 260)): the edge of fields and secondary buttons, all round.
- **Strong Rule** (oklch(0.6 0.012 260)): hover borders of fields and buttons, the frame of the numbered box (60%), the dashed edge of an empty state (50%).
- **Focus Blue** (oklch(0.55 0.17 255)): functional, never printed. The 2px keyboard focus outline (2px offset), a focused field's border and its 3px ring at 22%, the 8% tint of the selected record in every list and the frame of a selected board card.

### People and Data
- **Person hues:** an avatar seal takes one of eight hues (55, 95, 140, 180, 215, 250, 285 and 320), chosen from the name, so the same person always wears the same color. The band around the logo red is left out, so a seal never reads as an alert. The seal sits at lightness 0.92 and chroma 0.05 with initials at 0.42 and 0.11; on carbon, 0.34 and 0.06 with initials at 0.88 and 0.07.
- **Data Cerulean** (oklch(0.55 0.1 215)): quantity bars, such as "Tickets por cliente", so a bar never reads as a status or an alert.

### Carbon Paper
The dark theme re-inks every token in place: the desk drops to oklch(0.17 0.02 262), sheets to oklch(0.21 0.022 262), ink rises to oklch(0.93 0.01 250), and Logo Red lightens to oklch(0.68 0.19 28) with Paper on Red turning dark (oklch(0.16 0.03 28)). On carbon, Pressed Red is lighter than Logo Red, not darker, and the ochre ink warms to hue 75. Raised White becomes oklch(0.275 0.024 262), a step lighter than the sheet; Field Rule becomes oklch(0.4 0.022 262) and Data Cerulean oklch(0.72 0.1 215). The full carbon set is recorded per token in `.impeccable/design.json`.

### Named Rules
**The One Printed Ink Rule.** Logo red is the only printed spot color. In the app it marks the primary action (one per view), the head rule of a form and the current place, which is the only background it washes (at 10%); it never carries a status, colors a chart series or decorates.

**The Red Figure Rule.** Amounts print in black ink. A figure turns red (Stamp Red, semibold) only when it is late or alarming. Money is never red.

**The Office Ink Rule.** Status color follows one fixed map: graphite waits to start, ochre waits on someone, blue is approved, violet is in progress, green is finished, red is cancelled or overdue. No other status colors exist.

**The Color With a Job Rule.** Every color beyond paper and ink carries information: the office inks name a status, a hue names a person, the data hue measures a quantity, the focus tint marks the selected record. Surfaces stay neutral.

**The Carbon Paper Rule.** Dark mode re-inks the same variables; components never carry theme-specific colors. The one per-theme treatment is the logo wordmark, inverted with a half-turn of hue so the red stays red.

## Typography

**Display Font:** Archivo Variable with its width axis (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Archivo Variable (same stack)
**Label/Mono Font:** Red Hat Mono Variable (with ui-monospace, Cascadia Mono, monospace), for codes and amounts only

Both faces are self-hosted, so no screen waits on a font service.

**Character:** One office grotesque does every job by changing width and weight: condensed in stamps, normal in the app, expanded on marketing heads. Beside it, a typewriter mono turns every amount and code into a typed entry that lines up in its column.

### Hierarchy
- **Display** (700, 2.5rem on phones and 3.4rem from 640px, line-height 1.04, -0.02em, width 112%): the landing hero headline only.
- **Headline** (700, 1.875rem, 1.2, -0.015em, width 108%): landing and pricing section heads. Plan prices use the same cut at 2.25rem with tabular figures.
- **Page title** (600, 22px, 1.25, -0.01em): the letterhead heading of every app page, from "Hoy, …" to a project's name.
- **Title** (600, 1.125rem, 1.25): modal titles and the landing's step and feature heads. Record titles (a client's name, a ticket's subject) go up to 1.25rem.
- **Body** (400, 14px, 20px line): cells, fields and descriptions; sheet heads use it at 600 ("Libro de cotizaciones", "Bandeja de trabajo"). Letterhead subtitles cap at 48rem and empty-state text at 65ch; landing paragraphs run 15px at a 1.625 line height.
- **Dense** (13px; 400 for secondary cells, 500 for controls): dates, assignees, tabs, filters, small buttons, back links and field errors.
- **Label** (600, 11px, 16px line, 0.07em, uppercase, Ink 3): the caption. Field labels, column heads, nav group names and the label of a numbered box.
- **Stamp** (700, 11px, line-height 1, 0.06em, uppercase, width 82%; 12px at 0.08em on the large ticket stamp): status stamps only.
- **Figure** (Red Hat Mono, 400 in rows and 600 in totals, 13 to 14px, tabular figures; 15px semibold in the numbered box): amounts, ticket numbers and sequences ("1/5"), case codes, keyboard keys ("Ctrl K") and the landing's list numerals.

The build sets width through font-stretch (82%, 108%, 112%) on the variable width axis; the frontmatter records the same values as `wdth` variations.

### Named Rules
**The Typed Entry Rule.** Red Hat Mono is for codes, identifying numbers and amounts. Counts and dates keep Archivo's tabular figures, because they sit inside sentences and stamps. A missing price is a word ("Sin precio") and stays in Archivo even in a mono cell.

**The Caption Rule.** The uppercase 11px caption names what a box holds: a field, a column, a nav group, a numbered box. It never floats above a section heading as a kicker.

**The Eleven-Pixel Floor Rule.** No text is set below 11px. Captions, small stamps and the initials of the two smallest avatars sit exactly on the floor.

**The Width Axis Rule.** Width is a role: 82% belongs to stamps, 108 to 112% to marketing display heads, and app text stays at 100%.

## Layout

**Shell.** A paper sidebar 240px wide, divided from the desk by a rule, sits beside the content from 768px; below that it becomes a 256px drawer over a 45% ink scrim, opened from the top bar. The top bar is a 56px paper strip over a rule, holding a search trigger drawn as a well field ("Buscar proyecto, ticket o cliente" with a mono "Ctrl K" key), notifications, the theme switch and the account seal. Everything else is desk.

**Page anatomy.** Every app page opens with a letterhead on the desk: 16px gutters (24px from 640px), the page title and a one-line subtitle on the left, the page's actions on the right with the primary action last, and an optional numbered box at the far right from 1024px (beside the title on smaller screens). Folder tabs, when present, sit on the letterhead's bottom rule. Below it, sheets stack with 20px of desk between them. Work pages run a fluid main column with a fixed side column (most often 22rem) from 1280px; below that, the side column stacks after the main one.

**Rhythm.** A 4px base. Register rows run 10px by 16px (8px by 16px in the denser ledger rows); caption head rows run 6 to 8px tall on the well; sheet heads run 10px by 16px over a rule; modal bodies run 16px by 20px. Sheet padding steps through 12, 16 and 24px.

**Registers follow their own width.** The task register and the summary strip are size containers. The task list adds number, status and deadline from 36rem, priority and assignee from 56rem, and request type from 72rem of its own width, so it keeps its subject column beside the properties panel. The summary strip stacks its boxes until 36rem.

**Phones.** Below 640px, money tables fold the "Estado" stamp or the "Proyectos" count into the name cell, so the amount column always stays in view. Project names may break anywhere, so a name pasted with non-breaking spaces cannot hold a table open. Middle columns drop by breakpoint, and footer cells drop at the same breakpoints so a total stays under its column. Modals become bottom sheets. Folder tabs scroll sideways and keep the active tab in view; the view switcher shows icons alone below 1024px.

**Money is optional.** Price columns, the ledger and the price box render only for viewers allowed to see prices; every layout holds without them.

**Public pages.** A 72rem column with the same gutters; full-width bands alternate desk and paper and are divided by rules.

### Named Rules
**The Amount Stays in View Rule.** On a phone, a money register keeps the name and the amount; every other column folds into the name cell or drops. A price is never truncated or scrolled out of view.

## Elevation & Depth

Paper on a desk with three weights of shadow. Depth comes from tone first (white sheets on the desk, caption rows and footers sunk into the well, the chosen segment raised onto its recessed track); shadow says whether something sits on the paper, rests on the desk or is lifted from it.

### Shadow Vocabulary
- **Control** (`box-shadow: 0 1px 2px oklch(0.2 0.02 260 / 0.07)`; on carbon `0 1px 2px oklch(0 0 0 / 0.35)`): buttons, fields and the chosen segment. A pressed button drops it.
- **Resting sheet** (`box-shadow: 0 1px 2px oklch(0.2 0.02 260 / 0.05), 0 4px 12px -6px oklch(0.2 0.02 260 / 0.12)`; on carbon `0 1px 2px oklch(0 0 0 / 0.3), 0 4px 12px -6px oklch(0 0 0 / 0.45)`): every sheet on the desk.
- **Lifted sheet** (`box-shadow: 0 18px 40px -16px oklch(0.2 0.02 260 / 0.3), 0 4px 10px -2px oklch(0.2 0.02 260 / 0.08)`; on carbon `0 18px 44px -14px oklch(0 0 0 / 0.65), 0 2px 6px oklch(0 0 0 / 0.35)`): modals, popovers, toasts, the featured pricing plan, a board card under the pointer or in hand, and the landing's sample ledger and ticket slip.
- **Scrim** (`oklch(0.18 0.02 260 / 0.45)`): behind modals and the mobile drawer.

Lifted sheets enter by rising 6px and fading in over 200ms on an expo ease-out (cubic-bezier(0.16, 1, 0.3, 1)); scrims fade in over 160ms. Reduced motion collapses every animation and transition to 1ms.

### Named Rules
**The Paper Weight Rule.** Three elevations exist: control, resting and lifted. No hard offset shadows, no glows, no colored shadows.

**The No Nested Sheets Rule.** Sheets sit on the desk and never inside each other. A strip placed inside a sheet drops its border, corners and shadow and becomes a ruled band.

## Shapes

Stationery with softened corners, stepped down as they nest so the curves stay concentric. Sheets, modals, popovers, toasts, chat bubbles and board trays have 12px corners; buttons, fields, nav items, filters, folder tabs, segmented tracks, numbered boxes, alerts and boxes inside a sheet have 8px; segments inside a track, small icon buttons, chips, tags, keyboard keys and skeleton bars have 6px; stamps have 5px. Full rounding belongs to seals and rails: avatars, progress rails, chart bars and legend dots, priority ticks, route-sheet bars, the unread counter and the scrollbar thumb.

Lines carry the form language. Every border is a 1px rule. A field is edged all round in Field Rule and rises on the control shadow; an empty state is a dashed blank; a modal or ruled sheet carries a 2px red head rule; the active folder tab carries a 2px red top rule and covers the rule under it, joining the page. Modals lose their bottom corners when they become phone bottom sheets. Tilt is reserved for paper in hand: the landing's ticket slip (1.25°) and a board card while it is dragged (0.6°).

### Named Rules
**The Double Line Rule.** A doubled line means final. The double frame is a stamp; the 3px double rule closes a total. Nothing else is doubled.

## Components

### Buttons
Firm and printed, risen a hair off the paper; they press down a pixel.
- **Shape:** 8px corners, a 1px border, semibold Archivo. Default 36px tall with 14px sides and 14px text; small 32px with 10px sides and 13px text; large 44px with 20px sides and 15px text; icon-only 36px square. A 16px lucide icon leads the label with an 8px gap.
- **Primary:** Logo Red fill and border with Paper on Red lettering and the control shadow; Pressed Red on hover. One per view, last among the letterhead actions at the top right ("Nuevo proyecto", "Nuevo ticket").
- **Hover / Focus:** 150ms color and shadow transitions, a 1px press when active (the control shadow drops), the Focus Blue outline on keyboard focus, 50% opacity when disabled, a spinner and a busy state while loading.
- **Secondary:** Raised White fill, black-ink label, a Field Rule border and the control shadow; hover strengthens the border to Strong Rule and sinks the fill to the well. Page-level secondary actions ("Exportar PDF", "Editar", "Miembros").
- **Danger:** an outline in Stamp Red at 50% with red lettering until the pointer is on it, then a red fill with paper lettering. At rest it never looks like the primary.
- **Ghost:** no fill or border, Ink 2 label; hover lays a 6% ink wash.

### Segmented Controls and Filters
- **Segmented control:** a recessed track (Black Ink at 6% over paper, 8px corners, 2px inside). Options are medium Ink 2 text, 13px (12px in sheet heads); the chosen one is raised onto the track: Raised White, black ink, the control shadow, 6px corners. Used by the view switcher ("Lista", "Fichas", "Bandejas") and the sheet-head scopes ("Abiertos", "Completados", "Todos"; "Para mí", "Equipo").
- **Filters:** the status filters with their counts are 28px chips with 8px corners and a 6% ink wash on hover. The active filter takes the current-place wash: Logo Red at 10%, a Pressed Red label and its count at 75%.

### Status Stamps
The signature mark of a status: a framed rubber stamp.
- **Style:** uppercase condensed bold Archivo in the status ink pressed deeper (80% ink, 20% Black Ink, mixed in OKLab) over a 12% tint of the same ink, 5px corners, the outer frame at 45% of the ink. The 20px stamp frames with 1.5px plus an inner gap of paper and a fine inner ink line: the double frame. The large 28px ticket stamp keeps the double frame on a 2px frame. The 18px stamp for dense rows has a single 1px frame.
- **Labels:** the Spanish status names ("Pendiente de aprobación", "En desarrollo", "Finalizado").
- **Motion:** the stamp lands, from 1.35 times its size and -4° to rest over 260ms on the expo ease-out, only right after a status change, never on page load.

### Priority Ticks
- Three 3px ticks with rounded ends rising 6, 10 and 14px, 2px apart, filled up to the level in the priority ink with the rest in Rule: three red ticks for "Crítica" and "Alta", two ochre for "Moderada" and "Media", one graphite for "Menor" and "Baja". The word follows at 13px and takes the ink only at the top level. Dense rows show the meter alone, named for screen readers.

### Sheets
- **Corner Style:** 12px.
- **Background:** Bond Paper on the desk.
- **Shadow Strategy:** the layered resting sheet (see Elevation & Depth).
- **Border:** a 1px rule; a sheet that opens a form may carry a 2px Logo Red head rule.
- **Internal Padding:** 12, 16 or 24px. A sheet head is a 14px semibold title with an optional 12px Ink 3 note, 10px by 16px over a rule, with any scope toggle at its right. A sheet foot is a well strip over a rule holding a 13px link with a lucide chevron ("Abrir Tareas").

### Inputs / Fields
- **Style:** a form cell lifted a hair: paper fill, a 1px Field Rule edge all round, 8px corners, the control shadow, 8px by 10px padding, 14px text, an Ink 3 placeholder. The caption label sits 6px above (with a Stamp Red asterisk when required); a 12px Ink 3 hint sits below.
- **Focus:** the border turns Focus Blue with a 3px Focus Blue ring at 22%, and no outline. Hover strengthens the whole border to Strong Rule.
- **Error / Disabled:** an invalid field takes a Stamp Red border and a 13px medium red message below, linked to the field. A disabled field sinks to the well with Ink 3 text.
- **Select and textarea:** the select keeps the native control inside the field cell with a 15px lucide chevron at its right; the textarea starts at 88px with a relaxed line height and resizes vertically.

### Navigation
- **Sidebar:** paper ground, divided from the desk by a rule; 32px items with 8px corners, 14px Ink 2 labels and 16px Ink 3 icons; hover lays a 5% ink wash. The active item takes the current-place wash: Logo Red at 10%, a semibold Pressed Red label and a Logo Red icon. Caption group names ("Trabajo", "Canales"); a secondary "Nuevo proyecto" button and the help links sit at the foot.
- **Folder tabs:** 13px medium labels with 8px top corners. The active tab is the sheet in front: paper fill, ruled sides, a 2px red top rule and a bottom edge that covers the rule, joining the page below. Inactive tabs are transparent Ink 2 with a 4% ink wash on hover; counts follow in 12px tabular figures. Arrow keys, Home and End move between tabs.
- **Top bar:** see Layout. The unread counter is a Logo Red seal ringed in paper, with 11px bold figures.
- **Mobile:** the drawer, and the logo mark in place of the wordmark.

### Ruled Ledger
The register every money surface is built from: Inicio's "Libro de cotizaciones", the project and client registers, and the landing preview.
- A sheet with caption column heads on the well, then one line per record divided by rules. The name cell carries a 14px medium name and a 12px Ink 3 context line. Amounts are right-aligned Red Hat Mono in black ink in the es-DO format ("US$12,400.00", "RD$58,000.00"): either one column per currency ("USD", "DOP") or one line per currency in a single "Precio" cell, US$ before RD$. A currency with nothing shows an Ink 3 dash.
- The footer row sits under the 3px double ink rule: "Total" in semibold, totals in semibold mono, one line per currency, never summed across currencies.
- Sortable heads are caption buttons with an 11px lucide arrow; the sorted head darkens to ink. Row hover lays a 2 to 3% ink wash and the selected record takes the 8% Focus Blue tint; a clickable row opens its record while the links and buttons inside it keep their own click.
- Loading shows skeleton rows: 7% ink bars with 6px corners, the first 40% wide, the last pushed right.

### Numbered Box
- The box in the top-right corner of a printed form: paper fill, a Strong Rule frame at 60%, 8px corners, 6px by 12px, right-aligned, a caption label over a 15px semibold mono figure. On a project's letterhead it is the "Precio" box. On a ticket, a smaller box (14px figure) holds the ticket's sequence above the large stamp.

### Summary Strip
- One sheet ruled into equal boxes: a caption, a 24px semibold tabular figure (or one mono line per currency at 18px) and a 12px Ink 3 note, with red figures only for alerts. It stacks with horizontal rules until 36rem, then stands its boxes side by side with vertical rules. It lives inside a sheet under its head (a client's "Abierto", "Completado" and "Total cotizado"), never as the first block of a page.

### Route Sheet
- A ticket's status path as five equal segments, "Análisis" to "Completado": 4px rounded bars, black ink for the current step, ink at 45% with a lucide check for passed steps, Rule for the steps ahead; 11px labels (12px once the ticket panel is 36rem wide), the current one semibold. Each segment is a button that moves the ticket to that step.

### Board Trays
- The "Bandejas" view: 18rem columns, each headed by an 8px dot in the status ink, a 13px semibold title and its count. A column is a ruled tray (shelf at 60%, 1px rule, 12px corners, 8px inside) that sinks to the well when a card is dragged over it. Cards are small sheets (12px padding) with the mono ticket number on top; hover strengthens the border and lifts the card, a selected card takes a Focus Blue frame, and a dragged card tilts.

### Modals
- A form sheet lifted over the desk: paper, a 2px red head rule and the lifted shadow over the 45% scrim. The head holds an 18px title, a 13px Ink 2 line on what the form does, an optional numbered box and a ghost close. The body runs 16px by 20px and scrolls within 92% of the viewport; the foot puts the actions at the right on a well strip over a rule. Widths are 28, 32, 42 or 56rem; on phones it is a bottom sheet. Focus is trapped and returned, and Escape closes only the top dialog. Confirmations put a focused cancel button first and the confirm button as danger.

### Avatars
- Initials on a round seal in the person's own hue (see People and Data): a pale seal with deep semibold initials, no ring. Sizes are 22, 28, 32 and 40px, with 11px initials at the two smallest. Photos are round with a 1px rule ring.

### Empty States
- A blank form that says what goes here and how it fills: a dashed Strong Rule edge at 50%, the well at 60%, 8px corners, a 22px Ink 3 lucide icon (18px when compact), a 15px semibold title, up to 65ch of Ink 2 text and an optional action.

### Toasts
- Paper slips at the bottom right: paper, ink, a 1px rule, 12px corners, the lifted shadow, 14px text, 10px by 12px, up to 420px wide. The success icon is green and the error icon red; errors stay for 6 seconds.

### Charts
- Status bars and their legends use the office inks; quantity bars use Data Cerulean. Bars and their tracks are fully rounded, and legends are dots. Every bar sits beside its number, so color is never the only code.

### Icons
- lucide-react at 14 to 18px beside a text label and hidden from screen readers, Ink 3 at rest. Every chevron, back arrow and sort arrow comes from the same set.

## Do's and Don'ts

### Do:
- **Do** set every surface as a bond sheet on the desk: paper fill, 1px rule, 12px corners, the layered resting shadow, 20px of desk between sheets.
- **Do** keep one Logo Red primary action per view, last among the letterhead actions at the top right.
- **Do** set every amount in Red Hat Mono with tabular figures, right-aligned, in the es-DO format ("US$12,400.00", "RD$58,000.00"), one column or one line per currency, US$ before RD$.
- **Do** close a money register with a footer row under the 3px double ink rule, totals in semibold mono, one line per currency.
- **Do** show every status as a stamp from the fixed office-ink map, and every priority as the three-tick meter.
- **Do** label fields, column heads, nav groups and numbered boxes with the 11px uppercase caption in Ink 3.
- **Do** fold secondary columns into the name cell below 640px so the amount stays in view, and let project names break anywhere.
- **Do** size dense registers with container queries, so a list keeps its subject column beside a side panel.
- **Do** take every color from the semantic variables (desk, paper, raised, shelf, well, the inks, the rules, the office inks, the data hue, the person hues), so carbon paper follows on its own.
- **Do** raise the chosen segment onto its track (Raised White, the control shadow), and mark the current place, a nav item or a filter, with the 10% Logo Red wash.
- **Do** mark the selected record with the 8% Focus Blue tint, the same in every list.
- **Do** step corners down as they nest: 12px sheet, 8px control, 6px inner, 5px stamp.
- **Do** use lucide icons at 14 to 18px beside a text label, Ink 3 at rest, including every chevron and back arrow.
- **Do** land the stamp animation only right after a status change, and let reduced motion collapse every animation.

### Don't:
- **Don't** open a page with white cards, indigo accents or a row of stat tiles; a summary strip lives inside a sheet, under its head.
- **Don't** print amounts in red or in Archivo, and don't set counts or calendar dates in mono.
- **Don't** add amounts in different currencies, in a total or anywhere else, without an explicit conversion.
- **Don't** use Logo Red inside the app for a status, a chart series or decoration, or as a wash anywhere but the current place; status red means cancelled or overdue only.
- **Don't** put a caption above a section heading as a kicker or eyebrow; captions name boxes.
- **Don't** set any text below 11px.
- **Don't** add elevation beyond control, resting and lifted: no hard offset shadows, glows or colored shadows. The stamp's inner double frame is a border, not elevation.
- **Don't** nest a sheet inside a sheet.
- **Don't** use arrow or bullet glyphs (←, →, ›, ✓) as icons or link pointers. Spanish «comillas», and a › naming a menu path inside running text, are typography, not icons.
- **Don't** give a component theme-specific colors; only the logo wordmark is treated per theme.
- **Don't** mix an ink toward a neutral in OKLCH: the hue swings along the short arc (ochre turned red). Mix in OKLab.
- **Don't** paint the sidebar grey; it is paper, like the top bar.
- **Don't** give avatars or chart bars a status ink or the logo red; people and quantities have their own hues.
- **Don't** show real client data on a public page; the landing preview is labelled sample data ("Datos de ejemplo").
