import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const recruiterUid = searchParams.get("recruiterUid");

        let query = {};
        if (recruiterUid) {
            query = { recruiterUid };
        }

        const jobs = await Job.find(query).sort({ postedAt: -1 });
        const jobsWithId = jobs.map((job: any) => ({
            ...job.toObject(),
            id: job._id.toString()
        }));
        return NextResponse.json(jobsWithId);
    } catch (error) {
        console.error("Fetch Jobs Error:", error);
        return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // 1. Get the recruiter's UID (passed from frontend or derived from session)
        let companyName = "Momentum AI";

        if (body.uid) {
            const user = await User.findOne({ firebaseUid: body.uid });
            if (user && user.companyName) {
                companyName = user.companyName;
            }
        }

        const job = await Job.create({
            title: body.title,
            description: body.description,
            location: body.location,
            type: body.type,
            salary: body.salary,
            company: companyName, // Use the fetched company name
            recruiterUid: body.uid, // Save the recruiter's UID
            recruiterEmail: body.email,
            postedAt: new Date(),
            counter: 0,
            applicants: []
        });

        return NextResponse.json({
            ...job.toObject(),
            id: job._id.toString()
        }, { status: 201 });
    } catch (error) {
        console.error("Create Job Error:", error);
        return NextResponse.json({ error: "Failed to post job" }, { status: 500 });
    }
}
