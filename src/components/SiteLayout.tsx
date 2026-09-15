import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { siteContentQuery } from "@/lib/site-data";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Events" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const { data: content } = useQuery(siteContentQuery);
  const brand = content?.brand_name ?? "Westgate Arena";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <Link to="/" className="font-display text-lg font-bold">
            {brand}
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "text-foreground font-medium" }}
                activeOptions={{ exact: item.to === "/" }}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border">
        <div className="mx-auto max-w-6xl space-y-2 px-6 py-10">
          <p className="font-display font-bold">{brand}</p>
          <p className="text-sm text-muted-foreground">
            {content?.footer_tagline ?? "Live modelling competitions and audience voting in Nairobi, Kenya."}
          </p>
          <Link to="/admin" className="inline-block text-sm text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
