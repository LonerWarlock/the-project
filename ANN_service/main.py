from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow import keras
import numpy as np
import pandas as pd
import joblib
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model, label encoder, and features
model_path = os.path.join(os.path.dirname(__file__), "disease_ann_model_8617.keras")
encoder_path = os.path.join(os.path.dirname(__file__), "disease_label_encoder.pkl")

model = keras.models.load_model(model_path)
label_encoder = joblib.load(encoder_path)

# Load dataset to get symptom columns
df = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "lib", "csv", "dataset_246946.csv"))
symptom_columns = [col for col in df.columns if col != "diseases"]

class SymptomRequest(BaseModel):
    symptoms: list[str]

@app.post("/predict-ann")
async def predict(data: SymptomRequest):
    try:
        # 1. Create input vector (1s for present symptoms, 0s otherwise)
        input_vector = np.zeros((1, len(symptom_columns)))
        for s in data.symptoms:
            if s in symptom_columns:
                idx = symptom_columns.index(s)
                input_vector[0, idx] = 1

        # 2. Get predictions (probabilities for each class)
        predictions = model.predict(input_vector, verbose=0)[0]

        # 3. Get all class names
        classes = label_encoder.classes_

        # 4. Zip, sort descending, take top 3
        results = sorted(
            zip(classes, predictions),
            key=lambda x: x[1],
            reverse=True
        )[:3]

        # 5. Format for frontend
        predictions_formatted = [
            {"disease": str(name), "confidence": round(float(prob) * 100, 2)}
            for name, prob in results
        ]

        return {"predictions": predictions_formatted}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
