import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { uid, email, name, role, companyName } = await req.json();

        if (!uid || !email || !name) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists
        let user = await User.findOne({ firebaseUid: uid });

        if (user) {
            // Optional: Update company name if provided and missing? Or just return success.
            // For now, let's allow updating it if passed, or just leave it.
            return NextResponse.json(
                { message: "User already exists", user },
                { status: 200 }
            );
        }

        // Create new user
        user = await User.create({
            firebaseUid: uid,
            email,
            name,
            role: role || "user",
            companyName: role === 'recruiter' ? companyName : undefined,
        });

        return NextResponse.json(
            { message: "User created successfully", user },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error syncing user:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
