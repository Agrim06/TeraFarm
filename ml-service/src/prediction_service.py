#!/usr/bin/env python3
"""
prediction_service.py

Runs water_predict.py every 10 seconds automatically.
Fetches sensor data from MongoDB and saves predictions.
"""

import subprocess
import sys
import time
from pathlib import Path
import argparse

def parse_args():
    p = argparse.ArgumentParser(description="Run water prediction service every 10 seconds")
    p.add_argument("--model", default="models/soil_moisture_pump_model.pkl", help="Path to model file")
    p.add_argument("--csv", default="data/crop_irrigation.csv", help="Path to crop irrigation CSV")
    p.add_argument("--crop", default="Potato- Drip Irrigation", help="Crop name")
    p.add_argument("--device-id", type=str, default=None, help="Filter by device ID")
    p.add_argument("--mongo-uri", default="mongodb://127.0.0.1:27017", help="MongoDB connection URI")
    p.add_argument("--irrigation-rate", type=float, default=8.0, help="Irrigation rate in mm per hour")
    p.add_argument("--interval", type=int, default=10, help="Interval in seconds between predictions (default: 10)")
    p.add_argument("--script-dir", type=str, default=None, help="Script directory (auto-detected if not provided)")
    return p.parse_args()

def run_prediction(args, script_dir):
    """Run water_predict.py with the given arguments"""
    water_predict_path = script_dir / "src" / "water_predict.py"
    model_path = (script_dir / args.model).resolve()
    csv_path = (script_dir / args.csv).resolve()
    
    # Verify files exist
    if not water_predict_path.exists():
        print(f"Error: water_predict.py not found at {water_predict_path}")
        return False
    if not model_path.exists():
        print(f"Error: Model file not found at {model_path}")
        return False
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return False
    
    cmd = [
        sys.executable,
        str(water_predict_path),
        "--model", str(model_path),
        "--csv", str(csv_path),
        "--crop", args.crop,
        "--from-db",
        "--mongo-uri", args.mongo_uri,
        "--irrigation-rate", str(args.irrigation_rate)
    ]
    
    if args.device_id:
        cmd.extend(["--device-id", args.device_id])
    
    try:
        result = subprocess.run(
            cmd,
            cwd=str(script_dir),
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Prediction successful")
            if result.stdout:
                # Print key output lines
                for line in result.stdout.split('\n'):
                    if any(keyword in line for keyword in ['PUMP:', 'Estimated', 'Prediction saved']):
                        print(f"  {line}")
            return True
        else:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Prediction failed:")
            if result.stderr:
                print(f"  Error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Prediction timed out")
        return False
    except Exception as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error running prediction: {e}")
        return False

def main():
    args = parse_args()
    
    # Determine script directory - normalize path to handle trailing slashes and quotes
    if args.script_dir:
        # Strip quotes and trailing slashes/backslashes
        script_dir_str = args.script_dir.strip('"\'')
        script_dir_str = script_dir_str.rstrip('\\/')
        script_dir = Path(script_dir_str).resolve()
    else:
        # Auto-detect: assume this script is in ml-service/src/
        script_dir = Path(__file__).parent.parent.resolve()
    
    # Verify script directory exists
    if not script_dir.exists():
        print(f"Error: Script directory does not exist: {script_dir}")
        sys.exit(1)
    
    print("=" * 60)
    print("Water Prediction Service")
    print("=" * 60)
    print(f"Model: {script_dir / args.model}")
    print(f"CSV: {script_dir / args.csv}")
    print(f"Crop: {args.crop}")
    print(f"Device ID: {args.device_id or 'Any'}")
    print(f"Interval: {args.interval} seconds")
    print(f"MongoDB URI: {args.mongo_uri}")
    print("=" * 60)
    print(f"Starting prediction service... (Press Ctrl+C to stop)")
    print()
    
    try:
        while True:
            start_time = time.time()
            run_prediction(args, script_dir)
            elapsed_time = time.time() - start_time
            
            # Calculate remaining time to maintain exact interval
            remaining_time = args.interval - elapsed_time
            if remaining_time > 0:
                print(f"Waiting {remaining_time:.1f} seconds until next prediction...\n")
                time.sleep(remaining_time)
            else:
                print(f"Warning: Prediction took {elapsed_time:.1f} seconds (longer than {args.interval}s interval)\n")
                # Still wait a small amount to avoid tight loop
                time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n\nPrediction service stopped by user.")
        sys.exit(0)

if __name__ == "__main__":
    main()

