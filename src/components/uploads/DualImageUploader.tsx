"use client";

import { useMemo, useState } from "react";
import imageCompression from "browser-image-compression";

type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
  label: string;
};

type CompressionPreset = "quality" | "size";

export type DualImageUploaderProps = {
  className?: string;
  title?: string;
  compressedTitle?: string;
  /**
   * Max dimension (width/height) for compressed images.
   * Defaults to 1600.
   */
  compressMaxDimension?: number;
  /**
   * JPEG quality for compressed images (0-1).
   * Defaults to 0.82.
   */
  compressQuality?: number;
  onCompressedChange?: (files: File[]) => void;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

async function compressImageToJpegFile(input: File, opts: { maxDimension: number; quality: number }): Promise<File> {
  const baseName = input.name.replace(/\.[^/.]+$/, "");
  const nextName = `${baseName || "image"}-compressed.jpg`;
  const compressed = await imageCompression(input, {
    maxWidthOrHeight: opts.maxDimension,
    initialQuality: opts.quality,
    maxIteration: 10,
    useWebWorker: true,
    fileType: "image/jpeg",
  });

  if (compressed instanceof File) {
    return new File([compressed], nextName, { type: "image/jpeg", lastModified: Date.now() });
  }

  return new File([compressed], nextName, { type: "image/jpeg", lastModified: Date.now() });
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function triggerDownload(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name || "image";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function DualImageUploader({
  className,
  title = "上传图片",
  compressedTitle = "上传（压缩体积）",
  compressMaxDimension = 1600,
  compressQuality = 0.82,
  onCompressedChange,
}: DualImageUploaderProps) {
  const [compressed, setCompressed] = useState<UploadedImage[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<CompressionPreset>("quality");
  // Reset file input so selecting the same files again still triggers onChange.
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const compressedFiles = useMemo(() => compressed.map((x) => x.file), [compressed]);
  const compressionConfig = useMemo(() => {
    if (preset === "quality") {
      return {
        maxDimension: Math.max(compressMaxDimension, 2200),
        quality: Math.max(compressQuality, 0.88),
        label: "高清优先",
      };
    }

    return {
      maxDimension: Math.min(compressMaxDimension, 1200),
      quality: Math.min(compressQuality, 0.7),
      label: "体积优先",
    };
  }, [compressMaxDimension, compressQuality, preset]);

  const clearAll = () => {
    compressed.forEach((x) => URL.revokeObjectURL(x.previewUrl));
    setCompressed([]);
    setError(null);
    onCompressedChange?.([]);
    setFileInputKey((k) => k + 1);
  };

  const handlePickCompressed = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setCompressing(true);
    try {
      const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const processed = await Promise.all(
        picked.map(async (file) => compressImageToJpegFile(file, { maxDimension: compressionConfig.maxDimension, quality: compressionConfig.quality })),
      );
      const next = processed.map((file) => ({
        id: makeId(),
        file,
        previewUrl: URL.createObjectURL(file),
        label: "compressed",
      }));
      setCompressed((prev) => {
        const merged = [...prev, ...next];
        onCompressedChange?.(merged.map((x) => x.file));
        return merged;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "压缩失败，请重试");
    } finally {
      setCompressing(false);
      // Allow selecting the same files again after processing.
      setFileInputKey((k) => k + 1);
    }
  };

  const stopDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    stopDrag(event);
    if (compressing) return;
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    stopDrag(event);
    if (compressing) return;
    setIsDragging(true);
    // Let the browser know dropping is a copy operation.
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    stopDrag(event);
    if (compressing) return;
    const related = event.relatedTarget as Node | null;
    if (!related) {
      setIsDragging(false);
      return;
    }
    if (!event.currentTarget.contains(related)) setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    stopDrag(event);
    setIsDragging(false);
    if (compressing) return;
    await handlePickCompressed(event.dataTransfer?.files ?? null);
  };

  const handleExport = () => {
    if (compressedFiles.length === 0) return;
    compressedFiles.forEach((file) => triggerDownload(file));
  };

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">此区域为独立组件：上传后会自动压缩图片体积，支持导出下载。</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-[#00A676] px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all hover:bg-[#00855e] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleExport}
            disabled={compressedFiles.length === 0}
          >
            导出
          </button>
          <button
            type="button"
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
            onClick={clearAll}
            disabled={(compressedFiles.length === 0 && !error) || compressing}
          >
            清空
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-700">{error}</div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            preset === "quality"
              ? "bg-[#00A676]/12 text-[#00A676]"
              : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => setPreset("quality")}
        >
          高清优先
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            preset === "size"
              ? "bg-[#00A676]/12 text-[#00A676]"
              : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => setPreset("size")}
        >
          体积优先
        </button>
        <span className="text-[11px] text-[var(--color-text-muted)]">
          当前：{compressionConfig.label}（最长边 ≤ {compressionConfig.maxDimension}px，quality {compressionConfig.quality.toFixed(2)}）
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section
          className={`rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4 transition-colors ${
            isDragging ? "bg-[var(--color-surface-elevated)]/70 ring-2 ring-[#00A676]/30" : ""
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">{compressedTitle}</div>
              <div className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                会将图片缩放到最长边 ≤ {compressionConfig.maxDimension}px，并以 JPEG（quality {compressionConfig.quality.toFixed(2)}）重新编码以减小体积。
              </div>
              <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">支持拖拽图片到此处</div>
            </div>
            <label className="cursor-pointer rounded-[10px] bg-[#00A676] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-[#00A676]/10 transition-all hover:bg-[#00855e]">
              {compressing ? "处理中..." : "选择图片"}
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={compressing}
                onChange={(e) => void handlePickCompressed(e.target.files)}
              />
            </label>
          </div>

          {compressed.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)]/25 p-4 text-xs text-[var(--color-text-muted)]">
              暂无已压缩图片
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {compressed.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/20">
                  <div className="aspect-square bg-black/5">
                    <img src={img.previewUrl} alt={img.file.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-2">
                    <div className="truncate text-[11px] font-semibold text-[var(--color-text-primary)]" title={img.file.name}>
                      {img.file.name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{formatBytes(img.file.size)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/20 p-4 md:grid-cols-2">
        <div className="text-xs text-[var(--color-text-secondary)]">
          <div className="font-bold uppercase tracking-widest text-[10px] text-[var(--color-text-muted)]">汇总</div>
          <div className="mt-2 flex items-center justify-between">
            <span>压缩图数量</span>
            <span className="font-mono font-bold text-[var(--color-text-primary)]">{compressedFiles.length}</span>
          </div>
        </div>
        <div className="text-xs text-[var(--color-text-secondary)]">
          <div className="font-bold uppercase tracking-widest text-[10px] text-[var(--color-text-muted)]">体积</div>
          <div className="mt-2 flex items-center justify-between">
            <span>压缩图合计</span>
            <span className="font-mono font-bold text-[var(--color-text-primary)]">{formatBytes(compressedFiles.reduce((sum, f) => sum + f.size, 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

