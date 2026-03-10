type PwaInstallHintProps = {
  visible: boolean;
  onInstall: () => void | Promise<void>;
  onDismiss: () => void;
};

export function PwaInstallHint({ visible, onInstall, onDismiss }: PwaInstallHintProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-2 z-[90] rounded-2xl border border-emerald-300/30 bg-[#072417]/95 p-3 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-emerald-100 md:text-sm">
          可安装到手机主屏，点击“立即安装”即可。
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onInstall}
            className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-300 md:text-sm"
          >
            立即安装
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg border border-white/20 bg-black/25 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/10 md:text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
