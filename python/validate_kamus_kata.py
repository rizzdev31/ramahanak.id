#!/usr/bin/env python3
"""
KAMUS KATA VALIDATION SCRIPT
Validate and report issues in kamus_kata database entries
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db

# ═══════════════════════════════════════════════════════════
# VALIDATION RULES
# ═══════════════════════════════════════════════════════════

GENERIC_WORDS = [
    'tidak', 'bukan', 'yang', 'dan', 'atau',
    'masuk', 'keluar', 'kelas', 'sekolah',
    'sangat', 'sekali', 'selalu', 'sering', 'jarang', 'kadang',
    'ada', 'itu', 'ini', 'apa', 'siapa',
    'di', 'ke', 'dari', 'untuk', 'pada',
    'lebih', 'kurang', 'pernah'
]

MIN_WORD_LENGTH = 3
MAX_WORD_LENGTH = 20

# ═══════════════════════════════════════════════════════════
# VALIDATION FUNCTIONS
# ═══════════════════════════════════════════════════════════

def validate_kata(kata):
    """
    Validate single kata and return issues
    
    Returns:
        list: List of issue strings
    """
    issues = []
    
    # Check 1: Too short
    if len(kata) < MIN_WORD_LENGTH:
        issues.append(f"⚠ Terlalu pendek: '{kata}' ({len(kata)} char, min {MIN_WORD_LENGTH})")
    
    # Check 2: Too long (likely error)
    if len(kata) > MAX_WORD_LENGTH:
        issues.append(f"⚠ Terlalu panjang: '{kata}' ({len(kata)} char, max {MAX_WORD_LENGTH})")
    
    # Check 3: Generic word
    if kata in GENERIC_WORDS:
        issues.append(f"❌ Kata generic: '{kata}' (harusnya dihapus)")
    
    # Check 4: Contains spaces (should be single word)
    if ' ' in kata:
        issues.append(f"⚠ Multi-word: '{kata}' (pertimbangkan COMPOSITE_PHRASES)")
    
    # Check 5: Contains negation prefix
    if kata.startswith('tidak ') or kata.startswith('bukan '):
        issues.append(f"❌ Mengandung negasi: '{kata}' (biarkan negation logic handle)")
    
    # Check 6: Numeric
    if kata.isdigit():
        issues.append(f"❌ Hanya angka: '{kata}' (invalid)")
    
    # Check 7: Special characters
    if any(char in kata for char in ['!', '@', '#', '$', '%', '^', '&', '*']):
        issues.append(f"⚠ Karakter spesial: '{kata}'")
    
    return issues


def validate_kamus_kata(kamus_kata_str, kode, kategori):
    """
    Validate entire kamus_kata entry
    
    Returns:
        dict: {
            'total_kata': int,
            'valid_kata': int,
            'issues': list of strings,
            'problematic_kata': list of kata with issues
        }
    """
    kata_list = [k.strip() for k in kamus_kata_str.split(',') if k.strip()]
    
    all_issues = []
    problematic_kata = []
    valid_count = 0
    
    for kata in kata_list:
        kata_issues = validate_kata(kata)
        
        if kata_issues:
            all_issues.extend(kata_issues)
            problematic_kata.append(kata)
        else:
            valid_count += 1
    
    return {
        'total_kata': len(kata_list),
        'valid_kata': valid_count,
        'issues': all_issues,
        'problematic_kata': problematic_kata
    }


# ═══════════════════════════════════════════════════════════
# MAIN VALIDATION
# ═══════════════════════════════════════════════════════════

def main():
    print("=" * 80)
    print("KAMUS KATA VALIDATION REPORT")
    print("=" * 80)
    print()
    
    try:
        db = get_db()
        variabel_data = db.get_all_variabel_kata_with_negation()
        
        total_variabel = len(variabel_data)
        total_issues = 0
        variabel_with_issues = []
        
        print(f"Validating {total_variabel} variabel entries...")
        print()
        
        # Validate each variabel
        for v in variabel_data:
            kode = v['kode']
            kategori = v.get('kategori', '')
            kamus_kata = v.get('kamus_kata', '')
            
            validation_result = validate_kamus_kata(kamus_kata, kode, kategori)
            
            if validation_result['issues']:
                total_issues += len(validation_result['issues'])
                variabel_with_issues.append({
                    'kode': kode,
                    'kategori': kategori,
                    'kamus_kata': kamus_kata,
                    'result': validation_result
                })
        
        # ═════════════════════════════════════════════════════
        # SUMMARY
        # ═════════════════════════════════════════════════════
        
        print("─" * 80)
        print("SUMMARY")
        print("─" * 80)
        print(f"Total Variabel:           {total_variabel}")
        print(f"Variabel with Issues:     {len(variabel_with_issues)}")
        print(f"Total Issues Found:       {total_issues}")
        print()
        
        if len(variabel_with_issues) == 0:
            print("✅ ALL CLEAN! No issues found.")
            print("=" * 80)
            return 0
        
        # ═════════════════════════════════════════════════════
        # DETAILED REPORT
        # ═════════════════════════════════════════════════════
        
        print("─" * 80)
        print("DETAILED ISSUES")
        print("─" * 80)
        print()
        
        for item in variabel_with_issues:
            kode = item['kode']
            kategori = item['kategori']
            kamus_kata = item['kamus_kata']
            result = item['result']
            
            print(f"{'='*80}")
            print(f"KODE: {kode} - {kategori}")
            print(f"{'='*80}")
            print(f"Kamus Kata: {kamus_kata}")
            print()
            print(f"Total Kata: {result['total_kata']}")
            print(f"Valid Kata: {result['valid_kata']}")
            print(f"Issues: {len(result['issues'])}")
            print()
            
            if result['problematic_kata']:
                print("Problematic Kata:")
                for kata in result['problematic_kata']:
                    print(f"  - {kata}")
                print()
            
            print("Issues Details:")
            for issue in result['issues']:
                print(f"  {issue}")
            print()
        
        # ═════════════════════════════════════════════════════
        # RECOMMENDATIONS
        # ═════════════════════════════════════════════════════
        
        print("=" * 80)
        print("RECOMMENDATIONS")
        print("=" * 80)
        print()
        print("1. Remove generic words (kata with ❌)")
        print("2. Review multi-word entries (consider COMPOSITE_PHRASES)")
        print("3. Fix special characters")
        print("4. Update database using SQL UPDATE statements")
        print()
        print("Example SQL fix:")
        print("  UPDATE variabel_pelanggaran")
        print("  SET kamus_kata = 'telat,terlambat,ngaret'")
        print("  WHERE kode = 'P002';")
        print()
        
        print("=" * 80)
        print(f"VALIDATION COMPLETE - {total_issues} issues found")
        print("=" * 80)
        
        return 1 if total_issues > 0 else 0
        
    except Exception as e:
        print(f"❌ ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 2


if __name__ == '__main__':
    sys.exit(main())