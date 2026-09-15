import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BOARD_NAME } from "../../constants";
import { MenuIcon, CloseIcon } from "../icons";

interface AppHeaderProps {
  // The action buttons (image / export / import / edit / reset), rendered once
  // and repositioned by CSS: inline on desktop, in a dropdown panel on mobile.
  children: ReactNode;
}

// The whip logo (public/logo.svg), shown as the brand mark in the header.
const BrandMark = () : JSX.Element => (
  <img className="brand-mark" src="logo.svg" width={50} height={50} alt="WHIP Logo" aria-hidden />
);

// Sticky app header: brand on the left, actions on the right (desktop) or in a
// dropdown panel behind a menu button (mobile). Replaces the old floating
// button row that detached from the page while scrolling.
const AppHeader = ({ children } : AppHeaderProps) : JSX.Element => {
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) : void => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ menuOpen ]);

  // Close the mobile menu when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: PointerEvent) : void => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [ menuOpen ]);

  // If the viewport grows to desktop size, the panel is no longer needed.
  useEffect(() => {
    const onResize = () : void => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="app-header" ref={headerRef}>
      <div className="app-header-inner">
        <div className="brand">
          <BrandMark />
          <h1 className="brand-name">{BOARD_NAME}</h1>
          <span className="brand-tagline">{t("header.subtitle")}</span>
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-actions"
          aria-label={t("menu.actions")}
          onClick={() : void => setMenuOpen(!menuOpen)}>
          {menuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        </button>
        <nav
          id="app-actions"
          className={menuOpen ? "app-actions is-open" : "app-actions"}
          aria-label={t("menu.actions")}
          onClick={() : void => { setMenuOpen(false); }}>
          {children}
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;
