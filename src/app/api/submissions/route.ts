import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const readFilePromise = promisify(fs.readFile);
const writeFilePromise = promisify(fs.writeFile);

const SUBMISSIONS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "submissions.json",
);

interface Submission {
  id: string;
  problemId: string;
  userId: string;
  code?: string; // Optional for theory questions
  language?: string; // Optional for theory questions
  answer?: string; // For theory questions
  evaluation?: any; // For theory question AI evaluation
  status: "Accepted" | "Failed" | "Error";
  runtime: number;
  memory?: number;
  testsPassed: number;
  testsTotal: number;
  timestamp: string;
}

// GET - Fetch submissions for a problem
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");
    const userId = searchParams.get("userId") || "default-user";

    let submissions: Submission[] = [];

    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = await readFilePromise(SUBMISSIONS_FILE, "utf-8");
      submissions = JSON.parse(data);
    }

    // Filter by problemId and userId if provided
    let filtered = submissions;
    if (problemId) {
      filtered = filtered.filter((s) => s.problemId === problemId);
    }
    filtered = filtered.filter((s) => s.userId === userId);

    // Sort by timestamp (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}

// POST - Save a new submission
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      problemId,
      code,
      language,
      answer,
      evaluation,
      status,
      runtime,
      memory,
      testsPassed,
      testsTotal,
      userId = "default-user",
    } = body;

    // Validate: must have either code+language (coding) or answer (theory)
    if (!problemId || !status || (!code && !answer)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let submissions: Submission[] = [];

    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = await readFilePromise(SUBMISSIONS_FILE, "utf-8");
      submissions = JSON.parse(data);
    }

    const newSubmission: Submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      problemId,
      userId,
      code,
      language,
      answer,
      evaluation,
      status,
      runtime: runtime || 0,
      memory,
      testsPassed: testsPassed || 0,
      testsTotal: testsTotal || 0,
      timestamp: new Date().toISOString(),
    };

    submissions.push(newSubmission);

    await writeFilePromise(
      SUBMISSIONS_FILE,
      JSON.stringify(submissions, null, 2),
    );

    return NextResponse.json(newSubmission);
  } catch (error: any) {
    console.error("Error saving submission:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 },
    );
  }
}
