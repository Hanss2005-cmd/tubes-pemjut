import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Play, ArrowLeft, Clock, Film, Award, Flame, Sparkles, ChevronRight, Printer, Volume2, Info } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  createdAt?: any;
}

interface VideoGalleryProps {
  videos: Video[];
  onClose: () => void;
  isDarkMode: boolean;
}

export default function VideoGallery({ videos, onClose, isDarkMode }: VideoGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const categories = ["Semua", "Promo Terbaru", "Barang Baru", "Kegiatan Harian"];

  const isGoogleDrive = (url: string) => {
    if (!url) return false;
    return url.includes("drive.google.com");
  };

  const getGoogleDriveEmbedUrl = (url: string) => {
    let cleanUrl = url.trim();
    const driveMatch = cleanUrl.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([^"&?\/\s]+)/i);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return cleanUrl;
  };

  // Embed URL helper for YouTube videos
  const getEmbedUrl = (url: string) => {
    let rawUrl = url.trim();
    if (!rawUrl) return "";

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";

    const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      // Menggunakan youtube-nocookie.com dengan parameter origin resmi agar YouTube dapat memvalidasi asal domain penyemalan video
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0${originParam}`;
    }

    if (rawUrl.includes("youtube.com/embed/") || rawUrl.includes("youtube-nocookie.com/embed/")) {
      let cleanUrl = rawUrl.replace("youtube.com/embed/", "youtube-nocookie.com/embed/");
      if (originParam) {
        if (cleanUrl.includes("?")) {
          return `${cleanUrl}${originParam}`;
        } else {
          return `${cleanUrl}?${originParam.slice(1)}`;
        }
      }
      return cleanUrl;
    }

    return rawUrl;
  };

  const isYoutube = (url: string) => {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("youtube-nocookie.com");
  };

  const isAudioFile = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.wav') || 
           cleanUrl.endsWith('.mp3') || 
           cleanUrl.endsWith('.ogg') || 
           cleanUrl.endsWith('.m4a') || 
           url.toLowerCase().includes("audio%2f") || 
           url.toLowerCase().includes("audio/");
  };

  const getThumbnail = (url: string) => {
    if (isAudioFile(url)) {
      return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop";
    }
    const rawUrl = url.trim();
    if (isGoogleDrive(rawUrl)) {
      return "https://images.unsplash.com/photo-1626379953822-baec19c3bbcd?q=80&w=600&auto=format&fit=crop";
    }
    const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
    return "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop";
  };

  const filteredVideos = videos.filter(v => {
    const matchesCategory = selectedCategory === "Semua" || v.category === selectedCategory;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <button 
              onClick={() => {
                if (activeVideo) {
                  setActiveVideo(null);
                } else {
                  onClose();
                }
              }} 
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-sm border group mb-6 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95 ${
                isDarkMode 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800/80 text-slate-300 hover:text-white' 
                  : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-650 hover:text-slate-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 group-hover:-translate-x-1 hover:text-blue-500 transition-all duration-300" />
              <span>{activeVideo ? "Kembali ke Beranda Hub" : "Kembali ke Beranda Utama"}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-2 h-10 bg-blue-600 rounded-full" />
              <div>
                <span className="text-xs font-black tracking-widest text-blue-600 uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 fill-current text-amber-500 animate-pulse" /> Mulya Catridge Hub
                </span>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic">
                  GALERI VIDEO & PROMO
                </h1>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <input 
              type="text"
              placeholder="Cari video kegiatan/promo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full py-4 pl-12 pr-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'} focus:outline-none transition-all shadow-md`}
            />
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-none mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                  : isDarkMode
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  : "bg-white border-slate-100 text-slate-600 hover:text-slate-950 hover:bg-slate-100 shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Content Layout */}
        {videos.length === 0 ? (
          <div className="py-24 text-center rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Film className="w-16 h-16 text-slate-400 mx-auto mb-6 animate-pulse" />
            <h3 className="text-2xl font-black mb-2">Video Belum Tersedia</h3>
            <p className="text-slate-500 text-sm italic font-medium">Pengelola belum mengunggah video kegiatan maupun promo baru.</p>
          </div>
        ) : !activeVideo ? (
          /* YouTube Style Grid Layout */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <div 
                  key={video.id}
                  onClick={() => {
                    setActiveVideo(video);
                    window.scrollTo(0, 0);
                  }}
                  className="group cursor-pointer flex flex-col space-y-3"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-100 dark:border-slate-800 shadow-md">
                    <img 
                      src={getThumbnail(video.url)}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-3 rounded-full bg-blue-600 text-white scale-90 group-hover:scale-100 transition-transform shadow-lg">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                    {/* Category Label Overlay */}
                    <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      {video.category}
                    </span>
                  </div>

                  {/* Video Metadata */}
                  <div className="flex gap-3 px-1">
                    {/* Circular Channel Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-black text-white text-[10px] select-none shadow">
                      MC
                    </div>
                    <div className="flex flex-col space-y-1 overflow-hidden">
                      <h3 className="font-extrabold text-sm line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex flex-col text-xs text-slate-400 font-medium">
                        <span>Mulya Catridge</span>
                        <span className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400/80">
                          <Clock className="w-3.5 h-3.5" /> Terbaru
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 text-sm font-medium italic">Hasil tidak ditemukan dengan filter atau pencarian Anda.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Active Featured Player Column */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {activeVideo && (
                  <motion.div
                    key={activeVideo.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Responsive Video Container with true 16:9 box */}
                    <div className="relative aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-black border border-slate-100 dark:border-slate-800">
                      {isYoutube(activeVideo.url) ? (
                        <iframe 
                          src={getEmbedUrl(activeVideo.url)}
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title={activeVideo.title}
                        />
                      ) : isGoogleDrive(activeVideo.url) ? (
                        <iframe 
                          src={getGoogleDriveEmbedUrl(activeVideo.url)}
                          className="absolute inset-0 w-full h-full border-0 text-white"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title={activeVideo.title}
                        />
                      ) : isAudioFile(activeVideo.url) ? (
                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white select-none">
                          <div className="relative flex flex-col items-center justify-center">
                            {/* Decorative glowing background rings */}
                            <div className="absolute w-44 h-44 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
                            <div className="absolute w-32 h-32 rounded-full border border-blue-500/20 animate-ping duration-[3000ms]" />
                            
                            {/* Spinning disk representing custom media record */}
                            <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center shadow-2xl relative animate-spin [animation-duration:12s]">
                              <div className="absolute inset-1 border border-slate-700/50 rounded-full" />
                              <div className="absolute inset-5 border-2 border-dashed border-blue-500/30 rounded-full" />
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center z-10 shadow-lg">
                                <Volume2 className="w-4 h-4 text-white animate-pulse" />
                              </div>
                            </div>
                            
                            <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase mt-4 flex items-center gap-1.5 grayscale-0">
                              🔊 PEMUTAR AUDIO REKAMAN
                            </span>
                          </div>
                          
                          {/* Beautiful Soundwave visualization */}
                          <div className="flex items-end gap-1 h-8 mt-4">
                            {[...Array(16)].map((_, i) => (
                              <div 
                                key={i} 
                                className="w-1 bg-blue-500 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400"
                                style={{
                                  height: `${((i * 7) % 18) + 10}px`,
                                  animation: `bounce 1.${(i % 4) + 1}s infinite alternate`
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Audio player element */}
                          <div className="w-full max-w-sm mt-4">
                            <audio 
                              src={activeVideo.url} 
                              controls 
                              autoPlay 
                              className="w-full h-10 accent-blue-600 rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </div>
                      ) : (
                        <video 
                          src={activeVideo.url} 
                          controls 
                          autoPlay 
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {/* Direct File Download / Alternate Playback Tip */}
                    {!isYoutube(activeVideo.url) && !isGoogleDrive(activeVideo.url) && (
                      <div className={`mt-4 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border text-xs leading-relaxed ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100/70 border-slate-200 text-slate-700'}`}>
                        <div className="flex items-center gap-3">
                          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <div>
                            <span className="font-bold block text-slate-900 dark:text-white">Tips Pemutaran Video / Media:</span>
                            Beberapa browser tidak mendukung pemutaran langsung format tertentu (seperti MKV/AVI/FLV) secara bawaan. Jika video tidak berputar atau macet, Anda dapat mengunduh video untuk diputar langsung di komputer/smartphone.
                          </div>
                        </div>
                        <a 
                          href={activeVideo.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition duration-300 flex items-center gap-2 shadow-md w-full sm:w-auto text-center justify-center flex-shrink-0 cursor-pointer"
                        >
                          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Unduh Media
                        </a>
                      </div>
                    )}

                    {/* Google Drive Option Card */}
                    {isGoogleDrive(activeVideo.url) && (
                      <div className="mt-4">
                        <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-slate-100/70 border-slate-200/60 text-slate-700'}`}>
                          <div className="flex items-center gap-3">
                            <Info className="w-4.5 h-4.5 text-blue-500 flex-shrink-0" />
                            <span className="font-bold">Menonton video premium host Google Drive. Bebas dari gangguan iklan & rekomendasi eksternal video orang lain!</span>
                          </div>
                          <a 
                            href={activeVideo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-md w-full sm:w-auto text-center cursor-pointer"
                          >
                            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            Buka di Drive
                          </a>
                        </div>
                      </div>
                    )}

                    {/* YouTube Backup/Alternative Access Link */}
                    {isYoutube(activeVideo.url) && (
                      <div className="mt-4">
                        <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-slate-100/70 border-slate-200/60 text-slate-700'}`}>
                          <div className="flex items-center gap-3">
                            <Info className="w-4.5 h-4.5 text-blue-500 flex-shrink-0" />
                            <span className="font-bold">Apakah media bermasalah atau tidak berputar? Anda bisa langsung membukanya di YouTube.</span>
                          </div>
                          <a 
                            href={activeVideo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-md w-full sm:w-auto text-center cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Tonton di YouTube
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Active Video Info card */}
                    <div className={`mt-8 p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider">
                          {activeVideo.category}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <Clock className="w-4 h-4" /> Terbaru
                        </span>
                      </div>

                      <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">
                        {activeVideo.title}
                      </h2>
                      
                      <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-6" />

                      <p className={`text-sm md:text-base leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {activeVideo.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar List Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Video Lainnya {filteredVideos.length > 0 && `(${filteredVideos.length})`}
              </h3>

              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredVideos.map((video) => {
                  const isActive = activeVideo?.id === video.id;
                  return (
                    <div 
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className={`group p-4 rounded-3xl border transition-all cursor-pointer flex gap-4 ${
                        isActive 
                          ? (isDarkMode ? 'bg-blue-600/15 border-blue-600' : 'bg-blue-500/5 border-blue-500/30 shadow-md')
                          : (isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md')
                      }`}
                    >
                      {/* Video Snapshot Mini */}
                      <div className="w-32 h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-black shadow-inner border border-slate-200/50 dark:border-slate-800">
                        <img 
                          src={getThumbnail(video.url)}
                          alt={video.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center transition-all group-hover:bg-black/10">
                          <div className={`p-2 rounded-full backdrop-blur-md ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-950'} transition-transform group-hover:scale-110 shadow-md`}>
                            <Play className="w-3 h-3 fill-current" />
                          </div>
                        </div>
                      </div>

                      {/* Video Metadata */}
                      <div className="flex flex-col justify-between py-1 w-full overflow-hidden">
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                          {video.category}
                        </span>
                        <h4 className={`text-xs md:text-sm font-black line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors ${isActive ? 'text-blue-500' : ''}`}>
                          {video.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          Lihat Detail <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredVideos.length === 0 && (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 text-xs italic">Coba ganti kata kunci atau filter kategori.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
