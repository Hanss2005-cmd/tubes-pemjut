import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, ArrowLeft } from "lucide-react";

interface AdminLoginSectionProps {
  key?: string;
  isDarkMode: boolean;
  handleLogin: (e: React.FormEvent, email: string, pass: string) => void;
  onBack?: () => void;
}

export default function AdminLoginSection({ isDarkMode, handleLogin, onBack }: AdminLoginSectionProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    handleLogin(e, email, password);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 pt-28 transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-lg p-10 rounded-[2.5rem] shadow-2xl relative ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-100"}`}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>
        )}

        <div className="text-center mb-8 mt-4">
          <div className="bg-blue-600 p-5 rounded-[2rem] inline-block mb-4 shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-3xl font-black italic tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>ADMIN PORTAL</h2>
          <p className="text-slate-500 mt-2 font-medium">Sistem Kendali Utama Mulya Catridge</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase mb-2 tracking-wider opacity-60">Alamat Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-5 rounded-2xl border font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
              placeholder="admin@mulyacatridge.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2 tracking-wider opacity-60">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-5 rounded-2xl border font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 cursor-pointer"
          >
            Masuk ke Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  );
}
