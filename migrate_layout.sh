#!/bin/bash
# ============================================================
# migrate_layout.sh
# Migrasi semua halaman Guru BK dari AuthenticatedLayout2
# ke AppLayout yang konsisten.
#
# Cara pakai:
#   chmod +x migrate_layout.sh
#   ./migrate_layout.sh /path/to/laravel-project/resources/js
# ============================================================

TARGET_DIR="${1:-resources/js}"

echo "🔍 Mencari file yang masih pakai AuthenticatedLayout2..."
echo "   Target: $TARGET_DIR"
echo ""

# Temukan semua file .jsx yang masih pakai AuthenticatedLayout2
FILES=$(grep -rl "AuthenticatedLayout2\|AuthenticatedLayout'" "$TARGET_DIR" --include="*.jsx" 2>/dev/null)

if [ -z "$FILES" ]; then
    echo "✅ Tidak ada file yang perlu dimigrasi."
    exit 0
fi

echo "📋 File yang akan dimigrasi:"
echo "$FILES" | while read f; do echo "   - $f"; done
echo ""

read -p "Lanjutkan migrasi? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ Dibatalkan."
    exit 0
fi

echo ""
echo "🔄 Memulai migrasi..."

MIGRATED=0
SKIPPED=0

echo "$FILES" | while read file; do
    if [ -z "$file" ]; then continue; fi

    echo "  → $file"

    # Ganti import AuthenticatedLayout dari AuthenticatedLayout2
    sed -i "s|import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout2';|import AppLayout from '@/Layouts/AppLayout';|g" "$file"
    # Ganti import dari AuthenticatedLayout (tanpa angka) juga
    sed -i "s|import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';|import AppLayout from '@/Layouts/AppLayout';|g" "$file"

    # Ganti pemakaian <AuthenticatedLayout ke <AppLayout
    sed -i "s|<AuthenticatedLayout|<AppLayout|g" "$file"
    sed -i "s|</AuthenticatedLayout>|</AppLayout>|g" "$file"

    echo "     ✅ Selesai"
    MIGRATED=$((MIGRATED + 1))
done

echo ""
echo "✅ Migrasi selesai!"
echo ""
echo "⚠️  PENTING: Setelah migrasi, pastikan:"
echo "   1. Semua halaman Guru BK: prop user={auth.user} masih ada"
echo "   2. Halaman Santri & Tenaga Pendidik: prop user={auth.user} masih ada"
echo "   3. Tidak ada halaman yang masih import GuruBkLayout manual"
echo "   4. Jalankan: npm run dev  untuk verifikasi build"
echo ""
echo "📁 File AppLayout.jsx harus diletakkan di:"
echo "   resources/js/Layouts/AppLayout.jsx"