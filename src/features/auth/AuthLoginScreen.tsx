import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronRight, Dumbbell, Moon, Receipt, Sun, Zap } from "lucide-react";

type AuthLoginScreenProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  authError: string;
  onSignIn: () => void;
};

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "oxygen-theme";

export function AuthLoginScreen(props: AuthLoginScreenProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeMode);
    root.style.colorScheme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const isLight = themeMode === "light";

  function toggleTheme() {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[var(--background)] text-[var(--color-text-secondary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,color-mix(in_srgb,var(--color-text-primary)_18%,transparent),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:3px_3px] [background-image:radial-gradient(color-mix(in_srgb,var(--color-text-primary)_28%,transparent)_0.4px,transparent_0.4px)]" />

      <div className="pointer-events-none absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-transparent via-[var(--theme-green-glow-strong)] to-transparent animate-[scanline_8s_linear_infinite]" />

      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-overlay)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        aria-label={themeMode === "dark" ? "切换到浅色模式" : "切换到深色模式"}
        title={themeMode === "dark" ? "切换到浅色模式" : "切换到深色模式"}
      >
        {themeMode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        {themeMode === "dark" ? "Light" : "Dark"}
      </button>

      <div className="relative z-10 flex w-full">
        <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
          <style>{`@keyframes scanline {0%{transform:translateY(0);opacity:0;}5%{opacity:1;}95%{opacity:1;}100%{transform:translateY(100vh);opacity:0;}}`}</style>
          <section className="relative flex flex-col justify-between overflow-hidden p-6 sm:p-8 md:p-12 lg:p-16">
            <div className="relative z-10 flex flex-col gap-12">
              <div className="flex items-end gap-4 sm:gap-6">
                <div className={`relative h-20 w-20 overflow-hidden rounded-3xl ring-1 sm:h-24 sm:w-24 md:h-32 md:w-32 ${isLight ? "bg-white ring-slate-300/70 shadow-[0_10px_30px_rgba(15,32,54,0.16)]" : "bg-black/40 ring-white/10"}`}>
                  <Image src="/logo.png" alt="Oxygen logo" fill className="object-cover" sizes="128px" priority />
                </div>
                <div className="space-y-2">
                  <h2 className={`text-xs font-semibold uppercase tracking-[0.4em] ${isLight ? "text-cyan-700/90" : "text-cyan-300/70"}`}>Powering Internal Systems</h2>
                  <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl md:text-5xl">
                    OXYGEN
                    <span className=" pl-2 text-[var(--theme-green)]">PRO</span>
                  </h1>
                </div>
              </div>

              <div className="grid w-full max-w-2xl grid-cols-1 gap-8 md:grid-cols-2">
                <div className={`relative overflow-hidden rounded-3xl border p-6 ${isLight ? "border-slate-300/80 bg-white shadow-[0_14px_28px_rgba(15,32,54,0.12)]" : "border-white/5 bg-white/5"}`}>
                  <div className="absolute right-4 top-4 text-cyan-300">
                    <Zap size={20} className="opacity-90 text-[var(--theme-green)]" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>今日核心能效</p>
                        <h3 className="text-3xl font-black text-[var(--color-text-primary)]">94%</h3>
                      </div>
                      <div className="text-[10px] font-semibold text-[var(--theme-green)]">LEVEL 12 ARCHON</div>
                    </div>
                    <div className={`h-1.5 rounded-full ${isLight ? "bg-slate-200" : "bg-white/5"}`}>
                      <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-[var(--theme-green)] to-[var(--theme-green-glow-strong)]" />
                    </div>
                    <div className={`flex justify-between text-[9px] uppercase tracking-[0.2em] ${isLight ? "text-slate-500" : "text-slate-600"}`}>
                      <span>SYSTEM_READY</span>
                      <span>OPTIMIZED</span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-3xl border p-6 ${isLight ? "border-slate-300/80 bg-white shadow-[0_14px_28px_rgba(15,32,54,0.12)]" : "border-white/5 bg-white/5"}`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className={`text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>系统实时负载</p>
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-green)]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-green-soft)]" />
                      </div>
                    </div>
                    <div className="flex h-12 items-end justify-between gap-1.5">
                      <div className={`h-[30%] flex-1 rounded-t-sm ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
                      <div className={`h-[60%] flex-1 rounded-t-sm ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
                      <div className="h-[90%] flex-1 rounded-t-sm bg-[var(--theme-green-glow-mid)] shadow-[0_0_10px_var(--theme-green-glow)]" />
                      <div className={`h-[40%] flex-1 rounded-t-sm ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
                      <div className={`h-[20%] flex-1 rounded-t-sm ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
                      <div className={`h-[55%] flex-1 rounded-t-sm ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
                      <div className={`h-[75%] flex-1 rounded-t-sm ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
                    </div>
                    <div className={`flex justify-between text-[10px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      <span className="text-[var(--color-text-primary)]">TPS: 1,240</span>
                      <span>LATENCY: 4MS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 hidden items-center gap-12 lg:flex">
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-600"}`}>当前活跃管理员</span>
                <div className="mt-2 flex -space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#020617] bg-[#0f172a] text-[10px] font-bold text-white">JD</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#020617] bg-[var(--theme-green-soft)] text-[10px] font-bold text-[var(--theme-green)]">AK</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#020617] bg-violet-500/20 text-[10px] font-bold text-violet-500">LS</div>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className={`text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-600"}`}>版本状态</span>
                <p className="mt-1 text-xs font-semibold text-[var(--color-text-primary)]">v4.0.2 STABLE BUILD</p>
              </div>
            </div>
          </section>

          <section className={`relative flex items-start justify-center border-t p-6 sm:p-8 md:p-12 lg:items-center lg:border-l lg:border-t-0 ${isLight ? "border-slate-300/70 bg-[#f8fbff]" : "border-white/5 bg-[color-mix(in_srgb,var(--color-page-bg-strong)_80%,black)]"}`}>
            <div className="absolute bottom-0 right-0 h-1/2 w-1/2 bg-violet-500/5 blur-[120px]" />
            <div className="relative z-10 w-full max-w-sm md:max-w-md">
              <div className="mb-8 space-y-2 md:mb-10">
                <h2 className="text-3xl font-black italic tracking-tight text-[var(--color-text-primary)] sm:text-4xl">控制台验证</h2>
                <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-500"}`}>需要完成身份验证流程</p>
              </div>

              <div className="flex flex-col space-y-8">
                <label>
                  <span className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    <span className="tracking-[0.2em]">账号</span>
                    <span className="text-[var(--theme-green)]">必填</span>
                  </span>
                  <div className="relative">
                    <input
                      className={`w-full border-l-2 border-r-0 border-t-0 border-b-0 px-6 py-4 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--theme-green)] focus:bg-[var(--theme-green-faint)] focus:ring-0 ${isLight ? "border-slate-300 bg-white" : "border-white/10 bg-black/60"}`}
                      value={props.email}
                      onChange={(e) => props.setEmail(e.target.value)}
                      placeholder="输入控制台账号"
                    />
                    <div className="absolute bottom-0 left-0 h-px w-0 bg-[var(--theme-green)] transition-all group-focus-within:w-full" />
                  </div>
                </label>

                <label>
                  <span className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    <span className="tracking-[0.2em]">密码</span>
                    <span className="text-[var(--theme-green-glow-strong)]">已加密</span>
                  </span>
                  <div className="relative">
                    <input
                      type="password"
                      className={`w-full border-l-2 border-r-0 border-t-0 border-b-0 px-6 py-4 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--theme-green-glow-strong)] focus:bg-[var(--theme-green-faint)] focus:ring-0 ${isLight ? "border-slate-300 bg-white" : "border-white/10 bg-black/60"}`}
                      value={props.password}
                      onChange={(e) => props.setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </label>

                <div className="flex items-center justify-between">
                  <label className={`flex items-center gap-3 text-xs ${isLight ? "text-slate-600" : "text-slate-500"}`}>
                    <input className="h-4 w-4 rounded border-white/10 bg-white/5 text-[var(--theme-green)] focus:ring-[var(--theme-green-soft)] focus:ring-offset-0" type="checkbox" />
                    保持连接
                  </label>
                  <button type="button" className="text-xs font-bold text-[var(--theme-green-glow-strong)] transition hover:text-[var(--theme-green)]">
                    找回权限?
                  </button>
                </div>
              </div>

              {props.authError && (
                <p className="mt-6 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {props.authError}
                </p>
              )}

              <div className="pt-4">
                <button onClick={props.onSignIn} className="group w-full">
                  <div className="flex w-full items-center justify-center gap-4 bg-[var(--color-text-primary)] py-4 text-xl font-black text-[var(--color-page-bg-strong)] transition hover:bg-[var(--theme-green)]">
                    <span>进入系统</span>
                    <ChevronRight size={20} />
                  </div>
                  <div className="mt-2 flex w-full gap-2">
                    <div className="h-1 flex-1 bg-[var(--theme-green-muted)]" />
                    <div className="h-1 flex-1 bg-[var(--theme-green-faint)]" />
                    <div className="h-1 flex-1 bg-[var(--theme-green-subtle)]" />
                    <div className="h-1 flex-1 bg-[var(--theme-green-soft)]" />
                    <div className="h-1 flex-1 bg-[var(--theme-green)]" />
                  </div>
                </button>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 md:mt-16">
                <div className={`flex items-center gap-3 rounded-xl border p-4 grayscale transition-all hover:grayscale-0 ${isLight ? "border-slate-300 bg-white" : "border-white/5"}`}>
                  <Receipt size={18} className="text-[var(--theme-green)]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[var(--color-text-primary)]">结算中心</span>
                    <span className={`text-[8px] ${isLight ? "text-slate-600" : "text-slate-500"}`}>账务管理</span>
                  </div>
                </div>
                <div className={`flex items-center gap-3 rounded-xl border p-4 grayscale transition-all hover:grayscale-0 ${isLight ? "border-slate-300 bg-white" : "border-white/5"}`}>
                  <Dumbbell size={18} className="text-[var(--theme-green-glow-strong)]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[var(--color-text-primary)]">方案计算</span>
                    <span className={`text-[8px] ${isLight ? "text-slate-600" : "text-slate-500"}`}>定价系统</span>
                  </div>
                </div>
              </div>

              <div className={`mt-10 flex flex-col gap-4 border-t pt-6 text-center md:mt-12 md:pt-8 ${isLight ? "border-slate-300/70" : "border-white/5"}`}>
                <p className={`text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-600"}`}>OXYGEN 管理生态系统 © 2026</p>
                <p className={`text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-slate-600" : "text-slate-600"}`}>系统设计团队</p>
                <div className={`flex justify-center gap-6 text-[9px] font-bold ${isLight ? "text-slate-600" : "text-slate-500"}`}>
                  <button className="transition hover:text-[var(--theme-green)]" type="button">
                    系统架构
                  </button>
                  <button className="transition hover:text-[var(--theme-green)]" type="button">
                    安全审计
                  </button>
                  <button className="transition hover:text-cyan-300" type="button">
                    技术支持
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
