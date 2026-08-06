import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import Logo from "../shell/Logo.jsx";
import Button from "../ui/Button.jsx";
import ThemeToggle from "../shell/ThemeToggle.jsx";
import { MARKETING_NAV } from "../../constants/navigation.js";

/**
 * Marketing navigation.
 *
 * Transparent over the hero, then picks up a glass background and border once
 * the page scrolls — so the nav never competes with the headline but stays
 * readable over content. The scroll listener is passive and only flips a
 * boolean, so it does no layout work per frame.
 */
export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="marketing-nav" data-scrolled={scrolled}>
      <div className="container marketing-nav__inner">
        <Logo />

        <nav className="marketing-nav__links" aria-label="Sections">
          {MARKETING_NAV.map((item) => (
            <a key={item.href} href={item.href} className="marketing-nav__link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="marketing-nav__actions">
          <ThemeToggle />
          <Button to="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button to="/app/research" variant="primary" size="sm">
            Open workspace
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={menuOpen ? X : Menu}
            className="marketing-nav__mobile"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          />
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="mobile-menu"
            aria-label="Sections"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            {MARKETING_NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <Button
              to="/app/research"
              variant="gradient"
              size="md"
              block
              style={{ marginTop: 8 }}
              onClick={() => setMenuOpen(false)}
            >
              Open workspace
            </Button>
            <Button
              to="/login"
              variant="secondary"
              size="md"
              block
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </Button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
