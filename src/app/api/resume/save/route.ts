import { NextRequest, NextResponse } from "next/server";
import { rateResume } from "@/lib/gemini";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "candidates.json");

export async function POST(req: NextRequest) {
    try {
        const resumeData = await req.json();

        // Default job requirements if not provided
        const jobRequirements = `${resumeData.personal.role || "Frontend Developer"} position at ${resumeData.personal.targetCompany || "our company"}. Requirements include: React, Next.js, Tailwind, TypeScript, UI/UX design, Node.js knowledge.`;

        // Get rating from Gemini
        const rating = await rateResume(resumeData, jobRequirements);

        // Prepare candidate entry
        const newCandidate = {
            id: Date.now(),
            name: resumeData.personal.fullName,
            role: resumeData.personal.role || "Frontend Developer",
            targetCompany: resumeData.personal.targetCompany || "General",
            applied: "Just now",
            score: rating.score,
            status: rating.status,
            skills: resumeData.skills,
            summary: resumeData.personal.summary,
            feedback: rating.feedback,
            resumeData: resumeData // Store full data for viewing
        };

        // Update database
        let candidates = [];
        if (fs.existsSync(dbPath)) {
            const fileData = fs.readFileSync(dbPath, "utf-8");
            candidates = JSON.parse(fileData);
        }

        // Avoid duplicates (simplified check by name)
        const index = candidates.findIndex((c: any) => c.name === newCandidate.name);
        if (index !== -1) {
            candidates[index] = { ...candidates[index], ...newCandidate, applied: candidates[index].applied };
        } else {
            candidates.push(newCandidate);
        }

        fs.writeFileSync(dbPath, JSON.stringify(candidates, null, 2));

        return NextResponse.json({ success: true, rating });
    } catch (error) {
        console.error("Save Resume Error:", error);
        return NextResponse.json({ success: false, error: "Failed to save resume" }, { status: 500 });
    }
}
