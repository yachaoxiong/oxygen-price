"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, ShoppingCart, Sun } from "lucide-react";
import { useState } from "react";
import { cartCopy, formatCartCopy } from "@/lib/cart/cartCopy";

const NAV_ITEMS = [
  { key: "membership", labelZh: "会员&团课", labelEn: "Membership & Classes", href: "/membership" },
  { key: "personal_training", labelZh: "私教课程", labelEn: "Personal Training", href: "/personal-training" },
  { key: "cycle_plan", labelZh: "周期计划", labelEn: "Cycle Plans", href: "/cycle-plan" },
  { key: "stored_value", labelZh: "储值计划", labelEn: "Stored Value", href: "/stored-value" },
] as const;

type CategoryKey = (typeof NAV_ITEMS)[number]["key"];
type ThemeMode = "dark" | "light";
const THEME_STORAGE_KEY = "oxygen-theme";

export type NavbarProps = {
  activeLocale: "zh" | "en";
  activeCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
  onToggleLocale: () => void;
  cartCount: number;
  onOpenCart: () => void;
  addingItemKey?: string | null;
  avatarInitial: string;
  avatarName: string;
  avatarRole: string;
  avatarMenuOpen: boolean;
  onToggleAvatarMenu: () => void;
  onSignOut: () => void;
};

