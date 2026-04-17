import pandas as pd
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def evaluate_basic_engine():
    print("="*70)
    print("🧪 BASIC ENGINE EVALUATION: PERFORMANCE METRICS REPORT")
    print("="*70)

    # 1. Load Data and Model
    csv_path = os.path.join("..", "lib", "csv", "dataset_4920.csv")
    if not os.path.exists('model_0.pkl'):
        print("[!] Error: model_0.pkl not found. Please run the training script first.")
        return

    print("[*] Loading trained model and dataset...")
    df = pd.read_csv(csv_path)
    model = joblib.load('model_0.pkl')
    
    # 2. Prepare Test Set
    # We split with the same random_state to ensure consistency
    X = df.drop('prognosis', axis=1)
    y = df['prognosis']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 3. Perform Inference
    print(f"[*] Executing inference on {len(X_test)} test samples...")
    y_pred = model.predict(X_test)
    
    # 4. Calculate Accuracy and Metrics
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    
    print("\n" + "-"*30)
    print(f"✅ OVERALL ACCURACY: {acc * 100:.2f}%")
    print("-"*30)
    
    print("\n[+] Detailed Classification Report (Precision, Recall, F1-Score):")
    print(report)

    # 5. Generate Confusion Matrix Visualization
    print("[*] Generating Confusion Matrix visualisation...")
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=False, cmap='Blues', fmt='g')
    plt.title('Confusion Matrix: Basic Engine (Random Forest)')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    
    # Save the plot for the report
    plt.savefig('basic_engine_confusion_matrix.png', dpi=300, bbox_inches='tight')
    print("[+] Visualisation saved as: basic_engine_confusion_matrix.png")

    print("\n" + "="*70)
    print("✅ EVALUATION COMPLETE")
    print("="*70)

if __name__ == "__main__":
    evaluate_basic_engine()