"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Mic, BrainCircuit, Calendar, Clock, ArrowRight, BarChart3, ChevronRight, Loader2, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"


export default function InterviewsPage() {
    const [topic, setTopic] = useState("")
    const [difficulty, setDifficulty] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [recentInterviews, setRecentInterviews] = useState<any[]>([])

    useEffect(() => {
        const fetchInterviews = async () => {
            if (!userEmail) return; // Don't fetch until we have the email

            try {
                // Pass email as query param to handle session issues
                const res = await fetch(`/api/interviews/recent?email=${encodeURIComponent(userEmail)}`)
                if (res.ok) {
                    const data = await res.json()
                    setRecentInterviews(data.interviews || [])
                }
            } catch (error) {
                console.error("Failed to fetch recent interviews", error)
            }
        }

        if (userEmail) {
            fetchInterviews()
        }
    }, [userEmail])

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserEmail(user.email)
            }
        })
        return () => unsubscribe()
    }, [])

    const handleStartSession = async () => {
        if (!userEmail || !topic || !difficulty) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/interview/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userEmail,
                    topic,
                    difficulty,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setCreatedSessionId(data.sessionId)
            }
        } catch (error) {
            console.error("Failed to create session", error)
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (createdSessionId) {
            navigator.clipboard.writeText(createdSessionId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const resetDialog = () => {
        setOpen(false)
        setTimeout(() => {
            setCreatedSessionId(null)
            setTopic("")
            setDifficulty("")
            setCopied(false)
        }, 300)
    }

    const startSpecificSession = (preTopic: string, preDifficulty: string) => {
        setTopic(preTopic)
        setDifficulty(preDifficulty)
        setOpen(true)
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                        Mock Interviews
                    </h1>
                    <p className="text-muted-foreground text-lg mt-1">
                        Practice with AI-driven interviewers tailored to your target role.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={(val) => !val ? resetDialog() : setOpen(val)}>
                    <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20">
                        <Video className="mr-2 h-4 w-4" />
                        New Custom Session
                    </Button>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{createdSessionId ? "Session Created!" : "Create Custom Session"}</DialogTitle>
                            <DialogDescription>
                                {createdSessionId
                                    ? "Use this Session ID to start your interview in the Momentum Interview App."
                                    : "Enter the topic and difficulty for your AI mock interview."}
                            </DialogDescription>
                        </DialogHeader>

                        {!createdSessionId ? (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="topic" className="text-right">
                                        Topic
                                    </Label>
                                    <Input
                                        id="topic"
                                        placeholder="e.g. React Hooks"
                                        className="col-span-3"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="difficulty" className="text-right">
                                        Difficulty
                                    </Label>
                                    <Input
                                        id="difficulty"
                                        placeholder="e.g. Intermediate"
                                        className="col-span-3"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 py-6">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="flex-1 p-3 bg-muted rounded-md font-mono text-center text-lg select-all border border-input">
                                        {createdSessionId}
                                    </div>
                                    <Button size="icon" variant="outline" onClick={copyToClipboard} className="h-12 w-12 shrink-0">
                                        {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground text-center px-4">
                                    Please switch to the Momentum Interview App and enter this ID to begin your session.
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            {!createdSessionId ? (
                                <Button onClick={handleStartSession} disabled={isLoading || !topic || !difficulty}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Generate Session ID"
                                    )}
                                </Button>
                            ) : (
                                <Button onClick={resetDialog} className="w-full">
                                    Done
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="relative overflow-hidden group border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-950 shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <BrainCircuit className="h-16 w-16 text-indigo-600" />
                    </div>
                    <CardHeader>
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                            <BrainCircuit className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">Technical Interview</CardTitle>
                        <CardDescription>Algorithm, data structures, and role-specific coding questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Real-time code execution</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Verbal explanation analysis</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full group-hover:gap-3 transition-all" onClick={() => startSpecificSession("Technical Interview", "Intermediate")}>
                            Start Technical <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="relative overflow-hidden group border-violet-500/20 bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/20 dark:to-slate-950 shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-16 w-16 text-violet-600" />
                    </div>
                    <CardHeader>
                        <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-2">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">System Design</CardTitle>
                        <CardDescription>Architect complex systems and explain your design choices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Interactive diagramming</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Scalability & Latency focus</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20" onClick={() => startSpecificSession("System Design", "Intermediate")}>
                            Launch Architect <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="relative overflow-hidden group border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-950 shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Mic className="h-16 w-16 text-emerald-600" />
                    </div>
                    <CardHeader>
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                            <Mic className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">Behavioral Session</CardTitle>
                        <CardDescription>Master the STAR method with professional soft-skills coaching.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sentiment & Tone analysis</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Eye contact & Pacing tips</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => startSpecificSession("Behavioral Session", "Intermediate")}>
                            Practice Soft Skills <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="pt-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Clock className="h-6 w-6 text-primary" />
                        Recent Performance
                    </h2>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                        View All History <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="grid grid-cols-12 border-b bg-muted/50 p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-4 pl-2">Session Type</div>
                        <div className="col-span-3">Date</div>
                        <div className="col-span-3">Score</div>
                        <div className="col-span-2 text-right pr-4">Report</div>
                    </div>

                    {recentInterviews.length > 0 ? (
                        recentInterviews.map((interview, i) => (
                            <div key={i} className="group border-b last:border-0 hover:bg-muted/30 transition-colors">
                                {/* Main Row */}
                                <div className="grid grid-cols-12 items-center p-4 cursor-pointer" onClick={(e) => {
                                    const details = e.currentTarget.nextElementSibling;
                                    if (details) details.classList.toggle('hidden');
                                }}>
                                    <div className="col-span-4 pl-2 font-medium text-foreground">
                                        <div className="flex flex-col">
                                            <span className="line-clamp-1" title={interview.topic}>{interview.topic}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{interview.difficulty}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(interview.completed_at || interview.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={interview.report?.score >= 70 ? 'default' : interview.report?.score >= 40 ? 'secondary' : 'destructive'}>
                                                {interview.report?.score || 0}/100
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right pr-4">
                                        <Button variant="ghost" size="sm">
                                            <ChevronRight className="h-4 w-4 transition-transform group-hover:rotate-90" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <div className="hidden bg-muted/20 p-4 border-t border-dashed animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase">Understanding</span>
                                            <div className="text-lg font-bold">{interview.report?.understanding_score || 0}/100</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase">Skills</span>
                                            <div className="text-lg font-bold">{interview.report?.skills_score || 0}/100</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase">Language</span>
                                            <div className="text-lg font-bold">{interview.report?.language_score || 0}/100</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                                <BrainCircuit className="h-3 w-3" /> Feedback
                                            </span>
                                            <p className="text-sm text-muted-foreground italic bg-background p-3 rounded-md border">
                                                "{interview.report?.feedback || "No feedback available."}"
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                                <BarChart3 className="h-3 w-3" /> Improvements
                                            </span>
                                            <p className="text-sm text-muted-foreground italic bg-background p-3 rounded-md border">
                                                "{interview.report?.improvements || "No improvements available."}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Button size="sm" asChild>
                                            <Link href={`/dashboard/interviews/report/${interview._id}`}>
                                                View Full Report <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <p>No recent interview history found.</p>
                            <Button variant="link" asChild className="mt-2">
                                <Link href="/interview/quick-start">Start your first session</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
