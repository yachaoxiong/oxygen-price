import Image from "next/image";
import { Shield, User, UserCheck } from "lucide-react";

type AuthLoginScreenProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  authError: string;
  onSignIn: () => void;
};

export function AuthLoginScreen(props: AuthLoginScreenProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03050b] px-4 py-12 text-slate-100 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(56,189,248,0.16),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:3px_3px] [background-image:radial-gradient(rgba(255,255,255,0.4)_0.4px,transparent_0.4px)]" />

      <div className="relative mx-auto max-w-md rounded-3xl border border-cyan-300/25 bg-gradient-to-b from-[#0a1324]/95 to-[#081120]/95 p-7 shadow-[0_0_46px_rgba(34,211,238,0.18)] backdrop-blur">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5">
              <div className="relative h-7 w-7 overflow-hidden rounded-lg ring-1 ring-white/15">
                <Image src="/logo.png" alt="Oxygen logo" fill className="object-cover" sizes="28px" priority />
              </div>
              <p className="text-sm font-semibold tracking-tight text-white">
                Oxygen<span className="text-emerald-300">Pricing</span>
              </p>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Sales Login / 销售登录</h1>
            <p className="mt-1 text-sm text-slate-400">Oxygen Pricing Console</p>
          </div>
          <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-2">
            <UserCheck size={18} className="text-emerald-200" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-300">
              <User size={13} className="text-cyan-200" /> Email / 邮箱
            </span>
            <input
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20"
              value={props.email}
              onChange={(e) => props.setEmail(e.target.value)}
              placeholder="name@oxygen.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-300">
              <Shield size={13} className="text-emerald-200" /> Password / 密码
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20"
              value={props.password}
              onChange={(e) => props.setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        </div>

        {props.authError && <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{props.authError}</p>}

        <button
          onClick={props.onSignIn}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2.5 text-sm font-bold text-[#04111f] transition hover:brightness-105 active:scale-[0.99]"
        >
          Sign In / 登录
        </button>
      </div>
    </div>
  );
}
