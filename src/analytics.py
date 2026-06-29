import pandas as pd
import numpy as np
import json
import matplotlib.pyplot as plt

class DataAnalyzer:
    def __init__(self, json_path):
        self.json_path = json_path
        self.df = self._load_and_flatten_data()
        
    def _load_and_flatten_data(self):
        print(f"Wczytywanie danych z: {self.json_path}")
        with open(self.json_path, "r", encoding = "utf-8") as f:
            raw_data = json.load(f)

        flat_data = []

        for frame in raw_data:
            row = {
                "frame": frame["frame"],
                "timestamp": frame["timestamp_sec"]
            }

            for body_part, coords in frame["points"].items():
                row[f"{body_part}_x"] = coords["x"]
                row[f"{body_part}_y"] = coords["y"]
                row[f"{body_part}_z"] = coords["z"]
                row[f"{body_part}_vis"] = coords["visibility"]
            
            flat_data.append(row)

        return pd.DataFrame(flat_data)
    
    def calculate_center_of_mass(self):
        print("Obliczanie środka ciężkości (CoM)...")
        self.df["com_x"] = (self.df["left_hip_x"] + self.df["right_hip_x"]) / 2.0
        self.df["com_y"] = (self.df["left_hip_y"] + self.df["right_hip_y"]) / 2.0

        return self.df
    
    def calculate_velocity(self):
        print("Obliczanie prędkości ruchu i wygładzenie szumów...")

        if "com_x" not in self.df.columns:
            self.calculate_center_of_mass()

        dx = self.df["com_x"].diff()
        dy = self.df["com_y"].diff()
        dt = self.df["timestamp"].diff()

        dx = dx.fillna(0)
        dy = dy.fillna(0)
        dt = dt.fillna(1/30)

        self.df["com_velocity"] = np.sqrt(dx ** 2 + dy ** 2) / dt
        self.df["com_velocity_smooth"] = self.df["com_velocity"].rolling(window = 5, min_periods = 1).mean()

        return self.df
    
    def analyze_movement_phases(self, threshold = 0.15):
        if "com_velocity_smooth" not in self.df.columns:
            self.calculate_velocity()
        
        self.df["is_moving"] = self.df["com_velocity_smooth"] > threshold
        self.df["movement_phase"] = np.where(self.df["is_moving"], "Ruch", "Spoczynek")

        return self.df
    
    def get_movement_summary(self):
        if "is_moving" not in self.df.columns:
            return {"error": "Najpierw uruchom analyze_movement_phases()"}
        
        total_frames = len(self.df)
        moving_frames = self.df["is_moving"].sum()
        static_frames = total_frames - moving_frames
        # TUT - Time Under Tension
        tut_percentage = (moving_frames / total_frames) * 100 if total_frames > 0 else 0
        max_time = self.df["timestamp"].max()
        moving_time = (moving_frames / total_frames) * max_time
        static_time = (static_frames / total_frames) * max_time

        return {
            "total_time_sec": round(max_time, 2),
            "moving_time_sec": round(moving_time, 2),
            "static_time_sec": round(static_time, 2),
            "tut_percentage": round(tut_percentage, 1)
        }
    
    def get_summary(self):
        return {
            "total_frames": len(self.df),
            "duration_sec": round(self.df["timestamp"].max(), 2),
            "columns": len(self.df.columns)
        }
    
    def plot_velocity_chart(self):
        if "movement_phase" not in self.df.columns:
            self.analyze_movement_phases()
        
        print("Generowanie wykresu...")

        plt.figure(figsize = (12, 6))
        plt.plot(self.df["timestamp"], self.df["com_velocity_smooth"], label = "Prędkość (Średnia krocząca)", color = "#1f77b4", linewidth = 2.5)
        plt.axhline(y = 0.15, color = "red", linestyle = "--", label = "Próg ruchu (0.15)")
        plt.fill_between(self.df["timestamp"], 0, self.df["com_velocity_smooth"], where = self.df["com_velocity_smooth"] > 0.15, color = "green", alpha = 0.3, label = "Faza ruchu")
        plt.fill_between(self.df["timestamp"], 0, self.df["com_velocity_smooth"], where = self.df["com_velocity_smooth"] <= 0.15, color = "gray", alpha = 0.3, label = "Faza Spoczynku")
        plt.title("Analiza Płynności Przejścia", fontsize = 16, pad = 15)
        plt.xlabel("Czas nagrania (sekundy)", fontsize = 12)
        plt.ylabel("Znormalizowana Prędkość Ruchu", fontsize = 12)
        plt.legend(loc = "upper right")
        plt.grid(True, linestyle = ":", alpha = 0.7)
        plt.tight_layout()
        plt.savefig("wykres_plynnosci.png", dpi = 300)
        print("Wykres zapisano w folderze głównym jako 'wykres_plynnosci.png'.")
        plt.show()