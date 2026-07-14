import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import Resume from "@/models/Resume";
import { rateResume } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { jobId, applicantUid, coverNote } = await req.json();

        if (!jobId || !applicantUid) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch Job details (to get recruiterUid and jobTitle)
        const job = await Job.findById(jobId);
        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Fetch Applicant details
        const applicant = await User.findOne({ firebaseUid: applicantUid });
        if (!applicant) {
            return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
        }

        // Check if already applied
        const existingApp = await Application.findOne({ jobId, applicantUid });
        if (existingApp) {
            return NextResponse.json({ error: "Already applied to this job" }, { status: 400 });
        }

        // 1. Fetch Resume for AI Analysis
        // Try precise match first, then broader (Resume uses userId usually matching firebaseUid)
        let resumeData = {};
        const resumeDoc = await Resume.findOne({ userId: { $regex: new RegExp(`^${applicant.email}$`, 'i') } });

        if (resumeDoc) {
            resumeData = resumeDoc.toObject();
        }

        // 2. Rate Resume with Gemini
        // We use job description as requirements. If missing, use title.
        const jobRequirements = job.description || job.title;
        console.log(`Rating resume for ${applicant.name} on job ${job.title}...`);

        const aiResult = await rateResume(resumeData, jobRequirements);
        console.log("AI Rating Result:", aiResult);

        // Create Application
        const application = await Application.create({
            jobId,
            applicantUid,
            recruiterUid: job.recruiterUid, // Critical for filtering
            applicantName: applicant.name,
            applicantEmail: applicant.email,
            jobTitle: job.title,
            coverNote,
            status: 'Applied',
            score: aiResult.score || 0,
            aiReview: aiResult.feedback || "AI review unavailable.",
        });

        // Increment applicants count
        const updatedJob = await Job.findByIdAndUpdate(
            jobId,
            {
                $inc: { counter: 1 },
                $push: { applicants: { uid: applicantUid, name: applicant.name } }
            },
            { new: true }
        );
        // 3. Intelligent Interview Slot Assignment (Video Only)
        if (job.interviewConfig?.type === 'video' && job.interviewConfig?.scheduleConfig) {
            console.log("Attempting to auto-assign interview slot...");
            const { scheduleConfig, slots = [], duration = 30 } = job.interviewConfig;
            const { startDate, endDate, startTime, endTime } = scheduleConfig;

            // Sort existing slots by date and time to find the last booked slot
            const sortedSlots = [...slots].sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });

            const lastSlot = sortedSlots[sortedSlots.length - 1];
            let nextSlotDate, nextSlotTime;

            if (lastSlot) {
                // Calculate next slot based on last slot + duration + 10 mins buffer
                const lastDate = new Date(`${lastSlot.date}T${lastSlot.time}`);
                lastDate.setMinutes(lastDate.getMinutes() + duration + 10);
                nextSlotDate = lastDate;
            } else {
                // No slots yet, start from the beginning of the schedule
                const startDateTime = new Date(`${startDate.toISOString().split('T')[0]}T${startTime}`);
                nextSlotDate = startDateTime;
            }

            // check if nextSlotDate is within valid range
            const dayEndTime = new Date(nextSlotDate);
            const [endHour, endMin] = endTime.split(':').map(Number);
            dayEndTime.setHours(endHour, endMin, 0, 0);

            const scheduleEndDate = new Date(endDate);
            scheduleEndDate.setHours(23, 59, 59, 999);

            // If next slot is past today's end time, move to next day start time
            if (nextSlotDate >= dayEndTime) {
                nextSlotDate.setDate(nextSlotDate.getDate() + 1);
                const [startHour, startMin] = startTime.split(':').map(Number);
                nextSlotDate.setHours(startHour, startMin, 0, 0);
            }

            // Final check if we are still within the overall schedule window
            if (nextSlotDate <= scheduleEndDate) {
                const formattedDate = nextSlotDate.toISOString().split('T')[0];
                const formattedTime = nextSlotDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                // Assign the slot
                await Job.findByIdAndUpdate(jobId, {
                    $push: {
                        "interviewConfig.slots": {
                            date: formattedDate,
                            time: formattedTime,
                            isBooked: true,
                            candidateId: applicantUid,
                            applicationId: application._id.toString()
                        }
                    }
                });

                // Update Application Status
                await Application.findByIdAndUpdate(application._id, { status: 'Interviewing' });

                console.log(`Auto-assigned interview slot: ${formattedDate} at ${formattedTime}`);
                application.status = 'Interviewing'; // Update local object for response
            } else {
                console.log("No available slots within schedule range.");
            }
        }

        console.log(`Updated job ${jobId} counter to: ${updatedJob?.counter}`);

        return NextResponse.json(application, { status: 201 });
    } catch (error: any) {
        console.error("Apply Error:", error);
        return NextResponse.json({ error: error.message || "Failed to submit application" }, { status: 500 });
    }
}
