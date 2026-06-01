import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Play, Info, Video as VideoIcon, Loader2, Globe } from "lucide-react";
import { doc, collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

interface VideoFormProps {
  video?: Video | null;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function VideoForm({ video, onClose, isDarkMode }: VideoFormProps) {
  const [formData, setFormData] = useState({
    title: video?.title || "",
    description: video?.description || "",
    url: video?.url || "",
    category: video?.category || "Promo Terbaru",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categories = ["Promo Terbaru", "Barang Baru", "Kegiatan Harian"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalVideoUrl = formData.url.trim();
    if (!finalVideoUrl) {
      alert("Silakan masukkan tautan URL video terlebih dahulu!");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: finalVideoUrl,
        category: formData.category,
        updatedAt: serverTimestamp()
      };

      if (video) {
        await updateDoc(doc(db, "videos", video.id), data);
      } else {
        await addDoc(collection(db, "videos"), { ...data, createdAt: serverTimestamp() });
      }
      setIsSaving(false);
      onClose();
    } catch (error: any) {
      console.error("Error saving video document: ", error);
      setIsSaving(false);
      
      const errorStr = String(error?.message || error || "");
      let diagnostic = "Gagal menyimpan data ke database. Silakan coba kembali.";

      if (errorStr.includes("permission") || errorStr.includes("Permission denied") || errorStr.includes("insufficient permissions")) {
        diagnostic = "❌ AKSES DITOLAK: Penulisan dokumen 'videos' diblokir oleh aturan database (firestore.rules). Pastikan Anda telah login sebagai administrator.";
      }

      setErrorMsg(diagnostic);
      alert(diagnostic);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-2xl my-8 p-8 rounded-[2.5rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100 text-slate-900'}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-6 h-6 text-blue-500" />
            <h3 className="text-2xl font-black">{video ? 'Edit Video & Promo' : 'Tambah Video Baru'}</h3>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition disabled:opacity-50"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Judul Video */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Judul Video / Promo</label>
            <input 
              required 
              disabled={isSaving}
              placeholder="Contoh: Bongkar Printer Epson L3110 / Update Promo Mulya Catridge"
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} disabled:opacity-50`} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Kategori Video</label>
              <select 
                disabled={isSaving}
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} disabled:opacity-50`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sumber Video (Locked to Link for smooth experience) */}
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Sumber Video</label>
              <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'}`}>
                <Globe className="w-4.5 h-4.5" /> 
                <span>Koneksi Tautan URL Terintegrasi</span>
              </div>
            </div>
          </div>

          {/* Input URL */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Link URL / Embed Video</label>
              <input 
                required
                disabled={isSaving}
                placeholder="Tempel tautan YouTube, Google Drive file, dsb."
                value={formData.url} 
                onChange={e => setFormData({...formData, url: e.target.value})} 
                className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} disabled:opacity-50`} 
              />
            </div>

            <div className={`p-5 rounded-2xl flex gap-3.5 text-xs leading-relaxed ${isDarkMode ? 'bg-blue-950/40 text-blue-300 border border-blue-900/45' : 'bg-blue-50/70 border border-blue-100 text-blue-750'}`}>
              <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />
              <div>
                <span className="font-bold block mb-1 text-sm">💡 Solusi Cepat, Mulus & Bebas Gangguan Iklan:</span>
                <p className="mb-2">
                  Untuk performa putar terbaik dan 100% bersih dari rekomendasi eksternal (video orang lain), kami menyarankan Anda mengggunakan <strong>Google Drive</strong>:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1.5 mb-2 font-medium">
                  <li>Unggah file video Anda ke Google Drive milik Anda pribadi.</li>
                  <li>Ubah pengaturan berbagi link file tersebut menjadi <strong className="underline">"Siapa saja yang memiliki link dapat melihat"</strong>.</li>
                  <li>Salin tautan file-nya, lalu tempelkan di kolom tautan di atas.</li>
                </ol>
                <p className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                  ✨ Pemutar modern Google Drive akan otomatis disematkan dan siap ditonton tanpa buffering panjang atau gangguan "Video lainnya" dari YouTube!
                </p>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Deskripsi Singkat</label>
            <textarea 
              required 
              disabled={isSaving}
              rows={4}
              placeholder="Jelaskan isi video ini, promo terbaru, ketersediaan printer, servis cartridge, dll..."
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} disabled:opacity-50`}
            />
          </div>

          {/* Diagnostic Error Box */}
          {errorMsg && (
            <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-300 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSaving}
              className={`flex-1 py-4 rounded-xl font-bold border ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} disabled:opacity-50`}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 disabled:bg-blue-700/80 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Simpan Video
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
