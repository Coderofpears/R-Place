#!/usr/bin/env python3
"""
LLM Converter (Browser + iPad Optimized)

Features:
- Accepts HF URL directly
- Row-wise int8 quantization
- Chunked tensors (prevents browser crashes)
- Layer limiting (CRUCIAL for iPads)

Example:
python llm_converter.py --model https://huggingface.co/Qwen/Qwen3.5-0.8B-Base --limit_layers 2
"""

from __future__ import annotations
import argparse, base64, json, re
from pathlib import Path
import numpy as np
import torch
from transformers import AutoConfig, AutoModelForCausalLM, AutoTokenizer

print("STARTED SCRIPT")
# -----------------------------
# Utils
# -----------------------------
def normalize_model_id(model: str) -> str:
    if model.startswith("http"):
        m = re.search(r"huggingface\.co/([^/]+/[^/?]+)", model)
        if m:
            return m.group(1)
    return model


def b64(x: np.ndarray) -> str:
    return base64.b64encode(x.tobytes()).decode()


# -----------------------------
# Quantization
# -----------------------------
def quantize(t: torch.Tensor):
    arr = t.detach().float().cpu().numpy()

    if arr.ndim < 2:
        return {
            "dtype": "f32",
            "shape": list(arr.shape),
            "data": b64(arr.astype(np.float32))
        }

    rows = arr.shape[0]
    flat = arr.reshape(rows, -1)

    q = np.zeros_like(flat, dtype=np.int8)
    scale = np.zeros(rows, dtype=np.float32)

    for i in range(rows):
        m = np.max(np.abs(flat[i])) + 1e-8
        s = m / 127
        scale[i] = s
        q[i] = np.clip(np.round(flat[i] / s), -127, 127)

    return {
        "dtype": "qint8_row",
        "shape": list(arr.shape),
        "data": q,
        "scale": scale
    }


# -----------------------------
# Chunking (CRITICAL FOR iPad)
# -----------------------------
def chunk_tensor(qdict, mb=4):
    if qdict["dtype"] == "f32":
        return qdict

    data = qdict["data"]
    scale = qdict["scale"]

    rows = data.shape[0]
    cols = data.shape[1]

    max_bytes = mb * 1024 * 1024
    rows_per_chunk = max(1, max_bytes // cols)

    chunks = []
    for i in range(0, rows, rows_per_chunk):
        chunks.append({
            "data": b64(data[i:i+rows_per_chunk]),
            "scale": b64(scale[i:i+rows_per_chunk])
        })

    return {
        "dtype": "qint8_row",
        "shape": qdict["shape"],
        "chunks": chunks
    }


# -----------------------------
# Main
# -----------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--out", default="model.json")
    ap.add_argument("--limit_layers", type=int, default=0)
    ap.add_argument("--chunk_mb", type=int, default=4)

    args = ap.parse_args()

    model_id = normalize_model_id(args.model)
    print("Using model:", model_id)

    print("Loading config/tokenizer...")
    cfg = AutoConfig.from_pretrained(model_id, trust_remote_code=True)
    tok = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)

    print("Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        device_map="cpu",
        low_cpu_mem_usage=True,
        trust_remote_code=True
    )

    weights = {}

    print("Processing weights...")
    for k, v in model.state_dict().items():

        # Layer limiter (VERY IMPORTANT)
        if args.limit_layers:
            m = re.search(r"layers\.(\d+)\.", k)
            if m and int(m.group(1)) >= args.limit_layers:
                continue

        if not torch.is_tensor(v):
            continue

        try:
            q = quantize(v)
            q = chunk_tensor(q, args.chunk_mb)
            weights[k] = q
        except Exception as e:
            print("Skipped:", k, e)

    print("Building tokenizer...")
    vocab = tok.get_vocab()
    pieces = [""] * len(vocab)

    for t, i in vocab.items():
        if i < len(pieces):
            pieces[i] = t

    output = {
        "format": "mini-llm-json-2",
        "source": model_id,
        "config": cfg.to_dict(),
        "tokenizer": {
            "pieces": pieces,
            "bos_token_id": tok.bos_token_id,
            "eos_token_id": tok.eos_token_id,
            "unk_token_id": tok.unk_token_id
        },
        "weights": weights
    }

    Path(args.out).write_text(json.dumps(output))
    print("DONE ->", args.out)


if __name__ == "__main__":
    main()