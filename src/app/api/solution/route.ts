import { NextResponse } from "next/server";

// GET - Get solution for a problem
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");
    const language = searchParams.get("language") || "python";

    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 },
      );
    }

    // Call Gemini API to generate solution
    const apiKey = process.env.GEMINI_API_KEY;

    // Fetch the problem details
    const problemsModule = await import("@/lib/problems");
    const problems = problemsModule.getProblems();
    const problem = problems.find((p) => p.id === problemId);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // If no API key, return the default code as solution
    if (!apiKey) {
      const defaultSolution =
        problem.defaultCode?.[language] || "// Solution not available";
      return NextResponse.json({ solution: defaultSolution });
    }

    // Generate solution using Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert programmer. Generate an optimal, well-commented solution for the following coding problem in ${language}:

Problem: ${problem.title}
Description: ${problem.description}
Function Name: ${problem.functionName}
Arguments: ${problem.args?.join(", ")}

Requirements:
1. Write clean, efficient code with comments explaining the approach
2. Include time and space complexity analysis as comments
3. Use best practices for ${language}
4. Make the solution easy to understand

Return ONLY the code solution, no markdown formatting or explanations outside the code.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to generate solution from Gemini");
    }

    const data = await response.json();
    const solutionCode = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up the code (remove markdown formatting if present)
    let cleanCode = solutionCode
      .replace(/```[\w]*\n/g, "")
      .replace(/```/g, "")
      .trim();

    return NextResponse.json({ solution: cleanCode });
  } catch (error: any) {
    console.error("Error generating solution:", error);
    return NextResponse.json(
      { error: "Failed to generate solution", details: error.message },
      { status: 500 },
    );
  }
}
