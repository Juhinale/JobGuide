import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

export async function POST(req: NextRequest) {
    try {
        const { topic, difficulty, questions, answers, violations } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an expert technical interviewer evaluating a candidate.
            
            Topic: ${topic}
            Difficulty: ${difficulty}

            Interview Transcript:
            ${questions.map((q: string, i: number) => `Q${i + 1}: ${q}\nA: ${answers[i] || "(No Answer)"}`).join("\n\n")}

            Eye Tracking Violations (Looking away from screen): ${violations} times.

            Task:
            1. Evaluate the correctness and depth of the answers.
            2. Consider the eye tracking violations (serious flag if > 5).
            3. Provide a score out of 10.
            4. Provide constructive feedback.

            Return JSON:
            {
                "score": number,
                "feedback": "string",
                "status": "Passed" | "Failed" | "Needs Improvement"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let analysis = { score: 0, feedback: "Error parsing result", status: "Failed" };

        if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
        }

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Interview Report Error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
