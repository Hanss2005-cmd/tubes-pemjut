import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, Settings, Database, BrainCircuit, Activity, ArrowRight, Lock } from "lucide-react";

interface AdminLandingPageProps {
  key?: string;
  isDarkMode: boolean;
  onStartLogin: () => void;
}

export default function AdminLandingPage({ isDarkMode, onStartLogin }: AdminLandingPageProps) {
  const features = [
    {
      icon: <Settings className="w-6 h-6 text-blue-500" />,
      title: "Manajemen Inventori",
      desc: "Perbarui stok rincian barang, edit harga printer, tinta, toner, serta cartridge secara seketika dan efisien."
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-emerald-500" />,
      title: "Sistem Pakar Diagnostik",
      desc: "Konfigurasi basis pengetahuan dan aturan keputusan cerdas untuk konsultasi mandiri pelanggan."
    },
    {
      icon: <Database className="w-6 h-6 text-indigo-500" />,
      title: "Integrasi Real-Time",
      desc: "Sinkronisasi instan dengan Firestore Database untuk memastikan data pelanggan selalu mutakhir."
    },
    {
      icon: <Activity className="w-6 h-6 text-rose-500" />,
      title: "Pemantauan Status",
      desc: "Pantau kesehatan sistem, jumlah inventori aktif, dan ketersediaan layanan dari satu dashboard terpusat."
    }
  ];

  return (
    <div className={`min-h-screen py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300 flex flex-col justify-center items-center ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-5xl w-full">
        {/* Header/Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest mb-6"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" /> Sesi Terisolasi & Terenkripsi
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`text-5xl md:text-7xl font-black italic tracking-tighter uppercase ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            MULYA CATRIDGE
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              CONTROL CENTER
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto mt-6 text-slate-500 md:text-lg font-medium leading-relaxed"
          >
            Portal administrasi terisolasi khusus pengelola Mulya Catridge. Kelola database katalog produk, optimalkan basis aturan konsultasi cerdas, dan sinkronkan data penawaran.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className={`p-8 rounded-[2rem] border transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl shadow-slate-950/20" : "bg-white border-slate-100 hover:border-slate-200 shadow-xl shadow-slate-100/50"}`}
            >
              <div className={`p-4 rounded-2xl inline-block mb-4 ${isDarkMode ? "bg-slate-950/50" : "bg-slate-50"}`}>
                {feat.icon}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-slate-950"}`}>
                {feat.title}
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={onStartLogin}
            className="group inline-flex items-center gap-3 bg-blue-600 text-white py-5 px-10 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 cursor-pointer"
          >
            <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            Mulai Sesi Otentikasi
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-4 flex items-center justify-center gap-2">
            <span>Session-Only Protection</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>Aman</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
