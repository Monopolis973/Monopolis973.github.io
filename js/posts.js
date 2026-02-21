/* ============================================================
   posts.js  —  loads post/poem listings from GitHub API
   and renders individual markdown posts
   ============================================================ */

(function () {
  "use strict";

  const { github_username, github_repo } = SITE_CONFIG;

  /**
   * Fetch directory listing from GitHub API.
   * Works for public repos without an auth token (60 req/hr).
   */
  async function listFiles(folder) {
    const url = `https://api.github.com/repos/${github_username}/${github_repo}/contents/${folder}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const files = await res.json();
    return files.filter(f => f.name.endsWith(".md") && f.type === "file");
  }

  /**
   * Fetch raw markdown content for a file by its download_url.
   */
  async function fetchRaw(downloadUrl) {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error("Could not fetch file");
    return res.text();
  }

  /**
   * Extract front-matter from markdown (simple YAML-ish subset).
   * Supports: title, date, description, tags
   * Returns { meta, body }
   */
  function parseFrontMatter(raw) {
    const fm    = {};
    let body    = raw;

    if (raw.startsWith("---")) {
      const end = raw.indexOf("---", 3);
      if (end !== -1) {
        const block = raw.slice(3, end).trim();
        body = raw.slice(end + 3).trim();
        for (const line of block.split("\n")) {
          const colon = line.indexOf(":");
          if (colon === -1) continue;
          const key = line.slice(0, colon).trim();
          const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
          fm[key] = val;
        }
      }
    }
    return { meta: fm, body };
  }

  /**
   * Sort files: try to parse date from front-matter or filename.
   * Falls back to alphabetical.
   */
  function sortFiles(files, metas) {
    return files.slice().sort((a, b) => {
      const da = metas[a.name]?.date || a.name;
      const db = metas[b.name]?.date || b.name;
      return db.localeCompare(da);
    });
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Render a list of posts/poems into `containerEl`.
   * folder: "posts" | "poems"
   * viewerPage: "post.html" | "poem.html"
   */
  window.renderPostList = async function (containerEl, folder, viewerPage) {
    containerEl.innerHTML = `<p class="loading">loading…</p>`;
    try {
      const files = await listFiles(folder);
      if (!files.length) {
        containerEl.innerHTML = `<p class="chalk-dim">Nothing here yet.</p>`;
        return;
      }

      // Fetch front-matter for each file (in parallel, capped)
      const metaMap = {};
      await Promise.all(files.map(async f => {
        try {
          const raw = await fetchRaw(f.download_url);
          const { meta } = parseFrontMatter(raw);
          metaMap[f.name] = meta;
        } catch { metaMap[f.name] = {}; }
      }));

      const sorted = sortFiles(files, metaMap);

      const ul = document.createElement("ul");
      ul.className = "post-list";

      for (const f of sorted) {
        const meta  = metaMap[f.name] || {};
        const title = meta.title || f.name.replace(/\.md$/, "").replace(/-/g, " ");
        const date  = meta.date  || "";
        const desc  = meta.description || "";

        const li  = document.createElement("li");
        const href = `${viewerPage}?file=${encodeURIComponent(f.name)}`;

        li.innerHTML = `
          <a class="post-link" href="${href}">${escHtml(title)}</a>
          ${date ? `<span class="post-meta">${escHtml(date)}${desc ? " — " + escHtml(desc) : ""}</span>` : ""}
        `;
        ul.appendChild(li);
      }

      containerEl.innerHTML = "";
      containerEl.appendChild(ul);

    } catch (err) {
      containerEl.innerHTML = `
        <p class="error-msg">Couldn't load ${folder} from GitHub.<br>
        <small>Make sure <code>github_username</code> and <code>github_repo</code> in <code>config.js</code> are correct. (${err.message})</small></p>
      `;
    }
  };

  /**
   * Render an individual post/poem into the page.
   * Reads ?file= query param.
   * folder: "posts" | "poems"
   * bodyClass: "post-body" | "poem-body"
   */
  window.renderPost = async function (folder, bodyClass) {
    const params   = new URLSearchParams(window.location.search);
    const filename = params.get("file");
    const titleEl  = document.getElementById("post-title");
    const metaEl   = document.getElementById("post-meta");
    const bodyEl   = document.getElementById("post-body");

    if (!filename) {
      if (titleEl) titleEl.textContent = "Not found";
      if (bodyEl)  bodyEl.textContent  = "No file specified.";
      return;
    }

    if (bodyEl) bodyEl.innerHTML = `<p class="loading">loading…</p>`;

    try {
      // Fetch the raw file directly (works on GitHub Pages if same repo)
      // Primary: relative path (works when the HTML is in the same repo)
      // Fallback: GitHub raw content URL
      let raw;
      try {
        const rel = await fetch(`${folder}/${filename}`);
        if (rel.ok) { raw = await rel.text(); }
        else { throw new Error("relative fetch failed"); }
      } catch {
        const rawUrl = `https://raw.githubusercontent.com/${github_username}/${github_repo}/main/${folder}/${filename}`;
        const res    = await fetch(rawUrl);
        if (!res.ok) throw new Error(`File not found: ${filename}`);
        raw = await res.text();
      }

      const { meta, body } = parseFrontMatter(raw);

      if (titleEl) titleEl.textContent = meta.title || filename.replace(/\.md$/, "").replace(/-/g, " ");
      if (metaEl)  metaEl.textContent  = [meta.date, meta.description].filter(Boolean).join(" — ");
      document.title = (meta.title || filename) + " — Spencer Hill";

      if (bodyEl) {
        bodyEl.className = bodyClass;
        // Use marked.js (loaded via CDN in HTML) to render markdown
        if (typeof marked !== "undefined") {
          bodyEl.innerHTML = marked.parse(body);
        } else {
          // Fallback: very simple renderer
          bodyEl.innerHTML = simpleMarkdown(body);
        }
      }

    } catch (err) {
      if (titleEl) titleEl.textContent = "Error";
      if (bodyEl)  bodyEl.innerHTML = `<p class="error-msg">${err.message}</p>`;
    }
  };

  // ── Tiny markdown fallback ───────────────────────────────
  function simpleMarkdown(md) {
    return md
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/^######\s+(.*)$/gm,"<h6>$1</h6>")
      .replace(/^#####\s+(.*)$/gm,"<h5>$1</h5>")
      .replace(/^####\s+(.*)$/gm,"<h4>$1</h4>")
      .replace(/^###\s+(.*)$/gm,"<h3>$1</h3>")
      .replace(/^##\s+(.*)$/gm,"<h2>$1</h2>")
      .replace(/^#\s+(.*)$/gm,"<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>")
      .replace(/`(.+?)`/g,"<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>')
      .replace(/^---$/gm,"<hr>")
      .replace(/\n\n/g,"</p><p>")
      .replace(/^(.)/,"<p>$1")
      .concat("</p>");
  }

  function escHtml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

})();
