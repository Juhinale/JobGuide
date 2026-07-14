
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import InterviewSession from "@/models/InterviewSession";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userEmail = session?.user?.email;

        if (!userEmail) {
            // Fallback: Check for email in query params (SECURE THIS IN PROD)
            const { searchParams } = new URL(req.url);
            userEmail = searchParams.get('email');
        }

        if (!userEmail) {
            console.error("API Error: No valid session or email found.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Fetching recent interviews for user:", userEmail);

        await dbConnect();

        // fetch recent completed interviews
        const recentInterviews = await InterviewSession.find({
            userId: { $regex: new RegExp(`^${userEmail}$`, 'i') },
            $or: [{ status: "completed" }, { report: { $exists: true } }],
        })
            .sort({ createdAt: -1 }) // or completed_at
            .limit(3)
            .lean(); // Convert to plain JS objects

        console.log(`Found ${recentInterviews.length} recent interviews.`);

        return NextResponse.json({ interviews: recentInterviews });
    } catch (error) {
        console.error("Error fetching recent interviews:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
