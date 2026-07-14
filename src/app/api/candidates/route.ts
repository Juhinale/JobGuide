import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        await dbConnect();

        // Get query params for filtering
        const { searchParams } = new URL(req.url);
        const domain = searchParams.get("domain");

        // Base query: only users (not recruiters)
        let query: any = { role: "user" };

        // If domain filtering is needed, we'd need a 'domain' field in User model
        // For now, we'll just return all users since User model doesn't have domain/skills yet
        // In a real app, we'd likely have a Profile model or add fields to User

        const candidates = await User.find(query).sort({ createdAt: -1 });

        // Transform data to match frontend expectations (adding dummy scores/feedback for UI demo if needed, or just raw data)
        // Since the UI expects specific fields like score, feedback, status which might not be in User model yet:
        const enrichedCandidates = candidates.map(candidate => ({
            id: candidate._id.toString(),
            name: candidate.name,
            role: "Software Engineer", // Placeholder or fetch from profile
            status: "Applied", // Placeholder
            applied: new Date(candidate.createdAt).toLocaleDateString(),
            score: Math.random() * (9.5 - 7.0) + 7.0, // specialized 'skill' that generates a score... just kidding, random for now
            feedback: "AI domain analysis pending or completed.",
            email: candidate.email
        }));

        return NextResponse.json(enrichedCandidates);
    } catch (error) {
        console.error("Fetch Candidates Error:", error);
        return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
    }
}
