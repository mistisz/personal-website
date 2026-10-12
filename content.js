/* ------------------------------------------------------------------
   EDIT ME — all personal content lives here.
   Icon names: github, linkedin, twitter, mail, code, layers, terminal,
   cpu, database, music, camera, book, mountain, coffee, sparkles.
------------------------------------------------------------------- */
window.SITE = {
  name: "Alex Morgan",
  email: "hello@example.com",
  social: [
    { label: "GitHub", icon: "github", href: "https://github.com/your-username", handle: "@your-username" },
    { label: "LinkedIn", icon: "linkedin", href: "https://linkedin.com/in/your-username", handle: "in/your-username" },
    { label: "X / Twitter", icon: "twitter", href: "https://x.com/your-username", handle: "@your-username" },
  ],
  projects: [
    {
      title: "Lumen",
      icon: "sparkles",
      description: "A calm writing app with local-first sync, distraction-free focus modes and a delightful editor.",
      tags: ["TypeScript", "React", "CRDTs"],
      links: [{ label: "Live", href: "#" }, { label: "Source", href: "#" }],
    },
    {
      title: "Parcel Atlas",
      icon: "layers",
      description: "Interactive maps that turn messy logistics data into clear, explorable stories.",
      tags: ["Svelte", "MapLibre", "PostGIS"],
      links: [{ label: "Live", href: "#" }, { label: "Source", href: "#" }],
    },
    {
      title: "Quill CLI",
      icon: "terminal",
      description: "A fast, friendly command-line toolkit for scaffolding and shipping small web projects.",
      tags: ["Rust", "CLI", "Open source"],
      links: [{ label: "Source", href: "#" }],
    },
    {
      title: "Signal Notes",
      icon: "cpu",
      description: "An experiment in summarising long documents with language models, with citations you can verify.",
      tags: ["Python", "LLMs", "FastAPI"],
      links: [{ label: "Write-up", href: "#" }, { label: "Source", href: "#" }],
    },
  ],
  skills: [
    { group: "Frontend", icon: "code", items: [["TypeScript", 92], ["React & Svelte", 90], ["CSS & Motion", 95]] },
    { group: "Backend", icon: "database", items: [["Node.js", 85], ["Python", 80], ["PostgreSQL", 78]] },
    { group: "Tooling", icon: "terminal", items: [["Git & CI/CD", 88], ["Rust", 60], ["Docker", 75]] },
  ],
  interests: [
    { label: "Hiking", icon: "mountain" },
    { label: "Film photography", icon: "camera" },
    { label: "Jazz piano", icon: "music" },
    { label: "Reading", icon: "book" },
    { label: "Slow coffee", icon: "coffee" },
  ],
};
