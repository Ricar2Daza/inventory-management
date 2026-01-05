from datetime import datetime, timezone
import sys

print(f"Python version: {sys.version}")
try:
    print(f"timezone.utc: {timezone.utc}")
    print(f"datetime.now(timezone.utc): {datetime.now(timezone.utc)}")
except Exception as e:
    print(f"Error: {e}")
