from pathlib import Path
from typing import List

import joblib
import numpy as np
from keras.models import load_model

from models.water_log import WaterLog

# ============================================================================
# Configuration
# ============================================================================

SEQ_LENGTH = 48

MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "bangus_buhai_lstm_exp2.keras"
SCALER_PATH = MODEL_DIR / "bangus_buhai_scaler.pkl"

# ============================================================================
# Singleton Resources
# ============================================================================

_model = None
_scaler = None


# ============================================================================
# Resource Loading
# ============================================================================

def load_resources():
    """
    Loads the trained model and scaler into memory.

    Safe to call multiple times.
    """

    global _model, _scaler

    if _model is None:
        _model = load_model(MODEL_PATH)

    if _scaler is None:
        _scaler = joblib.load(SCALER_PATH)


def get_model():
    if _model is None:
        load_resources()
    return _model


def get_scaler():
    if _scaler is None:
        load_resources()
    return _scaler


# ============================================================================
# Preprocessing
# ============================================================================

def logs_to_numpy(logs: List[WaterLog]) -> np.ndarray:
    """
    Converts WaterLog objects into a NumPy array.

    Shape:
        (48,3)
    """

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


def prepare_sequence(logs: List[WaterLog]) -> np.ndarray:
    """
    Creates the model input.

    Returns:
        (1,48,3)
    """

    if len(logs) < SEQ_LENGTH:
        raise ValueError(
            f"Model requires {SEQ_LENGTH} water logs."
        )

    scaler = get_scaler()

    data = logs_to_numpy(logs)

    scaled = scaler.transform(data)

    sequence = scaled[-SEQ_LENGTH:]

    sequence = np.expand_dims(sequence, axis=0)

    return sequence


# ============================================================================
# Prediction
# ============================================================================

def predict(logs: List[WaterLog]) -> dict:
    """
    Predict future Temperature, pH and Turbidity.

    Returns:
    {
        temperature,
        pH,
        turbidity
    }
    """

    model = get_model()
    scaler = get_scaler()

    sequence = prepare_sequence(logs)

    prediction_scaled = model.predict(
        sequence,
        verbose=0,
    )

    prediction = scaler.inverse_transform(prediction_scaled)

    prediction = prediction[0]

    return {
        "temperature": float(prediction[0]),
        "pH": float(prediction[1]),
        "turbidity": float(prediction[2]),
    }


# ============================================================================
# Health Check
# ============================================================================

def is_model_loaded() -> bool:
    return _model is not None and _scaler is not None