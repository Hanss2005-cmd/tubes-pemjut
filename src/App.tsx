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
  Menu,
  X,
  Sun,
  Moon,
  Smartphone,
  Search,
  ChevronLeft
} from "lucide-react";
import { useState, useEffect } from "react";
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
  serverTimestamp
} from "firebase/firestore";

import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User 
} from "firebase/auth";
import { db, auth } from "./lib/firebase";

// WhatsApp Configuration
const WA_NUMBER = "6281223747477";
const WA_MSG_TEMPLATE = `Halo, saya ingin menggunakan layanan Mulya Cartridge.

Keperluan: (Service / Beli / Jual)
Produk: (Printer / Laptop / PC)
Merek/Tipe:
Keluhan/Keterangan:
Lokasi:

Mohon bantuannya, terima kasih.`;

const WA_LINK = `https://wa.me/${WA_NUMBER}`;
const WA_CONTACT_LINK = `${WA_LINK}?text=${encodeURIComponent(WA_MSG_TEMPLATE)}`;
const ADMIN_EMAIL = "firmanalghifari624@gmail.com";

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

const EXPERT_RULES: DiagnosisRule[] = [
  // PRINTER RULES
  {
    id: "p1",
    category: "Printer",
    symptoms: ["Hasil cetak bergaris", "Warna tidak keluar", "Text terputus-putus"],
    logic: "OR",
    questions: [
      { text: "Apakah printer sudah tidak digunakan lebih dari 1 minggu?", expected: true },
      { text: "Apakah sudah mencoba deep cleaning lewat driver?", expected: true },
      { text: "Apakah selang infus terlihat ada gelembung udara?", expected: true }
    ],
    diagnosis: "Head Printer Mampet / Kering",
    solution: "Lakukan Power Ink Flushing via Maintenance Software. Jika tetap, Head perlu di-servis manual menggunakan cairan head cleaner oleh teknisi."
  },
  {
    id: "p2",
    category: "Printer",
    symptoms: ["Lampu orange berkedip", "Pesan 'Service Required'"],
    logic: "OR",
    questions: [
      { text: "Apakah muncul kode error seperti 'Ink pad is at the end of its service life'?", expected: true },
      { text: "Apakah lampu power dan resume berkedip bergantian?", expected: true },
      { text: "Apakah printer masih bisa mencetak atau terkunci total?", expected: true }
    ],
    diagnosis: "Waste Ink Pad Meter Full (Resetter)",
    solution: "Printer perlu di-reset menggunakan software Resetter khusus tipe tersebut. Disarankan untuk mengganti atau mencuci busa pembuangan tinta agar tidak meluber."
  },
  {
    id: "p3",
    category: "Printer",
    symptoms: ["Kertas macet (Paper Jam)", "Suara berisik saat narik kertas", "Kertas robek saat keluar"],
    logic: "OR",
    questions: [
      { text: "Apakah ada benda asing seperti klip atau potongan kertas di dalam?", expected: true },
      { text: "Apakah Anda menggunakan kertas yang terlalu tebal atau lembab?", expected: true },
      { text: "Apakah roller penarik kertas terlihat berputar tapi tidak menarik?", expected: true }
    ],
    diagnosis: "Mekanik Pickup Roller / Sensor Kertas",
    solution: "Bersihkan roller penarik kertas dari debu. Jika roller aus, perlu penggantian karet pickup roller. Cek jalur kertas dari benda asing."
  },
  {
    id: "p5",
    category: "Printer",
    symptoms: ["Tinta bocor", "Hasil cetak kotor"],
    logic: "OR",
    questions: [
      { text: "Apakah posisi tabung infus diletakkan lebih tinggi dari printer?", expected: true },
      { text: "Apakah cartridge sering diisi ulang secara manual dengan suntikan?", expected: true }
    ],
    diagnosis: "Banjir Tinta / Cartridge Bocor",
    solution: "Segera turunkan posisi tabung sejajar dengan printer. Bersihkan sisa tinta di dalam body printer agar tidak mengenai Mainboard."
  },
  {
    id: "p6",
    category: "Printer",
    symptoms: ["Scanner tidak jalan", "Hasil scan buram"],
    logic: "OR",
    questions: [
      { text: "Apakah ada suara kasar saat scanner mulai bergerak?", expected: true },
      { text: "Apakah lampu scanner menyala saat proses scan berjalan?", expected: false }
    ],
    diagnosis: "Power Scanner / Motor CIS Lemah",
    solution: "Ganti unit kabel fleksibel scanner atau lampu CIS scanner. Cek juga jalur kabel ke mainboard."
  },
  
  // LAPTOP RULES
  {
    id: "l1",
    category: "Laptop",
    symptoms: ["Laptop lambat (Lemot)", "Gagal update Windows"],
    logic: "OR",
    questions: [
      { text: "Apakah laptop masih menggunakan Harddisk (HDD)?", expected: true },
      { text: "Apakah RAM laptop Anda masih 4GB ke bawah?", expected: true },
      { text: "Apakah booting Windows memerlukan waktu lebih dari 1 menit?", expected: true }
    ],
    diagnosis: "Bottle-neck Storage / Performa HDD",
    solution: "Hardware laptop Anda masih sehat, namun tertinggal teknologi. Sangat disarankan upgrade ke SSD dan tambah RAM minimal 8GB untuk performa 10x lebih cepat."
  },
  {
    id: "l2",
    category: "Laptop",
    symptoms: ["Laptop panas sekali (Overheat)", "Kipas berisik", "Sering restart sendiri"],
    logic: "OR",
    questions: [
      { text: "Apakah hawa panas tidak terasa keluar dari lubang kipas?", expected: true },
      { text: "Apakah laptop mati mendadak saat menjalankan aplikasi berat/game?", expected: true },
      { text: "Apakah kipas berputar kencang tapi laptop tetap panas?", expected: true }
    ],
    diagnosis: "Overheat / Sirkulasi Udara Macet",
    solution: "Segera bersihkan debu pada kipas dan heatsink. Ganti Thermal Paste prosessor yang sudah kering dengan kualitas tinggi agar suhu kembali dingin."
  },
  {
    id: "l3",
    category: "Laptop",
    symptoms: ["Baterai tidak mengisi", "Laptop mati saat charger dilepas", "Baterai kembung"],
    logic: "OR",
    questions: [
      { text: "Apakah indikator baterai tertulis 'Plugged in, not charging'?", expected: true },
      { text: "Apakah charger terasa sangat panas saat digunakan?", expected: true },
      { text: "Apakah kesehatan baterai di bawah 50%?", expected: true }
    ],
    diagnosis: "Baterai Drop / Sirkuit Charging",
    solution: "Jika kesehatan baterai rendah, solusinya adalah ganti baterai baru. Jika baterai masih bagus tapi tidak mengisi, kemungkinan ada kerusakan pada IC Power di Mainboard."
  },
  {
    id: "l5",
    category: "Laptop",
    symptoms: ["Keyboard ada tombol mati", "Keyboard ngetik sendiri"],
    logic: "OR",
    questions: [
      { text: "Apakah laptop pernah terkena tumpahan cairan atau air?", expected: true },
      { text: "Apakah masalah muncul hanya pada beberapa tombol tertentu?", expected: true }
    ],
    diagnosis: "Keyboard Short / Jalur Putus",
    solution: "Ganti keyboard unit satu set. Hindari memperbaiki jalur keyboard secara manual karena biasanya tidak tahan lama."
  },
  {
    id: "l6",
    category: "Laptop",
    symptoms: ["Layar bergaris", "Layar berkedip (Flicker)", "Layar pecah/retak"],
    logic: "OR",
    questions: [
      { text: "Apakah garis muncul sejak laptop pertama kali dinyalakan?", expected: true },
      { text: "Apakah garis hilang saat layar digerakkan/ditekuk perlahan?", expected: true },
      { text: "Apakah tampilannya normal jika dicolok ke monitor eksternal?", expected: true }
    ],
    diagnosis: "Panel LCD / Kabel Fleksibel Layar",
    solution: "Jika di monitor eksternal normal, berarti LCD atau kabel fleksibelnya bermasalah. Perlu pengecekan fisik untuk memastikan mana yang harus diganti."
  },
  {
    id: "l7",
    category: "Laptop",
    symptoms: ["Blue Screen (BSOD)", "Masuk BIOS terus"],
    logic: "OR",
    questions: [
      { text: "Apakah muncul pesan 'No Bootable Device'?", expected: true },
      { text: "Apakah RAM pernah di-upgrade atau diganti sebelumnya?", expected: true }
    ],
    diagnosis: "Kegagalan Sistem / Harddisk Rusak",
    solution: "Coba install ulang Windows. Jika proses install gagal di tengah (hang), berarti Harddisk/SSD Anda sudah rusak secara fisik (bad sector)."
  }
];

