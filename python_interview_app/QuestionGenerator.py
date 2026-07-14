# QuestionGenerator.py
# Gemini 2.5 Flash — Verbally Askable Question Generator

from config import GEMINI_API_KEY
from google import genai

# ---------------- GEMINI SETUP ----------------

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"

# ---------------- QUESTION GENERATOR ----------------

def generate_questions(topic: str, difficulty: str):
    prompt = f"""
Give me exactly 10 verbally askable interview questions on the topic "{topic}".

Difficulty level: {difficulty}

STRICT RULES (VERY IMPORTANT):
- Questions must sound natural when spoken out loud
- Do NOT include code snippets
- Do NOT mention variable names, symbols, decorators, or syntax
- Do NOT use backticks or special characters
- Phrase questions like a human interviewer would speak
- Each question must start with exactly: Q)
- Each question must end with exactly: .?
- Do not number them
- Do not add explanations
- Output ONLY the questions

Focus on concepts, reasoning, and real-world understanding.
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text.strip()

# ---------------- MAIN ----------------

def main():
    print("\n🧠 Gemini Question Generator (Verbal Mode)\n")

    topic = input("Enter topic name: ").strip()
    difficulty = input("Enter difficulty level (easy / medium / hard / tricky): ").strip()

    if not topic or not difficulty:
        print("❌ Topic and difficulty are required.")
        return

    print("\nGenerating verbally askable questions...\n")

    questions = generate_questions(topic, difficulty)
    print(questions)

# ---------------- RUN ----------------

if __name__ == "__main__":
    main()
