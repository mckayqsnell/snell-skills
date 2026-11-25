# Makes voice lines with a local model through mlx-audio (Apple Silicon), loading the model once per batch.
# voice.mjs runs this; you rarely call it by hand.
#   python voice_mlx.py <model-id> <jobs.json> <out-dir>
#   jobs: [{"name", "text", "voice"?, "instruct"?, "ref_audio"?, "ref_text"?, "seed"?, "speed"?, "lang_code"?}]
# Prints one JSON line per job: {"name", "seconds", "took", "peak_gb"}.
# Runs no code from the jobs file: only these keys are passed on to the model.
import json, os, sys, time

import mlx.core as mx
import numpy as np
import soundfile as sf
from mlx_audio.tts.utils import load_model

ALLOWED = ("voice", "instruct", "ref_audio", "ref_text", "speed", "lang_code", "temperature", "top_p", "use_zero_spk_emb")

model_id, jobs_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
jobs = json.load(open(jobs_path))
os.makedirs(out, exist_ok=True)
t0 = time.time()
model = load_model(model_id)
print(json.dumps({"loaded": model_id, "took": round(time.time() - t0, 1)}), flush=True)
for job in jobs:
    if "seed" in job:
        mx.random.seed(int(job["seed"]))
    kw = {k: job[k] for k in ALLOWED if k in job}
    t = time.time()
    parts = [np.array(r.audio) for r in model.generate(text=job["text"], **kw)]
    audio = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
    sf.write(os.path.join(out, f"{job['name']}.wav"), audio, model.sample_rate)
    print(json.dumps({"name": job["name"], "seconds": round(len(audio) / model.sample_rate, 2),
                      "took": round(time.time() - t, 1), "peak_gb": round(mx.get_peak_memory() / 1e9, 1)}), flush=True)
