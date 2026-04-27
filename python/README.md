# Python Preprocessing - RamahAnak.id

Preprocessing script untuk ekstraksi kode variabel dari laporan dengan 6 tahap preprocessing.

## 📋 Requirements

- Python 3.8+
- MySQL Database (shared dengan Laravel)
- Dependencies di `requirements.txt`

## 🚀 Installation

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy .env dari Laravel root
# Script akan otomatis baca DB_* config dari .env Laravel

# 3. Test installation
python3 test_preprocessing.py
```

## 📦 File Structure

```
python/
├── preprocessing.py          # Main script (6 tahap preprocessing)
├── database.py              # Database helper (query MySQL)
├── ner.py                   # Named Entity Recognition (ekstrak pelaku/korban)
├── config.py                # Configuration (DB, stopwords, verbs)
├── requirements.txt         # Python dependencies
├── test_preprocessing.py    # Unit tests
└── README.md               # This file
```

## 🔧 Usage

### Test Standalone (Tanpa Database)
```bash
python3 test_preprocessing.py
```

### Process Laporan dari Database
```bash
# Basic (output JSON ke stdout)
python3 preprocessing.py --laporan_id=123

# Pretty print
python3 preprocessing.py --laporan_id=123 --pretty

# Save ke database
python3 preprocessing.py --laporan_id=123 --save-to-db
```

### Called dari Laravel (via shell_exec)
```php
$command = "python3 " . base_path('python/preprocessing.py') . " --laporan_id={$laporan->id} --save-to-db";
$output = shell_exec($command);
$result = json_decode($output, true);
```

## 📊 Output Format

```json
{
  "status": "success",
  "laporan_id": 123,
  "jenis_laporan": "pelanggaran",
  "kode_matched": ["P001", "G011"],
  "pelaku_nama": "Udin",
  "pelaku_santri_id": 45,
  "korban_nama": "Budi",
  "korban_santri_id": 67,
  "kata_kerja_dasar": "pukul",
  "preprocessing_data": {
    "original": "Udin memukul Budi...",
    "case_folding": "udin memukul budi...",
    "cleaning": "udin memukul budi",
    "tokens": ["udin", "memukul", "budi"],
    "no_stopwords": ["udin", "memukul", "budi"],
    "stemmed": ["udin", "pukul", "budi"]
  },
  "timestamp": "2026-02-20T10:30:00"
}
```

## 🔄 Preprocessing Pipeline (6 Tahap)

### 1. Case Folding
Ubah semua huruf menjadi lowercase
```
Input:  "Udin Memukul Budi"
Output: "udin memukul budi"
```

### 2. Cleaning
Hapus emoji, URL, karakter khusus, multiple spaces
```
Input:  "udin memukul budi 😠!!!"
Output: "udin memukul budi"
```

### 3. Tokenization
Pecah menjadi list of words
```
Input:  "udin memukul budi"
Output: ["udin", "memukul", "budi"]
```

### 4. Stopword Removal
Hapus stopwords (kata yang tidak bermakna)
```
Input:  ["saya", "melihat", "udin", "memukul", "budi", "di", "kelas"]
Output: ["melihat", "udin", "memukul", "budi", "kelas"]
```

### 5. Stemming (Sastrawi)
Ubah kata menjadi bentuk dasar
```
Input:  ["memukul", "berkelahi", "mencuri"]
Output: ["pukul", "kelahi", "curi"]
```

### 6. Matching
Cocokkan dengan kamus kata variabel
```
Input:  ["pukul", "game", "telat"]
Kamus:  {"pukul": "P001", "game": "G011", "telat": "P002"}
Output: ["P001", "G011", "P002"]
```

## 🧠 Named Entity Recognition (NER)

Script menggunakan simple pattern matching untuk ekstrak nama:

### Pattern Recognition:
- **Active Transitive**: [Pelaku] [Verb] [Korban]
  - "Udin memukul Budi" → Pelaku: Udin, Korban: Budi
  
- **Passive**: [Korban] [di-Verb] [oleh Pelaku]
  - "Budi dipukul oleh Udin" → Pelaku: Udin, Korban: Budi
  
- **Active Intransitive**: [Pelaku] [ber-Verb]
  - "Udin berkelahi" → Pelaku: Udin

### Database Validation:
Setelah ekstraksi, nama divalidasi dengan database `santri_profiles`:
- Exact match: `LOWER(nama_lengkap) = 'udin'`
- Partial match: `nama_lengkap LIKE '%udin%'`
- Return `santri_id` jika ditemukan

## 🗄️ Database Schema (Sinkron dengan Laravel)

### Input: `laporan_awal`
```sql
- id
- text_laporan (TEXT)
- jenis_laporan (ENUM)
- status ('approved')
```

### Output: `hasil_preprocessing`
```sql
- laporan_awal_id (FK)
- kode_matched (JSON)
- pelaku_nama, pelaku_santri_id
- korban_nama, korban_santri_id
- kata_kerja_dasar
- preprocessing_data (JSON)
- status ('pending_validasi')
```

### Reference: Variabel Tables
```sql
- variabel_pelanggaran (kode, kamus_kata)
- variabel_apresiasi (kode, kamus_kata)
- variabel_konselor (kode, kamus_kata)
```

## ⚙️ Configuration

Edit `config.py` untuk customize:

```python
# Custom stopwords
CUSTOM_STOPWORDS = ['saya', 'aku', 'dia', ...]

# Transitive verbs (untuk NER)
TRANSITIVE_VERBS = ['pukul', 'tendang', 'bantu', ...]
```

## 🧪 Testing

```bash
# Run all tests
python3 test_preprocessing.py

# Test dengan laporan real dari database
python3 preprocessing.py --laporan_id=1 --pretty
```

## 🐛 Troubleshooting

### Error: Module not found
```bash
pip install -r requirements.txt
```

### Error: Access denied for user
- Check `.env` di root Laravel
- Pastikan `DB_USERNAME` dan `DB_PASSWORD` benar

### Error: Laporan tidak ditemukan
- Pastikan laporan sudah `status = 'approved'`
- Check dengan: `SELECT * FROM laporan_awal WHERE id = X`

### Kode matched kosong
- Check `kamus_kata` di variabel: `SELECT kode, kamus_kata FROM variabel_pelanggaran`
- Pastikan kata kunci ada di kamus

## 📞 Integration dengan Laravel

Lihat dokumentasi Laravel untuk:
- `ProcessLaporanJob.php` - Queue job untuk call Python
- `LaporanAwalController@approve()` - Trigger preprocessing
- `HasilPreprocessingController` - Validasi hasil (Gerbang 2)

## 📝 License

Internal use - RamahAnak.id Project