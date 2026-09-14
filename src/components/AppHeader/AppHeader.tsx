import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BOARD_NAME } from "../../constants";
import { MenuIcon, CloseIcon } from "../icons";

interface AppHeaderProps {
  // The action buttons (image / export / import / edit / reset), rendered once
  // and repositioned by CSS: inline on desktop, in a dropdown panel on mobile.
  children: ReactNode;
}

// Mini sunburst mark in the four status colors — a tiny board of its own.
const BrandMark = () : JSX.Element => (
  <svg className="brand-mark" viewBox="0 0 24 24" width="26" height="26" aria-hidden focusable={false}>
    <path d="M12 12 L12 2 A10 10 0 0 1 22 12 Z" fill="#ff0000"></path>
    <path d="M12 12 L22 12 A10 10 0 0 1 12 22 Z" fill="#ffff00"></path>
    <path d="M12 12 L12 22 A10 10 0 0 1 2 12 Z" fill="#32cd32"></path>
    <path d="M12 12 L2 12 A10 10 0 0 1 12 2 Z" fill="#008000"></path>
    <circle cx="12" cy="12" r="3.2" fill="#17131c"></circle>
  </svg>
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
