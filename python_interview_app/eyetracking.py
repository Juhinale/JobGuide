import cv2
import mediapipe as mp
import numpy as np

# ----------------- MediaPipe Setup -----------------
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Eye landmarks
LEFT_EYE = [33, 133]
RIGHT_EYE = [362, 263]
LEFT_IRIS = [468, 469, 470, 471]
RIGHT_IRIS = [473, 474, 475, 476]

LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145

# ----------------- Calibration -----------------
calibration_points = [
    "TOP LEFT",
    "TOP RIGHT",
    "BOTTOM LEFT",
    "BOTTOM RIGHT"
]

calibration_data = []

cap = cv2.VideoCapture(0)

def get_gaze_ratios(landmarks):
    left_eye_l, left_eye_r = landmarks[33], landmarks[133]
    right_eye_l, right_eye_r = landmarks[362], landmarks[263]

    left_iris = landmarks[LEFT_IRIS].mean(axis=0)
    right_iris = landmarks[RIGHT_IRIS].mean(axis=0)

    gaze_x = (
        (left_iris[0] - left_eye_l[0]) / (left_eye_r[0] - left_eye_l[0]) +
        (right_iris[0] - right_eye_l[0]) / (right_eye_r[0] - right_eye_l[0])
    ) / 2

    gaze_y = (
        (left_iris[1] - landmarks[LEFT_EYE_TOP][1]) /
        (landmarks[LEFT_EYE_BOTTOM][1] - landmarks[LEFT_EYE_TOP][1])
    )

    return gaze_x, gaze_y

# ----------------- CALIBRATION PHASE -----------------
point_index = 0

while cap.isOpened() and point_index < 4:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    cv2.putText(
        frame,
        f"LOOK AT: {calibration_points[point_index]}  |  Press ENTER",
        (30, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 0, 255),
        2
    )

    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0]
        landmarks = np.array([
            (int(lm.x * w), int(lm.y * h))
            for lm in face_landmarks.landmark
        ])

        gaze_x, gaze_y = get_gaze_ratios(landmarks)

    key = cv2.waitKey(1) & 0xFF
    if key == 13 and results.multi_face_landmarks:  # ENTER
        calibration_data.append((gaze_x, gaze_y))
        point_index += 1

    cv2.imshow("Calibration", frame)

cv2.destroyWindow("Calibration")

# ----------------- Compute Gaze Bounds -----------------
calibration_data = np.array(calibration_data)

min_x = calibration_data[:, 0].min()
max_x = calibration_data[:, 0].max()
min_y = calibration_data[:, 1].min()
max_y = calibration_data[:, 1].max()

# Add tolerance
MARGIN = 0.05
min_x -= MARGIN
max_x += MARGIN
min_y -= MARGIN
max_y += MARGIN

# ----------------- MONITORING PHASE -----------------
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    status = "NO FACE DETECTED"
    color = (0, 0, 255)

    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0]
        landmarks = np.array([
            (int(lm.x * w), int(lm.y * h))
            for lm in face_landmarks.landmark
        ])

        gaze_x, gaze_y = get_gaze_ratios(landmarks)

        if min_x <= gaze_x <= max_x and min_y <= gaze_y <= max_y:
            status = "LOOKING INSIDE SCREEN"
            color = (0, 255, 0)
        else:
            status = "⚠ LOOKING OUTSIDE SCREEN"
            color = (0, 0, 255)

    cv2.putText(
        frame,
        status,
        (30, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        color,
        2
    )

    cv2.imshow("Invigilation Monitor", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
