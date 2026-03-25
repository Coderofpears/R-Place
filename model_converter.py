#!/usr/bin/env python3
"""
Minimal LLM Model Converter
Converts HuggingFace models (Qwen, DeepSeek, Llama, GPT-OSS) to a single JSON file.
"""

import json
import argparse
import os
import sys
import math
from pathlib import Path

try:
    from transformers import AutoTokenizer, AutoConfig
    from safetensors import safe_open
except ImportError:
    print("Installing required packages...")
    os.system("pip install transformers safetensors huggingface_hub")
    from transformers import AutoTokenizer, AutoConfig
    from safetensors import safe_open


def get_model_files(model_id_or_path):
    """Get list of model files from local path or HuggingFace hub."""
    if os.path.isdir(model_id_or_path):
        files = list(Path(model_id_or_path).glob("*.safetensors"))
        if not files:
            raise FileNotFoundError(f"No .safetensors files found in {model_id_or_path}")
        return [str(f) for f in files]
    else:
        from huggingface_hub import snapshot_download
        print(f"Downloading model {model_id_or_path} from HuggingFace...")
        try:
            local_path = snapshot_download(
                repo_id=model_id_or_path,
                allow_patterns=["*.safetensors", "config.json", "tokenizer.json", "tokenizer_config.json"]
            )
            return get_model_files(local_path)
        except Exception as e:
            print(f"Error downloading model: {e}")
            sys.exit(1)


def extract_config(model_path):
    """Extract model configuration."""
    if os.path.isdir(model_path):
        config_path = os.path.join(model_path, "config.json")
    else:
        from huggingface_hub import hf_hub_download
        config_path = hf_hub_download(repo_id=model_path, filename="config.json")
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    normalized = {
        "model_type": config.get("model_type", "unknown"),
        "vocab_size": config.get("vocab_size", config.get("padded_vocab_size", 32000)),
        "hidden_size": config.get("hidden_size", config.get("n_embd", 4096)),
        "num_hidden_layers": config.get("num_hidden_layers", config.get("n_layer", 32)),
        "num_attention_heads": config.get("num_attention_heads", config.get("n_head", 32)),
        "max_position_embeddings": config.get("max_position_embeddings", config.get("n_positions", 2048)),
        "intermediate_size": config.get("intermediate_size", config.get("ffn_hidden_size", 11008)),
        "rms_norm_eps": config.get("rms_norm_eps", config.get("layer_norm_epsilon", 1e-5)),
        "rope_theta": config.get("rope_theta", 10000.0),
        "tie_word_embeddings": config.get("tie_word_embeddings", False),
    }
    
    if "num_key_value_heads" in config:
        normalized["num_key_value_heads"] = config["num_key_value_heads"]
    else:
        normalized["num_key_value_heads"] = normalized["num_attention_heads"]
    
    if "rope_scaling" in config:
        normalized["rope_scaling"] = config["rope_scaling"]
    
    return normalized


def extract_tokenizer(model_path):
    """Extract and simplify tokenizer to JSON format."""
    try:
        if os.path.isdir(model_path):
            tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
        else:
            tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
        
        simplified = {
            "vocab": {},
            "merges": [],
            "bos_token_id": tokenizer.bos_token_id if hasattr(tokenizer, 'bos_token_id') else None,
            "eos_token_id": tokenizer.eos_token_id if hasattr(tokenizer, 'eos_token_id') else None,
            "pad_token_id": tokenizer.pad_token_id if hasattr(tokenizer, 'pad_token_id') else None,
            "unk_token_id": tokenizer.unk_token_id if hasattr(tokenizer, 'unk_token_id') else None,
        }
        
        if hasattr(tokenizer, 'get_vocab'):
            vocab = tokenizer.get_vocab()
            sorted_vocab = sorted(vocab.items(), key=lambda x: x[1])
            simplified["vocab"] = {k: v for k, v in sorted_vocab}
        
        if hasattr(tokenizer, 'merges'):
            simplified["merges"] = tokenizer.merges if tokenizer.merges else []
        elif hasattr(tokenizer, 'bpe_ranks'):
            simplified["merges"] = list(tokenizer.bpe_ranks.keys()) if tokenizer.bpe_ranks else []
        
        if hasattr(tokenizer, 'special_tokens_map'):
            simplified["special_tokens"] = tokenizer.special_tokens_map
        
        return simplified
    
    except Exception as e:
        print(f"Warning: Could not extract tokenizer: {e}")
        return {
            "vocab": {"<unk>": 0, "<pad>": 1, "<bos>": 2, "<eos>": 3},
            "merges": [],
            "bos_token_id": 2,
            "eos_token_id": 3,
            "pad_token_id": 1,
            "unk_token_id": 0,
        }


