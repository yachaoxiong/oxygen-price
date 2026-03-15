"use client";

import { ShoppingCart } from "lucide-react";

export type NavbarProps = {
  activeLocale: "zh" | "en";
  activeCategory: "membership" | "personal_training" | "cycle_plan" | "stored_value" | "group_class" | "assessment";
  onSelectCategory: (category: "membership" | "personal_training" | "cycle_plan" | "stored_value" | "group_class" | "assessment") => void;
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

const NAV_ITEMS = [
  { key: "membership", labelZh: "会员&团课", labelEn: "Membership & Classes" },
  { key: "personal_training", labelZh: "私教课程", labelEn: "Personal Training" },
  { key: "cycle_plan", labelZh: "周期计划", labelEn: "Cycle Plans" },
  { key: "stored_value", labelZh: "储值计划", labelEn: "Stored Value" },
] as const;

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

  return (
    <header className="relative z-[40] p-4 w-full overflow-visible border-b border-slate-800/70 bg-[#020b0d]/80 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-size:30px_30px] [background-image:linear-gradient(rgba(0,242,150,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,150,0.08)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/15 via-transparent to-transparent" />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-6">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-black tracking-tighter text-white">Oxygen</span>
            <span className="text-3xl font-black tracking-tighter text-emerald-300 drop-shadow-[0_0_8px_rgba(0,242,150,0.6)]">
              Pricing
            </span>
          </div>
          {/* <p className="mt-1 text-xs uppercase tracking-[0.4em] text-slate-500">深色科技风重构版</p> */}
        </div>
        <nav className="mx-auto flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-400">
          {NAV_ITEMS.map((item) => {
            const isActive = activeCategory === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectCategory(item.key)}
                className={`relative inline-flex h-8 items-center px-4 text-sm font-semibold leading-none transition-colors duration-300 box-border border cursor-pointer ${
                  isActive
                    ? "border-emerald-300/60 text-emerald-300 shadow-[0_0_12px_rgba(0,242,150,0.25)]"
                    : "border-transparent text-slate-400 hover:text-white nav-item-hover"
                }`}
              >
                {activeLocale === "zh" ? item.labelZh : item.labelEn}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center justify-start gap-3 md:justify-end">
          <button
            onClick={onToggleLocale}
            className="btn-border-animate group relative overflow-hidden  border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-emerald-300/50 hover:text-emerald-100"
          >
            <svg aria-hidden="true">
              <rect width="100%" height="100%" x="0" y="0" />
            </svg>
            <span className="mr-2 text-[9px] text-slate-500 transition-colors group-hover:text-emerald-200">Lang</span>
            <span className="lang-glow-text">{activeLocale === "zh" ? "中文" : "English"}</span>
          </button>
          <button
            onClick={onOpenCart}
            className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full border text-emerald-100 transition hover:border-emerald-300/70 hover:bg-emerald-500/20 ${
              addingItemKey ? "border-emerald-300/70 bg-emerald-500/15" : "border-emerald-300/40 bg-emerald-500/10"
            }`}
            aria-label={`购物车，当前 ${cartCount} 项`}
            title="购物车"
          >
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span
                className={`absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-300 px-1 text-[10px] font-bold text-slate-950 ${
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500/10 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/60"
              aria-label={activeLocale === "zh" ? "用户菜单" : "User menu"}
            >
              {avatarInitial}
            </button>
            {avatarMenuOpen && (
              <div className="absolute right-0 z-[60] mt-3 w-64 overflow-hidden rounded-2xl border border-emerald-300/30 bg-[#050b14]/98 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur">
                <div className="border-b border-emerald-300/20 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-sm font-semibold text-emerald-100">
                      {avatarInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{avatarName}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">{avatarRole}</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <button
                    onClick={onSignOut}
                    className="w-full rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-500/20"
                  >
                    {activeLocale === "zh" ? "退出登录" : "Sign out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
    </header>
  );
}
