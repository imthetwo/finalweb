import { useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadHeroVideo } from "@/lib/api/admin";
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

  useEffect(() => {
    Promise.all([fetchSettingValue("hero_video_url"), fetchSettingValue("hero_poster_url")])
      .then(([v, p]) => { setVideoUrl(v); setPosterUrl(p); });
  }, []);

  async function handleVideoUpload(file: File) {
    if (!file.type.startsWith("video/")) { toast.error("Chỉ chấp nhận file video"); return; }
    if (file.size > 200 * 1024 * 1024) { toast.error("Video phải nhỏ hơn 200MB"); return; }

    setUploading(true);
    setUploadProgress(`Đang upload ${(file.size / 1024 / 1024).toFixed(1)}MB lên Cloudinary…`);
    try {
      const { url } = await uploadHeroVideo(file);
      setVideoUrl(url);
      setUploadProgress("");
      toast.success("Upload thành công! Nhớ nhấn Lưu để áp dụng.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại");
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        updateSettingValue("hero_video_url",  videoUrl.trim()  || DEFAULT_VIDEO),
        updateSettingValue("hero_poster_url", posterUrl.trim() || DEFAULT_POSTER),
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
        updateSettingValue("hero_video_url",  DEFAULT_VIDEO),
        updateSettingValue("hero_poster_url", DEFAULT_POSTER),
      ]);
      toast.success("Đã reset về mặc định");
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return {
    videoUrl, posterUrl, saving, uploading, uploadProgress,
    setVideoUrl, setPosterUrl,
    handleVideoUpload, save, reset,
  };
}
