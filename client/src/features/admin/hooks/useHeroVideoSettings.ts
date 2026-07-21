import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadHeroVideo } from "@/lib/api/admin-products.api";
import { fetchSettingValue, updateSettingValue } from "@/lib/api/settings";

const DEFAULT_VIDEO  = "/hero.mp4";
const DEFAULT_POSTER = "/hero-poster.jpg";

export { DEFAULT_VIDEO, DEFAULT_POSTER };

export function useHeroVideoSettings() {
  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const togglePreview = () => setPreviewing((v) => !v);

  useEffect(() => {
    Promise.all([fetchSettingValue("hero_video_url"), fetchSettingValue("hero_poster_url")])
      .then(([v, p]) => { setVideoUrl(v); setPosterUrl(p); });
  }, []);

  async function handleVideoUpload(file: File) {
    if (!file.type.startsWith("video/")) { toast.error("Only video files are accepted"); return; }
    if (file.size > 200 * 1024 * 1024) { toast.error("Video must be smaller than 200MB"); return; }

    setUploading(true);
    setUploadProgress(`Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB to Cloudinary…`);
    try {
      const { url } = await uploadHeroVideo(file);
      setVideoUrl(url);
      setUploadProgress("");
      toast.success("Upload successful! Remember to click Save to apply.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleVideoUpload(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        updateSettingValue("hero_video_url",  videoUrl.trim()  || DEFAULT_VIDEO),
        updateSettingValue("hero_poster_url", posterUrl.trim() || DEFAULT_POSTER),
      ]);
      toast.success("Saved — the homepage updates within ~60 seconds");
    } catch {
      toast.error("Save failed");
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
        updateSettingValue("hero_video_url",  DEFAULT_VIDEO),
        updateSettingValue("hero_poster_url", DEFAULT_POSTER),
      ]);
      toast.success("Reset to default");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return {
    videoUrl, posterUrl, saving, uploading, uploadProgress,
    previewing, togglePreview, fileRef,
    setVideoUrl, setPosterUrl,
    onFileChange, save, reset,
  };
}
