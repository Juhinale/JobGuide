import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { recruiterUid } = await req.json();

        if (!recruiterUid) {
            return NextResponse.json({ error: "Missing recruiterUid" }, { status: 400 });
        }

        // Fetch applications where this recruiter is the owner of the job
        const applications = await Application.find({ recruiterUid }).sort({ appliedAt: -1 });

        // Transform for UI (matches the Candidate interface we used earlier roughly)
        const candidates = applications.map(app => ({
            id: app._id.toString(),
            name: app.applicantName,
            role: app.jobTitle, // Showing the job they applied for as 'role'
            targetCompany: "Your Company",
            applied: new Date(app.appliedAt).toLocaleDateString(),
            score: app.score,
            status: app.status,
            feedback: app.aiReview || app.coverNote || "No AI review available",
            email: app.applicantEmail,
            applicationId: app._id
        }));

        return NextResponse.json(candidates);
    } catch (error: any) {
        console.error("Fetch Applicants Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch applicants" }, { status: 500 });
    }
}
