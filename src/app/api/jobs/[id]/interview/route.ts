import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        // Validate ID
        if (!id) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        const body = await req.json();
        const interviewConfig = body.interviewConfig;

        // Logic for Auto-Scheduling Video Interviews
        if (interviewConfig?.type === 'video' && interviewConfig?.scheduleConfig) {
            console.log("Generating slots for job:", id);
            const { startDate, endDate, startTime, endTime } = interviewConfig.scheduleConfig;
            const duration = interviewConfig.duration || 30; // Default 30 mins

            // 1. Fetch eligible applicants (Applied, Screening, Interviewing)
            console.log("Fetching applications...");
            const applications = await Application.find({
                jobId: id,
                status: { $in: ['Applied', 'Screening', 'Interviewing'] }
            });
            console.log(`Found ${applications.length} eligible applications.`);

            const slots = [];
            let currentAppIndex = 0;

            const start = new Date(startDate);
            const end = new Date(endDate);

            // Normalize start dates to midnight for loop
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            // 2. Loop through each day in the date range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // If all applicants assigned, break early
                if (currentAppIndex >= applications.length) break;

                const dateStr = d.toISOString().split('T')[0];

                // Parse daily start/end times
                const [startHour, startMin] = startTime.split(':').map(Number);
                const [endHour, endMin] = endTime.split(':').map(Number);

                let currentTime = new Date(d);
                currentTime.setHours(startHour, startMin, 0, 0);

                const dayEndTime = new Date(d);
                dayEndTime.setHours(endHour, endMin, 0, 0);

                // 3. Generate slots for the day
                while (currentTime < dayEndTime && currentAppIndex < applications.length) {
                    // Format time as HH:MM
                    const timeStr = currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    // Assign applicant
                    const app = applications[currentAppIndex];

                    slots.push({
                        date: dateStr,
                        time: timeStr,
                        isBooked: true,
                        candidateId: app.applicantUid,
                        applicationId: app._id.toString()
                    });

                    // Update application status to Interviewing
                    // We'll update the status in the DB as well
                    await Application.findByIdAndUpdate(app._id, { status: 'Interviewing' });

                    currentAppIndex++;

                    // Increment time by duration + 10 minutes buffer
                    currentTime.setMinutes(currentTime.getMinutes() + duration + 10);
                }
            }

            console.log(`Generated ${slots.length} slots.`);
            // Attach generated slots to config
            interviewConfig.slots = slots;
        } else if (['ai-manual', 'ai-auto'].includes(interviewConfig?.type)) {
            // Logic for Interview Deadline Validation
            if (interviewConfig?.deadline) {
                const deadlineDate = new Date(interviewConfig.deadline);
                if (isNaN(deadlineDate.getTime())) {
                    return NextResponse.json({ error: "Invalid deadline date" }, { status: 400 });
                }
                if (deadlineDate < new Date()) {
                    return NextResponse.json({ error: "Deadline must be in the future" }, { status: 400 });
                }
            } else {
                return NextResponse.json({ error: "Deadline is required for AI interviews" }, { status: 400 });
            }
        }

        const job = await Job.findByIdAndUpdate(
            id,
            { interviewConfig },
            { new: true, runValidators: true }
        );

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json(job, { status: 200 });
    } catch (error: any) {
        console.error("Error updating interview config:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
