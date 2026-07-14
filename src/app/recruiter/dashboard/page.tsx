"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Briefcase, Calendar, FileText, ArrowUpRight, Clock, Zap, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

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

export default function RecruiterHome() {
    const [userName, setUserName] = useState("Recruiter")
    const [stats, setStats] = useState({
        activeJobs: 0,
        totalApplicants: 0,
        pendingReview: 0,
        interviewsToday: 0
    })
    const [recentApplicants, setRecentApplicants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async (user: any) => {
            setLoading(true)
            try {
                // Fetch Profile
                const profileRes = await fetch('/api/users/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: user.uid }),
                })
                if (profileRes.ok) {
                    const profileData = await profileRes.json()
                    if (profileData.name) setUserName(profileData.name)
                }

                // Fetch Jobs (for Active Jobs count)
                const jobsRes = await fetch(`/api/jobs?recruiterUid=${user.uid}`)
                const jobsData = await jobsRes.json()

                // Fetch Applicants
                const applicantsRes = await fetch('/api/recruiter/applicants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recruiterUid: user.uid })
                })
                const applicantsData = await applicantsRes.json()

                const pending = applicantsData.filter((a: any) => a.status === 'Applied' || a.status === 'Screening').length

                setStats({
                    activeJobs: jobsData.length,
                    totalApplicants: applicantsData.length,
                    pendingReview: pending,
                    interviewsToday: 0 // Mocking as requested
                })

                // Set top 3 recent applicants
                setRecentApplicants(applicantsData.slice(0, 3))

            } catch (error) {
                console.error("Dashboard Fetch Error:", error)
            } finally {
                setLoading(false)
            }
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchData(user)
            } else {
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [])

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Welcome back, {userName}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Here's what's happening with your recruitment pipeline today.
                    </p>
                </div>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" asChild>
                    <Link href="/recruiter/dashboard/jobs/new">
                        <PlusCircle className="mr-2 h-5 w-5" /> Post New Job
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Active Jobs"
                    value={stats.activeJobs.toString()}
                    href="/recruiter/dashboard/jobs"
                    icon={<Briefcase className="h-5 w-5 text-blue-500" />}
                    trend="+1 this week"
                />
                <MetricCard
                    title="Total Applicants"
                    value={stats.totalApplicants.toString()}
                    href="/recruiter/dashboard/candidates"
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                    trend="+4 today"
                />
                <MetricCard
                    title="Pending Review"
                    value={stats.pendingReview.toString()}
                    href="/recruiter/dashboard/candidates"
                    icon={<FileText className="h-5 w-5 text-amber-500" />}
                    trend="Requires Action"
                />
                <MetricCard
                    title="Interviews Today"
                    value={stats.interviewsToday.toString()}
                    href="/recruiter/dashboard/interviews"
                    icon={<Calendar className="h-5 w-5 text-emerald-500" />}
                    trend="Schedule cleared"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-none shadow-xl bg-gradient-to-b from-background to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Recent Applicants</CardTitle>
                            <CardDescription>AI-ranked candidates for your open roles.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/recruiter/dashboard/candidates" className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="py-10 text-center text-muted-foreground">Syncing live talent stream...</div>
                            ) : recentApplicants.length === 0 ? (
                                <div className="py-10 text-center text-muted-foreground">No recent applicants found.</div>
                            ) : (
                                recentApplicants.map((candidate, i) => (
                                    <motion.div
                                        variants={item}
                                        key={candidate.id || i}
                                        className="group flex items-center justify-between p-3 rounded-xl transition-all hover:bg-muted/50 border border-transparent hover:border-border"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                                                    {candidate.name[0]}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-background flex items-center justify-center">
                                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-semibold group-hover:text-blue-600 transition-colors uppercase tracking-tight">{candidate.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                    {candidate.role} • <Clock className="h-3 w-3" /> {candidate.applied}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                    <p className="text-sm font-bold text-foreground">{(candidate.score || 0).toFixed(1)}/10</p>
                                                </div>
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{candidate.status}</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="rounded-full px-4 hover:bg-blue-600 hover:text-white transition-all shadow-sm" asChild>
                                                <Link href={`/recruiter/dashboard/candidates/view/${candidate.id}`}>Review</Link>
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl">Interview Schedule</CardTitle>
                        <CardDescription>AI-proctored and live sessions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <motion.div variants={item} className="rounded-2xl border-2 border-blue-500/20 p-4 space-y-3 bg-blue-500/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2">
                                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                                </div>
                                <div className="flex items-center gap-3 border-b border-blue-500/10 pb-3">
                                    <div className="h-12 w-12 rounded-xl flex flex-col items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                        <span className="text-[10px] font-bold uppercase opacity-80">Today</span>
                                        <span className="text-lg font-bold">15</span>
                                    </div>
                                    <div>
                                        <p className="font-bold">Video Interview: Alex K.</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> 3:00 PM - 3:45 PM
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm">Join Meeting</Button>
                                    <Button variant="outline" size="sm" className="group-hover:bg-white dark:group-hover:bg-slate-800">Profile</Button>
                                </div>
                            </motion.div>

                            <motion.div variants={item} className="rounded-2xl border p-4 flex items-center gap-3 transition-all hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground font-bold">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">AI Screening: Maria G.</p>
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <p className="text-xs text-muted-foreground font-medium">Completed • View Report</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </motion.div>

                            <motion.div variants={item} className="rounded-2xl border p-4 flex items-center gap-3 border-dashed opacity-60">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted/50 text-muted-foreground font-bold italic">
                                    ?
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-muted-foreground">Available Slot</p>
                                    <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                                </div>
                            </motion.div>
                        </div>
                        <Button variant="link" className="w-full mt-4 text-blue-500 hover:text-blue-600 font-bold" asChild>
                            <Link href="/recruiter/dashboard">View Full Calendar</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    )
}

function MetricCard({ title, value, icon, href, trend }: any) {
    return (
        <motion.div variants={item}>
            <Link href={href}>
                <Card className={`overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 border-none bg-gradient-to-br from-background to-muted/30 dark:to-muted/10 group`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">{title}</CardTitle>
                        <div className={`p-2 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform`}>
                            {icon}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div className="text-4xl font-black tracking-tighter">{value}</div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mb-1">
                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                {trend}
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "70%" }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full bg-blue-600 rounded-full`}
                            />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    )
}
