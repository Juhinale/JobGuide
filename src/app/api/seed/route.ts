import { NextResponse } from "next/server";
import { generateProblem } from "@/lib/gemini";
import { createProblem } from "@/lib/problems";

export async function GET() {
  const TOPICS = [
    { topic: "Array Manipulation", isCoding: true },
    { topic: "Linked List Reversal", isCoding: true },
    { topic: "Binary Tree Traversal", isCoding: true },
    { topic: "Dynamic Programming - Knapsack", isCoding: true },
    { topic: "System Design - Scalability", isCoding: false },
    { topic: "Object Oriented Programming Principles", isCoding: false },
  ];

  const results = [];

  // Clear existing problems handled by empty file write previously
  // But let's just append or ensure chaos doesn't ensue.
  // The user asked to replace. I already cleared the file.

  console.log("🌱 API Seeding started...");

  for (const { topic, isCoding } of TOPICS) {
    try {
      console.log(`Generating ${topic}...`);
      const problemData = await generateProblem(topic, isCoding);
      problemData.type = isCoding ? "coding" : "general";
      const saved = createProblem(problemData);
      results.push({ title: saved.title, id: saved.id, status: "success" });
    } catch (e) {
      console.error(`Failed ${topic}:`, e);
      results.push({ topic, status: "failed", error: String(e) });
    }
  }

  return NextResponse.json({ success: true, results });
}