// Expert System Knowledge Base (Symptoms List)
const EXPERT_DATA = {
  Printer: {
    symptoms: [
      "Hasil cetak bergaris", "Warna tidak keluar", "Warna pudar", "Kertas macet (Paper Jam)", 
      "Lampu orange berkedip", "Printer mati total", "Hasil cetak kotor", "Suara berisik saat narik kertas",
      "Kertas robek saat keluar", "Printer tidak terdeteksi PC", "Tinta bocor", "Text terputus-putus", 
      "Resetter minta dijalankan", "Pesan 'Service Required'", "Scanner tidak jalan", "Head buntu (Clogged)"
    ],
    generalQuestions: [
      "Apakah perangkat pernah jatuh atau terkena air?",
      "Apakah Anda menggunakan komponen original?",
      "Apakah sudah mencoba restart perangkat?",
      "Apakah kabel koneksi sudah dipastikan terpasang erat?",
      "Apakah usia perangkat sudah lebih dari 3 tahun?",
      "Apakah sudah dilakukan pembersihan fisik luar?"
    ]
  },
  Laptop: {
    symptoms: [
      "Laptop lambat (Lemot)", "Sering restart sendiri", "Baterai tidak mengisi", "Layar bergaris",
      "Keyboard ada tombol mati", "Touchpad tidak fungsi", "Blue Screen (BSOD)", "Laptop panas sekali (Overheat)",
      "Speaker pecah suaranya", "Kipas berisik", "Harddisk bunyi 'krek'", "Layar pecah/retak",
      "Keyboard ngetik sendiri", "Laptop mati saat charger dilepas", "Layar berkedip (Flicker)", "Masuk BIOS terus"
    ],
    generalQuestions: [
      "Apakah laptop pernah terbentur atau jatuh?",
      "Apakah laptop pernah terkena tumpahan cairan?",
      "Apakah sering menggunakan laptop di atas kasur?",
      "Apakah pengisi daya (charger) yang digunakan original?",
      "Apakah masalah muncul setelah instalasi update software?",
      "Apakah laptop terasa tersengat listrik saat disentuh?"
    ]
  }
};

