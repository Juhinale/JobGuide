
import { NextResponse } from "next/server";
import { generateJobDescription } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { title, type, location, salary } = await req.json();

        if (!title) {
            return NextResponse.json({ error: "Job title is required" }, { status: 400 });
        }

        const result = await generateJobDescription(title, type, location, salary);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error generating job description:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
