import { NextResponse } from "next/server";
import { generateProblem } from "@/lib/gemini";
import { createProblem } from "@/lib/problems";

export async function POST(request: Request) {
  try {
    const { topic, type, userId } = await request.json();
    console.log("API Received:", { topic, type, userId }); // DEBUG LOG

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const isCoding = type === "coding";
    console.log("isCoding:", isCoding); // DEBUG LOG

    const problemsData = await generateProblem(topic, isCoding);

    if (
      !problemsData ||
      !Array.isArray(problemsData) ||
      problemsData.length === 0
    ) {
      return NextResponse.json(
        { error: "Failed to generate problems" },
        { status: 500 },
      );
    }

    const savedProblems = [];

    // Iterate and save each problem
    for (const problemData of problemsData) {
      // Force valid type based on request, overriding AI if necessary
      if (problemData) {
        problemData.type = isCoding ? "coding" : "general";

        // Persist the problem so it can be accessed by ID
        const savedProblem = await createProblem(problemData, userId);
        savedProblems.push(savedProblem);
      }
    }

    return NextResponse.json({ problems: savedProblems });
  } catch (error) {
    console.error("CRITICAL API ERROR:", error); // Explicit log title
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) }, // Return details to client for debugging
      { status: 500 },
    );
  }
}
