import mongoose from 'mongoose';

export interface IJob extends mongoose.Document {
    title: string;
    description: string;
    location: string;
    type: string;
    salary: string;
    company: string;
    recruiterUid: string; // Firebase UID of the recruiter
    recruiterEmail: string;
    postedAt: Date;
    counter: number;
    applicants: {
        uid: string;
        name: string;
    }[];
    interviewConfig?: {
        type: 'video' | 'ai-manual' | 'ai-auto';
        duration?: number; // Duration in minutes
        scheduleConfig?: {
            startDate: Date;
            endDate: Date;
            startTime: string; // "14:00"
            endTime: string; // "18:00"
        };
        deadline?: Date;
        slots?: {
            date: string; // ISO date string
            time: string; // e.g., "10:00 AM"
            isBooked: boolean;
            candidateId?: string;
            applicationId?: string;
        }[];
        questions?: string[];
        aiTopic?: string;
        aiDifficulty?: 'Easy' | 'Medium' | 'Hard';
    };
}

const JobSchema = new mongoose.Schema<IJob>({
    title: {
        type: String,
        required: [true, 'Please provide a job title.'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a job description.'],
    },
    location: {
        type: String,
        required: [true, 'Please provide a job location.'],
    },
    type: {
        type: String,
        required: [true, 'Please provide a job type (e.g., Full-time).'],
    },
    salary: {
        type: String,
        required: [true, 'Please provide a salary range.'],
    },
    company: {
        type: String,
        default: 'Momentum AI',
    },
    recruiterUid: {
        type: String,
        required: true, // Making it required ensures we can track ownership
    },
    recruiterEmail: {
        type: String,
        required: true
    },
    postedAt: {
        type: Date,
        default: Date.now,
    },
    interviewConfig: {
        type: {
            type: String,
            enum: ['video', 'ai-manual', 'ai-auto'],
            required: false
        },
        duration: Number,
        scheduleConfig: {
            startDate: Date,
            endDate: Date,
            startTime: String,
            endTime: String
        },
        deadline: Date, // Date and Time
        slots: [{
            date: String,
            time: String,
            isBooked: { type: Boolean, default: false },
            candidateId: String,
            applicationId: String
        }],
        questions: [String],
        aiTopic: String,
        aiDifficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard']
        }
    },
    counter: {
        type: Number,
        default: 0
    },
    applicants: [{
        uid: String,
        name: String
    }]
});

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
