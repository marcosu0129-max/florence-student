# Florence Student — Web Design Specification

> **Design Style**: Hand-drawn narrative with pushpin decorations
> **Source**: Based on HTML prototype examples with 5 unique pushpin/card styles

---

## 1. Visual Identity

### Color Palette (Tailwind CSS Custom Colors)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-warm-white` | `#fdf8f8` | Global warm-white background |
| `surface-paper` | `#f1edec` | Card backgrounds, slightly darker paper |
| `surface` | `#fcf8f8` | Light surface, very close to bg |
| `surface-container` | `#f1edec` | Container level |
| `surface-container-low` | `#f7f3f2` | Lowest container |
| `surface-container-high` | `#ebe7e7` | Highest container |
| `surface-dim` | `#ddd9d8` | Dimmed surface |
| `surface-container-lowest` | `#ffffff` | White surface |
| `surface-container-highest` | `#e5e2e1` | Highest surface |
| `primary` | `#000000` | Deep pencil black — borders, text |
| `primary-fixed` | `#e3e2e2` | Light primary variant |
| `primary-fixed-dim` | `#c7c6c6` | Dimmed primary |
| `secondary` | `#2e5ea2` | Florence blue — CTAs, links |
| `secondary-fixed` | `#d6e3ff` | Light blue background |
| `secondary-container` | `#89b4fe` | Blue container |
| `on-secondary` | `#ffffff` | White on secondary |
| `on-secondary-fixed` | `#001b3d` | Dark on secondary-fixed |
| `on-secondary-fixed-variant` | `#0a4689` | Variant on secondary-fixed |
| `on-secondary-container` | `#064487` | Dark on secondary-container |
| `pencil-text` | `#1c1b1b` | Pencil text color |
| `on-surface` | `#1c1b1b` | On surface text |
| `on-surface-variant` | `#444748` | Muted text, labels |
| `outline` | `#747878` | Borders, dividers |
| `outline-variant` | `#c4c7c7` | Light outline |
| `star-yellow` | `#FFD60A` | Star rating color |
| `fluorescent-green` | `#30D158` | Success / low difficulty |
| `correction-red` | `#FF453A` | Danger / high difficulty |
| `error` | `#ba1a1a` | Error state |
| `error-container` | `#ffdad6` | Error background |
| `on-error` | `#ffffff` | White on error |
| `on-error-container` | `#93000a` | Dark on error container |
| `sticky-note-yellow` | `#fdf9e6` | Sticky note background |
| `tape-beige` | `#e8dcc8` | Tape decoration color |
| `tertiary-fixed` | `#e8e1e0` | Tertiary light |
| `tertiary-fixed-dim` | `#ccc5c4` | Tertiary dimmed |
| `tertiary-container` | `#1e1b1b` | Dark tertiary |
| `inverse-surface` | `#313030` | Inverse surface |
| `inverse-on-surface` | `#f4f0ef` | Inverse on surface |

### Fonts

- **Kalam** (Google Fonts) — Hand-drawn feel for all headings, titles, section headers
- **Inter** (Google Fonts) — Clean, readable for body text, labels, captions

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Display/Welcome | Kalam | 700 | 28px |
| Headline Page | Kalam | 700 | 24px |
| Headline Section | Kalam | 700 | 20px |
| Title Card | Inter | 600 | 16px |
| Body Main | Inter | 400 | 14px |
| Label Caption | Inter | 400 | 12px |
| Label Badge | Inter | 700 | 11px |

---

## 2. Core Decorative Elements

### 2.1 Pushpin SVGs (Main Decoration)

All pushpins are inline SVG elements positioned absolutely on cards. Each has a metallic pin and a colored head.

