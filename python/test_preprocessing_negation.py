#!/usr/bin/env python3
"""
✅ UPDATED Test Preprocessing Script
Test preprocessing WITH NEGATION SUPPORT
"""

import sys
from preprocessing import PreprocessingPipeline

# Sample kamus kata (untuk testing tanpa database)
SAMPLE_KAMUS = {
    # Pelanggaran
    'pukul': 'P001',
    'mukul': 'P001',
    'memukul': 'P001',
    'nonjok': 'P001',
    'telat': 'P002',
    'terlambat': 'P002',
    'ngaret': 'P002',
    'bolos': 'P005',
    
    # Apresiasi
    'bantu': 'A001',
    'membantu': 'A001',
    'tolong': 'A001',
    'menolong': 'A001',
    'tepat waktu': 'A101',
    'ontime': 'A101',
    'hadir': 'A102',
    
    # Konselor
    'murung': 'G003',
    'sedih': 'G003',
    'gelisah': 'G013',
    'cemas': 'G001',
    'game': 'G011',
    'gadget': 'G011',
}

# ✅ UPDATED TEST CASES - Include Negation
TEST_CASES = [
    {
        'name': 'Test 1: Pelanggaran Fisik',
        'text': 'Saya melihat Udin memukul Budi di bagian kepala di kelas 7A',
        'expected_codes': ['P001'],
        'has_negation': False,
    },
    {
        'name': 'Test 2: Pelanggaran Disiplin',
        'text': 'Anak ini sering ngaret kalau masuk kelas, kadang sampai telat 30 menit',
        'expected_codes': ['P002'],
        'has_negation': False,
    },
    {
        'name': 'Test 3: Apresiasi',
        'text': 'Ahmad membantu temannya bersih-bersih kelas setelah pulang sekolah',
        'expected_codes': ['A001'],
        'has_negation': False,
    },
    {
        'name': 'Test 4: Kondisi Mental',
        'text': 'Fahmi terlihat murung dan gelisah akhir-akhir ini, sering menyendiri',
        'expected_codes': ['G003', 'G013'],
        'has_negation': False,
    },
    {
        'name': 'Test 5: Multiple Codes',
        'text': 'Sule sering telat dan bolos, dia juga main game terus sampai gelisah',
        'expected_codes': ['P002', 'P005', 'G011', 'G013'],
        'has_negation': False,
    },
    
    # ═════════════════════════════════════════════════
    # ✅ NEW: NEGATION TESTS
    # ═════════════════════════════════════════════════
    {
        'name': 'Test 6: NEGATION - Tidak Telat → Apresiasi',
        'text': 'Aisyah tidak telat masuk kelas hari ini, dia tepat waktu',
        'expected_codes': ['A101'],  # Flipped from P002 to A101
        'has_negation': True,
    },
    {
        'name': 'Test 7: NEGATION - Tidak Bolos → Apresiasi',
        'text': 'Ahmad tidak bolos sama sekali minggu ini, selalu hadir',
        'expected_codes': ['A102'],  # Flipped from P005 to A102
        'has_negation': True,
    },
    {
        'name': 'Test 8: NEGATION - Tidak Membantu → Pelanggaran',
        'text': 'Budi tidak membantu temannya yang jatuh di kelas',
        'expected_codes': ['P101'],  # Flipped from A001 to P101
        'has_negation': True,
    },
    {
        'name': 'Test 9: DOUBLE NEGATION - No Flip',
        'text': 'Dia tidak pernah telat ke sekolah',
        'expected_codes': ['P002'],  # Double negation = no flip
        'has_negation': True,
    },
    {
        'name': 'Test 10: MIXED - Negation + Normal',
        'text': 'Ahmad tidak telat tapi dia suka memukul teman',
        'expected_codes': ['A101', 'P001'],  # Flipped P002→A101 + P001
        'has_negation': True,
    },
]


def run_tests():
    """Jalankan semua test cases"""
    pipeline = PreprocessingPipeline()
    
    print("=" * 70)
    print("PREPROCESSING TEST SUITE - WITH NEGATION SUPPORT")
    print("=" * 70)
    print()
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(TEST_CASES, 1):
        print(f"[Test {i}] {test['name']}")
        print(f"Input: {test['text']}")
        print()
        
        # Process
        hasil = pipeline.process(test['text'], SAMPLE_KAMUS)
        
        # Show steps
        print(f"  1. Case Folding: {hasil['case_folding'][:50]}...")
        print(f"  2. Cleaning:     {hasil['cleaning'][:50]}...")
        print(f"  3. Tokens:       {hasil['tokens'][:10]}")
        print(f"  4. No Stopwords: {hasil['no_stopwords'][:10]}")
        print(f"  5. Stemmed:      {hasil['stemmed'][:10]}")
        print(f"  6. Matched:      {hasil['matched_codes']}")
        
        # ✅ Show negation info if any
        if 'negation_log' in hasil and hasil['negation_log']:
            print(f"  7. NEGATION:")
            for neg in hasil['negation_log']:
                print(f"     - '{neg['original_kata']}' ({neg['original_kode']}) "
                      f"→ {neg.get('flipped_kode', 'NO_FLIP')} "
                      f"(negasi: '{neg['negation_word']}')")
        print()
        
        # Verify
        expected = set(test['expected_codes'])
        actual = set(hasil['matched_codes'])
        
        if expected == actual:
            print("  ✅ PASS")
            passed += 1
        else:
            print(f"  ❌ FAIL")
            print(f"     Expected: {sorted(expected)}")
            print(f"     Actual:   {sorted(actual)}")
            failed += 1
        
        print("-" * 70)
        print()
    
    # Summary
    print("=" * 70)
    print(f"SUMMARY: {passed} passed, {failed} failed out of {len(TEST_CASES)} tests")
    print("=" * 70)
    
    return failed == 0


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)