"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, User, Zap, Mail, Phone, Calendar, ArrowUpRight, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from "firebase/auth";

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDomain, setSelectedDomain] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchApplicants = async (user: any) => {
            setLoading(true);
            try {
                // Fetch applicants specifically for this recruiter's jobs
                const response = await fetch('/api/recruiter/applicants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recruiterUid: user.uid })
                });

                if (response.ok) {
                    const data = await response.json();
                    setCandidates(data);
                } else {
                    console.error("Failed to fetch applicants");
                }
            } catch (error) {
                console.error("Error fetching candidates:", error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchApplicants(user);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const filteredCandidates = candidates.filter(candidate =>
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Talent Pool</h1>
                    <p className="text-muted-foreground">Manage and review applicants with AI-powered domain relevance scoring.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl border-dashed">
                        Export List
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 rounded-xl font-bold">
                        Add Candidate
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-border/50">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                className="flex h-11 w-full rounded-xl border-none bg-background pl-10 pr-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Search candidates by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
                            <span className="text-sm font-bold text-muted-foreground whitespace-nowrap uppercase tracking-widest text-[10px]">Filter by Domain</span>
                            <select
                                className="flex h-10 w-full sm:w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                            >
                                <option value="all">All Domains</option>
                                <option value="Frontend Developer">Frontend Developer</option>
                                <option value="Backend Developer">Backend Developer</option>
                                <option value="Fullstack Developer">Fullstack Developer</option>
                                <option value="AI/ML Engineer">AI/ML Engineer</option>
                                <option value="Data Scientist">Data Scientist</option>
                                <option value="Mobile Developer">Mobile Developer</option>
                            </select>
                        </div>
                    </div>

                    <Card className="border-none shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/20">
                        <CardHeader className="bg-muted/10 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-500" />
                                Ranked Applicants
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                                    <p className="text-muted-foreground font-medium animate-pulse">Syncing with AI Engines...</p>
                                </div>
                            ) : filteredCandidates.length === 0 ? (
                                <div className="py-20 text-center space-y-4">
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground font-bold text-xl">No candidates match your criteria</p>
                                    <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedDomain("all") }} className="text-blue-500">Clear all filters</Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    <AnimatePresence mode="popLayout">
                                        {filteredCandidates.map((candidate, index) => (
                                            <motion.div
                                                layout
                                                variants={item}
                                                initial="hidden"
                                                animate="show"
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                key={candidate.id}
                                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-blue-500/[0.02] transition-colors relative"
                                            >
                                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                                    <div className="relative">
                                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center font-black text-xl text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shadow-sm transition-transform group-hover:scale-110">
                                                            {candidate.name[0]}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-lg bg-background border-2 border-background flex items-center justify-center">
                                                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-extrabold text-lg truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{candidate.name}</h3>
                                                            <Badge variant="outline" className="bg-white dark:bg-slate-900 border-border text-[10px] h-5 uppercase font-bold tracking-widest">{candidate.status}</Badge>
                                                        </div>
                                                        <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 mt-0.5">
                                                            {candidate.role} <span className="opacity-20">•</span> <Calendar className="h-3 w-3" /> {candidate.applied || "Recent"}
                                                        </p>
                                                        {candidate.feedback && (
                                                            <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1 bg-muted/30 p-1.5 rounded-lg border-l-4 border-blue-500/30">
                                                                "{candidate.feedback}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 mt-4 sm:mt-0 shrink-0">
                                                    <div className="text-right flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5">
                                                            <Zap className={cn(
                                                                "h-4 w-4 fill-current",
                                                                candidate.score >= 8.5 ? "text-green-500" : candidate.score >= 7 ? "text-blue-500" : candidate.score >= 5 ? "text-amber-500" : "text-red-500"
                                                            )} />
                                                            <span className={cn(
                                                                "font-black text-2xl tabular-nums tracking-tighter",
                                                                candidate.score >= 8.5 ? "text-green-600 dark:text-green-400" : candidate.score >= 7 ? "text-blue-600 dark:text-blue-400" : candidate.score >= 5 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                                                            )}>{candidate.score.toFixed(1)}</span>
                                                            <span className="text-[10px] font-bold text-muted-foreground mt-1">/10</span>
                                                        </div>
                                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">AI Score</div>
                                                    </div>
                                                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 h-10 font-bold shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-all">
                                                        <Link href={`/recruiter/dashboard/candidates/view/${candidate.id}${selectedDomain !== 'all' ? `?domain=${selectedDomain}` : ''}`}>
                                                            Review Profile
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden relative group">
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-400" />
                                Smart Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Top Strength</p>
                                <p className="text-sm font-medium">Majority of candidates excel in React & Typescript.</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-200 mb-1">Opportunity</p>
                                <p className="text-sm font-medium">Candidates with Next.js experience are 2x more relevant.</p>
                            </div>
                            <Button variant="ghost" className="w-full text-white hover:bg-white/10 font-bold border border-white/20">
                                View Full Analytics
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Activities</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="px-6 py-4 flex gap-4 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold">Email Sent to Dhruv</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">15 mins ago</p>
                                    </div>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full text-blue-500 font-bold h-12 rounded-none">View All Activity</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    )
}
