# Intelligent Interview Assistant

This project is an AI-powered interview practice application that simulates a real interview environment. It features real-time voice interaction, eye-tracking for engagement monitoring, and automated feedback generation using Gemini AI.

## 📂 Key Files

Here are the most important files in this codebase:

### 1. `interview_app.py` (Main Application)
This is the core GUI application built with PyQt6.
- **Features**:
  - Live video feed with eye-tracking overlay.
  - Real-time voice interaction (Speech-to-Text & Text-to-Speech).
  - Interview session management.
  - Integration with MediaPipe for face landmarks.
  - Generates a comprehensive feedback report using Gemini.

### 2. `QuestionGenerator.py`
A utility script that uses the Gemini API to generate verbally askable interview questions based on a specified topic and difficulty.
- **Usage**: Can be run independently to test question generation prompts.

### 3. `eyetracking.py`
A standalone script for eye-tracking calibration and monitoring.
- **Purpose**: Used for testing and calibrating the gaze detection logic (looking at screen vs. looking away) before integration into the main app.

### 4. `config.py`
Configuration file storing sensitive keys.
- **Contains**: `GEMINI_API_KEY`.
- **Note**: Ensure this file is present and contains a valid API key.

### 5. `interview.py`
A command-line/voice-only version of the interview system.
- **Purpose**: A lightweight alternative to the GUI app, focusing purely on the voice interaction loop.

## 🚀 Setup & Installation

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configuration**:
    - Open `config.py` and ensure your `GEMINI_API_KEY` is set.

3.  **Database**:
    - Ensure a local MongoDB instance is running (`mongodb://localhost:27017/`).
    - The app uses a database named `momentum`.

## ▶️ How to Run

To start the main interview application:
```bash
python interview_app.py
```

To run the standalone eye-tracking test:
```bash
python eyetracking.py
```

To run the CLI voice interview:
```bash
python interview.py
```

## 📦 Building the Executable

To convert the Python application into a standalone executable (`.exe`) file, use **PyInstaller**.
The project includes a `Momentum.spec` file that is already configured with the necessary settings (icon, data files, hidden imports).

1.  **Install PyInstaller**:
    ```bash
    pip install pyinstaller
    ```

2.  **Build the App**:
    Run the following command in your terminal:
    ```bash
    pyinstaller Momentum.spec
    ```

3.  **Locate the Executable**:
    Once the build process is complete, you will find the `Momentum.exe` file in the `dist/` folder.
