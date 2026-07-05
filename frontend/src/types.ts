export interface AnalysisResult {
  status: string;
  filename: string;
  summary: {
    total_time_sec: number;
    moving_time_sec: number;
    static_time_sec: number;
    tut_percentage: number;
    avg_wall_distance_cm: number;
    off_balance_percentage: number;
    symmetry_left: number;
    symmetry_right: number;
    max_reach_m: number;
    dyno_count: number;
    total_distance_m: number;
    frame_data: FrameData[];
  };
  chart_data: Array<{
    timestamp: number;
    com_velocity_smooth: number;
    movement_phase: string;
  }>;
}

export interface FrameData {
  time: number;
  com: { x: number; y: number };
  limbs: Array<{ x: number; y: number }>;
  off_balance: boolean;
  skeleton?: Record<string, { x: number; y: number }>;
}