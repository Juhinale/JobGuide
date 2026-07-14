import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/gemini";
import { getProblemById } from "@/lib/problems";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFilePromise = promisify(fs.writeFile);
const readFilePromise = promisify(fs.readFile);

const SUBMISSIONS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "submissions.json",
);

export async function POST(request: Request) {
  try {
    const { problemId, userAnswer } = await request.json();

    if (!problemId || !userAnswer) {
      return NextResponse.json(
        { error: "Problem ID and User Answer required" },
        { status: 400 },
      );
    }

    const problem = getProblemById(problemId);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Only for general type problems
    if (problem.type && problem.type !== "general") {
      return NextResponse.json(
        { error: "This endpoint is for general problems only" },
        { status: 400 },
      );
    }

    const evaluation = await evaluateAnswer(problem.description, userAnswer);

    // Save submission for theory question
    try {
      let submissions: any[] = [];

      if (fs.existsSync(SUBMISSIONS_FILE)) {
        const data = await readFilePromise(SUBMISSIONS_FILE, "utf-8");
        submissions = JSON.parse(data);
      }

      const newSubmission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        problemId,
        userId: "default-user",
        answer: userAnswer,
        evaluation,
        status: "Accepted", // Theory submissions are always "Accepted" to show checkmark
        runtime: 0,
        testsPassed: 1,
        testsTotal: 1,
        timestamp: new Date().toISOString(),
      };

      submissions.push(newSubmission);

      await writeFilePromise(
        SUBMISSIONS_FILE,
        JSON.stringify(submissions, null, 2),
      );
    } catch (error) {
      console.error("Failed to save theory submission:", error);
      // Don't fail the request if submission saving fails
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Evaluation API Error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
