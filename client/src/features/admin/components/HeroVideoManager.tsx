"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Video, RefreshCw, Upload, Loader2 } from "lucide-react";
import { apiFetch, getApiUrl } from "@/lib/api/client";
import { getToken } from "@/lib/auth";

const DEFAULT_VIDEO  = "/hero.mp4";
const DEFAULT_POSTER = "/hero-poster.jpg";

async function loadSetting(key: string): Promise<string> {
  try {
    const r = await apiFetch<{ key: string; value: string | null }>(`/settings/${key}`);
    return r.value ?? "";
  } catch { return ""; }
}

async function saveSetting(key: string, value: string) {
  return apiFetch(`/settings/${key}`, { method: "PATCH", body: JSON.stringify({ value }) });
}

async function uploadVideoToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(getApiUrl("/admin/upload-video"), {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Upload failed");
  }
  const data = await res.json() as { url: string };
  return data.url;
}

export function HeroVideoManager() {
  const [videoUrl,   setVideoUrl]   = useState("");
  const [posterUrl,  setPosterUrl]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([loadSetting("hero_video_url"), loadSetting("hero_poster_url")])
      .then(([v, p]) => { setVideoUrl(v); setPosterUrl(p); });
  }, []);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Chỉ chấp nhận file video"); return; }
    if (file.size > 200 * 1024 * 1024) { toast.error("Video phải nhỏ hơn 200MB"); return; }

    setUploading(true);
    setUploadProgress(`Đang upload ${(file.size / 1024 / 1024).toFixed(1)}MB lên Cloudinary…`);
    try {
      const url = await uploadVideoToCloudinary(file);
      setVideoUrl(url);
      setUploadProgress("");
      toast.success("Upload thành công! Nhớ nhấn Lưu để áp dụng.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại");
      setUploadProgress("");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("hero_video_url",  videoUrl.trim()  || DEFAULT_VIDEO),
        saveSetting("hero_poster_url", posterUrl.trim() || DEFAULT_POSTER),
      ]);
      toast.success("Đã lưu — trang chủ cập nhật trong ~60 giây");
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setVideoUrl(DEFAULT_VIDEO);
    setPosterUrl(DEFAULT_POSTER);
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("hero_video_url",  DEFAULT_VIDEO),
        saveSetting("hero_poster_url", DEFAULT_POSTER),
      ]);
      toast.success("Đã reset về mặc định");
    } catch { toast.error("Lưu thất bại"); }
    finally { setSaving(false); }
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

        {/* Upload trực tiếp */}
        <div className="border border-dashed border-edge/60 bg-base p-5 text-center">
          <p className="text-sm font-bold text-fg mb-1">Upload video lên Cloudinary</p>
          <p className="text-xs text-muted mb-4">MP4 / WebM / MOV · Tối đa 200MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 border border-brand/40 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-brand transition hover:bg-brand hover:text-black disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Đang upload…" : "Chọn video"}
          </button>
          {uploadProgress && (
            <p className="mt-3 text-xs text-muted animate-pulse">{uploadProgress}</p>
          )}
          {videoUrl && videoUrl !== DEFAULT_VIDEO && videoUrl.startsWith("http") && (
            <p className="mt-3 text-xs text-success break-all">
              ✅ Đã upload: {videoUrl.slice(0, 60)}…
            </p>
          )}
        </div>

        {/* Hoặc nhập URL thủ công */}
        <div>
          <label className={labelCls}>Hoặc nhập URL video thủ công</label>
          <input
            className={inputCls}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={DEFAULT_VIDEO}
          />
        </div>

        <div>
          <label className={labelCls}>URL Poster (ảnh thumbnail trước khi video load)</label>
          <input
            className={inputCls}
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            placeholder={DEFAULT_POSTER}
          />
        </div>

        {/* Preview */}
        <div>
          <button
            type="button"
            onClick={() => setPreviewing((v) => !v)}
            className="mb-3 text-xs text-brand underline hover:text-brand/80"
          >
            {previewing ? "Ẩn preview" : "Xem preview video"}
          </button>
          {previewing && (
            <div className="relative aspect-video w-full overflow-hidden border border-edge bg-base">
              <video
                key={videoUrl}
                src={videoUrl || DEFAULT_VIDEO}
                poster={posterUrl || DEFAULT_POSTER}
                autoPlay loop muted playsInline
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-edge pt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 bg-brand px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black transition hover:bg-brand/85 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Đang lưu…" : "Lưu & Áp dụng"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={saving}
            className="inline-flex items-center gap-2 border border-edge px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-muted transition hover:border-fg hover:text-fg disabled:opacity-40"
          >
            <RefreshCw size={14} /> Reset mặc định
          </button>
        </div>
      </div>
    </div>
  );
}
