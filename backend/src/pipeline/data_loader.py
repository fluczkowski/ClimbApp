import json
import pandas as pd

class DataLoader:
    """
    Data ingestion module for parsing MediaPipe JSON outputs.
    
    Attributes:
        json_path (str): The file path to the raw JSON file containing pose landmarks.
    """
    def __init__(self, json_path):
        self.json_path = json_path
        
    def load_and_flatten(self):
        """
        Loads the nested JSON file and flattens it into a 2D tabular structure.
        
        Returns:
            pd.DataFrame: Flattened DataFrame where each row is a frame and columns 
                          represent specific landmark coordinates (e.g., 'left_wrist_x').
        """
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