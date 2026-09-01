import os
import datetime
from sqlalchemy.orm import Session
from . import models

MODEL_PATH = os.path.join(os.path.dirname(__file__), "delay_model.joblib")
REGRESSOR_PATH = os.path.join(os.path.dirname(__file__), "delay_regressor.joblib")

def train_and_save_model():
    """
    Generates a synthetic dataset of MoSPI-like projects to train and save
    a real Scikit-Learn RandomForest classifier and regressor for delay prediction.
    """
    print("Training synthetic project delay prediction model...")
    try:
        import numpy as np
        import pandas as pd
        from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
        import joblib

        np.random.seed(42)
        n_samples = 1000
        
        # Generate random features
        progress = np.random.uniform(0, 100, n_samples)
        elapsed_ratio = np.random.uniform(0.05, 1.5, n_samples)
        budget_utilized = np.random.uniform(0, 120, n_samples)
        delayed_milestones = np.random.randint(0, 8, n_samples)
        
        delay_prob = 1 / (1 + np.exp(-(
            -3.5 + 4.5 * elapsed_ratio - 0.05 * progress + 0.02 * budget_utilized + 0.5 * delayed_milestones
        )))
        is_delayed = (delay_prob > 0.5).astype(int)
        
        expected_delay = np.maximum(0, (elapsed_ratio * 150 - progress * 1.2 + delayed_milestones * 15 + np.random.normal(0, 20, n_samples)))
        expected_delay = np.round(expected_delay).astype(int)
        
        X = pd.DataFrame({
            "progress": progress,
            "elapsed_ratio": elapsed_ratio,
            "budget_utilized": budget_utilized,
            "delayed_milestones": delayed_milestones
        })
        
        clf = RandomForestClassifier(n_estimators=50, random_state=42)
        clf.fit(X, is_delayed)
        
        reg = RandomForestRegressor(n_estimators=50, random_state=42)
        reg.fit(X, expected_delay)
        
        joblib.dump(clf, MODEL_PATH)
        joblib.dump(reg, REGRESSOR_PATH)
        print("AI Models trained and saved successfully.")
    except Exception as e:
        print(f"Error training models: {e}")

# Auto-train models if not exist when module is imported
if not os.path.exists(MODEL_PATH) or not os.path.exists(REGRESSOR_PATH):
    try:
        train_and_save_model()
    except Exception as e:
        print(f"Error training models: {e}")

def get_project_features(project: models.Project, db: Session):
    """
    Computes numerical features for the ML model based on current database state
    """
    # 1. Progress
    progress = project.progress
    
    # 2. Elapsed ratio
    start = project.start_date
    planned_end = project.expected_end_date
    now = datetime.datetime.utcnow()
    
    total_planned_days = (planned_end - start).days
    if total_planned_days <= 0:
        total_planned_days = 365 # fallback
        
    elapsed_days = (now - start).days
    elapsed_ratio = max(0.0, elapsed_days / total_planned_days)
    
    # 3. Budget utilization %
    budget_utilized = 0.0
    if project.budget > 0:
        budget_utilized = (project.amount_spent / project.budget) * 100
        
    # 4. Count delayed milestones
    delayed_milestones = db.query(models.Milestone).filter(
        models.Milestone.project_id == project.id,
        models.Milestone.status != "Completed",
        models.Milestone.planned_date < now
    ).count()
    
    return {
        "progress": progress,
        "elapsed_ratio": elapsed_ratio,
        "budget_utilized": budget_utilized,
        "delayed_milestones": delayed_milestones,
        "total_planned_days": total_planned_days,
        "elapsed_days": elapsed_days
    }

def predict_delay(project: models.Project, db: Session):
    """
    Uses the trained ML model to predict risk score, expected delay,
    and formats contributing factors and recommended actions.
    """
    features = get_project_features(project, db)
    
    try:
        import joblib
        import pandas as pd
        # Load models
        clf = joblib.load(MODEL_PATH)
        reg = joblib.load(REGRESSOR_PATH)
        
        # Prepare inputs
        X = pd.DataFrame([{
            "progress": features["progress"],
            "elapsed_ratio": features["elapsed_ratio"],
            "budget_utilized": features["budget_utilized"],
            "delayed_milestones": features["delayed_milestones"]
        }])
        
        # Make predictions
        risk_score_prob = clf.predict_proba(X)[0][1]
        predicted_delay_days = reg.predict(X)[0]
        
    except Exception as e:
        # Robust Fallback to rule-based logic if ML model fails to load
        print(f"Prediction model fallback active due to error: {e}")
        # Rule-based risk score
        score = 0.1
        if features["elapsed_ratio"] > 0.8 and features["progress"] < 50:
            score += 0.5
        score += features["delayed_milestones"] * 0.1
        score += max(0.0, (features["budget_utilized"] - features["progress"]) * 0.003)
        risk_score_prob = min(0.99, max(0.05, score))
        predicted_delay_days = max(0, int(risk_score_prob * 100 + features["delayed_milestones"] * 10))

    risk_score_pct = int(round(risk_score_prob * 100))
    
    # Determine risk level
    if risk_score_pct < 30:
        risk_level = "Low"
    elif risk_score_pct < 60:
        risk_level = "Medium"
    elif risk_score_pct < 85:
        risk_level = "High"
    else:
        risk_level = "Critical"
        
    # Analyze contributing factors
    factors = []
    if features["delayed_milestones"] > 0:
        factors.append(f"{features['delayed_milestones']} milestones are currently overdue")
    if features["elapsed_ratio"] > 0.7 and features["progress"] < features["elapsed_ratio"] * 80:
        factors.append(f"Physical progress ({features['progress']:.1f}%) is significantly below elapsed time ({features['elapsed_ratio']*100:.1f}%)")
    if features["budget_utilized"] > features["progress"] + 15:
        factors.append(f"Financial expenditure ({features['budget_utilized']:.1f}%) is disproportional to physical progress ({features['progress']:.1f}%)")
    if features["elapsed_ratio"] > 1.0:
        factors.append("Project has exceeded its planned completion timeline")
        
    if not factors:
        factors.append("Minor schedule variance")
        
    # Recommended Action
    actions = []
    if features["delayed_milestones"] > 0:
        actions.append("Conduct an immediate status review of the overdue milestones with the contractor.")
    if features["budget_utilized"] > features["progress"] + 15:
        actions.append("Audit recent project bills to investigate the physical-financial progress disparity.")
    if features["progress"] < 40 and features["elapsed_ratio"] > 0.5:
        actions.append("Expedite procurement cycles and deploy additional labor to recover lost timeline.")
    
    if not actions:
        actions.append("Continue routine monitoring and verify upcoming milestone timelines.")
        
    return {
        "project_id": project.id,
        "project_name": project.name,
        "risk_score": risk_score_pct,
        "risk_level": risk_level,
        "expected_delay": int(predicted_delay_days),
        "contributing_factors": factors,
        "recommended_actions": actions,
        "features": features
    }