**Base pushpin structure:**
```html
<svg class="pushpin-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Pin needle -->
  <polygon fill="#9ca3af" points="48,65 52,65 50,95"/>
  <!-- Bottom cap -->
  <path d="M 30 65 Q 50 75 70 65 L 62 50 Q 50 55 38 50 Z" fill="currentColor" style="filter: brightness(0.85)"/>
  <ellipse cx="50" cy="50" fill="currentColor" rx="20" ry="7"/>
  <!-- Pin body -->
  <path d="M 40 50 L 43 20 L 57 20 L 60 50 Z" fill="currentColor" style="filter: brightness(0.95)"/>
  <!-- Pin top -->
  <ellipse cx="50" cy="20" fill="currentColor" rx="14" ry="5" style="filter: brightness(1.15)"/>
  <ellipse cx="50" cy="5" fill="white" opacity="0.2" rx="4" ry="1.5"/>
</svg>
```

**CSS:**
```css
.pushpin-svg {
  width: 38px;
  height: 38px;
  position: absolute;
  z-index: 30;
  pointer-events: none;
  filter: drop-shadow(2px 4px 3px rgba(0,0,0,0.25));
}
.pin-red { color: #FF453A; }
.pin-blue { color: #2e5ea2; }
.pin-yellow { color: #FFD60A; }
.pin-green { color: #30D158; }
```

**Positioning:**
- Card pushpins: `-top-4` or `-top-6`, `left-[35%]` to `left-[65%]`, various rotation angles
- Page title pushpins: positioned to the left of headings

### 2.2 Wobbly Border Utility

```css
.wobbly-border {
  border-radius: 2% 98% 3% 97% / 97% 4% 96% 3%;
}
.wobbly-border-alt {
  border-radius: 98% 2% 97% 3% / 4% 97% 3% 96%;
}
```

### 2.3 Hard Shadow System

```css
/* Card shadow — 3px hard offset */
.card {
  box-shadow: 3px 3px 0px 0px rgba(0,0,0,0.12);
}

/* Button shadow — 4px hard offset, darker */
.btn-primary {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.35);
}

/* Pressed state */
.btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px 0px rgba(0,0,0,0.35);
}
```

### 2.4 Card Rotations

Each card gets a slight rotation for organic feel:
- Card 1: `rotate-[1deg]`
- Card 2: `rotate-[-1deg]`
- Card 3: `rotate-[0.5deg]`
- Card 4: `rotate-[-1.5deg]`

On hover: cards straighten to `rotate-0` with `hover:rotate-0`.

### 2.5 Sticky Note Style

Used for tips, advice sections, and empty states:

```html
<div class="bg-sticky-note-yellow border-l-4 border-l-fluorescent-green border-y-[1.5px] border-r-[1.5px] border-primary p-3 -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
```

Variants:
- Green border: tips/advice
- Red border: warnings
- Yellow border: general notes

### 2.6 Badge/Tag System

```html
<!-- Required badge -->
<span class="bg-surface border border-primary px-badge-padding-x py-badge-padding-y rounded flex items-center gap-1">
  <span class="material-symbols-outlined text-[14px] text-fluorescent-green" style="font-variation-settings: 'FILL' 1;">check_circle</span>
  <span class="font-label-badge text-label-badge text-on-surface-variant uppercase">Obbligatorio</span>
</span>

<!-- Difficulty badge -->
<span class="bg-surface border border-primary px-badge-padding-x py-badge-padding-y rounded flex items-center gap-1">
  <span class="font-label-badge text-label-badge text-on-surface-variant uppercase">Difficoltà</span>
  <span class="material-symbols-outlined text-[14px] text-correction-red" style="font-variation-settings: 'FILL' 1;">star</span>
  <!-- stars -->
</span>

<!-- CFU badge -->
<span class="shrink-0 font-label-badge text-label-badge bg-fluorescent-green/30 border-[1.5px] border-primary px-2 py-1 rounded-sm rotate-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">12 CFU</span>
```

---

## 3. Component Patterns

### 3.1 Top Navigation Bar

```html
<header class="bg-surface dark:bg-surface-dim w-full border-b-[1.5px] border-primary dark:border-primary-fixed -rotate-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.12)] z-50 relative sticky top-0">
  <div class="flex justify-between items-center px-gutter py-4 max-w-[960px] mx-auto">
    <a class="font-display-welcome text-display-welcome text-secondary ...">UNIFI Studenti</a>
    <nav class="hidden md:flex gap-6 items-center">
      <a class="...">Corsi</a>
      <a class="...">Docenti</a>
      <a class="text-secondary underline decoration-wavy decoration-2 underline-offset-4 ...">Recensioni</a>
      <a class="...">Mappa</a>
      <a class="...">Bacheca</a>
    </nav>
    <div class="flex items-center gap-4">
      <button>...</button>
    </div>
  </div>
</header>
```

