from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np
import os

print("--- STARTING API ---", flush=True) # Debug print

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

print(f"--- LOOKING FOR FILES IN: {DATA_DIR} ---", flush=True) # Debug print

try:
    model_path = os.path.join(DATA_DIR, "disease_model.pkl")
    symptoms_list_path = os.path.join(DATA_DIR, "symptoms.pkl") # NEW
    csv_path = os.path.join(DATA_DIR, "Training.csv")

    # 1. Load Model
    with open(model_path, "rb") as f:
        model = pickle.load(f)

    # 2. REPLACE the all_symptoms logic with this:
    with open(symptoms_list_path, "rb") as f:
        all_symptoms = pickle.load(f)

    # 3. Load and Clean CSV (Match Notebook cleaning)
    train_df = pd.read_csv(csv_path)
    train_df = train_df.loc[:, ~train_df.columns.str.contains('^Unnamed')]
    train_df.columns = train_df.columns.str.strip()

except Exception as e:
    print(f"!!! CRITICAL ERROR: {e} !!!")
    model = None
    all_symptoms = []

class SymptomRequest(BaseModel):
    symptoms: list[str]

@app.post("/api/predict")
def predict_disease(request: SymptomRequest):
    if len(request.symptoms) < 3:
        return {"error": "Please select at least 3 symptoms for analysis."}
    
    if not model:
        return {"error": "Model failed to load. Check server logs."}
    
    selected = request.symptoms
    input_vector = pd.DataFrame(0, index=[0], columns=all_symptoms)
    for s in selected:
        if s in all_symptoms:
            input_vector.loc[0, s] = 1

    probs = model.predict_proba(input_vector)[0]
    top_indices = np.argsort(probs)[::-1]
    
    top_conf = probs[top_indices[0]] * 100
    num_results = 3 if top_conf < 90 else 1
    
    results = []
    for i in range(num_results):
        idx = top_indices[i]
        confidence = probs[idx] * 100
        if confidence > 0.01:
            results.append({
                "disease": model.classes_[idx],
                "confidence": round(confidence, 2)
            })
    return {"predictions": results}

@app.post("/api/related_symptoms")
def get_related(request: SymptomRequest):
    selected = [s for s in request.symptoms if s in all_symptoms]
    if not selected: 
        return {"related": []}
    
    # Logic: Find rows where ANY of the selected symptoms are present
    mask = train_df[selected].sum(axis=1) > 0
    filtered = train_df[mask]
    
    if filtered.empty:
        return {"related": []}
    
    # Calculate frequency of symptoms not already selected
    drop_cols = selected + ['prognosis']
    related_series = filtered.drop(columns=drop_cols, errors='ignore').sum()
    
    # Return top 5 most frequent symptoms found in those cases
    top_related = related_series.sort_values(ascending=False).head(5)
    return {"related": top_related.index.tolist()}
