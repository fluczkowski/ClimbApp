import cv2
import mediapipe as mp
import numpy as np

class VideoProcessor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence = 0.5,
            min_tracking_confidence = 0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils

    @staticmethod
    def calculate_angle(a, b, c):
        a, b, c = np.array(a), np.array(b), np.array(c)
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)

        if angle > 180.0:
            angle = 360 - angle
        return angle
    
    def process_video(self, video_source = 0, show_video = False):
        cap = cv2.VideoCapture(video_source)

        video_data = []
        frame_index = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image_rgb.flags.writeable = False
            results = self.pose.process(image_rgb)
            image_rgb.flags.writeable = True

            # TODO: DATA EXTRACTION

            if show_video:
                image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
                if results.pose_landmarks:
                    self.mp_drawing.draw_landmarks(
                        image_bgr, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS
                    )
                cv2.imshow('Bouldering Analyzer - Debug', image_bgr)

                if cv2.waitKey(10) & 0xFF == ord('q'):
                    break

            frame_index += 1

        cap.release()
        if show_video:
            cv2.destroyAllWindows()
        
        return video_data