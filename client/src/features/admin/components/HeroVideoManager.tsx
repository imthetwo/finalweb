"use client";

import { useRef, useState } from "react";
import { Save, Video, RefreshCw, Upload, Loader2 } from "lucide-react";
import { useHeroVideoSettings, DEFAULT_VIDEO, DEFAULT_POSTER } from "@/features/admin/hooks/useHeroVideoSettings";

export function HeroVideoManager() {
  const {
    videoUrl, posterUrl, saving, uploading, uploadProgress,
    setVideoUrl, setPosterUrl, handleVideoUpload, save, reset,
  } = useHeroVideoSettings();
  const [previewing, setPreviewing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleVideoUpload(file);
    if (fileRef.current) fileRef.current.value = "";
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

        {/* Direct upload */}
        <div className="border border-dashed border-edge/60 bg-base p-5 text-center">
          <p className="text-sm font-bold text-fg mb-1">Upload video to Cloudinary</p>
          <p className="text-xs text-muted mb-4">MP4 / WebM / MOV · Max 200MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={onFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 border border-brand/40 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-brand transition hover:bg-brand hover:text-black disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading…" : "Choose Video"}
          </button>
          {uploadProgress && (
            <p className="mt-3 text-xs text-muted animate-pulse">{uploadProgress}</p>
          )}
          {videoUrl && videoUrl !== DEFAULT_VIDEO && videoUrl.startsWith("http") && (
            <p className="mt-3 text-xs text-success break-all">
              ✅ Uploaded: {videoUrl.slice(0, 60)}…
            </p>
          )}
        </div>

        {/* Or enter URL manually */}
        <div>
          <label className={labelCls}>Or enter video URL manually</label>
          <input
            className={inputCls}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={DEFAULT_VIDEO}
          />
        </div>

        <div>
          <label className={labelCls}>Poster URL (thumbnail shown before the video loads)</label>
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
            {previewing ? "Hide preview" : "Preview video"}
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
            <Save size={14} /> {saving ? "Saving…" : "Save & Apply"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={saving}
            className="inline-flex items-center gap-2 border border-edge px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-muted transition hover:border-fg hover:text-fg disabled:opacity-40"
          >
            <RefreshCw size={14} /> Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
