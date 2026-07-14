"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Video, User, CheckCircle2, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

export default function InterviewsPage() {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Interview Schedule</h1>
                    <p className="text-muted-foreground">Monitor and join upcoming candidate sessions.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl border-dashed h-11">
                        Calendar View
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 h-11 px-6 rounded-xl font-bold">
                        <PlusCircle className="mr-2 h-5 w-5" /> Schedule Live
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-muted/10 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-extrabold text-lg">Thursday, Feb 15</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="ghost" className="text-blue-600 font-bold">Today</Button>
                    </div>

                    <div className="space-y-4">
                        <InterviewCard
                            name="Alex Kumar"
                            role="Senior Frontend Developer"
                            time="3:00 PM - 3:45 PM"
                            type="Video Call"
                            status="Live"
                            isLive
                        />
                        <InterviewCard
                            name="Sophia Wang"
                            role="UI Designer"
                            time="4:30 PM - 5:15 PM"
                            type="AI Proctored"
                            status="Upcoming"
                        />
                        <InterviewCard
                            name="Maria Garcia"
                            role="Backend Engineer"
                            time="11:00 AM - 11:45 AM"
                            type="AI Proctored"
                            status="Completed"
                            isCompleted
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <CardHeader>
                            <CardTitle>AI Interview Settings</CardTitle>
                            <CardDescription className="text-blue-100">Customize how AI evaluates candidates during automated sessions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium opacity-80">Skill Check Rigor</span>
                                    <span className="font-bold">Advanced</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/20 rounded-full">
                                    <div className="w-[85%] h-full bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                            <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl h-11">
                                Update Evaluation Criteria
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Feedback</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold">Candidate Evaluation Pin</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2 italic">"Candidate showed strong problem solving skills but could improve on system design..."</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    )
}

function InterviewCard({ name, role, time, type, status, isLive, isCompleted }: any) {
    return (
        <motion.div variants={item}>
            <Card className={`overflow-hidden transition-all hover:shadow-lg border-2 ${isLive ? 'border-blue-500 bg-blue-50/20' : 'border-transparent'}`}>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-600'}`}>
                                <User className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold group-hover:text-blue-600 transition-colors uppercase tracking-tight">{name}</h3>
                                <p className="text-sm text-muted-foreground font-medium">{role}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="hidden md:block">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" /> Time
                                </p>
                                <p className="text-sm font-black">{time}</p>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Video className="h-3 w-3" /> Type
                                </p>
                                <p className="text-sm font-black">{type}</p>
                            </div>
                            <div className="text-right">
                                {isLive ? (
                                    <Badge className="bg-red-500 hover:bg-red-600 animate-pulse text-[10px] uppercase font-black px-3 py-1">Live Now</Badge>
                                ) : isCompleted ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] uppercase font-black px-3 py-1 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Finished
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] uppercase font-black px-3 py-1">Scheduled</Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            {isLive ? (
                                <Button className="bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-lg shadow-blue-500/20">Join Call</Button>
                            ) : isCompleted ? (
                                <Button variant="outline" className="font-bold">View Report</Button>
                            ) : (
                                <Button variant="outline" className="font-bold">Reschedule</Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