export function Navbar({
  activeLocale,
  activeCategory,
  onSelectCategory,
  onToggleLocale,
  cartCount,
  onOpenCart,
  addingItemKey,
  avatarInitial,
  avatarName,
  avatarRole,
  avatarMenuOpen,
  onToggleAvatarMenu,
  onSignOut,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") return current;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const isInvoiceRoute = pathname === "/invoice" || pathname === "/new-invoice";

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <header
      className="sticky top-0 z-[60] w-full border-b border-[var(--color-border)] bg-[var(--color-surface-overlay)]/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingLeft: "1rem", paddingRight: "1rem" }}
    >
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-6 md:px-6 md:py-4">
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tighter text-[var(--color-text-primary)] sm:text-2xl md:text-3xl">Oxygen</span>
            <span className="text-xl font-black tracking-tighter text-[var(--color-primary)] drop-shadow-[0_0_8px_rgba(0,242,150,0.6)] sm:text-2xl md:text-3xl">
              Pricing
            </span>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenCart}
              className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full border text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-soft)] hover:bg-[var(--color-primary-soft)] ${
                addingItemKey ? "border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)]" : "border-[var(--color-primary-soft)] bg-[var(--color-primary-faint)]"
              }`}
              aria-label={formatCartCopy(cartCopy.navbar.cartLabel[activeLocale], { count: cartCount })}
              title={cartCopy.navbar.cartTitle[activeLocale]}
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span
                  className={`absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-[var(--color-primary-contrast)] ${
                    addingItemKey ? "animate-[cart-flash_650ms_ease-in-out]" : ""
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setMobileNavOpen((prev) => {
                  const next = !prev;
                  if (next && avatarMenuOpen) onToggleAvatarMenu();
                  return next;
                });
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/40 bg-[var(--color-primary-faint)] text-[var(--color-text-primary)] transition hover:border-emerald-300/70 hover:bg-[var(--color-primary-soft)]"
              aria-label={mobileNavOpen ? "关闭导航" : "打开导航"}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="relative inline-flex h-6 w-6 items-center justify-center">
                <span
                  className={`absolute h-[2px] w-4 rounded-full bg-current transition duration-200 ${
                    mobileNavOpen ? "translate-y-0 rotate-45" : "-translate-y-1.5"
                  }`}
                />
                <span
                  className={`absolute h-[2px] w-4 rounded-full bg-current transition duration-200 ${
                    mobileNavOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute h-[2px] w-4 rounded-full bg-current transition duration-200 ${
                    mobileNavOpen ? "translate-y-0 -rotate-45" : "translate-y-1.5"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
        <nav className="hidden md:block">
          <div className="mx-auto flex w-max items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)] md:w-auto md:justify-center md:gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = activeCategory === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectCategory(item.key);
                    router.push(item.href);
                  }}
                  className={`relative inline-flex h-9 items-center whitespace-nowrap px-4 text-sm font-semibold leading-none transition-colors duration-300 box-border border cursor-pointer ${
                    isActive
                      ? "border-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[0_0_12px_rgba(0,242,150,0.25)]"
                      : "border-transparent text-muted-foreground hover:text-foreground nav-item-hover"
                  }`}
                >
                  {activeLocale === "zh" ? item.labelZh : item.labelEn}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="hidden flex-wrap items-center justify-start gap-2 md:flex md:justify-end">
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-3 text-[11px] font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-soft)] hover:bg-[var(--color-hover)]"
            aria-label={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
            title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button
            onClick={onToggleLocale}
            className="btn-border-animate group relative overflow-hidden border border-border bg-card/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary-soft)] hover:text-[var(--color-text-primary)]"
          >
            <svg aria-hidden="true">
              <rect width="100%" height="100%" x="0" y="0" />
            </svg>
            <span className="mr-2 text-[9px] text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary-soft)]">Lang</span>
            <span className="lang-glow-text">{activeLocale === "zh" ? "中文" : "English"}</span>
          </button>
          <button
            onClick={onOpenCart}
            className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full border text-foreground transition hover:border-border hover:bg-[var(--color-hover)] ${
              addingItemKey ? "border-border bg-[var(--color-primary-faint)]" : "border-border/70 bg-card"
            }`}
            aria-label={formatCartCopy(cartCopy.navbar.cartLabel[activeLocale], { count: cartCount })}
            title={cartCopy.navbar.cartTitle[activeLocale]}
          >
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span
                className={`absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-300 px-1 text-[10px] font-bold text-[var(--color-primary-contrast)] ${
                  addingItemKey ? "animate-[cart-flash_650ms_ease-in-out]" : ""
                }`}
              >
                {cartCount}
              </span>
            )}
          </button>
          <div className="relative" data-avatar-menu>
            <button
              onClick={onToggleAvatarMenu}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-xs font-semibold text-foreground transition hover:border-border hover:bg-[var(--color-hover)]"
              aria-label={activeLocale === "zh" ? "用户菜单" : "User menu"}
            >
              {avatarInitial}
            </button>
            {avatarMenuOpen && (
              <div className="absolute left-0 right-0 z-[60] mt-3 w-[min(92vw,20rem)] sm:left-auto sm:right-0 sm:w-64 overflow-hidden rounded-2xl border border-border/70 bg-[var(--color-page-bg-soft)] shadow-[0_24px_40px_rgba(0,0,0,0.32)]">
                <div className="border-b border-[var(--color-primary-faint)] bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card text-sm font-semibold text-foreground">
                      {avatarInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{avatarName}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-primary-soft)]">{avatarRole}</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <Link
                    href="/invoice"
                    className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      isInvoiceRoute
                        ? "border-border bg-[var(--color-primary-faint)] text-foreground"
                        : "border-border/70 bg-card text-foreground hover:border-border hover:bg-[var(--color-hover)]"
                    }`}
                  >
                    <span>{activeLocale === "zh" ? "发票中心" : "Invoice Center"}</span>
                    <span className="text-[10px] text-muted-foreground">Open</span>
                  </Link>
                  <button
                    onClick={onSignOut}
                    className="w-full rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-rose-300/60 hover:bg-rose-500/16"
                  >
                    {activeLocale === "zh" ? "退出登录" : "Sign out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        id="mobile-navigation"
        className={`md:hidden ${
          mobileNavOpen ? "max-h-[680px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden transition-all duration-300`}
      >
        <nav className="mt-2 rounded-2xl border border-emerald-300/20 bg-[var(--color-surface-overlay)]/95 px-3 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur">
          <div className="px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              {activeLocale === "zh" ? "价格菜单" : "Pricing"}
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeCategory === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectCategory(item.key);
                    router.push(item.href);
                    setMobileNavOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-border bg-[var(--color-primary-faint)] text-foreground"
                      : "border-border/70 text-[var(--color-text-secondary)] hover:border-border hover:bg-[var(--color-hover)]"
                  }`}
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      {activeLocale === "zh" ? item.labelZh : item.labelEn}
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-200/70">
                    {isActive ? (activeLocale === "zh" ? "当前" : "Active") : ""}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-soft)] hover:bg-[var(--color-hover)]"
              aria-label={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button
              onClick={onToggleLocale}
              className="btn-border-animate group relative inline-flex h-12 items-center justify-between overflow-hidden rounded-xl border border-border bg-card/70 px-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--color-text-secondary)] transition hover:border-emerald-300/50 hover:text-[var(--color-text-primary)]"
            >
              <svg aria-hidden="true">
                <rect width="100%" height="100%" x="0" y="0" />
              </svg>
              <span className="mr-2 text-[9px] text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)]">Lang</span>
              <span className="lang-glow-text">{activeLocale === "zh" ? "中文" : "English"}</span>
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-[var(--color-surface-overlay)]/90" data-avatar-menu>
            <button
              onClick={onToggleAvatarMenu}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-label={activeLocale === "zh" ? "用户菜单" : "User menu"}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500/10 text-xs font-semibold text-emerald-100">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{avatarName}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">{avatarRole}</p>
                </div>
              </div>
              <span className={`material-symbols-outlined text-base text-emerald-200/70 transition-transform ${
                avatarMenuOpen ? "rotate-180" : ""
              }`}>expand_more</span>
            </button>
            {avatarMenuOpen && (
              <div className="border-t border-emerald-300/15 px-4 py-3">
                <Link
                  href="/invoice"
                  className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    isInvoiceRoute
                      ? "border-emerald-300/60 bg-emerald-500/20 text-emerald-100"
                      : "border-emerald-300/20 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/50 hover:bg-emerald-500/20"
                  }`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span>{activeLocale === "zh" ? "发票中心" : "Invoice Center"}</span>
                  <span className="text-[10px] text-emerald-200/70">Open</span>
                </Link>
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileNavOpen(false);
                  }}
                  className="w-full rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-500/20"
                >
                  {activeLocale === "zh" ? "退出登录" : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
    </header>
  );
}
