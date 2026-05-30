import { motion, AnimatePresence } from "motion/react";
import { 
  Printer, 
  Laptop, 
  MapPin, 
  Clock, 
  Phone, 
  Settings, 
  ShoppingCart, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  Sun,
  Moon,
  Smartphone,
  Search,
  ChevronLeft,
  Database,
  Upload,
  Link as LinkIcon,
  Film
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  getDocs
} from "firebase/firestore";

import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { db, auth } from "./lib/firebase";
import AdminLoginSection from "./components/AdminLoginSection";
import AdminLandingPage from "./components/AdminLandingPage";
import VideoForm from "./components/VideoForm";
import VideoGallery from "./components/VideoGallery";

// WhatsApp Configuration
const WA_NUMBER = "6281223747477";
const WA_MSG_TEMPLATE = `Halo, saya ingin menggunakan layanan Mulya Catridge.

Keperluan: (Service / Beli / Jual)
Produk: (Printer / Laptop / PC)
Merek/Tipe:
Keluhan/Keterangan:
Lokasi:

Mohon bantuannya, terima kasih.`;

const WA_LINK = `https://wa.me/${WA_NUMBER}`;
const WA_CONTACT_LINK = `${WA_LINK}?text=${encodeURIComponent(WA_MSG_TEMPLATE)}`;
const WA_CONTACT_ADMIN_LINK = `${WA_LINK}?text=${encodeURIComponent("Halo Admin, saya ingin login.")}`;
// Any user managed via Firebase Console is an authorized admin
const ADMIN_EMAILS = [];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Modal Component Interfaces
interface ExpertSystemModalProps {
  expertStep: number;
  expertCategory: "Printer" | "Laptop" | null;
  expertType: string;
  selectedSymptoms: string[];
  expertAnswers: Record<string, boolean>;
  diagnosisResults: {diagnosis: string, solution: string}[];
  dynamicQuestions: string[];
  isAnalyzing: boolean;
  isDarkMode: boolean;
  expertData: any;
  setShowExpertSystem: (show: boolean) => void;
  setExpertStep: (step: number) => void;
  setExpertCategory: (cat: "Printer" | "Laptop" | null) => void;
  setExpertType: (type: string) => void;
  setSelectedSymptoms: (symptoms: string[]) => void;
  setExpertAnswers: (answers: Record<string, boolean>) => void;
  setDiagnosisResults: (results: any[]) => void;
  setDynamicQuestions: (questions: string[]) => void;
  generateExpertQuestions: (cat: "Printer" | "Laptop", symptoms: string[]) => string[];
  analyzeProblem: () => void;
  resetExpert: () => void;
  isMenuOpen: boolean;
  waCooldown: boolean;
  waCooldownTime: number;
  handleWAContact: (url: string) => void;
}

interface AdminLoginModalProps {
  key?: string;
  isDarkMode: boolean;
  setShowAdminLogin: (show: boolean) => void;
  handleLogin: (e: React.FormEvent, email: string, pass: string) => void;
}

interface ProductDetailModalProps {
  key?: string;
  product: Product;
  onClose: () => void;
  isDarkMode: boolean;
  waCooldown: boolean;
  waCooldownTime: number;
  handleWAContact: (url: string) => void;
}

interface AdminPanelProps {
  key?: string;
  isDarkMode: boolean;
  products: Product[];
  services: Service[];
  expertRules: DiagnosisRule[];
  videos: Video[];
  isAdmin: boolean;
  isAnalyzing: boolean;
  seedData: () => void;
  handleLogout: () => void;
  setShowAdminPanel: (show: boolean) => void;
  handleInitializeExpertData: () => void;
}

const AdminLoginModal = ({ isDarkMode, setShowAdminLogin, handleLogin }: AdminLoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-md p-8 rounded-[2rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'}`}
      >
        <div className="text-center mb-8">
          <div className="bg-blue-600 p-4 rounded-3xl inline-block mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black italic">ADMIN LOGIN</h2>
          <p className="text-slate-500 mt-2">Masuk untuk mengelola toko.</p>
        </div>
        
        <form onSubmit={(e) => handleLogin(e, email, password)} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
              placeholder="admin@mulyacartridge.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-4 mt-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
          >
            Login Sekarang
          </button>
        </form>
        
        <button 
          onClick={() => setShowAdminLogin(false)}
          className="w-full mt-4 py-3 text-slate-500 font-semibold hover:text-slate-700 transition"
        >
          Batal
        </button>
      </motion.div>
    </div>
  );
};

