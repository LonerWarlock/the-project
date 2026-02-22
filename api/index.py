from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np
import os

print("--- STARTING API ---") # Debug print

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

print(f"--- LOOKING FOR FILES IN: {DATA_DIR} ---") # Debug print

try:
    model_path = os.path.join(DATA_DIR, "disease_model.pkl")
    csv_path = os.path.join(DATA_DIR, "Training.csv")

    print(f"--- LOADING MODEL FROM: {model_path} ---") # Debug print
    if not os.path.exists(model_path):
        print("!!! ERROR: MODEL FILE NOT FOUND !!!")
    else:
        # Check file size
        size = os.path.getsize(model_path)
        print(f"--- MODEL SIZE: {size} bytes ---")
        
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print("--- MODEL LOADED SUCCESSFULLY ---") # Debug print

    print("--- LOADING CSV DATA ---") # Debug print
    train_df = pd.read_csv(csv_path)
    print("--- CSV LOADED SUCCESSFULLY ---") # Debug print

    train_df.columns = train_df.columns.str.strip()
    all_symptoms = [col for col in train_df.columns if col != 'prognosis']
    print(f"--- FOUND {len(all_symptoms)} SYMPTOMS ---") # Debug print

except Exception as e:
    print(f"!!! CRITICAL ERROR DURING LOADING: {e} !!!")
    model = None
    all_symptoms = []

class SymptomRequest(BaseModel):
    symptoms: list[str]

@app.post("/api/predict")
def predict_disease(request: SymptomRequest):
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
    selected = request.symptoms
    if not selected: return {"related": []}
    
    valid = [s for s in selected if s in all_symptoms]
    if not valid: return {"related": []}

    mask = pd.Series(True, index=train_df.index)
    for s in valid:
        mask &= (train_df[s] == 1)
    filtered = train_df[mask]
    
    if filtered.empty:
        filtered = train_df[train_df[valid[-1]] == 1]
    
    drop_cols = valid + ['prognosis']
    drop_cols = [c for c in drop_cols if c in filtered.columns]
    
    related = filtered.drop(columns=drop_cols).sum().sort_values(ascending=False)
    return {"related": related.head(5).index.tolist()}