import json
import pandas as pd

class DataLoader:
    def __init__(self, json_path):
        self.json_path = json_path
        
    def load_and_flatten(self):
        print(f"Wczytywanie danych z: {self.json_path}")
        with open(self.json_path, "r", encoding = "utf-8") as f:
            raw_data = json.load(f)

        flat_data = []

        for frame in raw_data:
            row = {
                "frame": frame["frame"],
                "timestamp": frame["timestamp_sec"],
                "aspect_ratio": frame.get("aspect_ratio", 1.0)
            }

            for body_part, coords in frame["points"].items():
                row[f"{body_part}_x"] = coords["x"]
                row[f"{body_part}_y"] = coords["y"]
                row[f"{body_part}_z"] = coords["z"]
                row[f"{body_part}_vis"] = coords["visibility"]
            
            flat_data.append(row)

        return pd.DataFrame(flat_data)
        pass
    