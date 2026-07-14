import { getProblems } from "@/lib/problems";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400 },
        );
    }

    try {
        const problems = await getProblems(userId);
        return NextResponse.json(problems);
    } catch (error) {
        console.error("Error fetching problems:", error);
        return NextResponse.json(
            { error: "Failed to fetch problems" },
            { status: 500 },
        );
    }
}
