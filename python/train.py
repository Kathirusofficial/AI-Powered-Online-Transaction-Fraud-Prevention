import sys
from pathlib import Path

# Add python & ml directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from train_model import train_and_evaluate

if __name__ == "__main__":
    train_and_evaluate()
