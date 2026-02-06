// CosmoSynapse landing page interactions (tiny, optional)
(() => {
  // Keep external links safe by default if added later.
  document.querySelectorAll('a[target="_blank"]').forEach((a) => {
    const rel = (a.getAttribute("rel") || "").toLowerCase();
    if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
      a.setAttribute("rel", "noopener noreferrer");
    }
  });

  // Add active state to nav links based on scroll position.
  const nav = document.querySelector(".cs-nav");
  const links = Array.from(nav?.querySelectorAll('a[href^="#"]') || []);
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (links.length && sections.length) {
    const setActive = (id) => {
      links.forEach((a) => {
        const href = a.getAttribute("href");
        const isActive = href === `#${id}`;
        a.classList.toggle("is-active", isActive);
      });
    };

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible) return;
        setActive(visible.target.id);
      },
      { root: null, threshold: [0.2, 0.35, 0.5, 0.65] }
    );

    sections.forEach((s) => obs.observe(s));
  }

  // Smooth scroll to top when clicking logo, if уже на текущей странице.
  const logos = document.querySelectorAll(".cs-logo");
  logos.forEach((logo) => {
    const asLink = logo.matches("a") ? logo : logo.closest("a");
    if (!asLink) return;

    asLink.addEventListener("click", (e) => {
      try {
        const url = new URL(asLink.href, window.location.href);
        const samePath = url.pathname === window.location.pathname;
        if (samePath) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        // Fallback: just smooth scroll without URL comparison.
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
})();
