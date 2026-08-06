from fastapi import HTTPException
from sqlmodel import Session, select
from datetime import timedelta

from models.water_log import WaterLog
from models.prediction import Prediction, PredictionRead
from ml.inference import predict


def create_prediction(tank_id: int, db: Session) -> PredictionRead:
    """
    Predict the next water quality values for a tank
    using the latest 48 water logs.
    """

    logs = db.exec(
        select(WaterLog)
        .where(WaterLog.tank_id == tank_id)
        .order_by(WaterLog.timestamp.desc())
        .limit(48)
    ).all()

    if len(logs) < 48:
        raise HTTPException(
            status_code=400,
            detail="At least 48 water logs are required for prediction."
        )

    # Reverse because the query returns newest -> oldest
    logs.reverse()

    prediction = predict(logs)

    prediction_db = Prediction(
        tank_id=tank_id,
        temperature=prediction["temperature"],
        pH=prediction["pH"],
        turbidity=prediction["turbidity"],
        predicted_for=logs[-1].recorded_at + timedelta(hours=3),
    )

    db.add(prediction_db)
    db.commit()
    db.refresh(prediction_db)

    return PredictionRead.model_validate(prediction_db)