def tensor_to_list(tensor, use_float16=False):
    """Convert numpy tensor to Python list with optional precision reduction."""
    import numpy as np
    
    if use_float16:
        tensor = tensor.astype(np.float16)
    else:
        tensor = tensor.astype(np.float32)
    
    # Flatten the tensor
    flat = tensor.flatten().tolist()
    return flat


def extract_weights_from_safetensors(safetensor_files, config, use_float16=False, chunk_threshold=1000000):
    """Extract weights from safetensors files and organize by layer."""
    import numpy as np
    
    weights = {}
    all_tensors = {}
    
    # Load all tensors from all files
    for sf in safetensor_files:
        print(f"  Loading {os.path.basename(sf)}...")
        with safe_open(sf, framework="numpy") as f:
            for key in f.keys():
                all_tensors[key] = f.get_tensor(key)
    
    # Map tensor names to layer structure
    # Common patterns across Qwen, Llama, DeepSeek
    layer_pattern_map = [
        # Llama/Qwen pattern: model.layers.{n}.self_attn.q_proj
        (r"model\.layers\.(\d+)\.self_attn\.q_proj\.weight", "layer_{}", "q_proj"),
        (r"model\.layers\.(\d+)\.self_attn\.k_proj\.weight", "layer_{}", "k_proj"),
        (r"model\.layers\.(\d+)\.self_attn\.v_proj\.weight", "layer_{}", "v_proj"),
        (r"model\.layers\.(\d+)\.self_attn\.o_proj\.weight", "layer_{}", "o_proj"),
        (r"model\.layers\.(\d+)\.mlp\.gate_proj\.weight", "layer_{}", "gate_proj"),
        (r"model\.layers\.(\d+)\.mlp\.up_proj\.weight", "layer_{}", "up_proj"),
        (r"model\.layers\.(\d+)\.mlp\.down_proj\.weight", "layer_{}", "down_proj"),
        (r"model\.layers\.(\d+)\.input_layernorm\.weight", "layer_{}", "input_layernorm"),
        (r"model\.layers\.(\d+)\.post_attention_layernorm\.weight", "layer_{}", "post_attention_layernorm"),
        # Alternative patterns
        (r"transformer\.h\.(\d+)\.attn\.q_proj\.weight", "layer_{}", "q_proj"),
        (r"transformer\.h\.(\d+)\.attn\.k_proj\.weight", "layer_{}", "k_proj"),
        (r"transformer\.h\.(\d+)\.attn\.v_proj\.weight", "layer_{}", "v_proj"),
        (r"transformer\.h\.(\d+)\.attn\.o_proj\.weight", "layer_{}", "o_proj"),
        (r"transformer\.h\.(\d+)\.mlp\.c_fc\.weight", "layer_{}", "gate_proj"),
        (r"transformer\.h\.(\d+)\.mlp\.c_proj\.weight", "layer_{}", "down_proj"),
        (r"transformer\.h\.(\d+)\.ln_1\.weight", "layer_{}", "input_layernorm"),
        (r"transformer\.h\.(\d+)\.ln_2\.weight", "layer_{}", "post_attention_layernorm"),
    ]
    
    import re
    
    # Non-layer weights
    non_layer_mappings = {
        "model.embed_tokens.weight": "embed_tokens",
        "transformer.wte.weight": "embed_tokens",
        "lm_head.weight": "lm_head",
        "model.norm.weight": "norm",
        "transformer.ln_f.weight": "norm",
    }
    
    for tensor_name, tensor in all_tensors.items():
        placed = False
        
        # Check non-layer mappings first
        if tensor_name in non_layer_mappings:
            dest_name = non_layer_mappings[tensor_name]
            weights[dest_name] = tensor_to_list(tensor, use_float16)
            placed = True
            continue
        
        # Check layer patterns
        for pattern, layer_template, weight_name in layer_pattern_map:
            match = re.match(pattern, tensor_name)
            if match:
                layer_num = int(match.group(1))
                layer_key = layer_template.format(layer_num)
                
                if layer_key not in weights:
                    weights[layer_key] = {}
                
                weights[layer_key][weight_name] = tensor_to_list(tensor, use_float16)
                placed = True
                break
        
        if not placed:
            # Store as-is with sanitized name
            safe_name = tensor_name.replace(".", "_").replace("/", "_")
            weights[f"extra_{safe_name}"] = tensor_to_list(tensor, use_float16)
    
    return weights


