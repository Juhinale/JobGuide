import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

export async function POST(req: NextRequest) {
    try {
        const { topic, difficulty } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an expert technical interviewer. Generate 5 distinct, challenging technical interview questions on the topic: "${topic}".
            The difficulty level should be: "${difficulty || 'Medium'}".

            Rules:
            1. Ensure questions are open-ended and test depth of knowledge.
            2. Do not number the questions in the output text, just provide the question text.
            3. Return the response as a valid JSON array of strings.
            Example: ["Question 1 text?", "Question 2 text?"]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from potential code blocks
        const jsonMatch = text.match(/\[\s*[\s\S]*\s*\]/);

        let questions = [];
        if (jsonMatch) {
            try {
                questions = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("JSON Parse Error:", e);
            }
        }

        if (questions.length === 0) {
            // Fallback parsing if JSON fails
            questions = text.split("\n").filter(line => line.includes("?")).map(line => line.replace(/^\d+\.\s*/, "").trim());
        }

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Question Gen Error:", error);
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }
}
