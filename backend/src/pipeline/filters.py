import numpy as np
import pandas as pd

class TrajectoryFilter:
    """
    Signal processing module for smoothing climbing trajectory data.
    
    Applies noise reduction, outlier removal, and linear interpolation 
    to correct tracking errors from MediaPipe pose estimation.
    
    Attributes:
        df (pd.DataFrame): Raw DataFrame containing tracking points.
    """
    def __init__(self, df):
        self.df = df

    def smooth(self):
        """
        Executes the smoothing pipeline: removes outliers, interpolates missing 
        frames, and applies a rolling mean to reduce coordinate jitter.
        
        Returns:
            pd.DataFrame: The smoothed and interpolated DataFrame.
        """
        cols_to_smooth = [col for col in self.df.columns if col.endswith("_x") or col.endswith("_y")]
        
        for col in cols_to_smooth:
            self.df.loc[self.df[col].abs() < 0.001, col] = np.nan
            self.df.loc[self.df[col].abs() > 5.0, col] = np.nan
        
        if "left_shoulder_y" in self.df.columns and "right_shoulder_y" in self.df.columns:
            shoulder_y = (self.df["left_shoulder_y"] + self.df["right_shoulder_y"]) / 2.0
            for side in ["left", "right"]:
                for joint in ["ankle", "foot", "heel", "knee"]:
                    y_col = f"{side}_{joint}_y"
                    x_col = f"{side}_{joint}_x"
                    if y_col in self.df.columns:
                        ghost_mask = self.df[y_col] < shoulder_y
                        self.df.loc[ghost_mask, x_col] = np.nan
                        self.df.loc[ghost_mask, y_col] = np.nan

        for col in cols_to_smooth:
            self.df[col] = self.df[col].interpolate(method = "linear", limit = 3, limit_direction = "both")
            self.df[col] = self.df[col].rolling(window = 5, min_periods = 1, center = True).mean()
        
        return self.df
        pass
    