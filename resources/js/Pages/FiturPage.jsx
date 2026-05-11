import { Head, Link } from '@inertiajs/react';

const WA_LINK = "https://wa.me/6281235738412";

//  Layout wrapper sederhana 
const PublicLayout = ({ children }) => (
    <div className="font-sans min-h-screen bg-[#F7F8FC]">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,600;1,400&display=swap');
            * { font-family: 'Plus Jakarta Sans', sans-serif; }
            .font-display { font-family: 'Lora', serif; }
            .mesh { background: radial-gradient(at 20% 10%, #DCFCE7 0%, transparent 50%), radial-gradient(at 85% 85%, #DBEAFE 0%, transparent 50%), #F7F8FC; }
            .step-line::before { content:''; position:absolute; left:22px; top:48px; bottom:-24px; width:2px; background:linear-gradient(to bottom,#14B8A6,#E5E7EB); }
        `}</style>

        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/images/Logo_RA.png" alt="RamahAnak.id" className="h-11 w-auto object-contain"
                        onError={e => e.target.style.display='none'} />
                </Link>
                <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
                    <Link href="/" className="hover:text-teal-600 transition-colors">Beranda</Link>
                    <Link href="/belajar-konseling" className="hover:text-teal-600 transition-colors">Belajar Konseling</Link>
                    <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">Kerja Sama</a>
                </div>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-md">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.42A9.985 9.985 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fillRule="evenodd" clipRule="evenodd"/>
                    </svg>
                    Chat WA
                </a>
            </div>
        </nav>

        {children}

        {/* Footer simpel */}
        <footer className="bg-gray-950 text-gray-400 py-8 text-center text-xs">
            <p>&copy; 2026 RamahAnak.id  Pondok Pesantren Muhammadiyah An-Nur Sidoarjo</p>
        </footer>
    </div>
);

//  Section header 
const SectionHeader = ({ tag, title, sub }) => (
    <div className="text-center mb-12">
        {tag && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 mb-4">
                {tag}
            </div>
        )}
        <h2 className="text-2xl lg:text-3xl font-black text-gray-900" dangerouslySetInnerHTML={{ __html: title }} />
        {sub && <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">{sub}</p>}
    </div>
);

//  Step item 
const Step = ({ no, role, title, desc, isLast }) => (
    <div className={`relative flex gap-5 pb-8 ${isLast ? '' : 'step-line'}`}>
        <div className="shrink-0 w-11 h-11 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-md z-10">
            {no}
        </div>
        <div className="pt-1">
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500 mb-1.5 uppercase tracking-wide">{role}</span>
            <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
);

// 
export default function FiturPage() {
    const features = [
        { icon: '', title: 'Expert System Forward Chaining', color: 'bg-violet-50 border-violet-200', badge: 'bg-violet-100 text-violet-700',
          points: ['43 rule IF-THEN berbasis pengetahuan Guru BK', 'Dieksekusi otomatis setiap malam via scheduler', 'Menghasilkan diagnosis kondisi mental + rekomendasi penanganan', '36 kode diagnosis dari PTSD hingga Bully-Victim Cycle'] },
        { icon: '', title: 'NLP Preprocessing Otomatis', color: 'bg-teal-50 border-teal-200', badge: 'bg-teal-100 text-teal-700',
          points: ['Laporan teks bebas diproses Python NLP Engine', '8 tahap: case folding, tokenisasi, stemming, NER', 'Deteksi pelaku & korban dari konteks kalimat', 'Deteksi negasi: "tidak telat" otomatis jadi apresiasi'] },
        { icon: '', title: 'Sistem Poin & Reward/Konsekuensi', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700',
          points: ['Poin akumulatif per pelanggaran (2-200 poin) dan apresiasi', 'Trigger konsekuensi otomatis saat threshold tercapai', 'Reward bertingkat: voucher hingga piagam penghargaan', '10 level konsekuensi dari bimbingan ringan hingga sidang'] },
        { icon: '', title: 'Alur Persetujuan Berjenjang', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700',
          points: ['Tenaga Pendidik buat laporan teks bebas', 'Guru BK validasi + trigger NLP otomatis', 'Wali kelas approval pertama', 'Guru BK approval final + catatan profesional'] },
        { icon: '', title: 'Rekam Jejak Digital Santri', color: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700',
          points: ['Riwayat lengkap pelanggaran, apresiasi, dan bimbingan', 'Santri dapat akses rekam jejak pribadi sendiri', 'Upload bukti pelaksanaan konsekuensi', 'PDF rekam medis otomatis setelah bimbingan selesai'] },
        { icon: '', title: 'Manajemen Akses Berbasis Peran', color: 'bg-rose-50 border-rose-200', badge: 'bg-rose-100 text-rose-700',
          points: ['3 peran: Guru BK, Tenaga Pendidik, Santri', 'Setiap peran hanya akses fitur yang relevan', 'Middleware otorisasi di setiap route', 'Data sensitif terenkripsi dan tidak dapat diakses silang'] },
    ];

    const steps = [
        { no:'1', role:'Tenaga Pendidik', title:'Buat Laporan Teks Bebas', desc:'Wali kelas menulis laporan dalam bahasa alami, tanpa format khusus. Contoh: "lukman memukul iqbal di kelas saat jam pelajaran".' },
        { no:'2', role:'Guru BK', title:'Validasi & Trigger NLP', desc:'Guru BK menyetujui laporan. Sistem otomatis memanggil Python NLP Engine secara asinkron untuk memproses teks.' },
        { no:'3', role:'Sistem NLP', title:'Preprocessing & Deteksi Kode', desc:'8 tahap preprocessing berjalan: tokenisasi, stemming (Sastrawi), NER, kode matching. Hasilnya: pelaku, korban, dan kode variabel terdeteksi.' },
        { no:'4', role:'Guru BK', title:'Validasi Hasil Preprocessing', desc:'Guru BK memeriksa hasil NLP. Jika ada kesalahan, bisa koreksi manual. Setelah approve, laporan dikategorikan otomatis.' },
        { no:'5', role:'Wali Kelas', title:'Approval Pertama', desc:'Wali kelas memberikan persetujuan dari sisi lapangan sebagai verifikasi tambahan sebelum laporan final.' },
        { no:'6', role:'Guru BK', title:'Final Approve & Poin Masuk', desc:'Guru BK memberikan catatan profesional dan approval akhir. Poin langsung masuk ke riwayat santri secara otomatis.' },
        { no:'7', role:'Sistem', title:'Expert System Berjalan', desc:'Jika poin melebihi threshold: laporan konsekuensi/reward dibuat otomatis. Malam hari, forward chaining dieksekusi untuk diagnosis kondisi mental.', isLast: false },
        { no:'8', role:'Santri', title:'Lihat Rekam Jejak & Upload Bukti', desc:'Santri dapat melihat seluruh riwayatnya dan mengupload bukti pelaksanaan konsekuensi untuk diverifikasi Guru BK.', isLast: true },
    ];

    const roles = [
        { role: 'Guru BK', icon: '', color: 'border-violet-300 bg-violet-50',
          badge: 'bg-violet-600', desc: 'Administrator utama dengan akses penuh ke seluruh sistem.',
          akses: ['Kelola user, kelas, penugasan', 'Validasi laporan & preprocessing', 'Approve Expert System Point & Konselor', 'Kelola variabel & rule basis pengetahuan', 'Monitoring seluruh santri', 'Generate & download PDF rekam medis'] },
        { role: 'Tenaga Pendidik', icon: '', color: 'border-teal-300 bg-teal-50',
          badge: 'bg-teal-600', desc: 'Wali kelas yang membuat laporan dan memberikan persetujuan pertama.',
          akses: ['Buat laporan teks bebas', 'Approval laporan wali kelas', 'Lihat daftar santri kelas sendiri', 'Monitor rekam jejak santri kelas'] },
        { role: 'Santri', icon: '', color: 'border-amber-300 bg-amber-50',
          badge: 'bg-amber-500', desc: 'Pengguna terdaftar yang dapat melihat rekam jejak pribadi.',
          akses: ['Lihat rekam jejak pelanggaran & apresiasi', 'Lihat status Expert System Point', 'Upload bukti pelaksanaan konsekuensi', 'Lihat hasil konseling yang terkait'] },
    ];

    return (
        <PublicLayout>
            <Head title="Fitur Lengkap  RamahAnak.id" />

            {/* Hero */}
            <section className="mesh py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 mb-6">
                        DOKUMENTASI FITUR
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-5">
                        Semua yang Kamu Butuhkan<br />
                        <span className="font-display italic" style={{background:'linear-gradient(135deg,#0F766E,#0891B2,#7C3AED)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                            Ada di Sini
                        </span>
                    </h1>
                    <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                        Platform bimbingan konseling digital berbasis Expert System dengan NLP Preprocessing
                        untuk pesantren yang ingin monitoring kesehatan mental santri secara terstruktur dan otomatis.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                            className="px-7 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg">
                            Tanya via WhatsApp
                        </a>
                        <a href="#cara-pemakaian" className="px-7 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-teal-300 transition-all">
                            Cara Pemakaian
                        </a>
                    </div>
                </div>
            </section>

            {/* 6 Fitur Utama */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader tag="6 FITUR UTAMA" title="Apa yang Bisa Dilakukan Sistem?" sub="Setiap fitur dirancang untuk menjawab tantangan nyata dalam manajemen bimbingan konseling di pesantren." />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <div key={i} className={`rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 ${f.color}`}>
                                <div className="text-4xl mb-4">{f.icon}</div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${f.badge}`}>FITUR UTAMA</span>
                                <h3 className="font-black text-gray-900 mt-3 mb-3 text-sm">{f.title}</h3>
                                <ul className="space-y-2">
                                    {f.points.map((p, j) => (
                                        <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                                            <svg className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cara Pemakaian */}
            <section id="cara-pemakaian" className="py-20 bg-[#F7F8FC]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader tag="ALUR KERJA" title="Cara Pemakaian Sistem" sub="8 langkah dari input laporan hingga bimbingan selesai dan tersimpan di rekam jejak digital santri." />
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Fase Input & Proses</p>
                            {steps.slice(0,4).map((s, i) => (
                                <Step key={i} {...s} isLast={i===3} />
                            ))}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Fase Approval & Output</p>
                            {steps.slice(4).map((s, i) => (
                                <Step key={i} {...s} isLast={i===3} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Hak Akses per Peran */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader tag="3 PERAN PENGGUNA" title="Siapa yang Bisa Menggunakan?" sub="Setiap peran memiliki antarmuka dan hak akses yang disesuaikan dengan kebutuhan dan tanggung jawabnya." />
                    <div className="grid md:grid-cols-3 gap-6">
                        {roles.map((r, i) => (
                            <div key={i} className={`rounded-2xl border-2 p-6 ${r.color}`}>
                                <div className="text-4xl mb-3">{r.icon}</div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${r.badge}`}>{r.role.toUpperCase()}</span>
                                <h3 className="font-black text-gray-900 mt-3 mb-1">{r.role}</h3>
                                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{r.desc}</p>
                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Hak Akses</p>
                                    <ul className="space-y-1.5">
                                        {r.akses.map((a, j) => (
                                            <li key={j} className="flex items-center gap-2 text-xs text-gray-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hasil Testing */}
            <section className="py-20 bg-[#F7F8FC]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader tag="HASIL PENGUJIAN" title="Diuji, Terukur, <span class='text-gradient font-display italic'>Terbukti</span>"
                        sub="Black Box Testing 26 skenario pada 3 peran pengguna. Semua skenario berhasil 100%. Data dari pengujian lapangan 30 April 2026." />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {[
                            { val:'100%', label:'Black Box Testing', sub:'26/26 skenario berhasil', color:'text-teal-600', bg:'bg-teal-50' },
                            { val:'100%', label:'Akurasi NLP', sub:'8/8 laporan terdeteksi', color:'text-violet-600', bg:'bg-violet-50' },
                            { val:'26', label:'Skenario diuji', sub:'3 peran pengguna', color:'text-cyan-600', bg:'bg-cyan-50' },
                            { val:'43', label:'Rule IF-THEN', sub:'Forward Chaining harian', color:'text-amber-600', bg:'bg-amber-50' },
                        ].map((s,i) => (
                            <div key={i} className={`${s.bg} rounded-2xl p-5 text-center border border-white shadow-sm`}>
                                <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                                <div className="text-sm font-bold text-gray-800 mt-1">{s.label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                    <div className="grid lg:grid-cols-3 gap-5 mb-6">
                        {[
                            { peran:'Guru BK', jml:14, color:'bg-blue-600', light:'bg-blue-50 text-blue-700',
                              items:['Login dan autentikasi','Validasi laporan dan NLP','Expert System Point dan Konselor','Kelola variabel, rule, kelas','Dashboard dan monitoring'] },
                            { peran:'Tenaga Pendidik', jml:5, color:'bg-teal-600', light:'bg-teal-50 text-teal-700',
                              items:['Login akun wali kelas','Buat 8 laporan teks bebas','Approval laporan wali','Login TP kedua (2 akun)','Login email tidak terdaftar'] },
                            { peran:'ES dan Santri', jml:7, color:'bg-amber-600', light:'bg-amber-50 text-amber-700',
                              items:['Trigger ES Point otomatis','Selesaikan konsekuensi dan reward','Forward Chaining RB-06','Sesi bimbingan 2 tahap','Login santri dan upload bukti'] },
                        ].map((g,i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${g.light}`}>{g.peran}</span>
                                    <span className="text-2xl font-black text-gray-900">{g.jml}<span className="text-sm font-medium text-gray-400">/26</span></span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                                    <div className={`h-full ${g.color} rounded-full`} style={{width:`${Math.round(g.jml/26*100)}%`}} />
                                </div>
                                <ul className="space-y-1.5">
                                    {g.items.map((item,j) => (
                                        <li key={j} className="flex items-center gap-2 text-xs text-gray-600">
                                            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="grid lg:grid-cols-2 gap-5">
                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
                            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Forward Chaining</span>
                            <h4 className="font-black text-gray-900 text-sm mt-2 mb-1">Rule RB-06 berhasil fired</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">Premise {"{P001, G010}"} menghasilkan diagnosis DX-B06 Bully-Victim Cycle untuk santri Zurah. Ditindaklanjuti 2 sesi bimbingan hingga dinyatakan selesai.</p>
                        </div>
                        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
                            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">ES Point otomatis</span>
                            <h4 className="font-black text-gray-900 text-sm mt-2 mb-1">Threshold terlampaui pada 2 kasus</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">K001 trigger saat poin Zurah 15 (threshold 10). R001 trigger saat poin Nasyuwa 34 (threshold 30). Keduanya selesai dengan bukti terverifikasi.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stack Teknologi */}
            <section className="py-16 bg-gray-950">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">Dibangun dengan Teknologi Modern</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Laravel 11','React.js','Inertia.js','Python 3','Sastrawi NLP','MariaDB','Tailwind CSS','Laravel Queue','Rule-Based Expert System'].map(t => (
                            <span key={t} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-semibold border border-gray-700">
                                {t}
                            </span>
                        ))}
                    </div>
                    <div className="mt-12 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl p-8">
                        <h3 className="text-2xl font-black text-white mb-3">Tertarik Menggunakan di Pesantren Anda?</h3>
                        <p className="text-teal-100 text-sm mb-6 max-w-lg mx-auto">Hubungi kami untuk diskusi implementasi, pelatihan, dan kerja sama pengembangan sistem.</p>
                        <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-teal-700 rounded-xl font-black text-sm hover:bg-gray-50 transition-all shadow-xl">
                            Chat WhatsApp Sekarang
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}