const ProductDetailModal = ({ product, onClose, isDarkMode, waCooldown, waCooldownTime, handleWAContact }: ProductDetailModalProps) => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-4xl my-8 rounded-[3rem] overflow-hidden shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 z-20 p-3 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-1/2 aspect-square lg:aspect-auto relative bg-slate-100 dark:bg-slate-800">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute top-8 left-8">
            <span className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-full uppercase tracking-widest">{product.category}</span>
          </div>
        </div>

        <div className="lg:w-1/2 p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-tight">{product.name}</h3>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{product.price}</p>
          </div>

          <div className="mb-10">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Deskripsi Produk</h4>
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{product.description}</p>
          </div>

          <div className="mb-12">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Spesifikasi Utama</h4>
            <ul className="grid grid-cols-1 gap-4">
              {product.specs.map((spec, i) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-150 transition-all" />
                  <span className="text-sm font-bold opacity-80">{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => handleWAContact(`${WA_LINK}?text=${encodeURIComponent(`Halo Mulya Catridge, saya tertarik dengan produk:
*${product.name}*

Bisakah saya tanya lebih lanjut?
Foto: ${product.image.startsWith('http') ? product.image : window.location.origin + product.image}`)}`)}
              className={`flex-1 ${waCooldown ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none shadow-xl'} text-white px-8 py-4 rounded-2xl font-bold text-center transition-all`}
            >
              {waCooldown ? `Tunggu ${waCooldownTime}s...` : 'Pesan Sekarang via WA'}
            </button>
            <button 
              onClick={onClose}
              className={`flex-1 px-8 py-4 rounded-2xl font-bold border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

const ProductForm = ({ product, onClose, isDarkMode }: { product?: Product, onClose: () => void, isDarkMode: boolean }) => {
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "Printer",
    price: product?.price || "",
    image: product?.image || "",
    description: product?.description || "",
    specs: product?.specs.join("\n") || ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 storage in Firestore
        alert("File terlalu besar. Maksimal 1MB untuk upload langsung. Gunakan URL untuk file besar.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      specs: formData.specs.split("\n").filter(s => s.trim() !== ""),
      updatedAt: serverTimestamp()
    };

    try {
      if (product) {
        await updateDoc(doc(db, "products", product.id), data);
      } else {
        await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, product ? OperationType.UPDATE : OperationType.CREATE, `products/${product?.id || ''}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-2xl my-8 p-8 rounded-[2.5rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Nama Produk</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Kategori</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <option>Printer</option>
                <option>Laptop</option>
                <option>Desktop</option>
                <option>Accessories</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Harga (Teks, misal: Rp 1.500.000)</label>
              <input required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase opacity-50">Foto Produk</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${imageMode === 'url' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}
                  >URL</button>
                  <button 
                    type="button"
                    onClick={() => setImageMode("upload")}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${imageMode === 'upload' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}
                  >Upload</button>
                </div>
              </div>
              
              {imageMode === 'url' ? (
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    required 
                    placeholder="https://..."
                    value={formData.image} 
                    onChange={e => setFormData({...formData, image: e.target.value})} 
                    className={`w-full p-3 pl-10 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'} transition`}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-bold">{formData.image.startsWith('data:') ? 'Ganti File' : 'Pilih File'}</span>
                  </button>
                  {formData.image.startsWith('data:') && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-blue-600">
                      <img src={formData.image} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Deskripsi Ringkas</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Spesifikasi (Satu per baris)</label>
            <textarea value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} rows={4} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700">Simpan Produk</button>
            <button type="button" onClick={onClose} className={`flex-1 py-4 rounded-xl font-bold border ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>Batal</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ServiceForm = ({ service, onClose, isDarkMode }: { service?: Service, onClose: () => void, isDarkMode: boolean }) => {
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [formData, setFormData] = useState({
    title: service?.title || "",
    description: service?.description || "",
    price: service?.price || "",
    icon: service?.icon || "Printer",
    image: service?.image || ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("File terlalu besar. Maksimal 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (service) {
        await updateDoc(doc(db, "services", service.id), formData);
      } else {
        await addDoc(collection(db, "services"), formData);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, service ? OperationType.UPDATE : OperationType.CREATE, `services/${service?.id || ''}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-xl my-8 p-8 rounded-[2.5rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black">{service ? 'Edit Layanan' : 'Tambah Layanan'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Judul Layanan</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Harga (Mulai dari...)</label>
              <input required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Icon</label>
              <select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <option>Printer</option>
                <option>Laptop</option>
                <option>ShoppingCart</option>
                <option>Settings</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase opacity-50">Foto Layanan (Opsional)</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${imageMode === 'url' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}
                >URL</button>
                <button 
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${imageMode === 'upload' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}
                >Upload</button>
              </div>
            </div>
            
            {imageMode === 'url' ? (
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  placeholder="https://..."
                  value={formData.image} 
                  onChange={e => setFormData({...formData, image: e.target.value})} 
                  className={`w-full p-3 pl-10 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
                />
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'} transition`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-bold">{formData.image && formData.image.startsWith('data:') ? 'Ganti File' : 'Pilih File'}</span>
                </button>
                {formData.image && formData.image.startsWith('data:') && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-blue-600">
                    <img src={formData.image} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Deskripsi</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700">Simpan Layanan</button>
            <button type="button" onClick={onClose} className={`flex-1 py-4 rounded-xl font-bold border ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>Batal</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const RuleForm = ({ rule, onClose, isDarkMode }: { rule?: DiagnosisRule, onClose: () => void, isDarkMode: boolean }) => {
  const [formData, setFormData] = useState({
    category: rule?.category || "Printer",
    diagnosis: rule?.diagnosis || "",
    solution: rule?.solution || "",
    logic: rule?.logic || "OR",
    symptoms: rule?.symptoms.join("\n") || "",
    questions: rule?.questions.map(q => `${q.text}|${q.expected}`).join("\n") || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const processedData = {
      category: formData.category,
      diagnosis: formData.diagnosis,
      solution: formData.solution,
      logic: formData.logic,
      symptoms: formData.symptoms.split("\n").filter(s => s.trim() !== ""),
      questions: formData.questions.split("\n")
        .filter(line => line.includes("|"))
        .map(line => {
           const [text, expected] = line.split("|");
           return { text: text.trim(), expected: expected.trim().toLowerCase() === "true" };
        })
    };

    try {
      if (rule) {
        await updateDoc(doc(db, "expert_rules", rule.id), processedData as any);
      } else {
        await addDoc(collection(db, "expert_rules"), processedData);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, rule ? OperationType.UPDATE : OperationType.CREATE, `expert_rules/${rule?.id || ''}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-2xl my-8 p-8 rounded-[2.5rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}
      >
        <h3 className="text-2xl font-black mb-6">{rule ? 'Edit Aturan' : 'Tambah Aturan Pakar'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Kategori</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <option>Printer</option>
                <option>Laptop</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Logika Aturan</label>
              <select value={formData.logic} onChange={e => setFormData({...formData, logic: e.target.value as any})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <option value="AND">AND (Semua Gejala)</option>
                <option value="OR">OR (Salah Satu Gejala)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Diagnosa Penyakit/Kerusakan</label>
            <input required value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Solusi Perbaikan</label>
            <textarea required value={formData.solution} onChange={e => setFormData({...formData, solution: e.target.value})} rows={3} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Gejala (Satu per baris)</label>
            <textarea required value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} rows={4} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 opacity-50">Pertanyaan Yes/No (Format: Pertanyaan|true) - Satu per baris</label>
            <textarea required value={formData.questions} onChange={e => setFormData({...formData, questions: e.target.value})} rows={4} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700">Simpan Rule</button>
            <button type="button" onClick={onClose} className={`flex-1 py-4 rounded-xl font-bold border ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>Batal</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AdminPanel = ({ 
  isDarkMode, 
  products, 
  services, 
  expertRules, 
  videos,
  isAdmin, 
  isAnalyzing, 
  seedData, 
  handleLogout, 
  setShowAdminPanel,
  handleInitializeExpertData
}: AdminPanelProps) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<DiagnosisRule | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const scrollTo = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div id="admin_stats" className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-1 bg-blue-600 rounded-full" />
              <span className="text-blue-600 font-black tracking-widest text-sm uppercase">Secure Area</span>
            </div>
            <h1 className="text-6xl font-black italic tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ADMIN DASHBOARD</h1>
            <p className="text-slate-500 font-medium text-lg mt-2">Pusat kontrol & intelijen bisnis Mulya Catridge</p>
          </div>
          <div className="flex gap-4">
            <button onClick={handleLogout} className="px-8 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center gap-2 active:scale-95">
              <X className="w-5 h-5" /> Keluar
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            { label: "Total Inventori", value: products.length, icon: ShoppingCart, color: "blue" },
            { label: "Layanan Aktif", value: services.length, icon: Settings, color: "indigo" },
            { label: "Video & Promo", value: videos.length, icon: Film, color: "rose" },
            { label: "Aturan Pakar", value: expertRules.length, icon: ShieldCheck, color: "purple" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`p-8 rounded-[2.5rem] border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-500' :
                stat.color === 'rose' ? 'bg-rose-500/10 text-rose-500' :
                'bg-purple-500/10 text-purple-500'
              }`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {!products.length && (
          <div className="mb-12 p-10 rounded-[3rem] bg-blue-600/5 border-2 border-dashed border-blue-600/30 text-center">
            <h3 className="text-2xl font-black mb-4">Database Kosong?</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto italic font-medium">Klik tombol dibawah untuk memasukkan data demo produk & layanan secara otomatis.</p>
            <button onClick={seedData} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-blue-200 dark:shadow-none">⚡ Inisialisasi Data Demo</button>
          </div>
        )}

        {/* Manage Products */}
        <div id="admin_products" className="mb-24 scroll-mt-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black tracking-tight">Manajemen Produk</h2>
            <button onClick={() => setShowProductForm(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
              <Upload className="w-5 h-5" /> Tambah Produk
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <div key={p.id} className={`group overflow-hidden rounded-[2.5rem] border transition-all hover:shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:shadow-slate-200'}`}>
                <div className="aspect-video relative overflow-hidden">
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest">{p.category}</span>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="font-bold text-xl mb-1 line-clamp-1">{p.name}</h4>
                  <p className="text-blue-600 font-black text-lg mb-6">{p.price}</p>
                  <div className="flex gap-3">
                    <button onClick={() => setEditingProduct(p)} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition">Ubah</button>
                    <button onClick={async () => { 
                      if(confirm("Hapus produk?")) {
                        try {
                          await deleteDoc(doc(db, "products", p.id));
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, `products/${p.id}`);
                        }
                      } 
                    }} className="px-5 py-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Services */}
        <div id="admin_services" className="mb-24 scroll-mt-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black tracking-tight">Daftar Layanan</h2>
            <button onClick={() => setShowServiceForm(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none">
              <Settings className="w-5 h-5" /> Tambah Layanan
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(s => (
              <div key={s.id} className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                {s.image && (
                  <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                    <img src={s.image} className="w-full h-full object-cover" />
                  </div>
                )}
                <h4 className="font-bold text-xl mb-1">{s.title}</h4>
                <p className="text-blue-600 font-bold mb-4">{s.price}</p>
                <p className="text-sm text-slate-500 mb-8 line-clamp-2 leading-relaxed">{s.description}</p>
                <div className="flex gap-3">
                  <button onClick={() => setEditingService(s)} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">Ubah</button>
                  <button onClick={async () => { 
                    if(confirm("Hapus layanan?")) {
                      try {
                        await deleteDoc(doc(db, "services", s.id));
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, `services/${s.id}`);
                      }
                    }
                  }} className="px-5 py-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Expert Rules */}
        <div id="admin_expert" className="mb-24 scroll-mt-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black tracking-tight">Aturan Sistem Pakar</h2>
            <button 
              onClick={() => setShowRuleForm(true)} 
              className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 dark:shadow-none"
            >
              <ShieldCheck className="w-5 h-5" /> Tambah Aturan
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {expertRules.map(r => (
              <div key={r.id} className={`p-8 rounded-[2rem] border flex flex-col md:flex-row justify-between items-center gap-6 transition-all hover:shadow-lg ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex-1 w-full text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-4 py-1 text-[10px] uppercase font-black rounded-full text-white shadow-sm ${r.category === 'Printer' ? 'bg-blue-600' : 'bg-indigo-600'}`}>{r.category}</span>
                    <h4 className="font-bold text-lg">{r.diagnosis}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {r.symptoms.slice(0, 3).map((sym, idx) => (
                       <span key={idx} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{sym}</span>
                     ))}
                     {r.symptoms.length > 3 && <span className="text-[10px] font-bold text-slate-400">+{r.symptoms.length - 3} lagi...</span>}
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={() => setEditingRule(r)} className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-md">Ubah Rule</button>
                  <button onClick={async () => { 
                    if(confirm("Hapus aturan diagnosa?")) {
                      try {
                        await deleteDoc(doc(db, "expert_rules", r.id));
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, `expert_rules/${r.id}`);
                      }
                    }
                  }} className="px-5 py-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-12 p-8 rounded-[2.5rem] border-2 border-dashed ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} text-center`}>
          <h3 className="text-lg font-bold mb-2">Pusat Inisialisasi Sistem Pakar</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-lg mx-auto">
            Gunakan tombol ini jika data aturan diagnosa masih (0). Ini akan memasukkan puluhan aturan diagnosa awal dari kode ke database Firestore Anda.
          </p>
          <button 
            onClick={handleInitializeExpertData}
            disabled={isAnalyzing}
            className={`px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:scale-105 transition-all flex items-center gap-2 mx-auto ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Database className="w-5 h-5" />
            {isAnalyzing ? "Sedang Memproses..." : "Inisialisasi Data Dasar"}
          </button>
        </div>

        {/* Manage Videos & Promo */}
        <div id="admin_videos" className="mt-24 mb-24 scroll-mt-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Kelola Galeri Video & Promo</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Unggah video dokumentasi promo terbaru, serah terima, kegiatan harian, dll.</p>
            </div>
            <button 
              onClick={() => { setEditingVideo(null); setShowVideoForm(true); }} 
              className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-none active:scale-95 self-end sm:self-auto"
            >
              <Film className="w-5 h-5 bg-transparent" /> Tambah Video Baru
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(v => (
              <div key={v.id} className={`p-6 rounded-[2.5rem] border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 text-[9px] uppercase font-black rounded-full text-white bg-rose-600 shadow-sm">{v.category}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">{v.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">{v.description}</p>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{v.url}</div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => { setEditingVideo(v); setShowVideoForm(true); }} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md">Ubah Video</button>
                  <button onClick={async () => { 
                    if(confirm("Hapus video ini?")) {
                      try {
                        await deleteDoc(doc(db, "videos", v.id));
                      } catch (error) {
                        console.error("Gagal menghapus video: ", error);
                      }
                    }
                  }} className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="col-span-1 md:col-span-3 py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
                <Film className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                <p className="text-slate-500 font-bold text-sm">Belum ada video diunggah.</p>
              </div>
            )}
          </div>
        </div>

        {/* Item Forms */}
        {showProductForm && <ProductForm isDarkMode={isDarkMode} onClose={() => setShowProductForm(false)} />}
        {editingProduct && <ProductForm isDarkMode={isDarkMode} product={editingProduct} onClose={() => setEditingProduct(null)} />}
        {showServiceForm && <ServiceForm isDarkMode={isDarkMode} onClose={() => setShowServiceForm(false)} />}
        {editingService && <ServiceForm isDarkMode={isDarkMode} service={editingService} onClose={() => setEditingService(null)} />}
        {showRuleForm && <RuleForm isDarkMode={isDarkMode} onClose={() => setShowRuleForm(false)} />}
        {editingRule && <RuleForm isDarkMode={isDarkMode} rule={editingRule} onClose={() => setEditingRule(null)} />}
        {showVideoForm && <VideoForm isDarkMode={isDarkMode} onClose={() => setShowVideoForm(false)} />}
        {editingVideo && <VideoForm isDarkMode={isDarkMode} video={editingVideo} onClose={() => setEditingVideo(null)} />}
      </div>
    </motion.div>
  );
};

const ExpertSystemModal = ({
  expertStep,
  expertCategory,
  expertType,
  selectedSymptoms,
  expertAnswers,
  diagnosisResults,
  dynamicQuestions,
  isAnalyzing,
  isDarkMode,
  expertData,
  setShowExpertSystem,
  setExpertStep,
  setExpertCategory,
  setExpertType,
  setSelectedSymptoms,
  setExpertAnswers,
  setDiagnosisResults,
  setDynamicQuestions,
  generateExpertQuestions,
  analyzeProblem,
  resetExpert,
  waCooldown,
  waCooldownTime,
  handleWAContact
}: ExpertSystemModalProps) => {
  const printerBrands = ["epson", "canon", "brother", "hp", "lexmark", "samsung", "xerox", "kyocera", "ricoh", "pantum"];
  const laptopBrands = ["asus", "acer", "lenovo", "hp", "dell", "apple", "macbook", "msi", "toshiba", "vaio", "axioo", "huawei", "xiaomi", "gigabyte", "zyrex", "razer"];
  const [brandError, setBrandError] = useState("");

  const validateBrand = (text: string) => {
    const lowerText = text.toLowerCase();
    if (expertCategory === "Laptop") {
      const foundPrinter = printerBrands.find(b => lowerText.includes(b));
      if (foundPrinter && !laptopBrands.find(b => lowerText.includes(b))) {
        if (foundPrinter === 'hp') return true;
        setBrandError(`${foundPrinter.toUpperCase()} biasanya adalah Printer. Mohon masukkan merk Laptop.`);
        return false;
      }
    } else if (expertCategory === "Printer") {
      const foundLaptop = laptopBrands.find(b => lowerText.includes(b));
      if (foundLaptop && !printerBrands.find(b => lowerText.includes(b))) {
        if (foundLaptop === 'hp') return true;
        setBrandError(`${foundLaptop.toUpperCase()} biasanya adalah Laptop. Mohon masukkan merk Printer.`);
        return false;
      }
    }
    setBrandError("");
    return true;
  };

  const data = expertData || DEFAULT_EXPERT_DATA;
  const symptoms = expertCategory ? data[expertCategory].symptoms : [];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className={`w-full max-w-2xl my-8 p-8 rounded-[2.5rem] shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}>
        <button 
          onClick={() => { setShowExpertSystem(false); resetExpert(); }}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">STEP {expertStep}/5</span>
            <h2 className="text-2xl font-black italic">DIAGNOSA MANDIRI</h2>
          </div>
          <p className="text-slate-500 text-sm">Sistem Pakar Forward Chaining - Deteksi Berbasis Gejala.</p>
        </div>

        <div className="space-y-6">
          {expertStep === 1 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center">Pilih Perangkat untuk Mulai Diagnosa:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => { setExpertCategory("Printer"); setExpertStep(2); }}
                  className={`p-10 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${expertCategory === "Printer" ? 'border-blue-600 bg-blue-600/5' : 'border-slate-100 dark:border-slate-800 hover:border-blue-600/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}
                >
                  <Printer className="w-16 h-16 text-blue-600" />
                  <span className="font-black text-xl uppercase tracking-widest">Printer</span>
                </button>
                <button 
                  onClick={() => { setExpertCategory("Laptop"); setExpertStep(2); }}
                  className={`p-10 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${expertCategory === "Laptop" ? 'border-blue-600 bg-blue-600/5' : 'border-slate-100 dark:border-slate-800 hover:border-blue-600/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}
                >
                  <Laptop className="w-16 h-16 text-blue-600" />
                  <span className="font-black text-xl uppercase tracking-widest">Laptop / PC</span>
                </button>
              </div>
            </div>
          )}

          {expertStep === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-6">Tulis Merk & Tipe {expertCategory}:</h3>
              <div className="relative mb-8">
                <input 
                  autoFocus
                  placeholder={`Contoh: ${expertCategory === 'Laptop' ? 'Asus ROG Strix' : 'Epson L3110'}`}
                  value={expertType}
                  onChange={e => {
                    setExpertType(e.target.value);
                    validateBrand(e.target.value);
                  }}
                  className={`w-full p-6 rounded-2xl border-2 text-xl font-bold focus:outline-none transition-all ${brandError ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : (isDarkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-200 focus:border-blue-600')}`}
                />
                {brandError && (
                  <p className="text-red-500 text-xs font-bold mt-2 absolute left-2">
                    ⚠️ {brandError}
                  </p>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => { setExpertStep(1); setBrandError(""); }} className="flex-1 py-4 font-bold rounded-xl border border-slate-200">Kembali</button>
                <button 
                  disabled={!expertType || !!brandError} 
                  onClick={() => setExpertStep(3)} 
                  className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95"
                >
                  Lanjut ke Gejala
                </button>
              </div>
            </div>
          )}

          {expertStep === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Pilih Gejala yang Sesuai (Bisa Lebih dari Satu):</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto p-2 border-y border-slate-100 dark:border-slate-800 custom-scrollbar">
                {symptoms.map(s => (
                  <button 
                    key={s}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (selectedSymptoms.includes(s)) setSelectedSymptoms(selectedSymptoms.filter(i => i !== s));
                      else setSelectedSymptoms([...selectedSymptoms, s]);
                    }}
                    className={`p-3 text-left text-sm font-semibold rounded-xl border-2 transition-all ${selectedSymptoms.includes(s) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'border-slate-100 dark:border-slate-800 hover:border-blue-600/30'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setExpertStep(2)} className="flex-1 py-4 font-bold rounded-xl border border-slate-200 text-slate-500">Kembali</button>
                <button 
                  disabled={selectedSymptoms.length === 0} 
                  onClick={() => {
                    setDynamicQuestions(generateExpertQuestions(expertCategory!, selectedSymptoms));
                    setExpertStep(4);
                  }} 
                  className="flex-[2] bg-blue-600 text-white py-4 font-bold rounded-xl disabled:opacity-50"
                >
                  Lanjut Diagnosa
                </button>
              </div>
            </div>
          )}

          {expertStep === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Verifikasi Informasi Tambahan:</h3>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto p-2 pr-4 custom-scrollbar">
                {dynamicQuestions.map((q, i) => (
                  <div key={i} className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-sm font-bold opacity-80">{i+1}. {q}</p>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setExpertAnswers({...expertAnswers, [q]: true}); }}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${expertAnswers[q] === true ? 'bg-green-500 text-white ring-4 ring-green-500/20 shadow-lg' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >IYA</button>
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setExpertAnswers({...expertAnswers, [q]: false}); }}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${expertAnswers[q] === false ? 'bg-red-500 text-white ring-4 ring-red-500/20 shadow-lg' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >TIDAK</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setExpertStep(3)} className="flex-1 py-4 font-bold rounded-xl border border-slate-200 text-slate-500">Kembali</button>
                <button 
                  disabled={Object.keys(expertAnswers).length < dynamicQuestions.length || isAnalyzing}
                  onClick={analyzeProblem} 
                  className="flex-[2] bg-blue-600 text-white py-4 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {isAnalyzing ? "Menganalisa..." : "Lihat Hasil Diagnosa"}
                </button>
              </div>
            </div>
          )}

          {expertStep === 5 && (
            <div key="step5" className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500/20">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-green-500">Analisa Forward Chaining Selesai</h3>
                <h4 className="text-2xl font-black mt-1 uppercase italic leading-tight">Ditemukan {diagnosisResults.length || 1} Indikasi Kerusakan</h4>
              </div>

              <div className="space-y-4 max-h-[35vh] overflow-y-auto px-1 custom-scrollbar">
                {diagnosisResults.length > 0 ? (
                  diagnosisResults.map((result, idx) => (
                    <div key={idx} className={`p-5 rounded-3xl border-2 ${isDarkMode ? 'border-slate-800 bg-slate-800/40' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-6 bg-red-500 rounded-full" />
                        <h5 className="font-black text-lg uppercase italic">{result.diagnosis}</h5>
                      </div>
                      <p className="text-xs font-black uppercase mb-1 opacity-50 text-blue-500">Saran & Solusi:</p>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-semibold">{result.solution}</p>
                    </div>
                  ))
                ) : (
                  <div className={`p-5 rounded-3xl border-2 ${isDarkMode ? 'border-slate-800 bg-slate-800/40' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-6 bg-blue-500 rounded-full" />
                      <h5 className="font-black text-lg uppercase italic">Analisa Pendalamam</h5>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-semibold">Berdasarkan gejala yang ada, kami mendeteksi perlunya pengecekan fisik lebih lanjut. Silakan hubungi teknisi kami.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => handleWAContact(`${WA_LINK}?text=Halo Mulya Catridge, saya melakukan diagnosa mandiri untuk ${expertCategory} ${expertType}. Hasil diagnosa: ${diagnosisResults.map(r => r.diagnosis).join(", ")}. Saya ingin konsultasi perbaikan.`)}
                  className={`flex-1 ${waCooldown ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-500 hover:scale-[1.02] shadow-green-500/20 shadow-xl'} text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all`}
                >
                  <Smartphone className="w-5 h-5" /> {waCooldown ? `TUNGGU ${waCooldownTime}S...` : 'CHAT TEKNISI SEKARANG'}
                </button>
                <button onClick={resetExpert} className={`flex-1 py-4 rounded-2xl font-bold border ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}> ULANGI DIAGNOSA</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Expert System Knowledge Base Mapping
interface DiagnosisRule {
  id: string;
  category: "Printer" | "Laptop";
  symptoms: string[]; // At least one of these must match
  logic: "OR" | "AND";
  questions: { text: string; expected: boolean }[];
  diagnosis: string;
  solution: string;
}

const DEFAULT_EXPERT_RULES: DiagnosisRule[] = [
  // PRINTER RULES
  { id: "p1", category: "Printer", symptoms: ["Hasil cetak bergaris", "Warna tidak keluar", "Text terputus-putus", "Warna pudar", "Head buntu (Clogged)"], logic: "OR", 
    questions: [
      { text: "Apakah printer sudah tidak digunakan lebih dari 1 minggu?", expected: true },
      { text: "Apakah sudah mencoba deep cleaning lewat driver?", expected: true },
      { text: "Apakah selang infus terlihat ada gelembung udara?", expected: true },
      { text: "Apakah Anda sering menggunakan tinta non-original (isi ulang)?", expected: true }
    ],
    diagnosis: "Print Head Tersumbat / Kering",
    solution: "Lakukan Power Ink Flushing via Maintenance Software. Jika tetap, Head perlu di-servis manual menggunakan cairan head cleaner oleh teknisi atau ganti nozzle head."
  },
  { id: "p2", category: "Printer", symptoms: ["Lampu orange berkedip", "Pesan 'Service Required'", "Resetter minta dijalankan", "Waste ink tank penuh (Epson)"], logic: "OR",
    questions: [
      { text: "Apakah muncul kode error seperti 'Ink pad is at the end of its service life'?", expected: true },
      { text: "Apakah lampu power dan resume berkedip bergantian?", expected: true },
      { text: "Apakah printer sudah mencetak lebih dari puluhan ribu kartu/halaman?", expected: true }
    ],
    diagnosis: "Waste Ink Pad Meter Full (Bantalan Tinta Penuh)",
    solution: "Printer perlu di-reset menggunakan software Resetter khusus tipe tersebut. Kami sarankan juga untuk mengganti atau mencuci busa pembuangan tinta agar tidak meluber ke komponen lain."
  },
  { id: "p3", category: "Printer", symptoms: ["Kertas macet (Paper Jam)", "Suara berisik saat narik kertas", "Kertas robek saat keluar", "Kertas miring saat ditarik", "Kertas terlipat saat ditarik"], logic: "OR",
    questions: [
      { text: "Apakah ada benda asing seperti klip atau potongan kertas di dalam?", expected: true },
      { text: "Apakah Anda menggunakan kertas yang terlalu tebal atau lembab?", expected: true },
      { text: "Apakah roller penarik kertas terlihat berputar tapi tidak menarik?", expected: true }
    ],
    diagnosis: "Mekanik Pickup Roller / Sensor Kertas Bermasalah",
    solution: "Bersihkan roller penarik kertas dari debu. Jika roller aus, perlu penggantian karet pickup roller. Cek jalur kertas dari benda asing kecil yang mungkin menghambat."
  },
  { id: "p4", category: "Printer", symptoms: ["Tinta bocor", "Hasil cetak kotor", "Muncul noda tinta di pinggir kertas"], logic: "OR",
    questions: [
      { text: "Apakah posisi tabung infus diletakkan lebih tinggi dari printer?", expected: true },
      { text: "Apakah cartridge sering diisi ulang secara manual dengan suntikan?", expected: true },
      { text: "Apakah pembuangan tinta eksternal sudah penuh?", expected: true }
    ],
    diagnosis: "Sirkulasi Tinta Banjir / Cartridge Bocor",
    solution: "Segera turunkan posisi tabung sejajar dengan printer. Bersihkan sisa tinta di dalam body printer agar tidak mengenai Mainboard atau Sensor Timing Disk."
  },
  { id: "p5", category: "Printer", symptoms: ["Scanner tidak jalan", "Hasil scan buram", "Scanner berbunyi decit"], logic: "OR",
    questions: [
      { text: "Apakah ada suara kasar saat scanner mulai bergerak?", expected: true },
      { text: "Apakah lampu scanner menyala saat proses scan berjalan?", expected: false },
      { text: "Apakah muncul pesan error 'Scanner unit error'?", expected: true }
    ],
    diagnosis: "Unit Scanner atau Kabel Fleksibel Rusak",
    solution: "Perlu penggantian unit kabel fleksibel scanner atau lampu CIS scanner. Cek juga jalur kabel data ke mainboard kemungkinan ada yang putus."
  },
  { id: "p6", category: "Printer", symptoms: ["Printer tidak terdeteksi PC", "Printer 'Offline' terus di PC", "WIFI Printer gagal konek"], logic: "OR",
    questions: [
      { text: "Apakah kabel USB sudah diganti dengan yang baru?", expected: false },
      { text: "Apakah Driver Printer di komputer sudah terinstal dengan benar?", expected: false }
    ],
    diagnosis: "Masalah Konektivitas USB / Driver Corrupt",
    solution: "Coba ganti kabel USB berkualitas. Re-install driver printer versi terbaru. Jika tetap tidak terbaca, kemungkinan ada kerusakan pada IC USB di Mainboard."
  },
  { id: "p7", category: "Printer", symptoms: ["Hasil cetak membayang (Ghosting)", "Muncul garis vertikal hitam", "Hasil print rontok (Laserjet)"], logic: "OR",
    questions: [
      { text: "Apakah Anda menggunakan printer tipe Laserjet?", expected: true },
      { text: "Apakah drum unit terlihat ada banyak goresan melingkar?", expected: true },
      { text: "Apakah fuser unit (pemanas) menyentuh kertas dengan panas yang rata?", expected: false }
    ],
    diagnosis: "Kerusakan Drum Unit / Fuser Unit (Laserjet)",
    solution: "Untuk Laserjet, noda vertikal biasanya akibat drum yang baret. Jika hasil print rontok, maka unit fuser (pemanas) sudah tidak bekerja maksimal and perlu ganti film fuser."
  },
  { id: "p8", category: "Printer", symptoms: ["Hasil cetak blanks (Kosong)", "Warna tercampur"], logic: "OR",
    questions: [
      { text: "Apakah cartridge baru saja diisi ulang?", expected: true },
      { text: "Apakah label segel udara pada cartridge sudah dilepas?", expected: false }
    ],
    diagnosis: "Udara Terjebak di Cartridge / Head Failure",
    solution: "Lakukan head cleaning berkali-kali. Pastikan ventilasi udara cartridge terbuka. Jika tetap kosong, kemungkinan sirkuit head rusak."
  },
  { id: "p9", category: "Printer", symptoms: ["Lampu power berkedip cepat", "Muncul error 'General Error'"], logic: "OR",
    questions: [
      { text: "Apakah ada suara mentok saat printer dinyalakan?", expected: true },
      { text: "Apakah ada benda asing di dalam tray printer?", expected: true }
    ],
    diagnosis: "Mekanik Macet (Mechanical Error / Fatal Error)",
    solution: "Cek seluruh jalur kertas and carriage head. Pastikan tidak ada kertas nyangkut atau benda asing kecil yang mengganjal pergerakan mekanik."
  },
  { id: "p10", category: "Printer", symptoms: ["Karakter cetakan aneh/simbol random"], logic: "OR",
    questions: [
      { text: "Apakah masalah muncul saat mencetak dokumen PDF atau Gambar besar?", expected: true },
      { text: "Apakah Anda menggunakan driver 'Generic' Windows?", expected: true }
    ],
    diagnosis: "Memory Buffer Error / Incompatible Driver",
    solution: "Hapus print queue. Gunakan driver resmi dari website produsen (Epson/Canon/HP) sesuai dengan versi Windows Anda."
  },
  { id: "p11", category: "Printer", symptoms: ["Printer mati total", "Bau terbakar dari dalam printer"], logic: "OR",
    questions: [
      { text: "Apakah kabel power sudah dipastikan masuk ke stopkontak dengan benar?", expected: true },
      { text: "Apakah ada tumpahan cairan di area belakang printer?", expected: true }
    ],
    diagnosis: "Power Supply Short / Mainboard Rusak",
    solution: "Jangan menyalakan printer lagi. Unit perlu dibongkar untuk pengecekan komponen Power Supply (Adaptor internal) or IC Power pada Mainboard."
  },
  { id: "p12", category: "Printer", symptoms: ["Kertas tidak tertarik sama sekali", "Roller berputar tapi kertas diam"], logic: "OR",
    questions: [
      { text: "Apakah karet penarik kertas terlihat licin/mengkilap?", expected: true },
      { text: "Apakah tray kertas terlalu penuh (melebihi batas)?", expected: true }
    ],
    diagnosis: "Keausan Karet Pickup Roller",
    solution: "Bersihkan karet roller dengan kain lembab. Jika tetap tidak ditarik, karet pickup roller sudah halus and harus diganti."
  },
  { id: "p13", category: "Printer", symptoms: ["Cartridge tidak terbaca (Incompatible)"], logic: "OR",
    questions: [
      { text: "Apakah pin kuningan pada cartridge kotor terkena tinta?", expected: true },
      { text: "Apakah chip pada cartridge ada yang gores atau lepas?", expected: true }
    ],
    diagnosis: "Chip Cartridge Kotor / Rusak",
    solution: "Bersihkan pin kuningan cartridge dengan penghapus pensil or alkohol. Jika tetap tidak terbaca, chip cartridge harus diganti."
  },
  { id: "p14", category: "Printer", symptoms: ["Scanner berbunyi decit", "Hasil scan buram"], logic: "OR",
    questions: [
      { text: "Apakah kaca scanner terlihat berembun atau kotor di bagian dalam?", expected: true },
      { text: "Apakah unit scanner bergerak tersendat-sendat?", expected: true }
    ],
    diagnosis: "Lampu CIS / Motor Scanner Lemah",
    solution: "Bersihkan kaca scanner. Jika bunyi decit keras, motor scanner or gear perlu dilumasi/diganti."
  },
  { id: "p15", category: "Printer", symptoms: ["Head buntu (Clogged)", "Selang infus kemasukan udara"], logic: "OR",
    questions: [
      { text: "Apakah tabung tinta dalam kondisi hampir habis?", expected: true },
      { text: "Apakah printer jarang digunakan (kurang dari sebulan sekali)?", expected: true }
    ],
    diagnosis: "Masalah Suplai Tinta (Ink Flow Problem)",
    solution: "Lakukan sedot manual pada cartridge menggunakan toolkit sedot (vacuum tool). Pastikan tidak ada kebocoran udara pada selang infus."
  },
  { id: "p16", category: "Printer", symptoms: ["Kualitas foto grainy/bintik"], logic: "OR",
    questions: [
      { text: "Apakah Anda menggunakan kertas foto berkualitas standar?", expected: false },
      { text: "Apakah settingan print sudah diatur ke 'High Quality'?", expected: false }
    ],
    diagnosis: "Setting Resolusi Rendah / Media Tidak Sesuai",
    solution: "Gunakan kertas foto khusus (Glossy/Matte) and ubah settingan print ke kualitas tertinggi (Photo/Best) di driver printer."
  },
  { id: "p17", category: "Printer", symptoms: ["Printer tidak mau narik kertas tebal (Art Paper)"], logic: "OR",
    questions: [
      { text: "Apakah Anda menggunakan kertas di atas 230 gsm?", expected: true },
      { text: "Apakah printer Anda tipe L-Series standar (bukan seri foto)?", expected: true }
    ],
    diagnosis: "Limitasi Mekanik / Roller Licin",
    solution: "Printer rumahan standar memiliki limit ketebalan kertas. Cobalah membantu dorong kertas sedikit saat roller mulai menarik or ganti karet pickup roller yang lebih kasar."
  },
  { id: "p18", category: "Printer", symptoms: ["Level tinta tidak berkurang di indikator"], logic: "OR",
    questions: [
      { text: "Apakah printer menggunakan sistem infus modifikasi (bukan pabrikan)?", expected: true }
    ],
    diagnosis: "Software Ink Level Freeze",
    solution: "Pada printer modifikasi, indikator tinta di Windows seringkali tidak akurat. Cek sisa tinta secara fisik pada tabung luar secara berkala."
  },
  { id: "p19", category: "Printer", symptoms: ["Tinta macet di selang"], logic: "OR",
    questions: [
      { text: "Apakah ada kerutan or lipatan pada selang infus?", expected: true },
      { text: "Apakah katup udara pada tabung tertutup rapat?", expected: true }
    ],
    diagnosis: "Hambatan Aliran Tinta (Ink Blockage)",
    solution: "Buka katup udara kecil pada tabung. Lakukan 'Ink Charge' or sedot selang secara manual menggunakan suntikan untuk membuang udara terjebak."
  },
  { id: "p20", category: "Printer", symptoms: ["Muncul noda tinta di pinggir kertas"], logic: "OR",
    questions: [
      { text: "Apakah Anda sering mencetak borderless (tanpa tepi)?", expected: true },
      { text: "Apakah busa peredam di bawah head sudah jenuh tinta?", expected: true }
    ],
    diagnosis: "Busa Waste Pad Internal Jenuh",
    solution: "Bersihkan busa pembuangan di bawah jalur head menggunakan tisu. Noda muncul karena sisa tinta yang meluber saat mencetak tanpa tepi."
  },
  { id: "p21", category: "Printer", symptoms: ["Error B200 / P10 (Canon)"], logic: "OR",
    questions: [
      { text: "Apakah lampu printer berkedip 10 kali bergantian?", expected: true }
    ],
    diagnosis: "VH Voltage Error (P10/B200)",
    solution: "Error ini biasanya karena head mengalami panas berlebih or korsleting. Cabut head and bersihkan konektornya. Jika tetap, Head or Mainboard harus diganti."
  },
  { id: "p22", category: "Printer", symptoms: ["Hasil print berbau gosong"], logic: "OR",
    questions: [
      { text: "Apakah Anda mencetak dalam jumlah banyak (ratusan lembar) sekaligus?", expected: true }
    ],
    diagnosis: "Motor Carriage Overheat",
    solution: "Segera matikan printer. Biarkan motor penggerak head dingin selama 30 menit. Berikan pelumas (grease) pada besi penyangga head."
  },
  { id: "p23", category: "Printer", symptoms: ["Tarik kertas banyak sekaligus"], logic: "OR",
    questions: [
      { text: "Apakah kertas menempel satu sama lain karena statis/lembab?", expected: true }
    ],
    diagnosis: "Sparator Pad / Retard Pad Aus",
    solution: "Ganti retard pad (karet pemisah kertas). Pastikan kertas dikibas-kibaskan (fanning) sebelum dimasukkan ke tray."
  },
  { id: "p24", category: "Printer", symptoms: ["Printer tidak bisa copy langsung"], logic: "OR",
    questions: [
      { text: "Apakah fungsi scan via komputer masih berjalan normal?", expected: true }
    ],
    diagnosis: "Kerusakan Modul Control Panel",
    solution: "Tombol fisik pada printer mungkin rusak or kotor. Unit control panel perlu diperbaiki or ganti membran tombolnya."
  },
  { id: "p25", category: "Printer", symptoms: ["Cetak dari HP lambat/gagal"], logic: "OR",
    questions: [
      { text: "Apakah jarak antara HP and Printer lebih dari 5 meter?", expected: true }
    ],
    diagnosis: "Sinyal Wifi Direct Lemah",
    solution: "Dekatkan HP ke printer or gunakan router wifi sebagai perantara. Pastikan aplikasi print di HP sudah versi terbaru."
  },
  { id: "p26", category: "Printer", symptoms: ["Toner bocor (Laserjet)"], logic: "OR",
    questions: [
      { text: "Apakah ada serbuk hitam di dalam body printer?", expected: true },
      { text: "Apakah cartridge toner baru saja diganti or diisi ulang?", expected: true }
    ],
    diagnosis: "Kebocoran Seal Cartridge Toner",
    solution: "Ganti unit cartridge toner. Jangan menghirup serbuk toner, bersihkan printer menggunakan vacuum khusus (toner vacuum) or lap lembab."
  },
  { id: "p27", category: "Printer", symptoms: ["Hasil cetak hitam pekat seluruhnya"], logic: "OR",
    questions: [
      { text: "Apakah Anda baru saja membongkar unit drum?", expected: true },
      { text: "Apakah konektor grounding di samping cartridge terpasang?", expected: false }
    ],
    diagnosis: "Masalah Grounding / PCR (Laserjet)",
    solution: "Cek per (spring) grounding pada cartridge. Jika PCR (Primary Charge Roller) tidak mendapat tegangan, printer akan mencetak hitam pekat (All black)."
  },
  { id: "p28", category: "Printer", symptoms: ["Error Duplex (Cetak bolak-balik)"], logic: "OR",
    questions: [
      { text: "Apakah kertas sering macet saat ditarik kembali ke dalam?", expected: true },
      { text: "Apakah ada suara gear selip saat proses duplexing?", expected: true }
    ],
    diagnosis: "Kerusakan Unit Duplexer / Gear Transmisi",
    solution: "Periksa unit pembalik kertas di bagian belakang printer. Pastikan tidak ada serpihan kertas yang menghalangi jalur sensor duplex."
  },
  { id: "p29", category: "Printer", symptoms: ["ADF (Auto Document Feeder) Macet"], logic: "OR",
    questions: [
      { text: "Apakah scanner bisa jalan jika diletakkan di kaca (platen)?", expected: true },
      { text: "Apakah kertas sulit ditarik via penarik atas (ADF)?", expected: true }
    ],
    diagnosis: "ADF Pickup Roller Aus",
    solution: "Karet penarik ADF sudah licin. Bersihkan dengan cairan pembersih karet or ganti unit karet pickup ADF yang baru."
  },
  { id: "p30", category: "Printer", symptoms: ["Scan garis-garis tipis"], logic: "OR",
    questions: [
      { text: "Apakah garis muncul saat scan via ADF saja?", expected: true },
      { text: "Apakah kaca kecil di samping kaca utama terlihat ada noda?", expected: true }
    ],
    diagnosis: "Kotoran pada Kaca Scan ADF (Slit Glass)",
    solution: "Bersihkan kaca kecil (slit glass) di area ADF menggunakan alkohol. Noda satu titik saja dapat menyebabkan garis panjang pada hasil scan."
  },
  { id: "p31", category: "Printer", symptoms: ["Kertas keluar kusut/kriting"], logic: "OR",
    questions: [
      { text: "Apakah Anda menggunakan printer Laserjet?", expected: true },
      { text: "Apakah suhu fuser sdh diatur terlalu tinggi?", expected: true }
    ],
    diagnosis: "Pressure Roller Fuser Terlalu Panas or Aus",
    solution: "Unit fuser (pemanas) perlu diservis. Karet pressure roller mungkin sudah memuai or pengaturan media di driver tidak sesuai dengan ketebalan kertas."
  },
  { id: "p32", category: "Printer", symptoms: ["Bunyi denging kencang (High-pitch)"], logic: "OR",
    questions: [
      { text: "Apakah bunyi muncul saat printer baru dinyalakan (warming up)?", expected: true }
    ],
    diagnosis: "Masalah Fan (Kipas) or Laser Scanner Motor",
    solution: "Cek kipas pendingin di sisi printer, kemungkinan ada kotoran or sudah kering pelumasnya. Jika Laser Scanner yang berbunyi, unit tersebut harus diganti."
  },
  { id: "p33", category: "Printer", symptoms: ["Printer mendeteksi kertas habis padahal ada"], logic: "OR",
    questions: [
      { text: "Apakah tuas sensor kertas (paper flag) macet tidak mau naik?", expected: true },
      { text: "Apakah sensor fotodioda tertutup debu kertas?", expected: true }
    ],
    diagnosis: "Sensor Paper Flag Macet / Kotor",
    solution: "Bersihkan area sensor kertas menggunakan blower or kuas kecil. Pastikan tuas sensor bergerak bebas and tidak tersangkut."
  },
  { id: "p34", category: "Printer", symptoms: ["Error Counter (Batas cetak tercapai)"], logic: "OR",
    questions: [
      { text: "Apakah printer berhenti mencetak di tengah jalan?", expected: true },
      { text: "Apakah muncul pesan 'Maintenance Box at end of life'?", expected: true }
    ],
    diagnosis: "Internal Print Counter Overlimit",
    solution: "Ganti maintenance box or reset counter menggunakan software teknisi. Ini adalah proteksi agar tinta tidak melimpah dari wadah pembuangan."
  },
  { id: "p35", category: "Printer", symptoms: ["Pesan 'Service Call 03'"], logic: "OR",
    questions: [
      { text: "Apakah ini printer Laserjet fuji xerox or sejenisnya?", expected: true }
    ],
    diagnosis: "Fuser Unit Error (High Temperature)",
    solution: "Matikan printer and cabut kabel power selama 1 jam. Jika tetap muncul, thermistor fuser unit kemungkinan rusak or terbakar."
  },
  { id: "p36", category: "Printer", symptoms: ["Hasil print miring"], logic: "OR",
    questions: [
      { text: "Apakah pembatas kertas di tray (paper guide) sudah pas?", expected: false }
    ],
    diagnosis: "Paper Guide Tidak Presisi",
    solution: "Rapatkan pembatas kertas di tray hingga menjepit kertas dengan pas (tidak terlalu kencang or longgar). Pastikan kertas dipasang rapi."
  },
  { id: "p37", category: "Printer", symptoms: ["Margin print terpotong"], logic: "OR",
    questions: [
      { text: "Apakah settingan ukuran kertas di driver sama dengan kertas fisik?", expected: false }
    ],
    diagnosis: "Missmatch Ukuran Kertas",
    solution: "Sesuaikan Page Setup di driver (misal: A4/Letter/F4). Seringkali pengguna menggunakan kertas F4 tapi settingan driver masih Letter."
  },
  { id: "p38", category: "Printer", symptoms: ["Tinta warna tertentu dominan"], logic: "OR",
    questions: [
      { text: "Apakah hasil nozzle check ada warna yang putus total?", expected: true }
    ],
    diagnosis: "Color Loss (Mati Warna)",
    solution: "Pastikan tabung tinta tidak kosong. Lakukan head cleaning. Jika satu warna hilang total, kemungkinan saluran tinta masuk angin or head kotor."
  },
  { id: "p39", category: "Printer", symptoms: ["Printer sering nyangkut di tengah (Carriage Jam)"], logic: "OR",
    questions: [
      { text: "Apakah besi penyangga head (as carriage) berkarat or kering?", expected: true }
    ],
    diagnosis: "Carriage Rail Kering (Butuh Pelumas)",
    solution: "Berikan cairan pelumas (grease or minyak khusus) pada besi rail carriage head. Bersihkan debu yang menempel di rail agar pergerakan lancar."
  },
  { id: "p40", category: "Printer", symptoms: ["Kabel fleksibel head terkelupas"], logic: "OR",
    questions: [
      { text: "Apakah printer sering mengeluarkan error 'General Error' saat mulai mencetak?", expected: true }
    ],
    diagnosis: "Strip Data Kabel Head Short",
    solution: "Ganti kabel fleksibel head yang menuju mainboard. Bagian yang terkelupas dapat menyebabkan arus pendek and merusak mainboard or head."
  },
  { id: "p41", category: "Printer", symptoms: ["Sensor timing disk kotor"], logic: "OR",
    questions: [
      { text: "Apakah hasil print ada garis horizontal hitam tebal di semua tempat?", expected: true },
      { text: "Apakah printer sering menabrak pinggiran (bunyi brak)?", expected: true }
    ],
    diagnosis: "Timing Disk / Encoder Sensor Error",
    solution: "Bersihkan piringan plastik bening (timing disk) di sisi kiri mekanik menggunakan alkohol. Jika kotor terkena tinta, sensor tidak bisa membaca posisi head."
  },
  { id: "p42", category: "Printer", symptoms: ["Gagal konek Cloud Print"], logic: "OR",
    questions: [
      { text: "Apakah status koneksi internet di printer 'Connected'?", expected: false }
    ],
    diagnosis: "Network Gateway Issue",
    solution: "Cek settingan IP, Subnet, and Gateway. Pastikan printer terdaftar di layanan cloud produsen (misal: Epson Connect or HP ePrint)."
  },
  { id: "p43", category: "Printer", symptoms: ["Fungsi Fax tidak jalan"], logic: "OR",
    questions: [
      { text: "Apakah kabel telepon sudah terpasang di port 'LINE' (bukan EXT)?", expected: false }
    ],
    diagnosis: "Salah Port Kabel Telepon",
    solution: "Pindahkan kabel telepon ke port berlabel 'LINE'. Pastikan layanan dial-up pada line telepon Anda masih aktif."
  },
  { id: "p44", category: "Printer", symptoms: ["Kertas macet di unit pemanas (Fuser Jam)"], logic: "OR",
    questions: [
      { text: "Apakah kertas sulit ditarik keluar dari bagian belakang?", expected: true },
      { text: "Apakah ada kerutan kertas seperti kipas (accordion)?", expected: true }
    ],
    diagnosis: "Teflon Fuser Sobek / Lengket",
    solution: "Ganti film teflon fuser or pressure roller. Kertas yang menyangkut di sini biasanya panas and sulit dikeluarkan karena lengket ke pemanas."
  },
  { id: "p45", category: "Printer", symptoms: ["Sensor suhu head error"], logic: "OR",
    questions: [
      { text: "Apakah muncul pesan 'Head Overheat' padahal baru dinyalakan?", expected: true }
    ],
    diagnosis: "Kerusakan Thermistor Print Head",
    solution: "Head printer kemungkinan rusak secara sirkuit internal. Ganti unit print head dengan yang baru."
  },
  { id: "p46", category: "Printer", symptoms: ["Scan buram hanya di pojok"], logic: "OR",
    questions: [
      { text: "Apakah engsel scanner terlihat miring or tidak rata?", expected: true }
    ],
    diagnosis: "Mechanical Misalignment Unit Scan",
    solution: "Hati-hati saat menutup scanner. Engsel yang miring menyebabkan jarak antara dokumen and lampu scan tidak sama, sehingga hasil buram di satu sisi."
  },
  { id: "p47", category: "Printer", symptoms: ["Cetak Draft Bagus, High Quality Buram"], logic: "OR",
    questions: [
      { text: "Apakah Anda mencetak menggunakan mode Photo?", expected: true }
    ],
    diagnosis: "Penyumbatan Micro-Nozzle",
    solution: "Lubang nozzle head yang sangat kecil tersumbat. Lakukan deep cleaning or sirkulasi tinta manual via software khusus teknisi."
  },
  { id: "p48", category: "Printer", symptoms: ["Printer restart saat mau narik kertas"], logic: "OR",
    questions: [
      { text: "Apakah saat mulai narik kertas, printer langsung mati lalu nyala lagi?", expected: true }
    ],
    diagnosis: "Power Supply Drop (Ampere Lemah)",
    solution: "Power supply printer sudah tidak mampu mensuplai arus saat motor penarik bekerja. Ganti unit power supply or cek kapasitor internal."
  },
  { id: "p49", category: "Printer", symptoms: ["Internal Clock Printer Hilang"], logic: "OR",
    questions: [
      { text: "Apakah printer sering minta atur jam/tanggal saat dinyalakan?", expected: true }
    ],
    diagnosis: "Baterai CMOS Mainboard Habis",
    solution: "Ganti baterai kancing (CR2032 or sejenis) pada mainboard printer. Ini penting untuk log error and fitur schedule."
  },
  { id: "p50", category: "Printer", symptoms: ["Mainboard Short karena Serangga"], logic: "OR",
    questions: [
      { text: "Apakah ada bau aneh or bekas bangkai semut/kecoa di dalam?", expected: true }
    ],
    diagnosis: "Korsleting akibat Gangguan Hewan",
    solution: "Bersihkan mainboard menggunakan tinner or alkohol murni. Jika ada bagian gosong, jalur mainboard harus diservis or ganti total."
  },

  // LAPTOP RULES
  { id: "l1", category: "Laptop", symptoms: ["Laptop lambat (Lemot)", "Gagal update Windows", "Booting stuck di logo", "Sering hang saat buka Chrome"], logic: "OR",
    questions: [
      { text: "Apakah laptop masih menggunakan Harddisk (HDD)?", expected: true },
      { text: "Apakah RAM laptop Anda masih 4GB ke bawah?", expected: true },
      { text: "Apakah booting Windows memerlukan waktu lebih dari 1 menit?", expected: true }
    ],
    diagnosis: "Performa Storage (HDD) Lambat",
    solution: "Sangat disarankan upgrade ke SSD. SSD akan membuat performa laptop 10x lebih cepat dibanding HDD konvensional. Tambah RAM minimal 8GB untuk multitasking lancar."
  },
  { id: "l2", category: "Laptop", symptoms: ["Laptop panas sekali (Overheat)", "Kipas berisik", "Laptop jadi lambat saat colok charger"], logic: "OR",
    questions: [
      { text: "Apakah hawa panas tidak terasa keluar dari lubang kipas?", expected: true },
      { text: "Apakah laptop mati mendadak saat menjalankan aplikasi berat?", expected: true },
      { text: "Apakah suhu prosessor di atas 80 derajat Celcius?", expected: true }
    ],
    diagnosis: "Overheat / Sirkulasi Udara Tersumbat",
    solution: "Lakukan cleaning fan and ganti thermal paste. Debu yang menumpuk menghambat pembuangan panas, menyebabkan laptop 'throttling' or lemot untuk perlindungan diri."
  },
  { id: "l3", category: "Laptop", symptoms: ["Baterai tidak mengisi", "Baterai kembung", "Laptop mati saat charger dilepas"], logic: "OR",
    questions: [
      { text: "Apakah indikator baterai tertulis 'Plugged in, not charging'?", expected: true },
      { text: "Apakah fisik baterai terlihat menekan casing hingga terangkat?", expected: true },
      { text: "Apakah health baterai sudah di bawah 50%?", expected: true }
    ],
    diagnosis: "Baterai Drop / Rusak Fisik",
    solution: "Jika baterai kembung, segera ganti demi keamanan. Baterai kembung dapat merusak touchpad and casing. Jika tidak mengisi, cek juga adaptor charger Anda."
  },
  { id: "l4", category: "Laptop", symptoms: ["Keyboard ada tombol mati", "Keyboard ngetik sendiri", "Tombol Power amblas/rusak"], logic: "OR",
    questions: [
      { text: "Apakah ada riwayat terkena tumpahan air/minuman?", expected: true },
      { text: "Apakah masalah muncul hanya pada baris tombol tertentu?", expected: true }
    ],
    diagnosis: "Kerusakan Keyboard / Short Circuit",
    solution: "Ganti unit keyboard satu set. Memperbaiki jalur keyboard laptop sangat sulit and beresiko kembali rusak dalam waktu singkat."
  },
  { id: "l5", category: "Laptop", symptoms: ["Layar bergaris", "Layar berkedip (Flicker)", "Layar pecah/retak", "Layar redup (Backlight mati)"], logic: "OR",
    questions: [
      { text: "Apakah tampilan normal jika dihubungkan ke monitor/TV luar?", expected: true },
      { text: "Apakah garis berubah-ubah saat layar digerakkan/ditekuk?", expected: true },
      { text: "Apakah ada retakan fisik meski kecil pada pojok layar?", expected: true }
    ],
    diagnosis: "Kerusakan Panel LCD / Kabel Fleksibel",
    solution: "Ganti panel LCD or kabel fleksibel layar. Jika di monitor luar normal, kemungkinan besar memang panel LCD laptopnya yang bermasalah."
  },
  { id: "l6", category: "Laptop", symptoms: ["Blue Screen (BSOD)", "SSD tidak terbaca di BIOS", "Harddisk bunyi 'krek'"], logic: "OR",
    questions: [
      { text: "Apakah ada suara detak mekanik dari dalam laptop?", expected: true },
      { text: "Apakah laptop sering terbentur saat menyala?", expected: true }
    ],
    diagnosis: "Kegagalan Media Penyimpanan (Storage Failure)",
    solution: "Data terancam hilang. Segera backup data jika masih terbaca and ganti drive dengan SSD baru. Bunyi krek adalah tanda fisik HDD sudah lemah."
  },
  { id: "l7", category: "Laptop", symptoms: ["Laptop mati total (No Power)", "Lampu indikator nyala tapi layar gelap"], logic: "OR",
    questions: [
      { text: "Apakah indikator charger menyala saat dicolok?", expected: true },
      { text: "Apakah ada bau hangus dari sekitar lubang lubang udara?", expected: true }
    ],
    diagnosis: "Masalah Mainboard / IC Power Short",
    solution: "Komponen elektronik di mainboard mengalami kegagalan. Perlu pengecekan tegangan detail oleh teknisi spesialis mainboard."
  },
  { id: "l8", category: "Laptop", symptoms: ["Touchpad tidak fungsi", "Kursor lari-lari sendiri"], logic: "OR",
    questions: [
      { text: "Apakah masalah hilang saat charger dilepas?", expected: true },
      { text: "Apakah ada bagian touchpad yang terangkat/cembung?", expected: true }
    ],
    diagnosis: "Touchpad Faulty / Gangguan Listrik Statis",
    solution: "Jika kursor lari saat dicharge, charger Anda mengeluarkan arus tidak stabil. Jika tetap lari meski pakai baterai, modul touchpad or baterai kembung penyebabnya."
  },
  { id: "l9", category: "Laptop", symptoms: ["Speaker pecah suaranya", "Audio Jack longgar/tidak bunyi"], logic: "OR",
    questions: [
      { text: "Apakah suara sember terdengar saat volume tinggi saja?", expected: false },
      { text: "Apakah suara speaker hilang sebelah?", expected: true }
    ],
    diagnosis: "Kerusakan Fisik Speaker / Driver Audio",
    solution: "Speaker fisik mungkin sobek membrannya. Jika audio jack tidak fungsi, port jack perlu disolder ulang or diganti."
  },
  { id: "l10", category: "Laptop", symptoms: ["Engsel layar goyang/patah", "Casing laptop retak/renggang"], logic: "OR",
    questions: [
      { text: "Apakah engsel terasa semakin keras saat dibuka?", expected: true },
      { text: "Apakah baut di bawah engsel sudah copot/hilang?", expected: true }
    ],
    diagnosis: "Engsel / Dudukan Baut (Pillar) Patah",
    solution: "Lakukan perbaikan body or ganti casing. Jangan dipaksa buka tutup karena bisa merusak kabel fleksibel and memecahkan LCD."
  },
  { id: "l11", category: "Laptop", symptoms: ["WIFI tidak bisa On", "Bluetooth tidak terdeteksi"], logic: "OR",
    questions: [
      { text: "Apakah ada gambar tanda seru (!) di driver network browser?", expected: true },
      { text: "Apakah tombol pintasan (Fn + F-key) wifi sudah ditekan?", expected: true }
    ],
    diagnosis: "Modul WIFI/Bluetooth Rusak / Driver Isu",
    solution: "Update driver wifi. Jika tetap tidak bisa, modul wifi internal (card) mungkin rusak and perlu diganti."
  },
  { id: "l12", category: "Laptop", symptoms: ["Windows minta aktivasi terus", "Muncul iklan terus (Adware/Virus)"], logic: "OR",
    questions: [
      { text: "Apakah laptop terasa sangat panas walau tidak buka program berat?", expected: true },
      { text: "Apakah wallpaper laptop berubah sendiri?", expected: true }
    ],
    diagnosis: "Sistem Terinfeksi Virus / Junk Files",
    solution: "Bersihkan file sementara and scan virus. Langkah paling efektif adalah install ulang (fresh install) OS Windows."
  },
  { id: "l13", category: "Laptop", symptoms: ["Laptop nyetrum saat charger dicolok"], logic: "OR",
    questions: [
      { text: "Apakah kabel charger ada bagian yang terkelupas?", expected: true },
      { text: "Apakah stopkontak di rumah Anda memiliki grounding?", expected: false }
    ],
    diagnosis: "Kebocoran Arus / Masalah Grounding Listrik",
    solution: "Gunakan charger original. Pastikan instalasi listrik rumah memiliki arde/grounding yang baik untuk membuang induksi listrik statis."
  },
  { id: "l14", category: "Laptop", symptoms: ["USB Port tidak baca Flashdisk", "Webcam buram/tidak fungsi"], logic: "OR",
    questions: [
      { text: "Apakah port USB terasa longgar saat dicolok?", expected: true },
      { text: "Apakah webcam tertutup stiker penutup?", expected: false }
    ],
    diagnosis: "Kerusakan Port Fisik / Jalur Konektor",
    solution: "Gantikan unit port yang rusak. Untuk webcam buram, seringkali lensa kotor or modul kamera sudah menurun kualitasnya."
  },
  { id: "l15", category: "Laptop", symptoms: ["Bunyi beep saat nyala", "RAM terdeteksi cuma setengah"], logic: "OR",
    questions: [
      { text: "Apakah laptop mengeluarkan bunyi tit-tit saat pertama dinyalakan?", expected: true },
      { text: "Apakah Anda baru saja menambah/upgrade RAM?", expected: true }
    ],
    diagnosis: "Kesalahan Memori (RAM Error)",
    solution: "Bersihkan kaki-kaki RAM dengan penghapus pensil. Jika tetap bunyi beep, RAM mungkin rusak or tidak kompatibel dengan mainboard."
  },
  { id: "l16", category: "Laptop", symptoms: ["Windows minta aktivasi terus"], logic: "OR",
    questions: [
      { text: "Apakah laptop baru saja di-install ulang?", expected: true },
      { text: "Apakah Anda memiliki lisensi original (Stiker di bawah laptop)?", expected: true }
    ],
    diagnosis: "Masalah Lisensi Digital OS",
    solution: "Hubungkan ke internet untuk aktivasi otomatis. Jika gagal, masukkan product key yang tertera pada unit or akun Microsoft Anda."
  },
  { id: "l17", category: "Laptop", symptoms: ["Tidak bisa install aplikasi baru"], logic: "OR",
    questions: [
      { text: "Apakah sisa ruang penyimpanan di Drive C kurang dari 5GB?", expected: true }
    ],
    diagnosis: "Penyimpanan Penuh (Disk Space Low)",
    solution: "Hapus file sampah di folder Downloads or Recycle Bin. Pindahkan data ke Drive D or Cloud agar sistem memiliki ruang untuk proses instalasi."
  },
  { id: "l18", category: "Laptop", symptoms: ["Webcam buram/tidak fungsi"], logic: "OR",
    questions: [
      { text: "Apakah ada lampu LED kecil di sebelah kamera yang menyala?", expected: false },
      { text: "Apakah sudah mencoba akses kamera via aplikasi Zoom/Meet?", expected: true }
    ],
    diagnosis: "Hardware Webcam / Driver Privacy",
    solution: "Cek tombol pintasan privasi kamera di keyboard (biasanya ikon kamera dicoret). Jika tetap tidak bisa, unit webcam or kabel fleksibelnya bermasalah."
  },
  { id: "l19", category: "Laptop", symptoms: ["SD Card Reader tidak deteksi"], logic: "OR",
    questions: [
      { text: "Apakah SD Card Anda terbaca normal di HP or perangkat lain?", expected: true }
    ],
    diagnosis: "Driver Reader Outdated / Port Kotor",
    solution: "Bersihkan slot SD card dengan tiupan udara. Update Driver 'Card Reader' di Device Manager."
  },
  { id: "l20", category: "Laptop", symptoms: ["Folder ada tanda tanya (Boot Failure)"], logic: "OR",
    questions: [
      { text: "Apakah ini laptop MacBook (Apple)?", expected: true }
    ],
    diagnosis: "Sistem Operasi Tidak Ditemukan",
    solution: "Indikasi OS rusak or SSD lepas/rusak. Masuk ke Recovery Mode untuk mencoba perbaikan sistem (First Aid)."
  },
  { id: "l21", category: "Laptop", symptoms: ["Slot RAM tidak detect"], logic: "OR",
    questions: [
      { text: "Apakah Anda menggunakan dua keping RAM dengan merk berbeda?", expected: true }
    ],
    diagnosis: "Inkompatibilitas RAM Dual Channel",
    solution: "Coba pasang satu per satu untuk memastikan slot mana yang mati. Gunakan RAM dengan speed (MHz) and merk yang sama untuk stabilitas."
  },
  { id: "l22", category: "Laptop", symptoms: ["Casing berlistrik saat dipegang"], logic: "OR",
    questions: [
      { text: "Apakah masalah muncul hanya saat charger dicolok?", expected: true }
    ],
    diagnosis: "Induksi Listrik / Kebocoran Grounding",
    solution: "Ganti charger dengan yang original. Gunakan alas kaki saat memakai laptop agar tubuh tidak menjadi jalur grounding langsung."
  },
  { id: "l23", category: "Laptop", symptoms: ["Brightness tidak bisa diatur"], logic: "OR",
    questions: [
      { text: "Apakah driver VGA sudah terinstal (muncul Intel/Nvidia/AMD di Device Manager)?", expected: false }
    ],
    diagnosis: "Driver VGA Generic / Microsoft Basic Display",
    solution: "Install driver VGA original sesuai merk prosessor/GPU Anda. Driver basic Windows tidak mendukung pengaturan kecerahan layar."
  },
  { id: "l24", category: "Laptop", symptoms: ["Bios minta Password"], logic: "OR",
    questions: [
      { text: "Apakah ini laptop bekas kantor or instansi?", expected: true }
    ],
    diagnosis: "BIOS Password Lock",
    solution: "Ini adalah fitur keamanan hardware. Untuk membuka, perlu dilakukan reset chip BIOS secara manual or menggunakan master key sesuai tipe laptop."
  },
  { id: "l25", category: "Laptop", symptoms: ["HDMI tidak keluar gambar ke TV"], logic: "OR",
    questions: [
      { text: "Apakah sudah menekan tombol (Fn + F-key) untuk proyeksi?", expected: true }
    ],
    diagnosis: "Masalah Port HDMI / Driver Display",
    solution: "Coba ganti kabel HDMI. Pastikan resolusi output di laptop didukung oleh TV. Jika tetap, port HDMI di mainboard mungkin rusak."
  },
  { id: "l26", category: "Laptop", symptoms: ["BIOS Update Gagal / Brick"], logic: "OR",
    questions: [
      { text: "Apakah laptop mati total setelah mencoba update firmware/BIOS?", expected: true },
      { text: "Apakah hanya lampu power yang menyala tapi tidak ada tampilan apa-apa?", expected: true }
    ],
    diagnosis: "Firmware Corrupt (BIOS Brick)",
    solution: "Unit harus dibongkar untuk dilakukan 'Flash BIOS' manual menggunakan alat programmer hardware khusus oleh teknisi berpengalaman."
  },
  { id: "l27", category: "Laptop", symptoms: ["Dudukan Engsel Patah"], logic: "OR",
    questions: [
      { text: "Apakah saat layar dibuka, casing sekitar engsel terangkat or renggang?", expected: true },
      { text: "Apakah ada bunyi 'krak' saat menggerakkan layar?", expected: true }
    ],
    diagnosis: "Kerusakan Pillar / Hinge Mount",
    solution: "Jangan dipaksa buka. Perlu rekonstruksi dudukan baut menggunakan lem resin khusus or ganti casing (top/bottom cover) sesuai bagian yang patah."
  },
  { id: "l28", category: "Laptop", symptoms: ["Webcam Bergetar"], logic: "OR",
    questions: [
      { text: "Apakah tampilan kamera tampak bergoyang-goyang sendiri?", expected: true }
    ],
    diagnosis: "Interface Kabel Flexi Webcam Longgar",
    solution: "Bongkar frame layar, kencangkan konektor kabel fleksibel kamera. Jika tetap, unit modul webcam harus diganti."
  },
  { id: "l29", category: "Laptop", symptoms: ["Lampu Indikator Capslock Berkedip"], logic: "OR",
    questions: [
      { text: "Apakah laptop tidak tampil gambar saat capslock berkedip?", expected: true }
    ],
    diagnosis: "Kode Error Hardware (HP/Dell Error Code)",
    solution: "Hitung jumlah kedipan (misal 3x lambat, 2x cepat). Ini adalah kode diagnostik internal (seperti masalah RAM or BIOS). Perlu pengecekan spesifik kode tersebut."
  },
  { id: "l30", category: "Laptop", symptoms: ["Suara Kresek-kresek di Speaker"], logic: "OR",
    questions: [
      { text: "Apakah suara masih kresek-kresek jika dicolok headset?", expected: false }
    ],
    diagnosis: "Membran Speaker Sobek",
    solution: "Jika di headset jernih, berarti membran speaker internal sudah sobek or berdebu. Solusi terbaik adalah ganti unit speaker internal."
  },
  { id: "l31", category: "Laptop", symptoms: ["Wifi On/Off Sendiri"], logic: "OR",
    questions: [
      { text: "Apakah ini terjadi setelah laptop dalam mode Sleep?", expected: true },
      { text: "Apakah settingan power saving wifi sudah dimatikan?", expected: false }
    ],
    diagnosis: "Masalah Power Management Driver",
    solution: "Ubah settingan di Device Manager agar Windows tidak mematikan modul wifi untuk hemat daya. Update driver ke versi paling stabil."
  },
  { id: "l32", category: "Laptop", symptoms: ["Kabel Flexi Touchpad Putus"], logic: "OR",
    questions: [
      { text: "Apakah touchpad mati total padahal driver terinstal?", expected: true },
      { text: "Apakah laptop baru saja dibongkar?", expected: true }
    ],
    diagnosis: "Konektor Ribbon Touchpad Rusak",
    solution: "Ganti kabel ribbon (fleksibel) touchpad. Bagian ini sangat tipis and sering patah jika teknik pembongkaran salah."
  },
  { id: "l33", category: "Laptop", symptoms: ["Laptop Sering Sleep Sendiri"], logic: "OR",
    questions: [
      { text: "Apakah laptop menggunakan magnetic sensor (Hall Sensor) di pinggir layar?", expected: true },
      { text: "Apakah Anda meletakkan HP or magnet di sekitar touchpad?", expected: true }
    ],
    diagnosis: "Interferensi Magnetic Hall Sensor",
    solution: "Jauhkan benda bermagnet dari laptop. Sensor ini bertugas mendeteksi tutup layar, jika terkena magnet eksternal, laptop mendeteksi layar tertutup (sleep)."
  },
  { id: "l34", category: "Laptop", symptoms: ["Layar Berbayang (Image Retention)"], logic: "OR",
    questions: [
      { text: "Apakah bayangan program sebelumnya tetap tertinggal tipis di layar?", expected: true }
    ],
    diagnosis: "Gejala Ghosting pada Panel IPS",
    solution: "Ini adalah sifat beberapa panel IPS (Screen Burn-in temporary). Ganti panel LCD berkualitas lebih baik jika gangguan sangat mengganggu produktivitas."
  },
  { id: "l35", category: "Laptop", symptoms: ["Backlight Layar Mati (Lampu Inverter)"], logic: "OR",
    questions: [
      { text: "Apakah gambar ada tapi sangat gelap (hanya terlihat jika disenter)?", expected: true }
    ],
    diagnosis: "Masalah Fuse Backlight or Lampu LED LCD",
    solution: "Ada kerusakan pada sirkuit backlight di mainboard or lampu LED di dalam panel LCD putus. Perlu teknisi hardware untuk pengecekan tegangan."
  },
  { id: "l36", category: "Laptop", symptoms: ["Port Charger Longgar"], logic: "OR",
    questions: [
      { text: "Apakah charger harus diputar/ditekuk dulu baru bisa mengisi?", expected: true }
    ],
    diagnosis: "Physical DC Jack Damage",
    solution: "Ganti unit DC Jack charger di dalam laptop. Jangan dipaksa tekuk karena dapat menyebabkan korsleting and merusak mainboard."
  },
  { id: "l37", category: "Laptop", symptoms: ["Slot SD Card Macet"], logic: "OR",
    questions: [
      { text: "Apakah mekanisme pegas (spring) tidak mau mengunci?", expected: true }
    ],
    diagnosis: "Mekanik Slot Card Reader Rusak",
    solution: "Slot card reader di mainboard harus diservis or ganti. Jangan menusuk paksa dengan benda tajam."
  },
  { id: "l38", category: "Laptop", symptoms: ["Baterai Terisi tapi Persentase Gantung"], logic: "OR",
    questions: [
      { text: "Apakah persentase tetap di angka tertentu (misal 80%) terus?", expected: true }
    ],
    diagnosis: "Battery Calibration Issue / Cell Failure",
    solution: "Lakukan kalibrasi baterai dengan menguras hingga 0% lalu charge hingga 100% saat laptop mati. Jika tetap, salah satu cell baterai sudah defect."
  },
  { id: "l39", category: "Laptop", symptoms: ["Laptop Tidak Bisa Masuk Safe Mode"], logic: "OR",
    questions: [
      { text: "Apakah saat ditekan F8 or Shift+Restart tidak muncul menu recovery?", expected: true }
    ],
    diagnosis: "System BCD / Recovery Partition Corrupt",
    solution: "Lakukan perbaikan menggunakan Windows Installation Media (USB Bootable). Jalankan perintah 'bootrec /fixboot' via CMD."
  },
  { id: "l40", category: "Laptop", symptoms: ["Keyboard Backlight Tidak Nyala"], logic: "OR",
    questions: [
      { text: "Apakah sudah mencoba menekan tombol pintasan keyboard (Fn + Space/F-key)?", expected: true }
    ],
    diagnosis: "Masalah Driver ATK / Kabel Flexi Backlight",
    solution: "Pastikan driver utilitas laptop original terinstal. Jika tetap, cek kabel fleksibel khusus backlight di bawah keyboard."
  },
  { id: "l41", category: "Laptop", symptoms: ["Touchpad Klik Kiri/Kanan Keras"], logic: "OR",
    questions: [
      { text: "Apakah tombol terasa seperti ada yang mengganjal di bawahnya?", expected: true }
    ],
    diagnosis: "Mekanik Microswitch Touchpad Aus",
    solution: "Bersihkan area tombol touchpad. Microswitch di dalam modul touchpad mungkin sudah lemah or terganjal kotoran."
  },
  { id: "l42", category: "Laptop", symptoms: ["Casing Bagian Bawah Sangat Panas"], logic: "OR",
    questions: [
      { text: "Apakah kipas berputar kencang?", expected: false }
    ],
    diagnosis: "Fan Stuck / Sirkulasi Udara Buntu",
    solution: "Segera matikan laptop. Kipas mungkin tersangkut kabel or debu tebal. Pengecekan fisik wajib dilakukan sebelum komponen lain terbakar."
  },
  { id: "l43", category: "Laptop", symptoms: ["Muncul Error 'Smart Harddisk Error'"], logic: "OR",
    questions: [
      { text: "Apakah pesan muncul sesaat setelah menekan tombol power?", expected: true }
    ],
    diagnosis: "Prediksi Kegagalan Drive (SMART Warning)",
    solution: "Ini adalah peringatan dini. Harddisk/SSD Anda hampir rusak total. Segera backup data penting and ganti drive secepatnya."
  },
  { id: "l44", category: "Laptop", symptoms: ["Lampu Power Kedip-kedip Merah"], logic: "OR",
    questions: [
      { text: "Apakah indikator ini muncul saat laptop dicolok charger?", expected: true }
    ],
    diagnosis: "Voltage Incompatibility / Warning Baterai",
    solution: "Gunakan charger original. Jika lampu tetap kedip merah, sirkuit charging mendeteksi tegangan yang tidak stabil or baterai sudah sangat kritis."
  },
  { id: "l45", category: "Laptop", symptoms: ["Laptop Mati Saat Ditekan Casingnya"], logic: "OR",
    questions: [
      { text: "Apakah laptop mati jika Anda menekan area di atas keyboard or touchpad?", expected: true }
    ],
    diagnosis: "Jalur Mainboard Longgar (Micro-crack)",
    solution: "Ada jalur pada mainboard yang retak (micro-crack). Masalah ini cukup berat and memerlukan teknik perbaikan 'reball' or solder ulang komponen SMD."
  },
  { id: "l46", category: "Laptop", symptoms: ["Bluetooth sering Unpairing sendiri"], logic: "OR",
    questions: [
      { text: "Apakah driver bluetooth sudah diupdate?", expected: true }
    ],
    diagnosis: "Interferensi Frekuensi / Module WiFi-BT Lemah",
    solution: "Modul Bluetooth seringkali menyatu dengan WiFi. Ganti modul internal WiFi-BT card untuk koneksi yang lebih stabil."
  },
  { id: "l47", category: "Laptop", symptoms: ["Laptop Bunyi Tiit Kencang Terus"], logic: "OR",
    questions: [
      { text: "Apakah bunyi muncul seketika saat baru nyala?", expected: true }
    ],
    diagnosis: "Tombol Keyboard Ada yang Tertekan (Stuck)",
    solution: "Salah satu tombol keyboard terjepit or short (tertekan terus-menerus). Bersihkan keyboard or cabut kabel fleksibel keyboard untuk tes."
  },
  { id: "l48", category: "Laptop", symptoms: ["Webcam Terlalu Gelap"], logic: "OR",
    questions: [
      { text: "Apakah ini terjadi di semua aplikasi (Zoom/Camera)?", expected: true }
    ],
    diagnosis: "Software Exposure Error / Optik Kotor",
    solution: "Bersihkan lensa kamera. Jika tetap, setting exposure di driver kamera perlu diatur ulang or diganti unit kameranya."
  },
  { id: "l49", category: "Laptop", symptoms: ["Baut Casing Copot Sendiri"], logic: "OR",
    questions: [
      { text: "Apakah ada keretakan pada lubang baut?", expected: true }
    ],
    diagnosis: "Getaran Kipas / Casing Longgar",
    solution: "Ganti baut yang hilang. Kerusakan ini jika dibiarkan dapat menyebabkan engsel patah karena tumpuan beban tidak merata."
  },
  { id: "l50", category: "Laptop", symptoms: ["Laptop Mati Total Seteleh Kena Petir"], logic: "OR",
    questions: [
      { text: "Apakah modem or charger dicolok saat kejadian?", expected: true }
    ],
    diagnosis: "Overvoltage Surge (Kena Lonjakan Listrik)",
    solution: "Kerusakan parah pada jalur input power or LAN port. Kemungkinan besar IC Power, MOSFET, or Mainboard hancur. Perlu diagnosa total teknisi spesialis."
  }
];

// Expert System Knowledge Base (Symptoms List)
const DEFAULT_EXPERT_DATA = {
  Printer: {
    symptoms: [
      // Basic & Print Quality
      "Hasil cetak bergaris", "Warna tidak keluar", "Warna pudar", "Text terputus-putus", 
      "Hasil cetak membayang (Ghosting)", "Muncul garis vertikal hitam", "Hasil cetak blanks (Kosong)",
      "Warna tercampur", "Hasil cetak kotor", "Muncul noda tinta di pinggir kertas",
      "Kualitas foto grainy/bintik", "Hasil print rontok (Laserjet)", "Karakter cetakan aneh/simbol random",
      
      // Mechanical & Paper
      "Kertas macet (Paper Jam)", "Suara berisik saat narik kertas", "Kertas robek saat keluar", 
      "Kertas miring saat ditarik", "Kertas terlipat saat ditarik", "Kertas tidak tertarik sama sekali",
      "Kertas tertarik lebih dari satu (Multiple sheets)", "Roller berputar tapi kertas diam",
      "Printer tidak mau narik kertas tebal (Art Paper)", "Print head mentok (Carriage Jam)",
      
      // Error Codes & Indicators
      "Lampu orange berkedip", "Pesan 'Service Required'", "Resetter minta dijalankan",
      "Waste ink tank penuh (Epson)", "Muncul kode error (Fatal Error)", "Lampu power berkedip cepat",
      "Muncul error 'General Error'", "Sensor penutup tidak deteksi (Cover Open)",
      
      // Connectivity & Electronic
      "Printer tidak terdeteksi PC", "Printer 'Offline' terus di PC", "WIFI Printer gagal konek",
      "Cetak dari HP lambat/gagal", "Printer mati total", "Bau terbakar dari dalam printer",
      "Muncul percikan api kecil di dalam", "Scanner tidak jalan", "Hasil scan buram", 
      "Scanner berbunyi decit", "Cartridge tidak terbaca (Incompatible)",
      
      // Ink System
      "Head buntu (Clogged)", "Tinta bocor", "Selang infus kemasukan udara",
      "Tinta macet di selang", "Level tinta tidak berkurang di indikator",
      
      // Additional - Printer
      "Toner bocor (Laserjet)", "Hasil cetak hitam pekat seluruhnya", "Error Duplex (Cetak bolak-balik)", 
      "ADF (Auto Document Feeder) Macet", "Scan garis-garis tipis", "Kertas keluar kusut/kriting", 
      "Bunyi denging kencang (High-pitch)", "Printer mendeteksi kertas habis padahal ada", 
      "Error Counter (Batas cetak tercapai)", "Pesan 'Service Call 03'", "Hasil print miring", 
      "Margin print terpotong", "Tinta warna tertentu dominan", "Printer sering nyangkut di tengah (Carriage Jam)", 
      "Kabel fleksibel head terkelupas", "Sensor timing disk kotor", "Gagal konek Cloud Print", 
      "Fungsi Fax tidak jalan", "Kertas macet di unit pemanas (Fuser Jam)", "Sensor suhu head error"
    ],
    generalQuestions: [
      "Apakah perangkat pernah jatuh atau terkena air?",
      "Apakah Anda menggunakan tinta/komponen original?",
      "Apakah sudah mencoba restart perangkat?",
      "Apakah kabel koneksi sudah dipastikan terpasang erat?",
      "Apakah usia perangkat sudah lebih dari 3 tahun?",
      "Apakah tegangan listrik di rumah Anda stabil?",
      "Apakah sudah mencoba ganti kabel USB baru?",
      "Apakah driver sudah diupdate ke versi terbaru?",
      "Apakah tinta di tabung infus masih penuh?",
      "Apakah sudah melakukan head cleaning sebelumnya?"
    ]
  },
  Laptop: {
    symptoms: [
      // Performance & System
      "Laptop lambat (Lemot)", "Sering restart sendiri", "Blue Screen (BSOD)", "Booting stuck di logo",
      "Sering hang saat buka Chrome", "Masuk BIOS terus", "Windows minta aktivasi terus",
      "Tidak bisa install aplikasi baru", "Muncul iklan terus (Adware/Virus)", "File dokumen corrupt terus",
      
      // Heat & Cooling
      "Laptop panas sekali (Overheat)", "Kipas berisik", "Laptop jadi lambat saat colok charger",
      
      // Power & Battery
      "Baterai tidak mengisi", "Baterai kembung", "Laptop mati saat charger dilepas",
      "Laptop nyetrum saat charger dicolok", "Laptop mati total (No Power)",
      "Lampu indikator nyala tapi layar gelap", "Tombol Power amblas/rusak",
      "Jam laptop sering ngaco (Baterai CMOS)",
      
      // Display & Screen
      "Layar bergaris", "Layar berkedip (Flicker)", "Layar pecah/retak", 
      "Layar redup (Backlight mati)", "Layar putih semua (White Screen)",
      "Layar biru tanpa tulisan", "Layar berubah warna (Dominan Hijau/Pink)",
      "Touchscreen error/ghost touch", "HDMI tidak keluar gambar ke TV",
      
      // Inputs (Keyboard/Touchpad)
      "Keyboard ada tombol mati", "Keyboard ngetik sendiri", "Touchpad tidak fungsi",
      "Kursor lari-lari sendiri",
      
      // Audio & Multimedia
      "Speaker pecah suaranya", "Audio Jack longgar/tidak bunyi", "Webcam buram/tidak fungsi",
      "Mikrofon tidak ada suara",
      
      // Connectivity
      "WIFI tidak bisa On", "Bluetooth tidak terdeteksi", "USB Port tidak baca Flashdisk",
      "SD Card Reader tidak deteksi",
      
      // Hardware/Mechanical
      "Harddisk bunyi 'krek'", "SSD tidak terbaca di BIOS", "RAM terdeteksi cuma setengah",
      "Bunyi beep saat nyala", "Engsel layar goyang/patah", "Casing laptop retak/renggang",
      "Engsel keras saat dibuka", "Folder ada tanda tanya (Boot Failure)",
      "Slot RAM tidak detect", "Casing berlistrik saat dipegang", "Brightness tidak bisa diatur", "Bios minta Password",
      
      // Additional - Laptop
      "BIOS Update Gagal / Brick", "Dudukan Engsel Patah", "Webcam Bergetar", "Lampu Indikator Capslock Berkedip", 
      "Suara Kresek-kresek di Speaker", "Wifi On/Off Sendiri", "Kabel Flexi Touchpad Putus", 
      "Laptop Sering Sleep Sendiri", "Layar Berbayang (Image Retention)", "Backlight Layar Mati (Lampu Inverter)", 
      "Port Charger Longgar", "Slot SD Card Macet", "Baterai Terisi tapi Persentase Gantung", 
      "Laptop Tidak Bisa Masuk Safe Mode", "Keyboard Backlight Tidak Nyala", "Touchpad Klik Kiri/Kanan Keras", 
      "Casing Bagian Bawah Sangat Panas", "Muncul Error 'Smart Harddisk Error'", "Lampu Power Kedip-kedip Merah", 
      "Laptop Mati Saat Ditekan Casingnya"
    ],
    generalQuestions: [
      "Apakah laptop pernah terbentur atau jatuh?",
      "Apakah laptop pernah terkena tumpahan cairan?",
      "Apakah sering menggunakan laptop di atas kasur?",
      "Apakah pengisi daya (charger) yang digunakan original?",
      "Apakah masalah muncul setelah instalasi update software?",
      "Apakah laptop terasa panas saat baru dinyalakan?",
      "Apakah sudah mencoba reset BIOS ke default?",
      "Apakah RAM pernah di-upgrade sebelumnya?",
      "Apakah laptop sering mati mendadak?",
      "Apakah suara kipas terdengar tersumbat?"
    ]
  }
};

const evaluateForwardChaining = (category: string, selectedSymptoms: string[], answers: Record<string, boolean>, rules: DiagnosisRule[]) => {
  const finalResults: { diagnosis: string; solution: string }[] = [];
  
  // Get rules for this category
  const activeRules = rules.filter(r => r.category === category);
  
  activeRules.forEach(rule => {
    // Check symptom condition
    const symptomMatch = rule.logic === "OR" 
      ? rule.symptoms.some(s => selectedSymptoms.includes(s))
      : rule.symptoms.every(s => selectedSymptoms.includes(s));
    
    if (symptomMatch) {
      // Check its specific questions
      let questionScore = 0;
      let totalSpecificQuestions = 0;
      
      rule.questions.forEach((q) => {
        if (answers[q.text] !== undefined) {
          totalSpecificQuestions++;
          if (answers[q.text] === q.expected) questionScore++;
        }
      });

      // If specific follow-up matches or enough high probability
      if (totalSpecificQuestions === 0 || (questionScore / totalSpecificQuestions) >= 0.5) {
        finalResults.push({ diagnosis: rule.diagnosis, solution: rule.solution });
      }
    }
  });

  if (finalResults.length === 0) {
    return [{ 
      diagnosis: "Analisa Awal Komponen", 
      solution: "Berdasarkan gejala, ada indikasi kerusakan pada sistem internal. Karena gejala yang Anda masukkan sangat spesifik atau belum masuk database kami, langkah terbaik adalah membawa unit Anda ke Mulya Catridge untuk pengecekan fisik gratis." 
    }];
  }

  return finalResults;
};


interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  createdAt?: any;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  description: string;
  specs: string[];
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  icon: string;
  image?: string;
}


export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminDarkMode, setIsAdminDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("isAdminDarkMode");
    return saved !== "false"; // Default to true (dark mode) for admin
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminLoginForm, setShowAdminLoginForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showFullCatalog, setShowFullCatalog] = useState(false);

  const isURLAdmin = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // Auto-detect if deployed on an admin subdomain/domain (e.g., mulyacartridgeadmin.netlify.app) or if path/hash has 'admin'
    return (
      hostname.includes('admin') ||
      path.endsWith('/admin') ||
      path.endsWith('/admin/') ||
      hash === '#/admin' ||
      hash === '#admin' ||
      hash.includes('admin')
    );
  };

  const [currentRoute, setCurrentRoute] = useState<"customer" | "admin">(isURLAdmin() ? "admin" : "customer");

  const navigateTo = (path: "/" | "/admin") => {
    if (path === "/admin") {
      window.history.pushState({}, "", "/admin");
      setCurrentRoute("admin");
    } else {
      window.history.pushState({}, "", "/");
      window.location.hash = "";
      setCurrentRoute("customer");
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleLocationChange = () => {
      if (isURLAdmin()) {
        setCurrentRoute("admin");
      } else {
        setCurrentRoute("customer");
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (currentRoute === "admin" && isAdmin) {
      setShowAdminPanel(true);
    } else {
      setShowAdminPanel(false);
    }
  }, [currentRoute, isAdmin]);
  const [searchQuery, setSearchQuery] = useState("");
  const [waCooldown, setWaCooldown] = useState(false);
  const [waCooldownTime, setWaCooldownTime] = useState(0);

  // Expert System State
  const [showExpertSystem, setShowExpertSystem] = useState(false);
  const [expertStep, setExpertStep] = useState(1);
  const [expertCategory, setExpertCategory] = useState<"Printer" | "Laptop" | null>(null);
  const [expertType, setExpertType] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [expertAnswers, setExpertAnswers] = useState<Record<string, boolean>>({});
  const [diagnosisResults, setDiagnosisResults] = useState<{diagnosis: string, solution: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expertRules, setExpertRules] = useState<DiagnosisRule[]>([]);
  const [expertData, setExpertData] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [showVideoGallery, setShowVideoGallery] = useState(false);

  // Firestore Sync
  useEffect(() => {
    // Set authentication persistence to session-only (cleared when tab is closed)
    setPersistence(auth, browserSessionPersistence).catch((err) => {
      console.error("Error setting session persistence on mount:", err);
    });

    const pQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const sQuery = query(collection(db, "services"));
    const rQuery = query(collection(db, "expert_rules"));
    const dQuery = query(collection(db, "expert_data"));
    const vQuery = query(collection(db, "videos"));

    const unsubP = onSnapshot(pQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
    });

    const unsubS = onSnapshot(sQuery, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "services");
    });

    const unsubR = onSnapshot(rQuery, (snapshot) => {
      setExpertRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiagnosisRule)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "expert_rules");
    });

    const unsubD = onSnapshot(dQuery, (snapshot) => {
      if (!snapshot.empty) {
        setExpertData(snapshot.docs[0].data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "expert_data");
    });

    const unsubV = onSnapshot(vQuery, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "videos");
    });

    const unsubAuth = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setIsAdmin(currUser !== null);
    });

    return () => {
      unsubP();
      unsubS();
      unsubR();
      unsubD();
      unsubV();
      unsubAuth();
    };
  }, []);

  // WhatsApp Cooldown Management
  useEffect(() => {
    const lastClick = localStorage.getItem('last_wa_click');
    if (lastClick) {
      const diff = Date.now() - parseInt(lastClick);
      if (diff < 150000) { 
        setWaCooldown(true);
        setWaCooldownTime(Math.ceil((150000 - diff) / 1000));
      }
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (waCooldown && waCooldownTime > 0) {
      timer = setInterval(() => {
        setWaCooldownTime(prev => {
          if (prev <= 1) {
            setWaCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [waCooldown, waCooldownTime]);

  const handleWAContact = (url: string) => {
    if (waCooldown) {
      return; // Do nothing if cooling down, button should be disabled or showing time
    }
    
    localStorage.setItem('last_wa_click', Date.now().toString());
    setWaCooldown(true);
    setWaCooldownTime(150);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Sync theme with document class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = async (e: React.FormEvent, email: string, pass: string) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
      setShowAdminLogin(false);
    } catch (error) {
      alert("Login gagal! Pastikan email dan password benar.");
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowAdminLoginForm(false);
  };

  // Seed initial data if empty (for the admin)
  const resetExpert = () => {
    setExpertStep(1);
    setExpertCategory(null);
    setExpertType("");
    setSelectedSymptoms([]);
    setExpertAnswers({});
    setDiagnosisResults([]);
    setDynamicQuestions([]);
  };

  const handleInitializeExpertData = async () => {
    if (!isAdmin) return;
    
    setIsAnalyzing(true);
    try {
      // Seed Expert Rules if empty
      if (expertRules.length === 0) {
        for (const rule of DEFAULT_EXPERT_RULES) {
          const { id, ...rest } = rule;
          await addDoc(collection(db, "expert_rules"), rest);
        }
      }

      // Seed Expert Data if empty
      let dSnap;
      try {
        dSnap = await getDocs(collection(db, "expert_data"));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "expert_data");
        return;
      }
      
      if (dSnap.empty) {
        await addDoc(collection(db, "expert_data"), DEFAULT_EXPERT_DATA);
      }

      alert("Data dasar sistem pakar berhasil diimpor ke database.");
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Unknown error";
      alert(`Gagal menginisialisasi data: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const seedData = async () => {
    if (!isAdmin) return;
    
    // Check if empty
    if (products.length > 0) {
      alert("Data sudah ada.");
      return;
    }

    const initialProducts = [
      { 
        name: "HP Laserjet Pro M15w", 
        category: "Printer", 
        price: "Rp 1.850.000", 
        image: "https://picsum.photos/seed/printer1/800/600",
        description: "Printer laser terkecil di kelasnya di dunia, dirancang untuk efisiensi dengan pencetakan cepat dan solusi mobile yang mudah.",
        specs: ["Fungsi: Print only", "Koneksi: Wi-Fi, USB 2.0", "Kecepatan Cetak: Hingga 19 ppm", "Kapasitas Kertas: 150 lembar", "Tipe Toner: HP 48A Black LaserJet Toner Cartridge"],
        createdAt: serverTimestamp()
      },
      { 
        name: "Epson L3210 EcoTank", 
        category: "Printer", 
        price: "Rp 2.450.000", 
        image: "https://picsum.photos/seed/printer2/800/600",
        description: "Solusi cetak multifungsi hemat biaya dengan sistem tangki tinta terintegrasi yang andal.",
        specs: ["Fungsi: Print, Scan, Copy", "Tipe Tinta: Botol 003", "Resolusi Cetak: 5760 x 1440 dpi", "Kecepatan: 10 ipm (Hitam), 5.0 ipm (Warna)", "Garansi: 2 Tahun atau 30.000 Lembar"],
        createdAt: serverTimestamp()
      }
    ];

    const initialServices = [
      { title: "Service Printer", description: "Perbaikan berbagai merk printer seperti HP, Epson, Canon, Brother.", price: "Mulai Rp 50.000", icon: "Printer" },
      { title: "Service Laptop & PC", description: "Upgrade RAM, SSD, perbaikan motherboard, ganti keyboard.", price: "Mulai Rp 100.000", icon: "Laptop" }
    ];

    try {
      for (const p of initialProducts) {
        await addDoc(collection(db, "products"), p);
      }
      for (const s of initialServices) {
        await addDoc(collection(db, "services"), s);
      }

      // Seed Expert System Rules
      for (const rule of DEFAULT_EXPERT_RULES) {
        const { id, ...rest } = rule;
        await addDoc(collection(db, "expert_rules"), rest);
      }

      // Seed Expert System Data (Symptoms & General Questions)
      await addDoc(collection(db, "expert_data"), DEFAULT_EXPERT_DATA);

      alert("Data berhasil diinisialisasi.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "seed_data");
    }
  };

  const generateExpertQuestions = (category: "Printer" | "Laptop", symptoms: string[]) => {
    const relevantQuestions: string[] = [];
    // Use expertRules from state instead of hardcoded constant
    const rules = expertRules.length > 0 ? expertRules : DEFAULT_EXPERT_RULES;
    const filteredRules = rules.filter(r => r.category === category);
    
    // Add specific questions from matching rules
    filteredRules.forEach(rule => {
      if (rule.symptoms.some(s => symptoms.includes(s))) {
        rule.questions.forEach(q => {
          if (!relevantQuestions.includes(q.text)) relevantQuestions.push(q.text);
        });
      }
    });

    // Use fetched expert data if available, else fallback to default
    const data = expertData || DEFAULT_EXPERT_DATA;
    const generals = data[category].generalQuestions;
    
    let i = 0;
    while (relevantQuestions.length < 5 && i < generals.length) {
      if (!relevantQuestions.includes(generals[i])) relevantQuestions.push(generals[i]);
      i++;
    }

    return relevantQuestions;
  };

  const analyzeProblem = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      // Use expertRules from state or fallback
      const rulesToUse = expertRules.length > 0 ? expertRules : DEFAULT_EXPERT_RULES;
      const results = evaluateForwardChaining(expertCategory!, selectedSymptoms, expertAnswers, rulesToUse);
      // Personalize results with Device Model
      const personalizedResults = results.map(r => ({
        ...r,
        diagnosis: r.diagnosis === "Analisa Awal Komponen" ? r.diagnosis : `${r.diagnosis} (${expertType})`,
      }));
      setDiagnosisResults(personalizedResults);
      setExpertStep(5);
    } catch (error) {
      console.error("Diagnosis failed", error);
      alert("Maaf, terjadi kesalahan saat menganalisa.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollTo = (id: string) => {
    if (selectedProduct) setSelectedProduct(null);
    
    // Auto switch off admin panel if navigating to main sections
    if (['hero', 'about', 'services', 'products', 'location'].includes(id) && currentRoute === "admin") {
      navigateTo("/");
    }

    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
    setIsMenuOpen(false);
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleAdminTheme = () => {
    setIsAdminDarkMode(prev => {
      const nextVal = !prev;
      localStorage.setItem("isAdminDarkMode", String(nextVal));
      return nextVal;
    });
  };
  const activeTheme = currentRoute === "admin" ? isAdminDarkMode : isDarkMode;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${activeTheme ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} overflow-x-hidden`}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-colors duration-300 ${activeTheme ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => currentRoute === "admin" ? null : scrollTo('hero')}>
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <span className={`font-bold text-xl tracking-tight transition-colors ${activeTheme ? 'text-white' : 'text-slate-900'}`}>
                MULYA CATRIDGE
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-8">
              {currentRoute === "admin" ? (
                isAdmin ? (
                  <>
                    <button onClick={() => scrollTo('admin_stats')} className={`text-sm font-bold transition-colors uppercase tracking-wider ${activeTheme ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Dashboard</button>
                    <button onClick={() => scrollTo('admin_products')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${activeTheme ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Produk</button>
                    <button onClick={() => scrollTo('admin_services')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${activeTheme ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Layanan</button>
                    <button onClick={() => scrollTo('admin_expert')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${activeTheme ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Sistem Pakar</button>
                    <button onClick={() => scrollTo('admin_videos')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${activeTheme ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Kelola Video</button>
                    
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                    <button 
                      onClick={toggleAdminTheme}
                      className={`p-2 rounded-full transition-all ${activeTheme ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      title="Ubah Tema Admin"
                    >
                      {activeTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={toggleAdminTheme}
                      className={`p-2 rounded-full transition-all ${activeTheme ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      title="Ubah Tema Admin"
                    >
                      {activeTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                  </>
                )
              ) : (
                <>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('hero'); }} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Home</button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('about'); }} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Tentang Kami</button>
                  <button onClick={() => setShowVideoGallery(true)} className={`text-sm font-bold transition-colors uppercase tracking-wider text-rose-500 hover:text-rose-600 flex items-center gap-1`}>
                    <Film className="w-4 h-4" /> Hub Video
                  </button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('services'); }} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Layanan</button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('products'); }} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Produk</button>
                  <button 
                    onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } setShowExpertSystem(true); }} 
                    className={`text-sm font-bold transition-colors uppercase tracking-wider ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center gap-1`}
                  >
                    <ShieldCheck className="w-4 h-4"/> Diagnosa
                  </button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('location'); }} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Lokasi</button>
                  
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  
                  <button 
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>

                  <button 
                    onClick={() => handleWAContact(WA_CONTACT_LINK)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${waCooldown ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none'}`}
                  >
                    {waCooldown ? `Tunggu ${waCooldownTime}s` : 'Hubungi Kami'}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <button 
                onClick={currentRoute === "admin" ? toggleAdminTheme : toggleTheme}
                className={`p-2 rounded-full ${activeTheme ? 'text-yellow-400' : 'text-slate-600'}`}
              >
                {activeTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className={`p-2 ${activeTheme ? 'text-white' : 'text-slate-900'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`lg:hidden border-b transition-colors duration-300 ${activeTheme ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'} px-4 py-6 flex flex-col gap-4 shadow-xl`}
            >
              {currentRoute === "admin" ? (
                isAdmin ? (
                  <>
                    <button onClick={() => { scrollTo('admin_stats'); setIsMenuOpen(false); }} className="text-left py-2 font-bold text-blue-500">DASHBOARD ADMIN</button>
                    <button onClick={() => { scrollTo('admin_products'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Kelola Produk</button>
                    <button onClick={() => { scrollTo('admin_services'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Kelola Layanan</button>
                    <button onClick={() => { scrollTo('admin_expert'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Sistem Pakar</button>
                    <button onClick={() => { scrollTo('admin_videos'); setIsMenuOpen(false); }} className="text-left py-2 font-medium col-span-2">Kelola Video</button>
                  </>
                ) : null
              ) : (
                <>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('hero'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Home</button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('about'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Tentang Kami</button>
                  <button onClick={() => { setShowVideoGallery(true); setIsMenuOpen(false); }} className="text-left py-2 font-bold text-rose-500 flex items-center gap-2">
                    <Film className="w-4 h-4" /> Hub Video & Kegiatan
                  </button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('services'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Layanan</button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('products'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Produk</button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } setShowExpertSystem(true); setIsMenuOpen(false); }} className="text-left py-2 font-bold text-blue-500">Diagnosa Mandiri</button>
                  <button onClick={() => { if(showVideoGallery) { setShowVideoGallery(false); } scrollTo('location'); setIsMenuOpen(false); }} className="text-left py-2 font-medium">Lokasi</button>
                  <button 
                    onClick={() => handleWAContact(WA_CONTACT_LINK)}
                    className={`text-center py-3 rounded-xl font-bold mt-2 transition-all ${waCooldown ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {waCooldown ? `Tunggu ${waCooldownTime}s` : 'Hubungi Kami'}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        {currentRoute === "admin" ? (
          isAdmin ? (
            <AdminPanel 
              key="admin" 
              isDarkMode={isAdminDarkMode}
              products={products}
              services={services}
              expertRules={expertRules}
              videos={videos}
              isAdmin={isAdmin}
              isAnalyzing={isAnalyzing}
              seedData={seedData}
              handleLogout={handleLogout}
              setShowAdminPanel={setShowAdminPanel}
              handleInitializeExpertData={handleInitializeExpertData}
            />
          ) : showAdminLoginForm ? (
            <AdminLoginSection
              key="admin-login"
              isDarkMode={isAdminDarkMode}
              handleLogin={handleLogin}
              onBack={() => setShowAdminLoginForm(false)}
            />
          ) : (
            <AdminLandingPage
              key="admin-landing"
              isDarkMode={isAdminDarkMode}
              onStartLogin={() => setShowAdminLoginForm(true)}
            />
          )
        ) : selectedProduct ? (
          <ProductDetailModal 
            key="detail" 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            isDarkMode={isDarkMode}
            waCooldown={waCooldown}
            waCooldownTime={waCooldownTime}
            handleWAContact={handleWAContact}
          />
        ) : showVideoGallery ? (
          <motion.div 
            key="video_gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VideoGallery 
              videos={videos}
              isDarkMode={isDarkMode}
              onClose={() => setShowVideoGallery(false)}
            />
          </motion.div>
        ) : showFullCatalog ? (
          <motion.div 
            key="catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 text-center md:text-left">
                <div>
                  <button 
                    onClick={() => { setShowFullCatalog(false); setSearchQuery(""); }}
                    className="flex items-center gap-2 text-slate-500 font-bold mb-4 hover:text-blue-600 transition-colors mx-auto md:mx-0"
                  >
                    <ArrowLeft className="w-5 h-5" /> Kembali
                  </button>
                  <h1 className={`text-5xl md:text-7xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    SEMUA KATALOG
                  </h1>
                  <p className="text-slate-500 font-medium text-lg mt-2">Menampilkan seluruh inventori produk Mulya Catridge</p>
                </div>
                
                <div className={`flex items-center gap-4 p-4 rounded-3xl border w-full max-w-md ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <Search className="w-6 h-6 text-slate-400 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Cari produk (Epson, Canon, HP...)"
                    value={searchQuery}
                    className="bg-transparent border-none focus:ring-0 w-full font-bold text-lg focus:outline-none"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </div>
              </div>

              {products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.category.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {products.filter(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((product) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -10 }}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-6 rounded-[2rem] border transition-all cursor-pointer group flex flex-col items-center text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10'}`}
                    >
                      <div className="aspect-square w-full rounded-2xl overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800 relative">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      <h4 className={`text-xl font-bold mb-1 w-full ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{product.name}</h4>
                      <p className="text-blue-600 dark:text-blue-400 font-black text-lg mb-4">{product.price}</p>
                      <button 
                        onClick={() => {
                          setSelectedProduct(product);
                          window.scrollTo(0, 0);
                        }}
                        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                      >
                        Detail Produk
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-40">
                  <div className="bg-blue-600/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShoppingCart className="w-12 h-12 text-blue-600 opacity-20" />
                  </div>
                  <h3 className="text-2xl font-black italic mb-2">STOK SEDANG KOSONG</h3>
                  <p className="text-slate-500">Katalog akan segera diperbarui. Silakan hubungi admin untuk pemesanan khusus.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Spotify-style Hero Section */}
            <section id="hero" className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden min-h-[90vh] flex items-center">
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <img 
                  src="/fotomulya.png" 
                  className="w-full h-full object-cover"
                  alt="Mulya Catridge Store"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
              </div>
              
              <div className="max-w-7xl mx-auto w-full relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-3xl"
                >
                  <h1 className="text-5xl md:text-8xl font-black leading-tight mb-8 tracking-tighter">
                    Service Tanpa Batas. <br/>
                    <span className="text-blue-500">Beri Nyawa Baru</span> Untuk Gadget Anda.
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-400 mb-10 font-medium leading-relaxed">
                    Satu tempat untuk semua solusi IT. Professional, Garansi 100%, & Harga Terjangkau.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setShowExpertSystem(true)}
                      className="px-10 py-5 bg-blue-600 text-white rounded-full font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-6 h-6 text-blue-200" />
                      Diagnosa Mandiri (Sistem Pakar)
                    </button>
                    <button 
                      onClick={() => scrollTo('services')}
                      className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-full font-black text-lg hover:bg-white hover:text-black transition-all"
                    >
                      Lihat Layanan Kami
                    </button>
                  </div>
                  
                  <p className="mt-8 text-sm text-slate-500 font-semibold tracking-wide">
                    Tawaran hanya berlaku untuk unit yang dipercayakan kepada kami. Syarat & Ketentuan berlaku.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* About Section */}
            <section id="about" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
              <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-24">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4"
                  >
                    Profil Perusahaan
                  </motion.h2>
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight transition-colors"
                  >
                    Perjalanan MULYA CATRIDGE
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className={`max-w-2xl mx-auto text-lg leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                  >
                    Berawal dari bengkel kecil, kini kami telah berkembang menjadi mitra teknologi terpercaya di Bandung dengan ribuan pelanggan puas.
                  </motion.p>
                </div>

                {/* Vertical Timeline */}
                <div className="relative">
                  {/* Central Vertical Line */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-blue-100 dark:bg-slate-800 hidden md:block" />

                  <div className="space-y-24">
                    {[
                      {
                        year: "Sebelum 2004",
                        title: "Awal Perjalanan & Visi",
                        description: "Merintis karir dengan kejujuran di bidang penjualan cartridge. Berbekal pengalaman dan kepercayaan pelanggan, Bapak Mulya Zuli bertekad menghadirkan solusi IT yang lebih personal dan transparan melalui bendera sendiri.",
                        type: "image",
                        media: "/fotomulya1.jpg"
                      },
                      {
                        year: "Pertengahan 2004",
                        title: "Lahirnya Mulya Catridge",
                        description: "Resmi mendirikan CV. Mulya Catridge di Jaya Plaza Computer Mall Lt. 2 Bandung. Dimulai sebagai tim kecil bersama istri, kami fokus pada kualitas produk and pelayanan dari hati ke hati.",
                        type: "image",
                        media: "/fotomulya.png"
                      },
                      {
                        year: "Pertumbuhan",
                        title: "Ekspansi & Teknisi Ahli",
                        description: "Mendengar tingginya permintaan pelanggan, kami merambah ke jual-beli printer dan menghadirkan teknisi spesialis servis. Kini setiap masalah gadget Anda ditangani oleh ahlinya.",
                        type: "image",
                        media: "/fotomulya2.jpg"
                      },
                      {
                        year: "Sekarang",
                        title: "Satu Pusat Solusi Terbaik",
                        description: "Kini kami memfokuskan seluruh keahlian kami di Jl. A. Yani No. 288 untuk memberikan layanan yang lebih intensif dan berkualitas. Satu tempat, ribuan gadget yang telah terselamatkan!",
                        type: "image",
                        media: "/fotomulya3.jpg"
                      }
                    ].map((item, index) => (
                      <div key={index} className="relative flex flex-col md:flex-row items-center group">
                        {/* Desktop Connection Dot - Absolutely Centered on Line */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-12">
                          <div className="w-5 h-5 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 ring-8 ring-blue-500/10 shadow-lg shadow-blue-500/20" />
                        </div>

                        {/* Content Side (Alternating) */}
                        <div className={`flex-1 w-full px-4 md:px-0 flex flex-col ${index % 2 === 0 ? 'md:items-end md:pr-16 lg:pr-24' : 'md:items-start md:pl-16 lg:pl-24 md:order-last'}`}>
                          <div className={`p-8 rounded-3xl transition-all duration-500 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'} hover:shadow-2xl hover:shadow-blue-500/10 max-w-lg w-full relative z-10 text-center flex flex-col items-center justify-center`}>
                            <span className="text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-widest mb-2 block w-full">{item.year}</span>
                            <h4 className="text-2xl font-bold mb-4 w-full">{item.title}</h4>
                            <p className={`leading-relaxed w-full ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Spacer for Dots in Mobile (Hidden in Desktop because of Absolute positioning) */}
                        <div className="w-0.5 h-12 bg-blue-100 dark:bg-slate-800 md:hidden my-4" />

                        {/* Media Side (Alternating) */}
                        <div className={`flex-1 w-full px-4 md:px-0 ${index % 2 === 0 ? 'md:pl-16 lg:pl-24' : 'md:pr-16 lg:pr-24'}`}>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-500 border border-slate-100 dark:border-slate-800"
                          >
                            {item.type === "video" ? (
                              <div className="relative w-full h-full bg-slate-800">
                                <video 
                                  src={item.media} 
                                  controls 
                                  className="w-full h-full object-cover"
                                  poster={(item as any).placeholder}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            ) : (
                              <img 
                                src={item.media} 
                                alt={item.title} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544265853-463870624021?q=80&w=2000&auto=format&fit=crop";
                                }}
                              />
                            )}
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features Summary */}
                <div className="mt-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { icon: ShieldCheck, text: "Garansi Resmi 100%" },
                    { icon: Settings, text: "Teknisi Profesional" },
                    { icon: Clock, text: "Servis Cepat & Akurat" },
                    { icon: Laptop, text: "Suku Cadang Original" }
                  ].map((feature, i) => (
                    <div key={i} className={`flex items-center gap-4 p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl'}`}>
                      <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Visual Video Hub Call-to-Action */}
                <div className={`mt-24 p-12 rounded-[3.5rem] relative overflow-hidden border ${isDarkMode ? 'bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border-indigo-500/10' : 'bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-white border-blue-500/10 shadow-xl'}`}>
                  {/* Absolute decoration elements */}
                  <div className="absolute top-[-50px] right-[-50px] w-60 h-60 rounded-full bg-blue-600/10 dark:bg-blue-500/5 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-[-30px] left-[-30px] w-40 h-40 rounded-full bg-indigo-600/10 dark:bg-indigo-500/5 blur-2xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="text-center lg:text-left">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 mb-4 animate-pulse">
                        <Film className="w-4 h-4 fill-current" /> Video Dokumentasi & Promo terbaru
                      </span>
                      <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic mb-3">
                        Tonton Kegiatan & Review Kami di Video Hub
                      </h3>
                      <p className={`max-w-2xl text-sm md:text-base leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Ingin tahu proses di balik layar pengerjaan printer handal, review barang-barang baru yang masuk store, atau vlogs aktivitas harian teknisi andalan kami? Semua dirangkum eksklusif dalam bentuk video yang bisa Anda tonton secara bebas!
                      </p>
                    </div>
                    <button 
                      onClick={() => { setShowVideoGallery(true); window.scrollTo(0,0); }}
                      className="px-8 py-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shrink-0 cursor-pointer"
                    >
                      Buka Galeri Video <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Section */}
            <section id="services" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <div className="max-w-7xl mx-auto mb-16">
                <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Layanan Unggulan</h2>
                <h3 className={`text-4xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Solusi Lengkap Untuk Kebutuhan Anda</h3>
              </div>
              
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {services.map((service, index) => {
                  const Icon = service.icon === "Laptop" ? Laptop : 
                              service.icon === "ShoppingCart" ? ShoppingCart :
                              service.icon === "Settings" ? Settings : Printer;
                  return (
                    <motion.div 
                      key={index}
                      whileHover={{ y: -10 }}
                      className={`p-8 rounded-3xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
                    >
                      {service.image ? (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6">
                          <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className={`mb-6 p-4 w-fit rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
                          <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                        </div>
                      )}
                      <h4 className={`text-xl font-bold mb-1 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{service.title}</h4>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-bold mb-4">{service.price}</p>
                      <p className={`leading-relaxed text-sm transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {service.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Products Section */}
            <section id="products" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Daftar Produk</h2>
                    <h3 className={`text-4xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Katalog Produk Tersedia</h3>
                  </div>
                  <button 
                    onClick={() => { setShowFullCatalog(true); window.scrollTo(0,0); }}
                    className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2 group"
                  >
                    Lihat Semua Katalog <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="relative mb-4 rounded-3xl overflow-hidden aspect-[4/3] shadow-md">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${isDarkMode ? 'bg-slate-900/90 text-white' : 'bg-white/90 text-slate-800'}`}>
                            {product.category}
                          </span>
                        </div>
                      </div>
                      <h4 className={`text-xl font-bold mb-1 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{product.name}</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-600 dark:text-blue-400 font-bold">{product.price}</p>
                        <button className={`p-2 rounded-full transition-all group-hover:bg-blue-600 group-hover:text-white ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Location Section */}
            <section id="location" className={`py-24 px-4 sm:px-6 lg:px-8 relative transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-slate-900'}`}>
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
                <div className="flex-1 text-white">
                  <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Lokasi Toko</h2>
                  <h3 className="text-4xl font-bold mb-8">Kunjungi Showroom Kami</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white/10'}`}>
                        <MapPin className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Alamat</h4>
                        <p className="text-slate-400">Jl. A. Yani sebelah pos keamanan No.288, Kacapiring, Kec. Batununggal, Kota Bandung, Jawa Barat 40271</p>
                        <p className="text-slate-500 italic mt-1 text-sm">Cek peta untuk lokasi presisi.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white/10'}`}>
                        <Clock className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Jam Operasional</h4>
                        <p className="text-slate-400">Senin - Sabtu: 09:00 - 18:00</p>
                        <p className="text-slate-400">Minggu: Tutup / Dengan Janji Temu</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white/10'}`}>
                        <Phone className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Kontak</h4>
                        <p className="text-slate-400">+62 812-2374-7477</p>
                        <p className="text-slate-400">mulyacatridge@email.com</p>
                      </div>
                    </div>
                  </div>
                  
                  <a 
                    href="https://maps.app.goo.gl/hAxLVjXHY6NY1c2J6?g_st=aw" 
                    target="_blank" 
                    className={`mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl ${isDarkMode ? 'bg-white text-slate-900 hover:bg-blue-400 hover:text-white' : 'bg-white text-slate-900 hover:bg-blue-400 hover:text-white border-2 border-transparent'}`}
                  >
                    Buka di Google Maps
                  </a>
                </div>
                
                <div className={`flex-1 w-full aspect-square md:aspect-video lg:aspect-square rounded-[2rem] overflow-hidden shadow-2xl relative transition-colors ${isDarkMode ? 'bg-slate-900 border-2 border-slate-800' : 'bg-slate-800'}`}>
                   <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-800'}`}>
                      <div className="text-center p-8">
                        <div className="bg-blue-600/20 p-6 rounded-full inline-block mb-6">
                          <MapPin className="w-12 h-12 text-blue-500" />
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-4">Peta Lokasi Toko</h4>
                        <p className="text-slate-400 mb-8 max-w-sm">Dapatkan rute terbaik menuju MULYA CATRIDGE melalui Google Maps.</p>
                        <a 
                          href="https://maps.app.goo.gl/hAxLVjXHY6NY1c2J6?g_st=aw" 
                          target="_blank"
                          className="block w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                        >
                          Petunjuk Arah
                        </a>
                      </div>
                   </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 border-t transition-colors duration-300 ${activeTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Printer className="w-5 h-5" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${activeTheme ? 'text-white' : 'text-slate-900'}`}>MULYA CATRIDGE</span>
          </div>
          
          {currentRoute !== "admin" && (
            <div className={`flex gap-8 text-sm font-medium ${activeTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              <button onClick={() => scrollTo('hero')} className="hover:text-blue-600">Home</button>
              <button onClick={() => scrollTo('about')}  className="hover:text-blue-600">Tentang</button>
              <button onClick={() => scrollTo('services')} className="hover:text-blue-600">Layanan</button>
              <button onClick={() => scrollTo('products')} className="hover:text-blue-600">Produk</button>
            </div>
          )}
          
          <div className="text-slate-400 text-sm hidden md:block">
            Jl. A. Yani No.288, Kacapiring, Kota Bandung
          </div>
          <div className="text-slate-400 text-sm">
            © 2026 MULYA CATRIDGE. All rights reserved.
          </div>
        </div>
      </footer>

      {showAdminLogin && (
        <AdminLoginModal 
          isDarkMode={isDarkMode} 
          setShowAdminLogin={setShowAdminLogin} 
          handleLogin={handleLogin} 
        />
      )}
      {showExpertSystem && (
        <ExpertSystemModal 
          expertStep={expertStep}
          expertCategory={expertCategory}
          expertType={expertType}
          selectedSymptoms={selectedSymptoms}
          expertAnswers={expertAnswers}
          diagnosisResults={diagnosisResults}
          dynamicQuestions={dynamicQuestions}
          isAnalyzing={isAnalyzing}
          isDarkMode={isDarkMode}
          expertData={expertData}
          setShowExpertSystem={setShowExpertSystem}
          setExpertStep={setExpertStep}
          setExpertCategory={setExpertCategory}
          setExpertType={setExpertType}
          setSelectedSymptoms={setSelectedSymptoms}
          setExpertAnswers={setExpertAnswers}
          setDiagnosisResults={setDiagnosisResults}
          setDynamicQuestions={setDynamicQuestions}
          generateExpertQuestions={generateExpertQuestions}
          analyzeProblem={analyzeProblem}
          resetExpert={resetExpert}
          isMenuOpen={isMenuOpen}
          waCooldown={waCooldown}
          waCooldownTime={waCooldownTime}
          handleWAContact={handleWAContact}
        />
      )}
    </div>
  );
}
