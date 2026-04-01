import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# 1. Load Data (Adjust path if Training.csv is in a different folder)
csv_path = os.path.join("..", "lib", "csv", "Training.csv")
df = pd.read_csv(csv_path)

# 2. Split Features (X) and Target (y)
X = df.drop('prognosis', axis=1)
y = df['prognosis']

# 3. Train the Model 
# Using Random Forest as it provides reliable probability scores
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# 4. Save Artifacts
joblib.dump(model, 'model.pkl')
joblib.dump(X.columns.tolist(), 'features.pkl')

print("✅ Training Complete: model.pkl and features.pkl are ready.")