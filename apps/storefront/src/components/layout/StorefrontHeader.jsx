import nuedeLogo from "@nuede/config/nuede-logo.svg";
import { Menu, ShoppingBasket } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { storefrontNavigation, storefrontPaths } from "../../app/routePaths.js";
import { CartDialog } from "../../features/cart/components/CartDialog.jsx";
import { useCart } from "../../features/cart/context/cartContext.js";
import { Dialog } from "../ui/Dialog.jsx";
import { IconButton } from "../ui/Button.jsx";
import { Container } from "./Container.jsx";

function Brand() {
  return (
    <Link className="inline-flex min-h-11 items-center gap-2 rounded text-brand-950" to={storefrontPaths.home} aria-label="Nuede home">
      <img src={nuedeLogo} alt="Nuede" width="374" height="112" className="h-auto w-32 shrink-0" />
    </Link>
  );
}

function NavigationLink({ item, onNavigate, mobile = false }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => `${mobile ? "flex min-h-12 items-center border-b border-line text-lg" : "inline-flex min-h-11 items-center border-b-2 px-1 text-sm"} font-semibold transition-colors ${isActive ? "border-brand-700 text-brand-950" : "border-transparent text-muted hover:text-brand-950"}`}
    >
      {item.label}
    </NavLink>
  );
}

export function StorefrontHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <Container className="flex min-h-18 items-center justify-between gap-5">
        <Brand />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {storefrontNavigation.map((item) => <NavigationLink key={item.path} item={item} />)}
          <a className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-brand-950" href="/#about">About</a>
          <a className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-brand-950" href="/#faq">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold text-brand-950 hover:bg-brand-100" type="button" onClick={() => setCartOpen(true)} aria-label={`Open basket, ${itemCount} ${itemCount === 1 ? "item" : "items"}`} aria-haspopup="dialog" aria-expanded={cartOpen}>
            <ShoppingBasket className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Basket</span>
            <span className="grid min-w-6 place-items-center rounded-full bg-brand-950 px-1.5 text-xs leading-6 text-white" aria-hidden="true">{itemCount}</span>
          </button>
          <IconButton className="lg:hidden" label="Open navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      </Container>
      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Explore Nuede" description="Choose where you'd like to go">
        <nav className="grid" aria-label="Mobile navigation">
          {storefrontNavigation.map((item) => <NavigationLink key={item.path} item={item} mobile onNavigate={() => setMobileOpen(false)} />)}
          <a className="flex min-h-12 items-center border-b border-line text-lg font-semibold text-brand-950" href="/#about" onClick={() => setMobileOpen(false)}>About</a>
          <a className="flex min-h-12 items-center border-b border-line text-lg font-semibold text-brand-950" href="/#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
          <a className="flex min-h-12 items-center text-lg font-semibold text-brand-950" href="/#contact" onClick={() => setMobileOpen(false)}>Contact</a>
        </nav>
      </Dialog>
      <CartDialog open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
