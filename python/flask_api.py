#!/usr/bin/env python3
"""
Flask API Wrapper - NLP Preprocessing untuk RamahAnak.id
Deploy ke PythonAnywhere
"""

from flask import Flask, request, jsonify
import sys
import os
import json
import re
from datetime import datetime
from functools import wraps

#  Tambah folder python ke path 
sys.path.insert(0, os.path.dirname(__file__))

app = Flask(__name__)

#  API Token (ubah ini jika deploy) 
API_TOKEN = os.getenv("NLP_API_TOKEN", "ramahanak-nlp-secret-2026")

#  Auth decorator 
def require_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("X-API-Token") or request.args.get("token")
        if not token or token != API_TOKEN:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

#  Helper: import preprocessing 
def get_preprocessor():
    from database import get_db
    from ner import get_ner
    from kode_matching import match_kode_variabel, categorize_kode
    from config import TRANSITIVE_VERBS
    try:
        from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
        stemmer = StemmerFactory().create_stemmer()
    except ImportError:
        stemmer = None
    return stemmer

#  Routes 

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "RamahAnak NLP API",
        "status": "running",
        "version": "1.0.0"
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route("/preprocess", methods=["POST"])
@require_token
def preprocess():
    """
    Endpoint utama preprocessing NLP.
    
    Request JSON:
    {
        "laporan_id": 123,
        "teks_laporan": "zurah memukul adel di kelas",
        "db_host": "...",
        "db_name": "...",
        "db_user": "...",
        "db_pass": "..."
    }
    
    Response JSON:
    {
        "status": "success",
        "hasil_preprocessing_id": 45,
        "kode_matched": [...],
        "pelaku_nama": "...",
        "korban_nama": "..."
    }
    """
    try:
        data = request.get_json(force=True)

        laporan_id  = data.get("laporan_id")
        teks        = data.get("teks_laporan", "")
        db_host     = data.get("db_host", "localhost")
        db_name     = data.get("db_name", "db_ra")
        db_user     = data.get("db_user", "ramahanak")
        db_pass     = data.get("db_pass", "")

        if not laporan_id or not teks:
            return jsonify({"status": "error", "message": "laporan_id dan teks_laporan wajib diisi"}), 400

        # Set env untuk database.py
        os.environ["DB_HOST"]     = db_host
        os.environ["DB_DATABASE"] = db_name
        os.environ["DB_USERNAME"] = db_user
        os.environ["DB_PASSWORD"] = db_pass

        # Import setelah env di-set
        from database import get_db
        from ner import get_ner
        from kode_matching import match_kode_variabel, categorize_kode
        from preprocessing import preprocess_laporan

        # Jalankan preprocessing
        result = preprocess_laporan(
            laporan_id=laporan_id,
            save_to_db=True
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "laporan_id": laporan_id if "laporan_id" in locals() else None
        }), 500


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)