const evaluateForwardChaining = (category: string, selectedSymptoms: string[], answers: Record<string, boolean>) => {
  const finalResults: { diagnosis: string; solution: string }[] = [];
  
  // Get rules for this category
  const activeRules = EXPERT_RULES.filter(r => r.category === category);
  
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
      solution: "Berdasarkan gejala, ada indikasi kerusakan pada sistem internal. Karena gejala yang Anda masukkan sangat spesifik atau belum masuk database kami, langkah terbaik adalah membawa unit Anda ke Mulya Cartridge untuk pengecekan fisik gratis." 
    }];
  }

  return finalResults;
};


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
}


export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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

  // Firestore Sync
  useEffect(() => {
    const pQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const sQuery = query(collection(db, "services"));

    const unsubP = onSnapshot(pQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubS = onSnapshot(sQuery, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });

    const unsubAuth = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setIsAdmin(currUser?.email === ADMIN_EMAIL);
    });

    return () => {
      unsubP();
      unsubS();
      unsubAuth();
    };
  }, []);

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
      await signInWithEmailAndPassword(auth, email, pass);
      setShowAdminLogin(false);
    } catch (error) {
      alert("Login gagal! Pastikan email dan password benar.");
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowAdminPanel(false);
  };

  // Seed initial data if empty (for the admin)
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

    for (const p of initialProducts) {
      await addDoc(collection(db, "products"), p);
    }
    for (const s of initialServices) {
      await addDoc(collection(db, "services"), s);
    }
    alert("Data berhasil diinisialisasi.");
  };

  const generateExpertQuestions = (category: "Printer" | "Laptop", symptoms: string[]) => {
    const relevantQuestions: string[] = [];
    const rules = EXPERT_RULES.filter(r => r.category === category);
    
    // Add specific questions from matching rules
    rules.forEach(rule => {
      if (rule.symptoms.some(s => symptoms.includes(s))) {
        rule.questions.forEach(q => {
          if (!relevantQuestions.includes(q.text)) relevantQuestions.push(q.text);
        });
      }
    });

    // Fill with general questions until we have 10
    const generals = EXPERT_DATA[category].generalQuestions;
    let i = 0;
    while (relevantQuestions.length < 10 && i < generals.length) {
      if (!relevantQuestions.includes(generals[i])) relevantQuestions.push(generals[i]);
      i++;
    }

    return relevantQuestions.slice(0, 10);
  };

  const analyzeProblem = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const results = evaluateForwardChaining(expertCategory!, selectedSymptoms, expertAnswers);
      setDiagnosisResults(results);
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
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
    setIsMenuOpen(false);
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Admin Components
  const AdminLoginModal = () => {
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

  const ProductForm = ({ product, onClose }: { product?: Product, onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: product?.name || "",
      category: product?.category || "Printer",
      price: product?.price || "",
      image: product?.image || "",
      description: product?.description || "",
      specs: product?.specs.join("\n") || ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
        ...formData,
        specs: formData.specs.split("\n").filter(s => s.trim() !== ""),
        updatedAt: serverTimestamp()
      };

      if (product) {
        await updateDoc(doc(db, "products", product.id), data);
      } else {
        await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
      }
      onClose();
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-2xl my-8 p-8 rounded-[2.5rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}
        >
          <h3 className="text-2xl font-black mb-6">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-xs font-black uppercase mb-1 opacity-50">URL Foto</label>
                <input required value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Deskripsi Ringkas</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Spesifikasi (Satu per baris)</label>
              <textarea value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} rows={5} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
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

  const ServiceForm = ({ service, onClose }: { service?: Service, onClose: () => void }) => {
    const [formData, setFormData] = useState({
      title: service?.title || "",
      description: service?.description || "",
      price: service?.price || "",
      icon: service?.icon || "Printer"
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (service) {
        await updateDoc(doc(db, "services", service.id), formData);
      } else {
        await addDoc(collection(db, "services"), formData);
      }
      onClose();
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}
        >
          <h3 className="text-2xl font-black mb-6">{service ? 'Edit Layanan' : 'Tambah Layanan'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 opacity-50">Judul Layanan</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
            </div>
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

  const AdminPanel = () => {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-black italic">ADMIN DASHBOARD</h1>
              <p className="text-slate-500 font-medium">Kelola Produk & Layanan MULYA CARTRIDGE</p>
            </div>
            <div className="flex gap-4">
              <button onClick={handleLogout} className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all">Keluar</button>
              <button onClick={() => setShowAdminPanel(false)} className={`px-6 py-3 rounded-xl font-bold border transition-all ${isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>Tutup</button>
            </div>
          </div>

          {!products.length && (
            <div className="mb-12 p-10 rounded-[2.5rem] bg-blue-600/10 border-2 border-dashed border-blue-600/30 text-center">
              <h3 className="text-xl font-bold mb-4">Sepertinya Database Masih Kosong</h3>
              <p className="text-slate-500 mb-6">Klik tombol dibawah untuk mengisi data awal secara otomatis.</p>
              <button onClick={seedData} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:scale-105 transition-all">Inisialisasi Data</button>
            </div>
          )}

          {/* Manage Products */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">Produk ({products.length})</h2>
              <button onClick={() => setShowProductForm(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">Tambah Produk</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className={`p-4 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                    <img src={p.image} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">{p.name}</h4>
                  <p className="text-blue-600 font-bold mb-4">{p.price}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProduct(p)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-bold rounded-lg hover:bg-blue-600 hover:text-white transition">Edit</button>
                    <button onClick={async () => { if(confirm("Hapus produk?")) await deleteDoc(doc(db, "products", p.id)) }} className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manage Services */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">Layanan ({services.length})</h2>
              <button onClick={() => setShowServiceForm(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">Tambah Layanan</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map(s => (
                <div key={s.id} className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <h4 className="font-bold mb-1">{s.title}</h4>
                  <p className="text-blue-600 text-sm font-bold mb-1">{s.price}</p>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{s.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingService(s)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition">Edit</button>
                    <button onClick={async () => { if(confirm("Hapus layanan?")) await deleteDoc(doc(db, "services", s.id)) }} className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Item Forms */}
          {showProductForm && <ProductForm onClose={() => setShowProductForm(false)} />}
          {editingProduct && <ProductForm product={editingProduct} onClose={() => setEditingProduct(null)} />}
          {showServiceForm && <ServiceForm onClose={() => setShowServiceForm(false)} />}
          {editingService && <ServiceForm service={editingService} onClose={() => setEditingService(null)} />}
        </div>
      </motion.div>
    );
  };

  const ExpertSystemModal = () => {
    const symptoms = expertCategory ? EXPERT_DATA[expertCategory].symptoms : [];

    const resetExpert = () => {
      setExpertStep(1);
      setExpertCategory(null);
      setExpertType("");
      setSelectedSymptoms([]);
      setExpertAnswers({});
      setDiagnosisResults([]);
      setDynamicQuestions([]);
    };

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-2xl my-8 p-8 rounded-[2.5rem] shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100'}`}
        >
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

          <AnimatePresence mode="wait">
            {expertStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
              </motion.div>
            )}

            {expertStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold mb-6">Tulis Merk & Tipe {expertCategory}:</h3>
                <input 
                  autoFocus
                  placeholder="Contoh: Epson L3110 / Laptop ASUS Zenbook"
                  value={expertType}
                  onChange={e => setExpertType(e.target.value)}
                  className={`w-full p-6 rounded-2xl border-2 text-xl font-bold focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200 focus:border-blue-600 transition'}`}
                />
                <div className="flex gap-4 mt-8">
                  <button onClick={() => setExpertStep(1)} className="flex-1 py-4 font-bold rounded-xl border border-slate-200">Kembali</button>
                  <button disabled={!expertType} onClick={() => setExpertStep(3)} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">Lanjut ke Gejala</button>
                </div>
              </motion.div>
            )}

            {expertStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold mb-4">Pilih Gejala yang Sesuai (Bisa Lebih dari Satu):</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto p-2 border-y border-slate-100 dark:border-slate-800 custom-scrollbar">
                  {symptoms.map(s => (
                    <button 
                      key={s}
                      onClick={() => {
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
              </motion.div>
            )}

            {expertStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-xl font-bold mb-4">Verifikasi Informasi Tambahan:</h3>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto p-2 pr-4 custom-scrollbar">
                  {dynamicQuestions.map((q, i) => (
                    <div key={i} className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-sm font-bold opacity-80">{i+1}. {q}</p>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => setExpertAnswers({...expertAnswers, [q]: true})}
                          className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${expertAnswers[q] === true ? 'bg-green-500 text-white ring-4 ring-green-500/20 shadow-lg' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >IYA</button>
                        <button 
                          onClick={() => setExpertAnswers({...expertAnswers, [q]: false})}
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
              </motion.div>
            )}

            {expertStep === 5 && diagnosisResults.length > 0 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="text-center">
                  <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500/20">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-green-500">Analisa Forward Chaining Selesai</h3>
                  <h4 className="text-2xl font-black mt-1 uppercase italic leading-tight">Ditemukan {diagnosisResults.length} Indikasi Kerusakan</h4>
                </div>

                <div className="space-y-4 max-h-[35vh] overflow-y-auto px-1 custom-scrollbar">
                  {diagnosisResults.map((result, idx) => (
                    <div key={idx} className={`p-5 rounded-3xl border-2 ${isDarkMode ? 'border-slate-800 bg-slate-800/40' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-6 bg-red-500 rounded-full" />
                        <h5 className="font-black text-lg uppercase italic">{result.diagnosis}</h5>
                      </div>
                      <p className="text-xs font-black uppercase mb-1 opacity-50 text-blue-500">Saran & Solusi:</p>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-semibold">{result.solution}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <a 
                    href={`${WA_LINK}?text=Halo Mulya Cartridge, saya melakukan diagnosa mandiri untuk ${expertCategory} ${expertType}. Hasil diagnosa: ${diagnosisResults.map(r => r.diagnosis).join(", ")}. Saya ingin konsultasi perbaikan.`}
                    target="_blank"
                    className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20"
                  >
                    <Smartphone className="w-5 h-5" /> CHAT TEKNISI SEKARANG
                  </a>
                  <button onClick={resetExpert} className={`flex-1 py-4 rounded-2xl font-bold border ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}> ULANGI DIAGNOSA</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  // Sub-components for better organization
  const ProductDetail = ({ product }: { product: Product }) => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => setSelectedProduct(null)}
          className="flex items-center gap-2 text-blue-600 font-bold mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Katalog
        </button>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2">
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="lg:w-1/2">
            <span className="inline-block px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-widest mb-4">
              {product.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8">{product.price}</p>
            
            <div className="prose prose-slate dark:prose-invert max-w-none mb-10">
              <h3 className="text-xl font-bold mb-3">Deskripsi Produk</h3>
              <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                {product.description}
              </p>
            </div>

            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4">Spesifikasi Lengkap</h3>
              <ul className="space-y-3">
                {product.specs.map((spec, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={`${WA_LINK}?text=${encodeURIComponent(`Halo Mulya Cartridge, saya tertarik dengan produk:
*${product.name}*

Bisakah saya tanya lebih lanjut?

Foto: ${product.image.startsWith('http') ? product.image : window.location.origin + product.image}`)}`}
                target="_blank"
                className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none"
              >
                Pesan Sekarang via WA
              </a>
              <button 
                onClick={() => setSelectedProduct(null)}
                className={`flex-1 px-8 py-4 rounded-2xl font-bold border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                Lihat Lainnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} overflow-x-hidden`}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('hero')}>
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <span className={`font-bold text-xl tracking-tight transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                MULYA CARTRIDGE
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo('about')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Tentang Kami</button>
              <button onClick={() => scrollTo('services')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Layanan</button>
              <button onClick={() => scrollTo('products')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Produk</button>
              <button 
                onClick={() => setShowExpertSystem(true)} 
                className={`text-sm font-bold transition-colors uppercase tracking-wider ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center gap-1`}
              >
                <ShieldCheck className="w-4 h-4"/> Diagnosa
              </button>
              <button onClick={() => scrollTo('location')} className={`text-sm font-medium transition-colors uppercase tracking-wider ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>Lokasi</button>
              
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <a href={WA_CONTACT_LINK} target="_blank" className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none">
                Hubungi Kami
              </a>
            </div>

            {/* Mobile Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full ${isDarkMode ? 'text-yellow-400' : 'text-slate-600'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className={`p-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
              className={`md:hidden border-b transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'} px-4 py-6 flex flex-col gap-4 shadow-xl`}
            >
              <button onClick={() => scrollTo('about')} className="text-left py-2 font-medium">Tentang Kami</button>
              <button onClick={() => scrollTo('services')} className="text-left py-2 font-medium">Layanan</button>
              <button onClick={() => scrollTo('products')} className="text-left py-2 font-medium">Produk</button>
              <button onClick={() => { setShowExpertSystem(true); setIsMenuOpen(false); }} className="text-left py-2 font-bold text-blue-500">Diagnosa Mandiri</button>
              <button onClick={() => scrollTo('location')} className="text-left py-2 font-medium">Lokasi</button>
              <a href={WA_CONTACT_LINK} target="_blank" className="bg-blue-600 text-white text-center py-3 rounded-xl font-bold mt-2">
                Hubungi Kami
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        {showAdminPanel && isAdmin ? (
          <AdminPanel key="admin" />
        ) : selectedProduct ? (
          <ProductDetail product={selectedProduct} />
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
                  alt="Mulya Cartridge Store"
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
            <section id="about" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                <div className="flex-1 md:order-last">
                  <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Profil Perusahaan</h2>
                  <h3 className={`text-4xl font-bold mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tentang MULYA CARTRIDGE</h3>
                  <p className={`text-lg leading-relaxed mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Mulya Cartridge adalah mitra terpercaya bagi Anda yang membutuhkan perawatan dan penyediaan perangkat komputasi. Kami berdiri dengan dedikasi tinggi untuk memberikan solusi terbaik bagi setiap permasalahan tech hardware Anda.
                  </p>
                  <p className={`text-lg leading-relaxed mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Mulai dari kebutuhan perorangan hingga korporasi, tim ahli kami siap membantu Anda dengan layanan yang transparan, cepat, dan berkualitas prima.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <ShieldCheck className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                      <span className="font-semibold">Bergaransi Resmi</span>
                    </div>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <Settings className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                      <span className="font-semibold">Teknisi Ahli</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <img src="https://picsum.photos/seed/shop1/400/500" alt="Shop 1" className={`rounded-2xl shadow-lg border-2 ${isDarkMode ? 'border-slate-800' : 'border-white'}`} referrerPolicy="no-referrer" />
                    <div className="flex flex-col gap-4">
                      <img src="https://picsum.photos/seed/shop2/400/240" alt="Shop 2" className={`rounded-2xl shadow-lg border-2 ${isDarkMode ? 'border-slate-800' : 'border-white'}`} referrerPolicy="no-referrer" />
                      <img src="https://picsum.photos/seed/shop3/400/240" alt="Shop 3" className={`rounded-2xl shadow-lg border-2 ${isDarkMode ? 'border-slate-800' : 'border-white'}`} referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Section */}
            <section id="services" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <div className="max-w-7xl mx-auto text-center mb-16">
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
                      className={`p-8 rounded-3xl border transition-all group ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
                    >
                      <div className={`mb-6 p-4 w-fit rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
                        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                      </div>
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
                  <button className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2 group">
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
                        <p className="text-slate-400">MULYA CARTRIDGE, Jual Beli & Service Printer Laptop Komputer</p>
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
                        <p className="text-slate-400">mulyacartridge@email.com</p>
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
                        <p className="text-slate-400 mb-8 max-w-sm">Dapatkan rute terbaik menuju MULYA CARTRIDGE melalui Google Maps.</p>
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
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 border-t transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Printer className="w-5 h-5" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>MULYA CARTRIDGE</span>
          </div>
          
          <div className={`flex gap-8 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <button onClick={() => scrollTo('about')}  className="hover:text-blue-600">Tentang</button>
            <button onClick={() => scrollTo('services')} className="hover:text-blue-600">Layanan</button>
            <button onClick={() => scrollTo('products')} className="hover:text-blue-600">Produk</button>
            {isAdmin ? (
                <button onClick={() => setShowAdminPanel(true)} className="text-blue-600 font-bold border-b border-blue-600">Dashboard Admin</button>
            ) : (
                <button onClick={() => setShowAdminLogin(true)} className="hover:text-blue-600 opacity-20 hover:opacity-100 transition-opacity">Admin</button>
            )}
          </div>
          
          <div className="text-slate-400 text-sm">
            © 2026 MULYA CARTRIDGE. All rights reserved.
          </div>
        </div>
      </footer>

      {showAdminLogin && <AdminLoginModal />}
      {showExpertSystem && <ExpertSystemModal />}
    </div>
  );
}
