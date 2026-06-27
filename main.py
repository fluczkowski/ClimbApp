import cv2
import mediapipe as mp
import numpy as np

# Angle calculation
def calculate_angle(a, b, c):
    a = np.array(a) # Shoulder
    b = np.array(b) # Elbow
    c = np.array(c) # Hand

    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians*180.0/np.pi)

    if angle > 180.0:
        angle = 360 - angle
    
    return angle

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

with mp_pose.Pose(min_detection_confidence = 0.5, min_tracking_confidence = 0.5) as pose:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        image_height, image_width, _ = frame.shape
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image_rgb.flags.writeable = False
        results = pose.process(image_rgb)
        image_rgb.flags.writeable = True
        image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

        try:
            landmarks = results.pose_landmarks.landmark

            left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            left_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            left_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            
            right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            right_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
            
            angle_left = calculate_angle(left_shoulder, left_elbow, left_wrist)
            angle_right = calculate_angle(right_shoulder, right_elbow, right_wrist)

            left_elbow_pos = tuple(np.multiply(left_elbow, [image_width, image_height]).astype(int))
            right_elbow_pos = tuple(np.multiply(right_elbow, [image_width, image_height]).astype(int))

            color_left = (0, 255, 0) if angle_left > 160 else (0, 0, 255)
            color_right = (0, 255, 0) if angle_right > 160 else (0, 0, 255)

            cv2.putText(image_bgr, str(int(angle_left)) + "°",
                            left_elbow_pos,
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, color_left, 3, cv2.LINE_AA)
            
            cv2.putText(image_bgr, str(int(angle_right)) + "°",
                            right_elbow_pos,
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, color_right, 3, cv2.LINE_AA)
        except:
            pass

        if results.pose_landmarks:
            mp_drawing.draw_landmarks(image_bgr, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

        cv2.imshow("Analizator Boulderingowy", image_bgr)

        if cv2.waitKey(10) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()