def downscale_model(config, weights, target_hidden=256, target_layers=4, target_heads=8):
    """Downscale model for browser compatibility if needed."""
    print(f"Downscaling model for browser runtime...")
    print(f"  Hidden: {config['hidden_size']} -> {target_hidden}")
    print(f"  Layers: {config['num_hidden_layers']} -> {target_layers}")
    print(f"  Heads: {config['num_attention_heads']} -> {target_heads}")
    
    old_hidden = config["hidden_size"]
    old_layers = config["num_hidden_layers"]
    old_heads = config["num_attention_heads"]
    old_kv_heads = config.get("num_key_value_heads", old_heads)
    
    # Update config
    config["hidden_size"] = target_hidden
    config["num_hidden_layers"] = target_layers
    config["num_attention_heads"] = target_heads
    config["num_key_value_heads"] = min(target_heads, old_kv_heads)
    config["intermediate_size"] = target_hidden * 4
    config["_downscaled"] = True
    config["_original_hidden"] = old_hidden
    config["_original_layers"] = old_layers
    
    # Downscale weights
    import numpy as np
    
    def interpolate_weights(data, old_dim, new_dim):
        """Simple interpolation for weight matrices."""
        if isinstance(data, list):
            arr = np.array(data, dtype=np.float32)
        else:
            arr = data
            
        if len(arr.shape) == 1:
            # Vector - take first new_dim elements or pad
            if len(arr) >= new_dim:
                return arr[:new_dim].tolist()
            else:
                padded = np.zeros(new_dim, dtype=np.float32)
                padded[:len(arr)] = arr
                return padded.tolist()
        elif len(arr.shape) == 2:
            # Matrix - scale both dimensions
            old_h, old_w = arr.shape
            
            # Calculate scaling factors
            scale_h = new_dim / old_h if old_h == old_hidden else 1.0
            scale_w = new_dim / old_w if old_w == old_hidden else 1.0
            
            # Simple strided sampling
            new_h = min(new_dim, old_h)
            new_w = min(new_dim, old_w)
            
            step_h = max(1, old_h // new_h)
            step_w = max(1, old_w // new_w)
            
            result = np.zeros((new_h, new_w), dtype=np.float32)
            for i in range(new_h):
                for j in range(new_w):
                    src_i = min(int(i * step_h), old_h - 1)
                    src_j = min(int(j * step_w), old_w - 1)
                    result[i, j] = arr[src_i, src_j] * np.sqrt(scale_h * scale_w)
            
            return result.flatten().tolist()
        return data
    
    # Downscale embed_tokens
    if "embed_tokens" in weights:
        weights["embed_tokens"] = interpolate_weights(weights["embed_tokens"], old_hidden, target_hidden)
    
    # Downscale lm_head
    if "lm_head" in weights:
        weights["lm_head"] = interpolate_weights(weights["lm_head"], old_hidden, target_hidden)
    
    # Downscale norm
    if "norm" in weights:
        weights["norm"] = interpolate_weights(weights["norm"], old_hidden, target_hidden)
    
    # Keep only target_layers and downscale each
    new_weights = {}
    for key, value in weights.items():
        if key.startswith("layer_"):
            layer_num = int(key.split("_")[1])
            if layer_num < target_layers:
                new_key = f"layer_{layer_num}"
                if isinstance(value, dict):
                    new_weights[new_key] = {}
                    for sub_key, sub_value in value.items():
                        new_weights[new_key][sub_key] = interpolate_weights(sub_value, old_hidden, target_hidden)
                else:
                    new_weights[new_key] = interpolate_weights(value, old_hidden, target_hidden)
        else:
            new_weights[key] = value
    
    return config, new_weights


def convert_model(model_id, output_path="model.json", use_float16=False, downscale=False):
    """Main conversion function."""
    print(f"Converting model: {model_id}")
    print(f"Output: {output_path}")
    print(f"Float16: {use_float16}")
    print(f"Downscale: {downscale}")
    print()
    
    # Get model files
    safetensor_files = get_model_files(model_id)
    print(f"Found {len(safetensor_files)} safetensor file(s)")
    
    # Extract config
    print("Extracting configuration...")
    config = extract_config(model_id if not os.path.isdir(model_id) else os.path.dirname(safetensor_files[0]))
    print(f"  Model type: {config['model_type']}")
    print(f"  Hidden size: {config['hidden_size']}")
    print(f"  Layers: {config['num_hidden_layers']}")
    print(f"  Attention heads: {config['num_attention_heads']}")
    print(f"  Vocab size: {config['vocab_size']}")
    
    # Extract tokenizer
    print("Extracting tokenizer...")
    tokenizer = extract_tokenizer(model_id if not os.path.isdir(model_id) else os.path.dirname(safetensor_files[0]))
    vocab_size = len(tokenizer.get("vocab", {}))
    print(f"  Vocab entries: {vocab_size}")
    
    # Extract weights
    print("Extracting weights...")
    weights = extract_weights_from_safetensors(safetensor_files, config, use_float16)
    print(f"  Extracted {len(weights)} weight groups")
    
    # Downscale if requested or if model is too large
    if downscale or config["hidden_size"] > 512 or config["num_hidden_layers"] > 8:
        if downscale or config["hidden_size"] > 1024:
            config, weights = downscale_model(config, weights)
    
    # Build final output
    output = {
        "config": config,
        "tokenizer": tokenizer,
        "weights": weights,
    }
    
    # Estimate file size
    json_str = json.dumps(output)
    size_mb = len(json_str.encode('utf-8')) / (1024 * 1024)
    print(f"\nEstimated output size: {size_mb:.1f} MB")
    
    if size_mb > 100:
        print("WARNING: Large model! Consider using --downscale flag for browser compatibility.")
    
    # Write output
    print(f"Writing to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(output, f)
    
    print("Conversion complete!")
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Convert HuggingFace models to JSON format for browser inference"
    )
    parser.add_argument(
        "model",
        help="Model ID (e.g., 'Qwen/Qwen2.5-0.5B') or local path"
    )
    parser.add_argument(
        "-o", "--output",
        default="model.json",
        help="Output JSON file path (default: model.json)"
    )
    parser.add_argument(
        "--float16",
        action="store_true",
        help="Use float16 precision for weights"
    )
    parser.add_argument(
        "--downscale",
        action="store_true",
        help="Downscale model for browser compatibility"
    )
    
    args = parser.parse_args()
    
    try:
        convert_model(
            args.model,
            args.output,
            args.float16,
            args.downscale
        )
    except KeyboardInterrupt:
        print("\nConversion cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
