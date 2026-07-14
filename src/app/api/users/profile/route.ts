import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { uid } = await req.json();

        if (!uid) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { name: user.name, email: user.email, role: user.role, companyName: user.companyName },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
