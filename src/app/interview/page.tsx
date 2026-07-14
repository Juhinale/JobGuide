"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BrainCircuit, Mic2, Loader2, Trophy, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function InterviewPage() {
    const [recentInterviews, setRecentInterviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInterviews = async () => {
            try {

                const res = await fetch('/api/interviews/recent')
                if (res.ok) {
                    const data = await res.json()
                    console.log('Recent interviews data:', data);
                    setRecentInterviews(data.interviews || [])
                } else {
                    console.error('Failed to fetch:', res.status, res.statusText);
                }
            } catch (error) {
                console.error("Failed to fetch recent interviews", error)
            } finally {
                setLoading(false)
            }
        }
        fetchInterviews()
    }, [])

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    const options = [
        {
            title: "Behavioral Interview",
            icon: Sparkles,
            description: "Practice common behavioral questions with our AI. Perfect for preparing for HR rounds.",
            color: "blue"
        },
        {
            title: "Technical Interview",
            icon: BrainCircuit,
            description: "Deep dive into technical concepts. The AI will challenge your knowledge.",
            color: "purple"
        },
        {
            title: "System Design",
            icon: Mic2,
            description: "Discuss system architecture and design scalable systems with the AI interviewer.",
            color: "green"
        }
    ]

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Select Interview Type
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Choose the type of interview you want to practice today.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {options.map((opt, i) => (
                        <motion.div variants={item} key={i}>
                            <Link href="/interview/setup">
                                <Card className={`h-full border-2 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group border-${opt.color}-500/20 bg-${opt.color}-500/5 hover:border-${opt.color}-500/50`}>
                                    <CardHeader className="pb-2">
                                        <div className={`h-12 w-12 rounded-full bg-${opt.color}-100 dark:bg-${opt.color}-900/20 flex items-center justify-center text-${opt.color}-600 dark:text-${opt.color}-400 mb-2 group-hover:scale-110 transition-transform`}>
                                            <opt.icon className="h-6 w-6" />
                                        </div>
                                        <CardTitle>{opt.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-end justify-between mb-2">
                                            <Badge className={`bg-${opt.color}-500 hover:bg-${opt.color}-600`}>AI Powered</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {opt.description}
                                        </p>
                                        <Button className={`w-full mt-4 bg-${opt.color}-600 hover:bg-${opt.color}-700`}>Start Session</Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : recentInterviews.length > 0 && (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-6 pt-8 border-t"
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold tracking-tight">Recent Performance</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Analysis from your completed interview sessions.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recentInterviews.map((interview, i) => (
                            <motion.div variants={item} key={interview._id || i}>
                                <Link href={`/dashboard/interviews/report/${interview._id}`}>
                                    <Card className="h-full hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <Badge variant={interview.difficulty === 'hard' ? 'destructive' : interview.difficulty === 'medium' ? 'default' : 'secondary'} className="capitalize">
                                                    {interview.difficulty}
                                                </Badge>

                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {new Date(interview.completed_at || interview.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg line-clamp-1" title={interview.topic}>
                                                {interview.topic}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>

                                            <div className="space-y-4">
                                                <div className="flex items-end justify-between">
                                                    <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-bold text-primary">
                                                            {interview.report?.score || 0}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">/100</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 py-2 border-y bg-muted/20 rounded-md">
                                                    <div className="text-center">
                                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Understand</div>
                                                        <div className="font-bold text-sm">{interview.report?.understanding_score || 0}</div>
                                                    </div>
                                                    <div className="text-center border-l border-r border-border/50">
                                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Skills</div>
                                                        <div className="font-bold text-sm">{interview.report?.skills_score || 0}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Language</div>
                                                        <div className="font-bold text-sm">{interview.report?.language_score || 0}</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</div>
                                                    <p className="text-sm text-foreground/90 line-clamp-2" title={interview.report?.feedback}>
                                                        {interview.report?.feedback || "No specific feedback available."}
                                                    </p>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Improvements</div>
                                                    <p className="text-xs text-muted-foreground line-clamp-1 italic" title={interview.report?.improvements}>
                                                        "{interview.report?.improvements || "View full report for details."}"
                                                    </p>
                                                </div>
                                            </div>

                                            <Button variant="ghost" className="w-full text-xs group-hover:text-primary pt-2">
                                                View Detailed Report
                                                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            </motion.div>


            ))}
        </div>
                </motion.div >
            )
}
        </div >
    )
}
