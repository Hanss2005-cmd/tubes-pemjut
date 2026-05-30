import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { X, Play, Info, Video as VideoIcon, Upload, Loader2, FileVideo, Globe } from "lucide-react";
import { doc, collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

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

  const [uploadType, setUploadType] = useState<'file' | 'link'>(video?.url ? "link" : "file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Promo Terbaru", "Barang Baru", "Kegiatan Harian"];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const isAllowedFile = (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".wav", ".mp3", ".ogg", ".m4a"];
    return isVideo || isAudio || allowedExts.includes(ext);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isAllowedFile(file)) {
        setVideoFile(file);
      } else {
        alert("File yang diunggah harus berformat video atau audio (seperti MP4, WEBM, WAV, MP3)!");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isAllowedFile(file)) {
        setVideoFile(file);
      } else {
        alert("File yang diunggah harus berformat video atau audio (seperti MP4, WEBM, WAV, MP3)!");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadType === "file" && !videoFile && !video?.url) {
      alert("Silakan pilih file video untuk diunggah!");
      return;
    }

    let finalVideoUrl = formData.url.trim();
    setIsUploading(true);

    try {
      // If uploading a new file via Firebase Storage
      if (uploadType === "file" && videoFile) {
        const storageRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, videoFile);

        finalVideoUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => {
              console.error("Storage upload failed: ", error);
              reject(error);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      }

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
      setIsUploading(false);
      onClose();
    } catch (error) {
      console.error("Error saving video document or uploading file: ", error);
      setIsUploading(false);
      alert("Gagal mengunggah atau menyimpan video. Pastikan koneksi internet stabil.");
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
          <button onClick={onClose} disabled={isUploading} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition disabled:opacity-50"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Judul Video */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Judul Video / Promo</label>
            <input 
              required 
              disabled={isUploading}
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
                disabled={isUploading}
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} disabled:opacity-50`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Upload Type Tabs */}
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Sumber Video</label>
              <div className="flex border rounded-xl overflow-hidden border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setUploadType("file")}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    uploadType === "file" 
                      ? "bg-blue-600 text-white" 
                      : isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileVideo className="w-4 h-4" /> File Lokal
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setUploadType("link")}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    uploadType === "link" 
                      ? "bg-blue-600 text-white" 
                      : isDarkMode ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Globe className="w-4 h-4" /> Tautan URL
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content: File Upload vs URL Link Input */}
          {uploadType === "file" ? (
            <div className="space-y-4">
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Berkas Media (Video / Audio)</label>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*,audio/*"
                className="hidden"
                disabled={isUploading}
              />

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`py-8 px-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  isDragOver 
                    ? "border-blue-500 bg-blue-500/5" 
                    : isDarkMode 
                    ? "border-slate-700 bg-slate-950/45 hover:border-slate-500 hover:bg-slate-900" 
                    : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/50"
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {videoFile ? (
                  <div className="flex flex-col items-center text-center">
                    <FileVideo className="w-12 h-12 text-blue-500 mb-2 animate-bounce" />
                    <p className="font-bold text-sm max-w-sm truncate">{videoFile.name}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <span className="text-xs text-blue-600 font-black mt-2 underline">Ganti file media</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <Upload className="w-12 h-12 text-slate-400 mb-2" />
                    <p className="font-bold text-sm">Seret & taruh file video / audio di sini</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">atau klik untuk menelusuri komputer Anda</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-2">Mendukung MP4, WEBM, MOV, WAV, MP3, dll.</p>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-1 text-xs font-black">
                    <span className="flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Mengunggah Video ke Server...</span>
                    <span className="text-blue-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1 opacity-50">Link URL / Embed Video</label>
                <input 
                  required={uploadType === "link"}
                  disabled={isUploading}
                  placeholder="YouTube URL, Drive MP4, atau link embed"
                  value={formData.url} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} disabled:opacity-50`} 
                />
              </div>

              <div className={`p-4 rounded-2xl flex gap-3 text-xs leading-relaxed ${isDarkMode ? 'bg-blue-950/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                <Info className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-bold block mb-1">Panduan Pengisian Link:</span>
                  Mendukung link share YouTube biasa (seperti <code className="font-bold underline">https://youtu.be/...</code> atau <code className="font-bold underline">https://youtube.com/watch?v=...</code>), link embed YouTube (<code className="font-bold underline">https://www.youtube.com/embed/...</code>), maupun URL video mentah (<code className="font-bold underline">.mp4</code>). Sistem akan membaca dan memutar link video secara otomatis!
                </div>
              </div>
            </div>
          )}

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Deskripsi Singkat</label>
            <textarea 
              required 
              disabled={isUploading}
              rows={4}
              placeholder="Jelaskan isi video ini, promo terbaru, ketersediaan printer, servis cartridge, dll..."
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} disabled:opacity-50`}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isUploading}
              className={`flex-1 py-4 rounded-xl font-bold border ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} disabled:opacity-50`}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isUploading}
              className="flex-1 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 disabled:bg-blue-700/80 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mengunggah ({uploadProgress}%)
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
