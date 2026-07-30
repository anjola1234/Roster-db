"use client";

import { useEffect } from "react";

export default function ScrollSpyToc({ items }: { items: { id: string; num: string; label: string }[] }) {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".toc a[data-spy]"));
    const sections = Array.from(document.querySelectorAll<HTMLElement>("#io-content section[id]"));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((a) => a.classList.remove("active"));
            const active = document.querySelector<HTMLAnchorElement>(`.toc a[href="#${entry.target.id}"]`);
            active?.classList.add("active");
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="toc side-card">
      <p className="eyebrow toc-label">On this page</p>
      <ol>
        {items.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`} data-spy>
              <span className="num">{t.num}</span> {t.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
