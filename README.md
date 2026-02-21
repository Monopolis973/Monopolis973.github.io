# spencerhill.me

Personal website. Built as a static site for GitHub Pages.

---

## Quick Setup

1. **Create a GitHub repo** named `spencerhill.github.io` (or any name — but user-page repos auto-deploy at `username.github.io`).
2. **Push all these files** to the repo's `main` branch.
3. In your repo settings → **Pages**, set the source to `main` branch, root directory.
4. **Edit `config.js`** — set `github_username` and `github_repo` to your actual values.
5. **Add your custom domain** (`spencerhill.me`) in the Pages settings. The `CNAME` file is already included.
6. At your DNS provider, add an `A` record pointing to GitHub's IPs (or a `CNAME` pointing to `spencerhill.github.io`). GitHub's IPs are in their docs.

---

## Adding a New Post

1. Create a new `.md` file in the `posts/` folder.
2. Start the file with front-matter (optional but recommended):

```markdown
---
title: My Post Title
date: 2024-08-01
description: A short tagline shown on the list page
---

Your content here...
```

3. Commit and push. The post automatically appears on the Writings page.

**That's it.** No build step, no config change needed.

---

## Adding a New Poem

Same as above, but put the file in `poems/` — it will show up on the Poetry page.

---

## Editing Site Content

| What to change | Where |
|---|---|
| Your name, nav links | `config.js` → `site_name`, `nav` |
| Friends list | `config.js` → `friends` array |
| Projects list | `config.js` → `projects` array |
| About Me text | `about.html` → the `<div class="post-body">` section |

---

## Chalk Drawings

- Click **"draw on board"** in the bottom-right to enter drawing mode.
- Pick a chalk color, adjust brush size, or select the eraser.
- **Eraser:** single click = chalk dust effect; click-and-hold = actually erase.
- Press **Escape** to exit drawing mode.
- Your drawings are saved in `localStorage` per-page, so they persist across visits (on your browser only). Other visitors see a clean board.
- Click **"clear my drawings"** to erase your saved state.

### Custom Initial Chalk Markings (Per Page)

Each page has a `drawInitialMarkings` call at the bottom that runs only when a visitor has **no saved state** for that page. Edit these to add decorative annotations — circles around words in a poem, underlines, arrows, etc.

Example for `poem.html` — checking which poem is loaded and annotating it:

```html
<script>
window.drawInitialMarkings(function(ctx, canvas) {
  const file = new URLSearchParams(window.location.search).get("file");
  if (file === "cartography.md") {
    // Red circle — position by trial and error in px
    ctx.strokeStyle = "rgba(212,96,96,0.7)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(180, 340, 45, 14, -0.1, 0, Math.PI * 2);
    ctx.stroke();
  }
});
</script>
```

> **Note:** Initial markings only appear for visitors who haven't drawn on that page. Once a visitor makes their own marks and clears them, the initial markings reappear.

---

## File Structure

```
/
├── index.html          ← home page
├── writings.html       ← post list
├── post.html           ← individual post viewer
├── poetry.html         ← poem list
├── poem.html           ← individual poem viewer
├── about.html          ← about page (edit HTML directly)
├── projects.html       ← auto-populated from config.js
├── friends.html        ← auto-populated from config.js
├── config.js           ← ✏️  MAIN CONFIGURATION FILE
├── CNAME               ← custom domain
├── css/
│   └── main.css
├── js/
│   ├── shell.js        ← nav + toolbar injection
│   ├── chalkboard.js   ← drawing engine
│   └── posts.js        ← markdown loader
├── posts/
│   ├── on-writing-things-down.md
│   └── ...             ← add .md files here
└── poems/
    ├── still-life-with-unread-book.md
    └── ...             ← add .md files here
```
