import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os
import time

# 1. Setup and Initialization
print("="*60)
print("🚀 SYSTEMIC DIAGNOSIS ENGINE: BASIC TIER TRAINING")
print("="*60)
start_time = time.time()

# 2. Load Data
csv_path = os.path.join("..", "lib", "csv", "dataset_4920.csv")
print(f"[*] Loading dataset from: {csv_path}...")
df = pd.read_csv(csv_path)

# 3. Data Inspection
num_samples, num_features = df.shape
num_classes = df['prognosis'].nunique()
print(f"[+] Dataset loaded successfully.")
print(f"    - Total Samples: {num_samples}")
print(f"    - Input Features: {num_features - 1} (Symptoms)")
print(f"    - Target Classes: {num_classes} (Diseases)")

# 4. Split Features (X) and Target (y)
X = df.drop('prognosis', axis=1)
y = df['prognosis']

# 5. Model Configuration & Training
print("\n[*] Configuring Random Forest Ensemble...")
# Using 100 estimators as per methodology
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)

print(f"[*] Commencing training on {num_samples} instances...")
model.fit(X, y)

# 6. Self-Evaluation (Quick Sanity Check)
# Since this is the Basic tier, we verify the training fit
y_pred = model.predict(X)
train_acc = accuracy_score(y, y_pred)
print(f"[+] Training Phase Complete.")
print(f"    - Training Accuracy: {train_acc * 100:.2f}%")

# 7. Save Artifacts
print("\n[*] Serializing model artifacts for FastAPI integration...")
joblib.dump(model, 'model_0.pkl')
joblib.dump(X.columns.tolist(), 'features_0.pkl')
print(f"    - Exported: model_0.pkl")
print(f"    - Exported: features_0.pkl")

# 8. Completion Summary
end_time = time.time()
print("\n" + "="*60)
print(f"✅ BASIC ENGINE READY | Total Time: {end_time - start_time:.2f}s")
print("="*60)