"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Video, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

const DEFAULT_VIDEO  = "/hero.mp4";
const DEFAULT_POSTER = "/hero-poster.jpg";

async function loadSetting(key: string): Promise<string> {
  try {
    const r = await apiFetch<{ key: string; value: string | null }>(`/settings/${key}`);
    return r.value ?? "";
  } catch { return ""; }
}

async function saveSetting(key: string, value: string) {
  return apiFetch(`/settings/${key}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}

export function HeroVideoManager() {
  const [videoUrl,  setVideoUrl]  = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    Promise.all([loadSetting("hero_video_url"), loadSetting("hero_poster_url")])
      .then(([v, p]) => { setVideoUrl(v); setPosterUrl(p); });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("hero_video_url",  videoUrl.trim()  || DEFAULT_VIDEO),
        saveSetting("hero_poster_url", posterUrl.trim() || DEFAULT_POSTER),
      ]);
      toast.success("Hero video đã lưu — trang chủ sẽ cập nhật trong 60 giây");
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setVideoUrl(DEFAULT_VIDEO);
    setPosterUrl(DEFAULT_POSTER);
    await save();
  }

  const inputCls = "w-full border border-edge bg-surface px-4 py-2.5 text-body text-fg outline-none transition-colors focus:border-brand/50 placeholder:text-subtle";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Video size={20} className="text-brand" />
        <h1 className="text-2xl font-black uppercase tracking-wide text-fg">Hero Video</h1>
      </div>

      <div className="space-y-6 border border-edge bg-elevated p-6">
        <p className="text-sm text-muted">
          Nhập URL video (Cloudinary, MP4 trực tiếp). Để trống sẽ dùng{" "}
          <code className="text-brand">hero.mp4</code> mặc định.
        </p>

        <div>
          <label className={labelCls}>URL Video (MP4 / WebM)</label>
          <input
            className={inputCls}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={DEFAULT_VIDEO}
          />
          <p className="mt-1 text-xs text-subtle">Ví dụ: https://res.cloudinary.com/.../video/upload/hero.mp4</p>
        </div>

        <div>
          <label className={labelCls}>URL Poster (ảnh tĩnh hiện trước khi video load)</label>
          <input
            className={inputCls}
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            placeholder={DEFAULT_POSTER}
          />
          <p className="mt-1 text-xs text-subtle">Ví dụ: https://res.cloudinary.com/.../image/upload/hero-poster.jpg</p>
        </div>

        {/* Preview */}
        <div>
          <button
            type="button"
            onClick={() => setPreviewing((v) => !v)}
            className="mb-3 text-xs text-brand underline hover:text-brand/80"
          >
            {previewing ? "Ẩn preview" : "Xem preview"}
          </button>
          {previewing && (
            <div className="relative aspect-video w-full overflow-hidden border border-edge bg-base">
              <video
                key={videoUrl}
                src={videoUrl || DEFAULT_VIDEO}
                poster={posterUrl || DEFAULT_POSTER}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-base/40 flex items-center justify-center">
                <p className="text-xs text-fg/60 uppercase tracking-widest">Preview</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-edge pt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 border border-edge px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-muted transition hover:border-fg hover:text-fg"
          >
            <RefreshCw size={14} /> Reset mặc định
          </button>
        </div>
      </div>
    </div>
  );
}
