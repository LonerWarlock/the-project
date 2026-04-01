from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Load the trained model and feature list
model = joblib.load("model.pkl")
features = joblib.load("features.pkl")

class SymptomRequest(BaseModel):
    symptoms: list[str]

@app.post("/predict")
async def predict(data: SymptomRequest):
    try:
        # 1. Create the input vector (1s for present symptoms, 0s otherwise)
        input_vector = np.zeros(len(features))
        for s in data.symptoms:
            if s in features:
                index = features.index(s)
                input_vector[index] = 1

        # 2. Get probabilities for ALL diseases
        # predict_proba returns an array of probabilities [0.1, 0.5, 0.02...]
        probabilities = model.predict_proba([input_vector])[0]
        
        # 3. Get the names of all possible diseases (classes)
        disease_classes = model.classes_

        # 4. Zip them together, sort by probability descending, and take top 3
        results = sorted(
            zip(disease_classes, probabilities),
            key=lambda x: x[1],
            reverse=True
        )[:3]

        # 5. Format for the Next.js Frontend
        predictions = [
            {"disease": str(name), "confidence": round(float(prob) * 100, 2)}
            for name, prob in results
        ]

        return {"predictions": predictions}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)