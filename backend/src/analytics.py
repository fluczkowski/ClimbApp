import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from src.pipeline.data_loader import DataLoader
from src.pipeline.filters import TrajectoryFilter
from src.pipeline.biomechanics import BiomechanicsEngine

class DataAnalyzer:
    """
    High-level analytics orchestrator for climbing data.
    
    This class ties together the data loading, filtering, and biomechanics 
    pipeline to compute the final climbing performance metrics.
    
    Attributes:
        json_path (str): Path to the source JSON tracking data.
        df (pd.DataFrame): The fully processed and analyzed DataFrame.
        bio (BiomechanicsEngine): Instance of the physics engine.
    """
    def __init__(self, json_path):
        self.json_path = json_path 
        loader = DataLoader(self.json_path)
        raw_df = loader.load_and_flatten()
        filt = TrajectoryFilter(raw_df)
        clean_df = filt.smooth()
        clean_df["is_smoothed"] = True

        self.bio = BiomechanicsEngine(clean_df)
        self.bio.calculate_center_of_mass()
        self.bio.calculate_velocity()
        self.bio.analyze_movement_phases()
        self.bio.analyze_z_depth()
        self.bio.analyze_balance()
        self.bio.analyze_symmetry()
        self.bio.analyze_reach_and_dynos()
        self.df = self.bio.df   
    
    def get_movement_summary(self, climber_height_m = 1.70):
        """
        Aggregates frame-by-frame data into a unified performance summary payload.
        
        Args:
            climber_height_m (float): The climber's real-world height for scale calibration.
            
        Returns:
            dict: A comprehensive dictionary containing aggregated metrics 
                  (e.g., TUT, Dyno count) and localized frame data for frontend rendering.
        """
        total_frames = len(self.df)
        moving_frames = self.df["is_moving"].sum()
        static_frames = total_frames - moving_frames
        # TUT - Time Under Tension
        tut_percentage = (moving_frames / total_frames) * 100 if total_frames > 0 else 0
        max_time = self.df["timestamp"].max()
        moving_time = (moving_frames / total_frames) * max_time
        static_time = (static_frames / total_frames) * max_time
        avg_hip_dist = self.df["hip_to_wall_smooth"].mean()
        off_balance_frames = self.df["is_off_balance"].sum()
        off_balance_percentage = (off_balance_frames / total_frames) * 100 if total_frames > 0 else 0
        total_left = self.df["left_hand_dist"].sum()
        total_right = self.df["right_hand_dist"].sum()
        total_hands = total_right + total_left
        left_percent = (total_left / total_hands) * 100 if total_hands > 0 else 50
        right_percent = (total_right / total_hands) * 100 if total_hands > 0 else 50
        max_reach = self.df["hands_distance"].max()
        dyno_count = (self.df["is_dyno"] & ~self.df["is_dyno"].shift(1).fillna(False)).sum()
        scale = self.bio.calibrate_to_meters(climber_height_m = climber_height_m)
        raw_wall_dist = self.df["hip_to_wall_smooth"].mean()
        real_wall_dist_cm = (raw_wall_dist * scale) * 100
        real_max_reach_m = max_reach * scale

        dx = self.df["com_x"].diff().fillna(0) * self.bio.ar
        dy = self.df["com_y"].diff().fillna(0)

        step_distance = np.sqrt(dx ** 2 + dy ** 2)
        valid_steps = step_distance[step_distance > 0.001]
        total_raw_distance = valid_steps.sum()
        real_distance_m = total_raw_distance * scale

        frame_data = []
        for _, row in self.df.iterrows():
            limbs = []
            
            for wrist in ["left_wrist", "right_wrist"]:
                if f"{wrist}_x" in row and not pd.isna(row[f"{wrist}_x"]):
                    v_x, v_y = row[f"{wrist}_x"], row[f"{wrist}_y"]
                    if abs(v_x) > 0.001 and abs(v_y) > 0.001:
                        limbs.append({"x": v_x, "y": v_y})

            for side in ["left", "right"]:
                for joint in ["ankle", "heel", "foot", "knee"]:
                    col_x = f"{side}_{joint}_x"
                    col_y = f"{side}_{joint}_y"
                    if col_x in row and not pd.isna(row[col_x]):
                        v_x, v_y = row[col_x], row[col_y]
                        if (abs(v_x) > 0.001 and abs(v_y) > 0.001) and abs(v_x) < 5.0 and abs(v_y) < 5.0:
                            limbs.append({"x": v_x, "y": v_y})
                            break
            skeleton_points = {}
            body_parts = [
                "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
                "left_wrist", "right_wrist", "left_hip", "right_hip",
                "left_knee", "right_knee", "left_ankle", "right_ankle"
            ]
            for part in body_parts:
                col_x, col_y = f"{part}_x", f"{part}_y"
                if col_x in row and not pd.isna(row[col_x]):
                    v_x, v_y = row[col_x], row[col_y]
                    if abs(v_x) > 0.001 and abs(v_y) > 0.001:
                        skeleton_points[part] = {"x": v_x, "y": v_y}

            frame_data.append({
                "time": row.get("timestamp", 0),
                "com": {"x": row.get("com_x", 0), "y": row.get("com_y", 0)},
                "limbs": limbs,
                "skeleton": skeleton_points,
                "off_balance": bool(row.get("is_off_balance", False))
            })

        return {
            "total_time_sec": round(max_time, 2),
            "moving_time_sec": round(moving_time, 2),
            "static_time_sec": round(static_time, 2),
            "tut_percentage": round(tut_percentage, 1),
            "avg_wall_distance_cm": round(real_wall_dist_cm, 1),
            "off_balance_percentage": round(off_balance_percentage, 1),
            "symmetry_left": round(left_percent, 1),
            "symmetry_right": round(right_percent, 1),
            "max_reach_index": round(max_reach, 2),
            "dyno_count": int(dyno_count),
            "max_reach_m": round(real_max_reach_m, 2),
            "total_distance_m": round(real_distance_m, 2),
            "frame_data": frame_data
        }
    
    def get_summary(self):
        """
        Provides a brief metadata overview of the processed dataset.
        
        Returns:
            dict: Basic metadata including frame count, duration, and column count.
        """
        return {
            "total_frames": len(self.df),
            "duration_sec": round(self.df["timestamp"].max(), 2),
            "columns": len(self.df.columns)
        }
    
    def plot_velocity_chart(self):
        """
        Generates and saves a matplotlib plot showing the climber's movement 
        velocity and active/resting phases over time.
        """
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
        plt.show()

    
    
    