### 3.2 Course Card (Notebook Style)

```html
<article class="bg-surface border-[1.5px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.12)] p-card-padding relative flex flex-col gap-4 wobbly-border rotate-[1deg] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] transition-all cursor-pointer group">
  <!-- Pushpin -->
  <svg class="pushpin-svg pin-yellow -top-4 left-[35%] rotate-6 ...">
  <header class="flex justify-between items-start gap-2">
    <h2 class="font-headline-section text-headline-section text-primary leading-tight ...">Course Name</h2>
    <span class="shrink-0 font-label-badge ... rotate-2">12 CFU</span>
  </header>
  <div class="flex flex-wrap gap-2">
    <span class="...">1° Anno</span>
    <span class="...">Obbligatorio</span>
  </div>
  <p class="...">Description...</p>
  <footer class="flex items-center gap-3 pt-4 border-t-[1.5px] border-outline-variant border-dashed">
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-container to-secondary ...">MR</div>
    <div class="flex flex-col">
      <span class="font-label-caption ...">Docente</span>
      <span class="font-title-card ...">Mario Rossi</span>
    </div>
  </footer>
</article>
```

### 3.3 Sticky Note Course Card

```html
<article class="bg-sticky-note-yellow border-[1.5px] border-primary border-l-[6px] border-l-fluorescent-green shadow-[4px_4px 0px 0px rgba(0,0,0,0.12)] p-card-padding relative flex flex-col gap-4 rotate-[-1deg] ...">
  <svg class="pushpin-svg pin-green -top-6 left-[65%] rotate-[-15deg] ...">
  <!-- content -->
</article>
```

### 3.4 Professor Row (Directory Style)

```html
<div class="flex items-start gap-4 p-4 hover:bg-surface-container transition-colors group relative cursor-pointer bg-white organic-border">
  <img class="absolute -top-5 left-[54%] matte-pushpin pushpin-blue -rotate-3 ..." src="pushpin-url">
  <div class="w-12 h-12 rounded-full border-[1.5px] border-primary shadow-[2px_2px 0px 0px rgba(0,0,0,0.12)] gradient-purple-avatar ...">MR</div>
  <div class="flex-grow flex flex-col md:flex-row justify-between gap-4">
    <div class="flex flex-col gap-1">
      <h3 class="font-title-card text-title-card text-primary group-hover:text-secondary ...">Prof. Mario Rossi</h3>
      <p class="font-label-caption ...">Dipartimento di Ingegneria...</p>
      <div class="flex flex-wrap gap-2 mt-2">
        <span class="bg-white border-[1.5px] border-outline-lead ...">LM-92</span>
      </div>
    </div>
    <div class="flex items-center gap-2 self-start md:self-center">
      <span class="font-label-badge text-label-badge text-secondary flex items-center gap-1 bg-secondary-fixed ...">
        <span class="material-symbols-outlined ..." style="font-variation-settings: 'FILL' 1;">star</span> 4.5
      </span>
      <span class="material-symbols-outlined ...">chevron_right</span>
    </div>
  </div>
</div>
```

### 3.5 Review Card

