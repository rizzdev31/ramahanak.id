import { Head, Link } from '@inertiajs/react';

const WA_LINK = "https://wa.me/6281235738412";

//  Navbar 
const PublicNav = () => (
    <nav style={{
        position:'sticky',top:0,zIndex:50,
        background:'rgba(255,255,255,0.9)',
        backdropFilter:'blur(12px)',
        borderBottom:'1px solid #f0f0f0',
    }}>
        <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:'64px'}}>
            <Link href="/" style={{display:'flex',alignItems:'center',textDecoration:'none'}}>
                <img src="/images/Logo_RA.png" alt="RamahAnak.id" style={{height:'44px',width:'auto',objectFit:'contain'}}
                    onError={e => e.target.style.display='none'} />
            </Link>
            <div style={{display:'flex',alignItems:'center',gap:'24px',fontSize:'14px',fontWeight:'600',color:'#6B7280'}}>
                <Link href="/" style={{color:'inherit',textDecoration:'none'}}>Beranda</Link>
                <Link href="/fitur" style={{color:'inherit',textDecoration:'none'}}>Fitur</Link>
                <Link href="/belajar-konseling" style={{color:'#0F766E',textDecoration:'none'}}>Belajar Konseling</Link>
            </div>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                style={{padding:'8px 18px',background:'#0F766E',color:'#fff',borderRadius:'10px',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>
                Hubungi Kami
            </a>
        </div>
    </nav>
);

//  Gallery 1-4 foto dengan layout adaptif 
function ImageGallery({ gambar = [] }) {
    if (!gambar || gambar.length === 0) return null;
    const imgs = gambar.filter(g => g.url);
    if (imgs.length === 0) return null;
    const count = imgs.length;

    const imgStyle = (h='240px') => ({
        width:'100%', height:h, objectFit:'cover',
        borderRadius:'10px', display:'block',
    });
    const cap = (text) => text ? (
        <div style={{fontSize:'12px',color:'#9CA3AF',textAlign:'center',marginTop:'6px',fontStyle:'italic'}}>
            {text}
        </div>
    ) : null;

    if (count === 1) return (
        <div style={{margin:'24px 0'}}>
            <img src={imgs[0].url} alt={imgs[0].keterangan||'Gambar artikel'} style={imgStyle('320px')} />
            {cap(imgs[0].keterangan)}
        </div>
    );

    if (count === 2) return (
        <div style={{margin:'24px 0'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {imgs.map((g,i) => (
                    <div key={i}>
                        <img src={g.url} alt={g.keterangan||`Foto ${i+1}`} style={imgStyle('220px')} />
                        {cap(g.keterangan)}
                    </div>
                ))}
            </div>
        </div>
    );

    if (count === 3) return (
        <div style={{margin:'24px 0'}}>
            <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:'10px',alignItems:'start'}}>
                <div>
                    <img src={imgs[0].url} alt={imgs[0].keterangan||'Foto 1'} style={imgStyle('310px')} />
                    {cap(imgs[0].keterangan)}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    {imgs.slice(1).map((g,i) => (
                        <div key={i}>
                            <img src={g.url} alt={g.keterangan||`Foto ${i+2}`} style={imgStyle('146px')} />
                            {cap(g.keterangan)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // 4 gambar: 1 besar + 3 bawah
    return (
        <div style={{margin:'24px 0'}}>
            <div style={{marginBottom:'10px'}}>
                <img src={imgs[0].url} alt={imgs[0].keterangan||'Foto utama'} style={imgStyle('280px')} />
                {cap(imgs[0].keterangan)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                {imgs.slice(1).map((g,i) => (
                    <div key={i}>
                        <img src={g.url} alt={g.keterangan||`Foto ${i+2}`} style={imgStyle('130px')} />
                        {cap(g.keterangan)}
                    </div>
                ))}
            </div>
        </div>
    );
}

//  Media Link Card 
function MediaCard({ ml }) {
    const cfg = {
        youtube:   { color:'#FF0000', bg:'#FFF0F0', label:'YouTube',    icon:'YT' },
        instagram: { color:'#C13584', bg:'#FDF0F8', label:'Instagram',  icon:'IG' },
        tiktok:    { color:'#000000', bg:'#F5F5F5', label:'TikTok',     icon:'TK' },
        facebook:  { color:'#1877F2', bg:'#EEF4FF', label:'Facebook',   icon:'FB' },
        twitter:   { color:'#1DA1F2', bg:'#EFF9FF', label:'Twitter / X',icon:'X'  },
        website:   { color:'#0F766E', bg:'#F0FDF9', label:'Website',    icon:'WEB'},
    };
    const c = cfg[ml.tipe] || cfg.website;

    // YouTube embed
    if (ml.tipe === 'youtube' && ml.embed_id) {
        return (
            <div style={{margin:'20px 0',borderRadius:'14px',overflow:'hidden',background:'#000',boxShadow:'0 4px 16px rgba(0,0,0,0.12)'}}>
                <div style={{position:'relative',paddingBottom:'56.25%',height:0}}>
                    <iframe
                        src={`https://www.youtube.com/embed/${ml.embed_id}`}
                        title={ml.judul || 'Video YouTube'}
                        style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                </div>
                {ml.judul && (
                    <div style={{padding:'10px 14px',background:'#111',color:'#ccc',fontSize:'13px'}}>
                        {ml.judul}
                    </div>
                )}
            </div>
        );
    }

    // Instagram embed
    if (ml.tipe === 'instagram' && ml.embed_id) {
        return (
            <div style={{margin:'20px 0',borderRadius:'14px',overflow:'hidden',border:`1px solid ${c.color}30`,background:c.bg}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px',borderBottom:`1px solid ${c.color}20`}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'50%',background:c.color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'800'}}>
                        {c.icon}
                    </div>
                    <div>
                        <div style={{fontSize:'13px',fontWeight:'700',color:c.color}}>{c.label}</div>
                        {ml.judul && <div style={{fontSize:'12px',color:'#6B7280'}}>{ml.judul}</div>}
                    </div>
                    <a href={ml.url} target="_blank" rel="noopener noreferrer"
                        style={{marginLeft:'auto',padding:'6px 14px',borderRadius:'20px',border:`1.5px solid ${c.color}`,color:c.color,fontSize:'12px',fontWeight:'700',textDecoration:'none'}}>
                        Lihat Post
                    </a>
                </div>
                <iframe
                    src={`https://www.instagram.com/p/${ml.embed_id}/embed`}
                    style={{width:'100%',border:'none',minHeight:'480px'}}
                    scrolling="no"
                    allowTransparency
                />
            </div>
        );
    }

    // Generic link card  TikTok, Facebook, Twitter, Website
    return (
        <a href={ml.url} target="_blank" rel="noopener noreferrer"
            style={{
                display:'flex',alignItems:'center',gap:'14px',
                padding:'14px 16px',
                background:c.bg,
                border:`1px solid ${c.color}30`,
                borderLeft:`4px solid ${c.color}`,
                borderRadius:'12px',
                margin:'12px 0',
                textDecoration:'none',
                transition:'box-shadow 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow=`0 4px 16px ${c.color}20`}
            onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
            <div style={{
                width:'42px',height:'42px',borderRadius:'10px',
                background:c.color,color:'#fff',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'12px',fontWeight:'800',flexShrink:0,letterSpacing:'-0.5px',
            }}>
                {c.icon}
            </div>
            <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'11px',color:c.color,fontWeight:'700',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                    {c.label}
                </div>
                <div style={{fontSize:'13px',fontWeight:'600',color:'#1F2937',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {ml.judul || ml.url}
                </div>
                <div style={{fontSize:'11px',color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'2px'}}>
                    {ml.url}
                </div>
            </div>
            <svg style={{width:'16px',height:'16px',color:c.color,flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </a>
    );
}

//  Related Card 
function RelatedCard({ artikel }) {
    return (
        <Link href={`/belajar-konseling/${artikel.slug}`}
            style={{display:'flex',gap:'12px',padding:'12px',background:'#fff',borderRadius:'12px',border:'1px solid #F3F4F6',textDecoration:'none',marginBottom:'10px',transition:'border-color 0.2s'}}
            onMouseEnter={e => e.currentTarget.style.borderColor='#99F6E4'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#F3F4F6'}>
            <div style={{width:'72px',height:'60px',borderRadius:'8px',overflow:'hidden',flexShrink:0,background:'linear-gradient(135deg,#E0F2FE,#CFFAFE)'}}>
                {artikel.gambar_utama
                    ? <img src={artikel.gambar_utama} alt={artikel.judul} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'}}>
                        <span style={{color:'#A5F3FC'}}>B</span>
                      </div>
                }
            </div>
            <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'10px',color:'#0F766E',fontWeight:'700',marginBottom:'3px',textTransform:'uppercase'}}>{artikel.kategori}</div>
                <div style={{fontSize:'13px',fontWeight:'600',color:'#1F2937',lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                    {artikel.judul}
                </div>
                <div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'4px'}}>{artikel.estimasi_baca}</div>
            </div>
        </Link>
    );
}

// 
export default function BelajarKonselingShow({ artikel, related = [] }) {
    const data = artikel ?? {
        judul:'Mengenal Kesehatan Mental Remaja di Lingkungan Pesantren',
        kategori:'Kesehatan Mental',
        penulis:'Tim RamahAnak',
        tanggal:'30 April 2026',
        estimasi_baca:'5 menit',
        ringkasan:'Kesehatan mental remaja adalah aspek penting yang sering terabaikan di pesantren.',
        konten:'<h2>Mengapa Kesehatan Mental Penting?</h2><p>Di lingkungan pesantren yang penuh rutinitas, santri rentan mengalami berbagai gangguan mental yang jika tidak ditangani berdampak pada prestasi mereka.</p><blockquote>Deteksi dini adalah kunci. Satu percakapan tulus bisa mengubah arah hidup seorang santri.</blockquote><h2>Langkah Praktis</h2><p>Ciptakan lingkungan inklusif, adakan sesi konseling proaktif, dan libatkan orang tua dalam proses pembinaan santri secara berkelanjutan.</p>',
        tags:['Kesehatan Mental','Pesantren'],
        gambar:[],
        media_links:[],
    };

    const relatedData = related.length > 0 ? related : [
        { slug:'teknik-konseling-individual', judul:'Teknik Konseling Individual yang Efektif', kategori:'Panduan BK', gambar_utama:null, estimasi_baca:'8 menit' },
        { slug:'menangani-bullying-pesantren', judul:'Strategi Menangani Bullying di Pesantren', kategori:'Kasus Khusus', gambar_utama:null, estimasi_baca:'7 menit' },
    ];

    const KATCOL = {
        'Kesehatan Mental':'#7C3AED','Panduan BK':'#0F766E',
        'Kasus Khusus':'#DC2626','Manajemen Santri':'#D97706',
    };
    const katColor = KATCOL[data.kategori] || '#6B7280';

    return (
        <div style={{minHeight:'100vh',background:'#F9FAFB',fontFamily:'system-ui,sans-serif'}}>
            <Head title={`${data.judul}  Belajar Konseling RamahAnak.id`} />
            <style>{`
                .art-body{color:#374151;line-height:1.9;font-size:15.5px;text-align:justify;word-break:break-word;hyphens:auto}
                .art-body h2{font-size:1.25rem;font-weight:800;color:#111827;margin:2.2rem 0 .8rem;padding-bottom:.6rem;border-bottom:2.5px solid #CCFBF1;text-align:left;line-height:1.35;letter-spacing:-0.01em}
                .art-body h3{font-size:1.05rem;font-weight:700;color:#1F2937;margin:1.8rem 0 .5rem;text-align:left;letter-spacing:-0.005em}
                .art-body p{margin-bottom:1.2rem;text-align:justify}
                .art-body ul,.art-body ol{padding-left:1.6rem;margin-bottom:1.1rem;text-align:left}
                .art-body li{margin-bottom:.5rem;line-height:1.75}
                .art-body strong{color:#111827;font-weight:700}
                .art-body em{font-style:italic;color:#374151}
                .art-body u{text-decoration:underline;text-underline-offset:3px}
                .art-body a{color:#0F766E;text-decoration:underline;text-underline-offset:2px;font-weight:500}
                .art-body a:hover{color:#134E4A}
                .art-body blockquote{border-left:4px solid #14B8A6;background:#F0FDFA;padding:1.1rem 1.4rem;border-radius:0 12px 12px 0;margin:1.8rem 0;font-style:italic;color:#0F766E;font-size:1rem;line-height:1.8;text-align:left}
                .art-body blockquote p{margin:0;text-align:left}
                .art-body hr{border:none;border-top:1.5px solid #E5E7EB;margin:2rem 0}
                .art-body pre,.art-body code{font-family:monospace;background:#F3F4F6;border-radius:6px;padding:2px 6px;font-size:13px;color:#1F2937}
                .art-body pre{padding:12px 16px;display:block;overflow-x:auto;margin-bottom:1rem}
                .art-body table{width:100%;border-collapse:collapse;margin-bottom:1.2rem;font-size:14px}
                .art-body th{background:#F9FAFB;font-weight:700;padding:8px 12px;border:1px solid #E5E7EB;text-align:left}
                .art-body td{padding:8px 12px;border:1px solid #E5E7EB}
                .art-body img{max-width:100%;border-radius:10px;margin:1rem 0}
            `}</style>

            <PublicNav />

            {/* Breadcrumb */}
            <div style={{maxWidth:'1200px',margin:'0 auto',padding:'12px 1.5rem'}}>
                <nav style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'#9CA3AF'}}>
                    <Link href="/" style={{color:'inherit',textDecoration:'none'}}>Beranda</Link>
                    <span>/</span>
                    <Link href="/belajar-konseling" style={{color:'inherit',textDecoration:'none'}}>Belajar Konseling</Link>
                    <span>/</span>
                    <span style={{color:'#374151',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'300px'}}>{data.judul}</span>
                </nav>
            </div>

            {/* MAIN LAYOUT */}
            <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 1.5rem 4rem',display:'grid',gridTemplateColumns:'1fr 320px',gap:'32px',alignItems:'start'}}>

                {/*  ARTIKEL  */}
                <article style={{minWidth:0}}>
                    {/* Header card */}
                    <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #E5E7EB',overflow:'hidden',marginBottom:'24px'}}>
                        {/* Category bar */}
                        <div style={{height:'4px',background:katColor}} />

                        <div style={{padding:'28px 32px 24px'}}>
                            {/* Badge kategori */}
                            <div style={{marginBottom:'14px'}}>
                                <span style={{
                                    display:'inline-block',padding:'4px 12px',
                                    borderRadius:'20px',fontSize:'11px',fontWeight:'700',
                                    background:`${katColor}15`,color:katColor,
                                    border:`1px solid ${katColor}30`,letterSpacing:'0.3px'
                                }}>
                                    {data.kategori}
                                </span>
                            </div>

                            {/* Judul */}
                            <h1 style={{fontSize:'1.75rem',fontWeight:'800',color:'#111827',lineHeight:1.3,marginBottom:'16px',fontFamily:'Georgia,serif'}}>
                                {data.judul}
                            </h1>

                            {/* Meta */}
                            <div style={{display:'flex',flexWrap:'wrap',gap:'16px',color:'#6B7280',fontSize:'13px',paddingBottom:'20px',borderBottom:'1px solid #F3F4F6'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                                    <div style={{width:'28px',height:'28px',borderRadius:'50%',background:`${katColor}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:katColor}}>
                                        {(data.penulis||'T')[0]}
                                    </div>
                                    <span style={{fontWeight:'600',color:'#374151'}}>{data.penulis}</span>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                    <svg style={{width:'14px',height:'14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {data.tanggal}
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                    <svg style={{width:'14px',height:'14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {data.estimasi_baca}
                                </div>
                            </div>

                            {/* Ringkasan */}
                            {data.ringkasan && (
                                <div style={{marginTop:'20px',padding:'14px 18px',background:'#F0FDFA',border:'1px solid #CCFBF1',borderRadius:'10px',fontSize:'14px',color:'#0F766E',lineHeight:1.7,fontStyle:'italic'}}>
                                    {data.ringkasan}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Konten artikel */}
                    <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #E5E7EB',padding:'28px 32px',marginBottom:'20px'}}>

                        {/* Gallery foto  muncul di atas konten */}
                        {data.gambar && data.gambar.length > 0 && data.gambar.some(g => g.url) && (
                            <ImageGallery gambar={data.gambar} />
                        )}

                        {/* Body artikel */}
                        <div
                            className="art-body"
                            dangerouslySetInnerHTML={{ __html: data.konten || '' }}
                        />

                        {/* Media links section */}
                        {data.media_links && data.media_links.length > 0 && (
                            <div style={{marginTop:'32px',paddingTop:'24px',borderTop:'1px solid #F3F4F6'}}>
                                <div style={{fontSize:'13px',fontWeight:'700',color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'14px'}}>
                                    Media & Referensi
                                </div>
                                {data.media_links.map((ml, i) => (
                                    <MediaCard key={i} ml={ml} />
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {data.tags && data.tags.length > 0 && (
                            <div style={{marginTop:'28px',paddingTop:'20px',borderTop:'1px solid #F3F4F6'}}>
                                <div style={{fontSize:'11px',fontWeight:'700',color:'#9CA3AF',textTransform:'uppercase',marginBottom:'10px'}}>Tags</div>
                                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                                    {data.tags.map(tag => (
                                        <span key={tag} style={{padding:'4px 12px',background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'20px',fontSize:'12px',fontWeight:'600',color:'#6B7280'}}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Share / Feedback */}
                    <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #E5E7EB',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
                        <p style={{fontSize:'14px',color:'#6B7280',margin:0}}>Artikel ini bermanfaat?</p>
                        <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                            style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#0F766E',color:'#fff',borderRadius:'10px',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>
                            <svg style={{width:'16px',height:'16px'}} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.42A9.985 9.985 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                            </svg>
                            Diskusi via WhatsApp
                        </a>
                    </div>

                    {/* Navigasi */}
                    <div style={{marginTop:'16px'}}>
                        <Link href="/belajar-konseling"
                            style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'10px 18px',background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',fontSize:'13px',fontWeight:'600',color:'#6B7280',textDecoration:'none'}}>
                            <svg style={{width:'16px',height:'16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Semua Artikel
                        </Link>
                    </div>
                </article>

                {/*  SIDEBAR  */}
                <aside style={{position:'sticky',top:'80px',display:'flex',flexDirection:'column',gap:'16px'}}>

                    {/* Artikel terkait */}
                    <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #E5E7EB',padding:'20px'}}>
                        <div style={{fontSize:'13px',fontWeight:'700',color:'#111827',marginBottom:'14px',paddingBottom:'10px',borderBottom:'1px solid #F3F4F6'}}>
                            Artikel Terkait
                        </div>
                        {relatedData.map((r, i) => <RelatedCard key={i} artikel={r} />)}
                    </div>

                    {/* CTA Sidebar */}
                    <div style={{background:'linear-gradient(135deg,#0F766E,#0891B2)',borderRadius:'16px',padding:'20px',color:'#fff'}}>
                        <div style={{fontSize:'24px',marginBottom:'8px'}}></div>
                        <div style={{fontSize:'15px',fontWeight:'700',marginBottom:'6px'}}>Ingin Diskusi Lebih?</div>
                        <p style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',marginBottom:'14px',lineHeight:1.6}}>
                            Tim kami siap membantu implementasi sistem konseling di pesantren Anda.
                        </p>
                        <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                            style={{display:'block',textAlign:'center',padding:'10px',background:'#fff',color:'#0F766E',borderRadius:'10px',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>
                            Chat WhatsApp
                        </a>
                    </div>

                    {/* Info platform */}
                    <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #E5E7EB',padding:'20px'}}>
                        <div style={{fontSize:'13px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Tentang Platform</div>
                        <p style={{fontSize:'12px',color:'#6B7280',lineHeight:1.6,marginBottom:'12px'}}>
                            RamahAnak.id adalah platform konseling digital berbasis Expert System untuk pesantren modern.
                        </p>
                        <Link href="/fitur"
                            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#F0FDFA',color:'#0F766E',borderRadius:'10px',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>
                            Lihat Fitur Lengkap
                            <svg style={{width:'14px',height:'14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </aside>
            </div>

            {/* Footer */}
            <footer style={{background:'#111827',color:'#6B7280',padding:'28px',textAlign:'center',fontSize:'12px'}}>
                <p>&copy; 2026 RamahAnak.id  Pondok Pesantren Muhammadiyah An-Nur Sidoarjo</p>
            </footer>
        </div>
    );
}