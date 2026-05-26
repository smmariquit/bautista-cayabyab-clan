# Vibe Coding Dev Log 🌳

Welcome to the vibe coding session for the **Domingo Bautista-Pastora Cayabyab Clan** Family Tree. This log captures the design ethos, technical choices, and incremental progress made during our pair-programming session.

---

## 🎨 Design Philosophy & Vibe

We wanted an interface that felt like a premium digital heirloom—sleek, modern, yet respectful of heritage.

- **Theme**: Premium dark mode with subtle glassmorphism and ambient glows.
- **Accents**: 
  - Gold (`#c9a96e`) for lineage headings, stats, and badges.
  - Saturated Blue (`#3b82f6`) for male ancestors/cards.
  - Soft Pink (`#ec4899`) for female ancestors/cards.
- **Visuals**: Symmetrical, balanced family nodes centered on their hierarchical coordinate, resolving all overlapping.

---

## 🛠️ The Tech Stack

- **Framework**: Next.js 16 (App Router + React)
- **Database**: SQLite (local `dev.db`) managed via **Prisma 7**
- **Prisma Driver Adapter**: `@prisma/adapter-better-sqlite3` combined with standard `prisma-client-js`
- **Visualization Engine**: **D3.js** for custom, fluid SVG layout generation

---

## 🚀 Accomplishments So Far

1. **Genealogy Parsing**:
   - Transcribed 53 clan members across 5 generations from scanned PDF source records.
2. **Database & Schema Design**:
   - Modelled `Person`, `Partnership` (marriages), and `ParentChild` relations inside Prisma schema.
   - Built a direct seeding pipeline using `better-sqlite3` to instantiate the family tree.
3. **Overlapping Node Layout Fix**:
   - Refactored D3 tree layout to automatically allocate spacing (`LAYOUT_W`) for married couple nodes.
   - Restructured coordinates so card pairs draw symmetrically around parent lines, resolving overlapping issues.
4. **First-Gen Completeness**:
   - Added all 9 children of Roberto Gundayao and Anacleta Junio (**Florentina, Genoveva, Leonila, Marcela, Mariano, Marcelino, Rufina, Placido, and Victorina Gundayao**) to keep the tree accurate to source genealogy.
   - Added lineage code badges (like `1.s` for spouses) to all cards.

---

## 🔮 Next Features in the Queue

1. **Authentication**: Secure write-access for clan editors.
2. **Edit Features**: Inline detail modifications, spouse/child additions, and photo uploads.
3. **List View**: A search-optimized list layout resembling the initial transcribed lineage document.
