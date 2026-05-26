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
43: 
44: ---
45: 
46: ## 🚀 Session 2 Accomplishments: Editor Auth, Detail Profiles, & List View
47: 
48: 1. **Secure Admin Authentication**:
49:    - Created a user credential database schema using PBKDF2 native password hashing and verification.
50:    - Implemented secure HMAC-SHA256 session token signatures written to client-side HttpOnly, Secure cookies.
51:    - Protected modify/delete API routes (`PATCH`, `POST`, `DELETE`) with session checking.
52: 2. **Profile Editor**:
53:    - Added a modern floating form within the `PersonDetail` panel allowing logged-in editors to modify first/last names, nicknames, suffixes, birth/death dates, gender, and biography notes.
54:    - Built state synchronization between the edit drawer and the D3 tree visualization, triggering an immediate update without reloading the page.
55: 3. **Indented List View**:
56:    - Created a recursive List view at `/list` mirroring the original indented genealogy document.
57:    - Added instant client-side full-text search across names, nicknames, lineage codes, and occupations.
58:    - Integrated the profile detail drawer navigation inside the list view.
59: 4. **Atomic Git History**:
60:    - Configured `.gitignore` for local SQLite databases.
61:    - Committed all architectural shifts, API protections, and layout updates in atomic, descriptive commits on the `main` branch.
62: 
63: ---
64: 
65: ## 🔮 Future Roadmap
66: 
67: 1. **Interactive Node Additions**: Let authenticated editors insert children or spouses directly on the canvas.
68: 2. **Media/Photo Upload Manager**: Build an image upload route to persist profile pictures on the server.
69: 3. **Change History Auditing**: Track editor activity to inspect family tree modifications over time.
70: 
