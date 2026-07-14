"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, BookOpen, CheckCircle2, PlayCircle, Sparkles, TrendingUp, Trophy } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

import { useState, useEffect } from "react"

import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function DashboardHome() {
    const [resumeScore, setResumeScore] = useState<number | null>(null)
    const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)
    const [userName, setUserName] = useState<string>("Developer")

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.displayName) {
                    setUserName(user.displayName.split(' ')[0]) // First name only
                } else if (user.email) {
                    // Fallback to part before @ if no display name
                    setUserName(user.email.split('@')[0])
                }
            }
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        const fetchScore = async () => {
            try {
                // Fetch candidate score (existing logic)
                const response = await fetch('/api/candidates');
                const data = await response.json();
                const me = data.find((c: any) => c.name === "Dhruv User");
                if (me) setResumeScore(me.score);

                // Fetch real resume analysis
                if (auth.currentUser?.email) {
                    const resumeRes = await fetch(`/api/resume?email=${auth.currentUser.email}`);
                    const resumeData = await resumeRes.json();
                    if (resumeData.success && resumeData.data?.analysis) {
                        setResumeAnalysis(resumeData.data.analysis);
                    }
                }
            } catch (e) { }
        };
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                fetchScore();
            }
        });
        return () => unsubscribe();
    }, []);

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

    return (
        <motion.div
            className="space-y-8 max-w-7xl mx-auto"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Welcome back, {userName}!
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-muted-foreground text-lg">
                            Ready to keep your momentum going?
                        </p>
                        <Link href="/dashboard/resume">
                            <Button variant="link" className="text-indigo-600 p-0 h-auto font-bold text-lg hover:no-underline">
                                View My Resume →
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/report">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            View Full Report
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* AI Focus Widget */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={item} className="col-span-4">
                    <Card className="h-full border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg relative overflow-hidden group">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <CardTitle>AI Focus Suggestion</CardTitle>
                                </div>
                            </div>
                            <CardDescription className="text-base">
                                Based on your recent performance analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Master Dynamic Programming</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    You've shown great progress, but our analysis detected a struggle with the <strong>Knapsack problem</strong> pattern.
                                    We've curated 3 specific problems to help you turn this weakness into a strength.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link href="/dashboard/problems?tag=dp">
                                    <Button size="lg" className="shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5">
                                        <PlayCircle className="mr-2 h-5 w-5" />
                                        Start Practice Session
                                    </Button>
                                </Link>
                                <Link href="/dashboard/analysis">
                                    <Button variant="secondary" size="lg" className="shadow-sm hover:bg-background/80">
                                        View Analysis
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="col-span-3">
                    <Card className="h-full shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                                Weekly Activity
                            </CardTitle>
                            <CardDescription>Your coding time distribution this week</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full mt-4 flex items-end justify-between gap-2 px-2">
                                {[45, 75, 30, 85, 50, 95, 65].map((h, i) => (
                                    <div key={i} className="flex flex-col items-center justify-end gap-2 w-full h-full group relative">
                                        <div
                                            className="w-full bg-gradient-to-t from-primary/60 to-primary rounded-t-sm hover:from-primary hover:to-purple-500 transition-all duration-300"
                                            style={{ height: `${h}%` }}
                                        ></div>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 border">
                                            {h} mins
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Actions / Recent Items */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <motion.div variants={item}>
                    <Link href="/dashboard/resume">
                        <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                            <CardHeader className="pb-2">
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <CardTitle>Resume Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {resumeAnalysis ? `${resumeAnalysis.score}/100` : (resumeScore ? `${(resumeScore * 10).toFixed(0)}%` : "N/A")}
                                    </span>
                                    <span className="text-sm text-muted-foreground mb-1">
                                        {resumeAnalysis ? resumeAnalysis.status : (resumeScore ? (resumeScore >= 9 ? "Optimized" : "Improving") : "Not Rated")}
                                    </span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: resumeAnalysis ? `${resumeAnalysis.score}%` : (resumeScore ? `${resumeScore * 10}%` : '0%') }}
                                    ></div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                    {resumeAnalysis
                                        ? resumeAnalysis.feedback
                                        : (resumeScore
                                            ? (resumeScore >= 9 ? "Excellent profile! You're ready." : "AI suggests adding more technical projects.")
                                            : "Complete and save your resume to get AI rating.")}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                <motion.div variants={item}>
                    <Link href="/dashboard/interviews">
                        <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                            <CardHeader className="pb-2">
                                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <CardTitle>Pending Interview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge className="mb-3 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                                    Tomorrow, 10:00 AM
                                </Badge>
                                <h4 className="font-semibold text-lg">System Design Mock</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Scheduled with Senior Engineer. Focus on scalability.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                <motion.div variants={item}>
                    <Link href="/dashboard/problems">
                        <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                            <CardHeader className="pb-2">
                                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <CardTitle>Skill Gap</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
                                        Next.js
                                    </Badge>
                                    <Badge variant="outline">Server Actions</Badge>
                                </div>
                                <h4 className="font-medium">Recommended Path</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Start the "Advanced Next.js Patterns" module to close this gap.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    )
}
