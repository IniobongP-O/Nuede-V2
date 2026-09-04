import nuedeLogo from "@nuede/config/nuede-logo.svg";
import {
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareQuote,
  MessagesSquare,
  ReceiptText,
  Settings,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { adminNavigation } from "../../app/routePaths.js";
import { useAuth } from "../../features/auth/hooks/useAuth.js";
import { Button, IconButton } from "../ui/Button.jsx";
import { Dialog } from "../ui/Dialog.jsx";
import { ToastProvider } from "../ui/Toast.jsx";

const icons = {
  "layout-dashboard": LayoutDashboard,
  "receipt-text": ReceiptText,
  utensils: Utensils,
  "chart-no-axes-combined": ChartNoAxesCombined,
  "map-pinned": MapPinned,
  "message-square-quote": MessageSquareQuote,
  "messages-square": MessagesSquare,
  settings: Settings,
};

function AdminNav({ onNavigate, mobile = false }) {
  return <nav className="grid gap-1" aria-label={mobile ? "Mobile admin navigation" : "Admin navigation"}>{adminNavigation.map((item) => { const Icon = icons[item.icon]; return <NavLink key={item.path} to={item.path} onClick={onNavigate} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold transition-colors ${isActive ? "bg-brand-950 text-white" : "text-muted hover:bg-brand-100 hover:text-brand-950"}`}><Icon className="size-4" aria-hidden="true" />{item.label}</NavLink>; })}</nav>;
}

function adminInitials(admin) {
  const source = admin.display_name || admin.email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const { admin, signOut } = useAuth();
  const displayName = admin.display_name || admin.email;

  const handleLogout = async () => {
    setLogoutBusy(true);
    setLogoutError("");
    try {
      await signOut();
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
      setLogoutBusy(false);
    }
  };

  return <ToastProvider><a href="#admin-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-control bg-brand-950 px-4 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0">Skip to admin content</a><div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]"><aside className="hidden min-h-screen border-r border-line bg-surface p-5 lg:sticky lg:top-0 lg:block lg:h-screen"><div className="flex min-h-12 items-center gap-2 text-brand-950"><img src={nuedeLogo} alt="Nuede" width="374" height="112" className="h-auto w-32 shrink-0" /></div><p className="mb-5 mt-8 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted">Admin console</p><AdminNav /><p className="absolute bottom-5 text-xs text-muted">Authenticated operations</p></aside><div className="min-w-0"><header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur sm:px-6 lg:px-8"><div className="flex items-center gap-3"><IconButton className="lg:hidden" label="Open admin navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu className="size-5" aria-hidden="true" /></IconButton><div><p className="text-xs font-semibold text-muted">Nuede operations</p><p className="max-w-[8rem] truncate text-sm font-semibold text-brand-950 sm:max-w-none" title={displayName}>{displayName}</p></div></div><div className="flex items-center gap-2"><div className="hidden text-right sm:block"><p className="text-xs font-semibold text-brand-950">{admin.role}</p>{logoutError ? <p className="max-w-52 text-xs text-danger" role="alert">{logoutError}</p> : null}</div><div className="grid size-10 place-items-center rounded-full border border-line bg-surface text-xs font-bold text-brand-950" aria-label={`Signed in as ${displayName}`}>{adminInitials(admin)}</div><Button size="small" variant="ghost" aria-label="Log out" busy={logoutBusy} onClick={handleLogout}><LogOut className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Log out</span></Button></div></header>{logoutError ? <p className="px-4 py-2 text-sm text-danger sm:hidden" role="alert">{logoutError}</p> : null}<main id="admin-content" tabIndex="-1" className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div><Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Admin navigation" description="Operational application sections"><AdminNav mobile onNavigate={() => setMobileOpen(false)} /></Dialog></ToastProvider>;
}
