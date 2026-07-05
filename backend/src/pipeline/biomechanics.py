import numpy as np
from scipy.spatial import Delaunay

class BiomechanicsEngine:
    def __init__(self, df):
        self.df = df
        self.ar = self.df["aspect_ratio"].iloc[0] if "aspect_ratio" in self.df.columns else 1.0

    def calculate_center_of_mass(self):
        print("Obliczanie środka ciężkości (CoM)...")
        self.df["com_x"] = (self.df["left_hip_x"] + self.df["right_hip_x"]) / 2.0
        self.df["com_y"] = (self.df["left_hip_y"] + self.df["right_hip_y"]) / 2.0

        return self.df
    
    def calculate_velocity(self):
        print("Obliczanie prędkości ruchu i wygładzenie szumów...")

        if "com_x" not in self.df.columns:
            self.calculate_center_of_mass()

        dx = self.df["com_x"].diff().fillna(0) * self.ar
        dy = self.df["com_y"].diff().fillna(0)
        dt = self.df["timestamp"].diff().fillna(1/30)

        self.df["com_velocity"] = np.sqrt(dx ** 2 + dy ** 2) / dt
        self.df["com_velocity_smooth"] = self.df["com_velocity"].rolling(window = 5, min_periods = 1).mean()

        return self.df
    
    def analyze_movement_phases(self, threshold = 0.15):
        if "com_velocity_smooth" not in self.df.columns:
            self.calculate_velocity()
        
        self.df["is_moving"] = self.df["com_velocity_smooth"] > threshold
        self.df["movement_phase"] = np.where(self.df["is_moving"], "Ruch", "Spoczynek")

        return self.df
    
    def analyze_z_depth(self):
        print("Obliczanie odległości bioder od ściany (Oś Z)...")

        expected_limbs = ["left_wrist", "right_wrist", "left_ankle", "right_ankle"]
        distances = []

        for index, row in self.df.iterrows():
            points = []
            for limb in expected_limbs:
                if f"{limb}_x" in row and not np.isnan(row[f"{limb}_x"]):
                    points.append([row[f"{limb}_x"], row[f"{limb}_y"], row[f"{limb}_z"]])
                    
            points = np.array(points)
            com_x = (row.get("left_hip_x", 0) + row.get("right_hip_x", 0)) / 2.0
            com_y = (row.get("left_hip_y", 0) + row.get("right_hip_y", 0)) / 2.0
            com_z = (row.get("left_hip_z", 0) + row.get("right_hip_z", 0)) / 2.0
            com = np.array([com_x, com_y, com_z])

            if len(points) >= 3:
                centroid = np.mean(points, axis = 0)
                centered_points = points - centroid
                _, _, vh = np.linalg.svd(centered_points)
                normal_vector = vh[2, :]
                D = -np.dot(normal_vector, centroid)
                distance = np.abs(np.dot(normal_vector, com) + D)
            else:
                if len(points) > 0:
                    wall_z = np.mean(points[:, 2])
                    distance = np.abs(com_z - wall_z)
                else:
                    distance = 0.0
            distances.append(distance)
        
        self.df["hip_to_wall_dist"] = distances
        self.df["hip_to_wall_smooth"] = self.df["hip_to_wall_dist"].rolling(window = 10, min_periods = 1).mean()

        return self.df
    
    def analyze_balance(self):
        print("Obliczanie wielokąta podparcia i balansu...")

        if "com_x" not in self.df.columns:
            self.calculate_center_of_mass()

        is_off_balance = []
        expected_limbs = ['left_wrist', 'right_wrist', 'left_ankle', 'right_ankle']

        for index, row in self.df.iterrows():
            points = []

            for limb in expected_limbs:
                if f"{limb}_x" in row and not np.isnan(row[f"{limb}_x"]):
                    points.append([row[f"{limb}_x"], row[f"{limb}_y"]])

            com_x = row.get("com_x", np.nan)
            com_y = row.get("com_y", np.nan)

            if len(points) >= 3 and not np.isnan(com_x):
                points = np.array(points)
                com = np.array([com_x, com_y])
                try:
                    hull = Delaunay(points)
                    is_inside = hull.find_simplex(com) >= 0
                    is_off_balance.append(not is_inside)
                except Exception:
                    is_off_balance.append(True)
            else:
                is_off_balance.append(True)

        self.df["is_off_balance"] = is_off_balance

        return self.df
    
    def analyze_symmetry(self):
        print("Obliczanie asymetrii pracy rąk...")

        expected = ["left_wrist_x", "left_wrist_y", "right_wrist_x", "right_wrist_y"]
        if not all(col in self.df.columns for col in expected):
            self.df["left_hand_dist"] = 0
            self.df["right_hand_dist"] = 0
            return self.df
        
        dx_left = self.df["left_wrist_x"].diff().fillna(0) * self.ar
        dy_left = self.df["left_wrist_y"].diff().fillna(0)
        self.df["left_hand_dist"] = np.sqrt(dx_left ** 2 + dy_left ** 2)

        dx_right = self.df["right_wrist_x"].diff().fillna(0) * self.ar
        dy_right = self.df["right_wrist_y"].diff().fillna(0)
        self.df["right_hand_dist"] = np.sqrt(dx_right ** 2 + dy_right ** 2)

        return self.df
    
    def analyze_reach_and_dynos(self):
        print("Obliczanie zasięgu i skoków (Dyno)...")

        if "left_wrist_x" in self.df.columns and "right_wrist_x" in self.df.columns:
            dx = (self.df["left_wrist_x"] - self.df["right_wrist_x"]) * self.ar
            dy = self.df["left_wrist_y"] - self.df["right_wrist_y"]
            self.df["hands_distance"] = np.sqrt(dx ** 2 + dy ** 2)
        else:
            self.df["hands_distance"] = 0

        if "com_velocity_smooth" not in self.df.columns:
            self.calculate_velocity()

        dyno_threshold = 0.5
        self.df["is_dyno"] = self.df["com_velocity_smooth"] > dyno_threshold

        return self.df
    
    def calibrate_to_meters(self, climber_height_m = 1.70):
        print(f"Kalibracja wymiarów wideo dla wzrostu: {climber_height_m} m...")

        if "nose_y" in self.df.columns and "left_ankle_y" in self.df.columns:
            stretch_left = (self.df["left_ankle_y"] - self.df["nose_y"]).abs()
            stretch_right = (self.df["right_ankle_y"] - self.df["nose_y"]).abs()
            max_pixel_height = max(stretch_left.max(), stretch_right.max())

            if max_pixel_height > 0:
                self.scale_factor = climber_height_m / max_pixel_height
            else:
                self.scale_factor = 1.0
        else:
            self.scale_factor = 1.0
        
        return self.scale_factor