```html
<article class="bg-surface-paper border-[1.5px] border-primary p-card-padding shadow-[3px_3px 0px 0px rgba(0,0,0,0.12)] relative rotate-[1deg] hover:rotate-0 transition-transform">
  <svg class="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 z-10 rotate-[15deg] text-star-yellow" ...>
  <div class="flex items-center gap-4 mb-4">
    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-container to-secondary ...">M</div>
    <div>
      <h3 class="font-title-card ...">Marco T.</h3>
      <p class="font-label-caption ...">12 Ottobre 2023</p>
    </div>
  </div>
  <div class="flex flex-wrap gap-3 mb-4">
    <!-- Difficulty, Voto, Docenza badges -->
  </div>
  <p class="...">Review text...</p>
  <!-- Sticky note tip -->
  <div class="bg-sticky-note-yellow border-l-4 border-l-fluorescent-green ...">
    <h4 class="..."><span class="material-symbols-outlined ...">lightbulb</span> Consigli per l'esame</h4>
    <p class="...">Tip text...</p>
  </div>
  <div class="flex justify-end mt-4 pt-4 border-t border-outline-variant border-dashed">
    <button class="flex items-center gap-1 ...">
      <span class="material-symbols-outlined ...">thumb_up</span> Utile (12)
    </button>
  </div>
</article>
```

### 3.6 Rating Dashboard Cards

```html
<!-- Sticky note 1 -->
<div class="bg-sticky-note-yellow border-l-[4px] border-l-star-yellow border-y-[1.5px] border-r-[1.5px] border-primary hard-shadow p-card-padding relative transform -rotate-2 hover:-rotate-1 transition-transform">
  <div class="thumbtack thumbtack-red" style="..."></div>
  <h3 class="font-title-card text-title-card text-primary mb-2 flex items-center gap-2">
    <span class="material-symbols-outlined">trending_up</span> Difficoltà
  </h3>
  <div class="flex items-end gap-2">
    <span class="font-display-welcome text-display-welcome text-error">4.2</span>
    <span class="font-label-caption ...">/ 5</span>
  </div>
</div>
```

### 3.7 Profile/Stats Cards

```html
<!-- Stat card with tape -->
<div class="bg-sticky-note-yellow border-l-4 border-fluorescent-green border-[1.5px] border-y-primary border-r-primary p-6 rounded hard-shadow rotate-2 group-hover:-rotate-1 transition-transform">
  <svg class="pushpin-svg ...">...</svg>
  <div class="flex items-center gap-2 mb-2">
    <span class="material-symbols-outlined text-primary">school</span>
    <h3 class="font-headline-section ...">Corsi Superati</h3>
  </div>
  <p class="font-display-welcome text-display-welcome text-secondary text-center mt-4">12 / 24</p>
</div>
```

### 3.8 Form Inputs (Hand-drawn style)

```html
<!-- Hand-drawn input with underline -->
<div class="flex flex-col">
  <label class="font-headline-section text-[18px] text-on-surface-variant mb-1">Nome Completo</label>
  <input class="hand-input font-body-main text-body-main text-pencil-text w-full max-w-sm" type="text" value="Mario Rossi"/>
</div>

<style>
  .hand-input {
    border: none;
    border-bottom: 1.5px solid #747878;
    background: transparent;
    border-radius: 0;
    padding: 4px 0;
  }
  .hand-input:focus {
    outline: none;
    border-bottom-color: #1c1b1b;
    box-shadow: none;
  }
</style>
```

### 3.9 Toggle Switch (Hand-drawn)

```html
<div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
  <input class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-2 border-[#1c1b1b] appearance-none cursor-pointer z-10 top-[-2px] right-0 transition-all duration-300" id="email-toggle" name="toggle" type="checkbox" checked/>
  <label class="toggle-label block overflow-hidden h-5 rounded-full bg-secondary cursor-pointer border-[1.5px] border-[#1c1b1b]" for="email-toggle"></label>
</div>
```

---

## 4. Page-Specific Details

### 4.1 Welcome Page (P1)
- 5-page horizontal swipe carousel
- Brand page: book icon (Florence blue) + "Florence Student" Kalam title + "La tua guida per i corsi UNIFI"
- Feature pages with icons: star (reviews), person.2 (professors), doc (materials), heart (favorites)
- CTA: "Invia ora" primary button + "Accedi / Registrati" secondary

### 4.2 Auth Page (P2)
- Toggle between Accedi/Registrati
- Form card: white bg + 1.5px black border + 3px hard shadow + micro-rotation
- Inputs: bottom-border style (no full border)
- CTA: blue solid button with 4px hard shadow
- Note card for registration info

