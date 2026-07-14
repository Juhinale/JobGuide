"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, DollarSign, Building2, Search, Filter, CheckCircle2, Loader2, X } from "lucide-react"

import { auth } from "@/lib/firebase"

export default function JobsPage() {
    const [jobs, setJobs] = useState<any[]>([])
    const [isLoadingJobs, setIsLoadingJobs] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [applyingJob, setApplyingJob] = useState<any>(null)
    const [isApplying, setIsApplying] = useState(false)
    const [justApplied, setJustApplied] = useState<number[]>([])

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/jobs")
            const data = await res.json()
            // Combine with some of the nice colored mock logos if missing
            const enrichedData = data.map((job: any, i: number) => ({
                ...job,
                logo: job.logo || job.title.substring(0, 2).toUpperCase(),
                color: job.color || ["bg-blue-600", "bg-purple-600", "bg-indigo-600", "bg-pink-600", "bg-emerald-600"][i % 5],
                tags: job.tags || ["AI-Ranked", "Active"]
            }))
            setJobs(enrichedData)
        } catch (error) {
            console.error("Failed to fetch jobs:", error)
        } finally {
            setIsLoadingJobs(false)
        }
    }

    useEffect(() => {
        fetchJobs()
    }, [])

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsApplying(true)

        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Please log in to apply");
                setIsApplying(false);
                return;
            }

            const res = await fetch('/api/applications/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: applyingJob.id,
                    applicantUid: user.uid,
                    coverNote: (e.target as any).coverNote?.value || ""
                })
            });

            if (res.ok) {
                setJustApplied(prev => [...prev, applyingJob.id])
                setApplyingJob(null)
            } else {
                const err = await res.json();
                alert(err.error || "Failed to apply");
            }
        } catch (error) {
            console.error("Application error:", error);
            alert("An error occurred while applying.");
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                        Discover Opportunities
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Curated roles specifically matched with your skills and Momentum profile.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search jobs, skills, or companies..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-xl shrink-0">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {isLoadingJobs ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
                    ))
                ) : jobs.filter(job =>
                    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (job.tags && job.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())))
                ).length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                        <p className="text-muted-foreground">No jobs found matching your search.</p>
                    </div>
                ) : (
                    jobs.filter(job =>
                        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (job.tags && job.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())))
                    ).map((job) => (
                        <Card key={job.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-14 w-14 rounded-2xl ${job.color} flex items-center justify-center text-white font-bold text-xl shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                        {job.logo}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{job.title}</CardTitle>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md font-medium">{job.type}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground font-medium">
                                            <div className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {job.company}</div>
                                            <span className="text-slate-300">•</span>
                                            <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location}</div>
                                        </div>
                                    </div>
                                </div>

                                {justApplied.includes(job.id) ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 py-2 px-4 rounded-full flex gap-2">
                                        <CheckCircle2 className="h-4 w-4" /> Applied
                                    </Badge>
                                ) : (
                                    <Button
                                        onClick={() => setApplyingJob(job)}
                                        className="bg-slate-900 hover:bg-primary text-white dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-primary dark:hover:text-white rounded-full px-6 transition-all shadow-md active:scale-95"
                                    >
                                        Quick Apply
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        {job.tags && job.tags.map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-lg">
                                        <DollarSign className="h-5 w-5 text-emerald-500" />
                                        {job.salary}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Quick Apply Modal */}
            {applyingJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setApplyingJob(null)} />
                    <Card className="relative w-full max-w-lg shadow-2xl border-primary/20 transform animate-in fade-in zoom-in duration-200">
                        <form onSubmit={handleApply}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg ${applyingJob.color} flex items-center justify-center text-white font-bold`}>
                                            {applyingJob.logo}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Apply to {applyingJob.company}</CardTitle>
                                            <CardDescription>{applyingJob.title}</CardDescription>
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setApplyingJob(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                                    <p className="text-sm text-primary font-medium flex gap-2 items-center">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Momentum will use your optimized profile & AI-rated resume.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold">Full Name</label>
                                    <input required className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" defaultValue={auth.currentUser?.displayName || ""} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold">Email Address</label>
                                    <input required type="email" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" defaultValue={auth.currentUser?.email || ""} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold">Cover Note (Optional)</label>
                                    <textarea name="coverNote" className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Briefly explain why you're a great fit..." />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11" disabled={isApplying}>
                                    {isApplying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting Application...
                                        </>
                                    ) : (
                                        "Confirm & Submit Application"
                                    )}
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                                    Trusted by top tier companies
                                </p>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}


