import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Resume from "@/models/Resume";
import dbConnect from "@/lib/db";
import { analyzeResume } from "@/lib/gemini";

export async function GET(req: Request) {
    try {
        await dbConnect();

        // Try getting session first
        const session = await getServerSession(authOptions);
        let userEmail = session?.user?.email;

        // Fallback to query param if no session
        if (!userEmail) {
            const { searchParams } = new URL(req.url);
            userEmail = searchParams.get('email');
        }

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Search by userId (which stores email)
        const resume = await Resume.findOne({ userId: { $regex: new RegExp(`^${userEmail}$`, 'i') } });

        if (!resume) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: resume });

    } catch (error) {
        console.error("Error fetching resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const data = await req.json();

        // Get identification info
        const session = await getServerSession(authOptions);
        const userEmail = session?.user?.email || data.personal?.email;
        const uid = data.uid; // Passed from frontend

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized - Email required" }, { status: 401 });
        }

        // Trigger AI Analysis
        let analysisData = null;
        if (data.skills || (data.experience && data.experience.length > 0)) {
            analysisData = await analyzeResume(data);
        }

        // Prepare update object
        const updateFields: any = {
            ...data,
            userId: userEmail,
            uid: uid, // Store the Firebase UID as requested
            updatedAt: new Date()
        };

        if (analysisData) {
            updateFields.analysis = analysisData;
        }

        // Upsert by email (userId)
        const updatedResume = await Resume.findOneAndUpdate(
            { userId: { $regex: new RegExp(`^${userEmail}$`, 'i') } },
            { $set: updateFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({ success: true, data: updatedResume });

    } catch (error: any) {
        console.error("Error saving resume:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