### 4.3 Home Page (P3)
- Welcome banner: paper card with pushpin
- Search bar: wobbly-border input
- 3 stat cards: Corsi Superati (green border), Media Voti (yellow border), Preferiti (purple border)
- Program sections: expandable blocks with pushpin header
- Course cards: grid of notebook-style cards with pushpins

### 4.4 Course Detail (P4)
- Header: sticky note with tape, course name, tags
- 3-column info bar: CFU, program, review count
- 3 rating dashboard cards: Difficoltà (red), Voto (green), Docenza (blue)
- Tab switcher: Recensioni / Materiali
- Reviews: stacked review cards
- FAB: "Scrivi recensione" button

### 4.5 Professor Pages (P8/P9)
- Search bar + department filter pills
- Professor rows with gradient avatars and pushpin accents
- Detail page: large avatar, bio sticky note, course list

### 4.6 Profile Pages (P10/P13)
- Profile header: avatar + info card with tape
- Stat cards: Favorites, Reviews, Materials
- Settings: hand-drawn inputs, toggles, danger button

---

## 5. Animation & Interaction

| Interaction | Animation |
|-------------|-----------|
| Card hover | `translateY(-2px)` + shadow deepens, 200ms |
| Card rotation | hover → `rotate-0`, 200ms |
| Button press | `translate(2px, 2px)` + shadow shrinks |
| Tab switch | underline slide, 300ms |
| Modal open | bottom sheet slide, 300ms |
| Toast | top slide-in, 2s stay, slide-out |
| Star fill | sequential fill, 50ms per star |

---

## 6. Spacing System

| Token | Value |
|-------|-------|
| `gutter` | 16px |
| `card-padding` | 16px |
| `btn-padding-x` | 24px |
| `btn-padding-y` | 12px |
| `badge-padding-x` | 8px |
| `badge-padding-y` | 6px |
| `unit` | 4px |
| `container-margin` | 16px |
| `max-width` | 960px |

---

## 7. Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-warm-white': '#fdf8f8',
        'surface-paper': '#f1edec',
        'sticky-note-yellow': '#fdf9e6',
        'tape-beige': '#e8dcc8',
        'fluorescent-green': '#30D158',
        'correction-red': '#FF453A',
        'pencil-text': '#1c1b1b',
        'star-yellow': '#FFD60A',
        // ... all colors from section 1
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'full': '9999px',
      },
      spacing: {
        'gutter': '16px',
        'card-padding': '16px',
        'btn-padding-x': '24px',
        'btn-padding-y': '12px',
        'badge-padding-x': '8px',
        'badge-padding-y': '6px',
        'unit': '4px',
        'container-margin': '16px',
      },
      fontFamily: {
        'display-welcome': ['Kalam', 'cursive'],
        'headline-page': ['Kalam', 'cursive'],
        'headline-section': ['Kalam', 'cursive'],
        'title-card': ['Inter', 'sans-serif'],
        'body-main': ['Inter', 'sans-serif'],
        'label-caption': ['Inter', 'sans-serif'],
        'label-badge': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-welcome': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-page': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-section': ['20px', { lineHeight: '1.4', fontWeight: '700' }],
        'title-card': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-main': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-caption': ['12px', { lineHeight: '1.2', fontWeight: '400' }],
        'label-badge': ['11px', { lineHeight: '1', fontWeight: '700' }],
      },
      boxShadow: {
        'hard': '3px 3px 0px 0px rgba(0,0,0,0.12)',
        'hard-heavy': '4px 4px 0px 0px rgba(0,0,0,0.35)',
        'card': '3px 3px 0px 0px rgba(0,0,0,0.12)',
        'card-hover': '6px 6px 0px 0px rgba(0,0,0,0.15)',
        'btn': '4px 4px 0px 0px rgba(0,0,0,0.35)',
        'btn-sm': '2px 2px 0px 0px rgba(0,0,0,0.1)',
        'thumbtack': '2px 4px 3px rgba(0,0,0,0.25)',
      }
    },
  },
  plugins: [],
}
```

---

*Document version: 1.0 — Based on HTML prototype examples*
*Project: Florence Student — Hand-drawn narrative style with pushpin decorations*
