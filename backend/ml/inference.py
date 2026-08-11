import warnings
from pathlib import Path
from typing import List

import joblib
import numpy as np
import torch

from models.water_log import WaterLog
from ml.models.bangus_lstm import BangusLSTM

# ============================================================================
# Configuration
# ============================================================================

# Number of historical water-log readings the model expects per prediction.
SEQ_LENGTH = 48

# Resolved relative to this file (not the process cwd), so the model loads
# correctly no matter where `uvicorn`/`python` is invoked from.
MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "bangus_buhai_lstm_pytorch.pt"
SCALER_PATH = MODEL_DIR / "bangus_buhai_scaler.pkl"

# ============================================================================
# Singleton Resources
# ============================================================================

_model = None
_scaler = None


# ============================================================================
# Resource Loading
# ============================================================================

def load_resources() -> None:
    """Loads model weights + scaler from disk into global memory (runs once)."""
    global _model, _scaler

    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"ML model file not found at {MODEL_PATH}. "
                "Expected 'bangus_buhai_lstm_pytorch.pt' in ml/models/."
            )
        # Initialize model architecture and load state dict
        _model = BangusLSTM()
        checkpoint = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
        _model.load_state_dict(checkpoint["state_dict"])
        _model.eval()  # Set to inference mode (disables dropout, freezes batchnorm)

    if _scaler is None:
        if not SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Scaler file not found at {SCALER_PATH}. "
                "Expected 'bangus_buhai_scaler.pkl' in ml/models/."
            )
        _scaler = joblib.load(SCALER_PATH)  # Load fitted sklearn scaler


def get_model() -> BangusLSTM:
    """Returns loaded model (loads first if needed)."""
    if _model is None:
        load_resources()
    return _model


def get_scaler():
    """Returns loaded scaler (loads first if needed)."""
    if _scaler is None:
        load_resources()
    return _scaler


# ============================================================================
# Preprocessing
# ============================================================================

def logs_to_numpy(logs: List[WaterLog]) -> np.ndarray:
    """Converts list of WaterLog objects → numpy array (n, 3) [temp, pH, turbidity]."""
    return np.array(
        [
            [
                log.temperature,
                log.pH,
                log.turbidity,
            ]
            for log in logs
        ],
        dtype=np.float32,
    )


def prepare_sequence(logs: List[WaterLog]) -> torch.Tensor:
    """Validates 48 logs → scales → returns tensor (1, 48, 3) ready for model."""
    if len(logs) < SEQ_LENGTH:
        raise ValueError(
            f"Model requires {SEQ_LENGTH} water logs, got {len(logs)}."
        )

    scaler = get_scaler()
    data = logs_to_numpy(logs)

    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="X does not have valid feature names",
            category=UserWarning,
        )
        scaled = scaler.transform(data)  # Normalize: (48, 3)

    sequence = scaled[-SEQ_LENGTH:]           # Keep last 48: (48, 3)
    sequence = np.expand_dims(sequence, axis=0)  # Add batch dim: (1, 48, 3)
    return torch.as_tensor(sequence, dtype=torch.float32)


# ============================================================================
# Prediction
# ============================================================================

def predict(logs: List[WaterLog]) -> dict:
    """Runs autoregressive forecast: predicts 4 hours ahead using sliding window."""
    model = get_model()
    scaler = get_scaler()

    sequence = prepare_sequence(logs)  # (1, 48, 3)
    predictions = {}

    with torch.no_grad():  # Disable gradients for inference
        for horizon in range(1, 5):
            # 1. Predict next step: (1, 48, 3) → (1, 3)
            prediction_scaled = model(sequence)

            # 2. Inverse transform to real values
            pred_np = prediction_scaled.cpu().numpy()
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message="X does not have valid feature names",
                    category=UserWarning,
                )
                real_pred = scaler.inverse_transform(pred_np)[0]  # (3,) [temp, pH, turbidity]

            # 3. Store prediction
            predictions[f"hour_{horizon}"] = {
                "temperature": float(real_pred[0]),
                "pH": float(real_pred[1]),
                "turbidity": float(real_pred[2]),
            }

            # 4. Autoregressive update: slide window forward
            next_step = prediction_scaled.unsqueeze(1)  # (1, 3) → (1, 1, 3)
            sequence = torch.cat([sequence[:, 1:, :], next_step], dim=1)  # Drop oldest, append new → (1, 48, 3)

    return predictions


# ============================================================================
# Health Check
# ============================================================================

def is_model_loaded() -> bool:
    """Returns True if both model and scaler are loaded in memory."""
    return _model is not None and _scaler is not None