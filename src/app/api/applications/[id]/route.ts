import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import Resume from "@/models/Resume";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: "Missing application ID" }, { status: 400 });
        }

        // Fetch application
        const application = await Application.findById(id);
        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Fetch Resume data using applicant's email
        const resume = await Resume.findOne({
            userId: { $regex: new RegExp(`^${application.applicantEmail}$`, 'i') }
        });

        // Combine data
        const candidateData = {
            id: application._id.toString(),
            name: application.applicantName,
            role: application.jobTitle,
            status: application.status,
            applied: new Date(application.appliedAt).toLocaleDateString(),
            score: application.score || 0,
            feedback: application.aiReview || application.coverNote || "No AI review available",
            email: application.applicantEmail,
            resumeData: resume ? resume.toObject() : null
        };

        return NextResponse.json(candidateData);
    } catch (error: any) {
        console.error("Fetch Application Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
