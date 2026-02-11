import React, { useEffect, useState } from "react";
import { X, Share2, Download, Clock, Trash2 } from "lucide-react";
import type { Tutorial } from "../store/useDataStore";

interface Props {
  tutorial: Tutorial;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function extractYouTubeId(url: string) {
  if (!url) return null;
  const m =
    url.match(/[?&]v=([\w-]+)/) ||
    url.match(/youtu\.be\/([\w-]+)/) ||
    url.match(/embed\/([\w-]+)/);
  return m ? m[1] : null;
}

export const VideoDetailModal: React.FC<Props> = ({ tutorial, onClose }) => {
  const [description, setDescription] = useState<string | null>(
    tutorial.description || null,
  );
  const [views, setViews] = useState<string | null>(tutorial.views || null);
  const [loading, setLoading] = useState(false);

  const videoId = tutorial.videoUrl
    ? extractYouTubeId(tutorial.videoUrl)
    : null;

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!videoId) return;
      setLoading(true);
      const key = (import.meta.env as any).VITE_YOUTUBE_API_KEY;
      try {
        if (key) {
          const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${key}`;
          const res = await fetch(url);
          const data = await res.json();
          if (!mounted) return;
          const item = data.items && data.items[0];
          if (item) {
            setDescription(item.snippet.description || description);
            setViews(
              item.statistics && item.statistics.viewCount
                ? Intl.NumberFormat().format(item.statistics.viewCount)
                : null,
            );
          }
        } else {
          // fallback to noembed for basic metadata (no view counts)
          const noembed = `https://noembed.com/embed?url=${encodeURIComponent(tutorial.videoUrl || "")}`;
          const res = await fetch(noembed);
          const data = await res.json();
          if (!mounted) return;
          if (data && !description)
            setDescription(data.title ? `${data.title}` : description);
        }
      } catch (e) {
        // ignore errors, show what's available
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-2/3 bg-black">
            <div className="relative" style={{ paddingTop: "56.25%" }}>
              {videoId ? (
                <iframe
                  title={tutorial.title}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <p>No embeddable video URL</p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:w-1/3 p-8 space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-extrabold text-[#871F1E]">
                  {tutorial.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock size={14} /> {tutorial.duration}
                  </div>
                  <div className="px-2 py-0.5 bg-[#FACC00]/10 text-[#FACC00] rounded-md text-xs font-black">
                    Brand
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                <X />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-600">
                  About this video
                </div>
                <div className="text-sm font-black text-slate-400">
                  {loading
                    ? "Loading..."
                    : views
                      ? `${views} views`
                      : "Views unavailable"}
                </div>
              </div>
              <div className="text-sm text-slate-500 max-h-40 overflow-auto leading-relaxed">
                {description || "No description available for this video."}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.confirm("Delete this video from your library?")) {
                    onDelete(tutorial.id);
                  }
                }}
                className="px-4 py-3 bg-white border border-[#ED1B24] text-[#ED1B24] rounded-xl font-bold flex items-center gap-2"
              >
                <Trash2 /> Delete
              </button>
              <button className="flex-1 px-4 py-3 bg-[#ED1B24] text-white rounded-xl font-bold">
                Open on YouTube
              </button>
              <button className="px-3 py-3 bg-[#F58726] text-white rounded-xl">
                <Share2 />
              </button>
              <button className="px-3 py-3 bg-[#FACC00] text-black rounded-xl">
                <Download />
              </button>
            </div>

            <div className="bg-[#FACC00]/10 border border-[#FACC00]/20 rounded-xl p-3 text-xs font-bold text-slate-600">
              Tip: To surface view counts automatically add a YouTube Data API
              key to Vite env as `VITE_YOUTUBE_API_KEY`.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailModal;
