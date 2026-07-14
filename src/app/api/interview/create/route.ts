import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import InterviewSession from "@/models/InterviewSession";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { userId, topic, difficulty } = await req.json();

        if (!userId || !topic || !difficulty) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const session = await InterviewSession.create({
            userId, // This will be the user's email as requested
            topic,
            difficulty,
        });

        return NextResponse.json(
            {
                message: "Interview session created",
                sessionId: session._id
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating interview session:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
