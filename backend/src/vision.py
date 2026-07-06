import cv2
import mediapipe as mp
import numpy as np
import json
import os

class VideoProcessor:
    """
    Computer Vision module for extracting human pose landmarks from video.
    
    Wraps Google's MediaPipe Pose estimation to process MP4 files, extract 
    3D skeletal keypoints, and export the tracking data to JSON format.
    """
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode = False,
            model_complexity = 2,
            enable_segmentation = False,
            min_detection_confidence = 0.5,
            min_tracking_confidence = 0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils

    @staticmethod
    def calculate_angle(a, b, c):
        """
        Calculates the angle between three skeletal coordinates.
        
        Args:
            a, b, c (list/tuple): [x, y] coordinates of three points where 'b' is the vertex.
            
        Returns:
            float: The calculated angle in degrees.
        """
        a, b, c = np.array(a[:2]), np.array(b[:2]), np.array(c[:2])
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)

        if angle > 180.0:
            angle = 360 - angle
        return angle
    
    def _extract_landmark(self, landmarks, landmark_enum):
        """
        Helper method to securely extract x, y, z, and visibility from a MediaPipe landmark.
        """
        point = landmarks[landmark_enum.value]
        return {
            "x": point.x,
            "y": point.y,
            "z": point.z,
            "visibility": point.visibility
        }

    def process_video(self, video_source = 0, show_video = False, output_json = "climb_data.json"):
        """
        Processes a video file frame-by-frame and writes pose landmarks to a JSON file.
        
        Args:
            video_source (str/int): Path to the video file or 0 for webcam input.
            show_video (bool): If True, renders OpenCV playback with skeleton overlay.
            output_json (str): Target path for saving the extracted landmark data.
            
        Returns:
            list: A list of dictionaries containing frame-by-frame landmark positions.
        """
        cap = cv2.VideoCapture(video_source)
        video_data = []
        frame_index = 0
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0: fps = 30

        v_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        v_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)

        aspect_ratio = v_width / v_height if v_height > 0 else 1.0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image_rgb.flags.writeable = False
            results = self.pose.process(image_rgb)
            image_rgb.flags.writeable = True

            if results.pose_landmarks:
                lms = results.pose_landmarks.landmark
                frame_data = {
                    "frame": frame_index,
                    "timestamp_sec": frame_index / fps,
                    "aspect_ratio": aspect_ratio,
                    "points": {
                        "left_shoulder": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_SHOULDER),
                        "left_elbow": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_ELBOW),
                        "left_wrist": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_WRIST),
                        "right_shoulder": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_SHOULDER),
                        "right_elbow": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_ELBOW),
                        "right_wrist": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_WRIST),
                        "left_hip": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_HIP),
                        "right_hip": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_HIP),
                        "left_foot": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_FOOT_INDEX),
                        "right_foot": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_FOOT_INDEX),
                        "left_ankle": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_ANKLE),
                        "right_ankle": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_ANKLE),
                        "left_heel": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_HEEL),
                        "right_heel": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_HEEL),
                        "left_knee": self._extract_landmark(lms, self.mp_pose.PoseLandmark.LEFT_KNEE),
                        "right_knee": self._extract_landmark(lms, self.mp_pose.PoseLandmark.RIGHT_KNEE)
                    }
                }
                video_data.append(frame_data)

            if show_video:
                image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
                if results.pose_landmarks:
                    self.mp_drawing.draw_landmarks(
                        image_bgr, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS
                    )
                cv2.imshow('Bouldering Analyzer', image_bgr)

                if cv2.waitKey(10) & 0xFF == ord('q'):
                    break

            frame_index += 1

        cap.release()
        if show_video:
            cv2.destroyAllWindows()
        
        with open(output_json, "w", encoding = "utf-8") as f:
            json.dump(video_data, f, indent = 4)

        return video_data