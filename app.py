from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import json
from threading import Lock

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data.json"
DATA_LOCK = Lock()

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/<path:filename>")
def static_root(filename):
    # Keep HTML, CSS, JS and JSON files together beside app.py.
    allowed = {"style.css", "dashboard.js", "data.js", "data.json"}
    if filename not in allowed:
        return ("Not found", 404)
    return send_from_directory(BASE_DIR, filename)

@app.route("/api/data", methods=["GET"])
def get_data():
    with DATA_LOCK:
        if not DATA_FILE.exists():
            DATA_FILE.write_text("{}", encoding="utf-8")
        try:
            payload = json.loads(DATA_FILE.read_text(encoding="utf-8") or "{}")
        except json.JSONDecodeError:
            return jsonify({"error": "data.json contains invalid JSON"}), 500
    return jsonify(payload)

@app.route("/api/data", methods=["POST"])
def save_data():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Send a valid JSON object"}), 400
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    # Validate JSON before replacing the file; atomic replace prevents partial writes.
    temp_file = DATA_FILE.with_suffix(".json.tmp")
    with DATA_LOCK:
        temp_file.write_text(serialized + "\n", encoding="utf-8")
        temp_file.replace(DATA_FILE)
    return jsonify({"saved": True, "file": "data.json"})

if __name__ == "__main__":
    app.run(debug=True)
