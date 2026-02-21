// ============================================================
//  SITE CONFIGURATION — edit this file to personalize your site
// ============================================================
const SITE_CONFIG = {
  // Your GitHub username and repo name (needed to auto-load posts)
  // The repo is typically "yourusername.github.io" for a user page,
  // or whatever repo you deploy from.
  github_username: "Monopolis973",
  github_repo: "Monopolis973.github.io",

  // Site display name
  site_name: "Spencer Hill",

  // Nav links shown on every page
  nav: [
    { label: "home",     href: "index.html" },
    { label: "writings", href: "writings.html" },
    { label: "poetry",   href: "poetry.html" },
    { label: "projects", href: "projects.html" },
    { label: "friends",  href: "friends.html" },
    { label: "about",    href: "about.html" },
  ],

  // Friends list — add / remove entries freely
  friends: [
    { name: "Friend One",  url: "https://example.com",  note: "brilliant mind, terrible puns" },
    { name: "Friend Two",  url: "https://example.org",  note: "poet & philosopher" },
  ],

  // Projects / Creations — add / remove freely
  projects: [
    {
      title: "Project Alpha",
      url:   "https://github.com/spencerhill/project-alpha",
      desc:  "A short description of this project.",
      tags:  ["research", "code"],
    },
    {
      title: "Project Beta",
      url:   "https://github.com/spencerhill/project-beta",
      desc:  "Another project I'm proud of.",
      tags:  ["writing", "music"],
    },
  ],
};
