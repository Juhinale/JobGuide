"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Briefcase, CheckCircle2, ChevronRight, FileText, Globe, LineChart, Lock, Search, Target, TrendingUp, AlertCircle, Sparkles, Clock } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell
} from 'recharts'

export default function AnalysisPage() {
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

    // Comparison Data: User vs Job Requirement
    const radarData = [
        { skill: 'Data Structures', user: 80, required: 90, fullMark: 100 },
        { skill: 'System Design', user: 45, required: 85, fullMark: 100 },
        { skill: 'Database', user: 70, required: 75, fullMark: 100 },
        { skill: 'Cloud (AWS)', user: 30, required: 70, fullMark: 100 },
        { skill: 'React/Next.js', user: 95, required: 80, fullMark: 100 },
        { skill: 'Communication', user: 85, required: 80, fullMark: 100 },
    ]

    // Market Demand vs User Readiness
    const marketData = [
        { role: 'Frontend', readiness: 92, demand: 85 },
        { role: 'Backend', readiness: 65, demand: 90 },
        { role: 'Full Stack', readiness: 78, demand: 95 },
        { role: 'DevOps', readiness: 40, demand: 75 },
    ]


    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <motion.div
            className="space-y-8 max-w-7xl mx-auto pb-10"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1 text-sm group">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Career Fit Analysis
                    </h1>
                    <p className="text-muted-foreground">AI-driven gap analysis against your target role: <strong className="text-foreground">Senior Full Stack Engineer</strong></p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Market Status: Hiring Active
                    </Badge>
                </div>
            </motion.div>

            {/* Top Level Fit Score */}
            <motion.div variants={item}>
                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
                                <Sparkles className="mr-2 h-3 w-3" /> AI Analysis Ready
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">You are a <span className="text-blue-400">72% Match</span> for your target role.</h2>
                            <p className="text-slate-300 text-lg leading-relaxed">
                                Your frontend skills are top-tier (Top 5%), but your <strong>System Design</strong> knowledge fits a Mid-level profile rather than Senior. Bridging this gap is your fastest route to a promotion or new offer.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                                    Generate Study Plan
                                </Button>
                                <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                                    Update Resume
                                </Button>
                            </div>
                        </div>

                        {/* Circular Progress Visual */}
                        <div className="relative h-40 w-40 flex-shrink-0 flex items-center justify-center">
                            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                                <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                <circle
                                    className="text-blue-500 transition-all duration-1000 ease-out"
                                    strokeWidth="8"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * 72) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-bold">72%</span>
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">Ready</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Gap Analysis Chart */}
                <motion.div variants={item} className="h-full">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Skill Gap Visualization</CardTitle>
                            <CardDescription>
                                <span className="text-blue-500 font-medium">Blue: Your Level</span> vs <span className="text-slate-400 font-medium">Grey: Job Requirement</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                        <PolarGrid strokeOpacity={0.2} />
                                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Required" dataKey="required" stroke="#94a3b8" strokeWidth={2} fill="#94a3b8" fillOpacity={0.1} />
                                        <Radar name="You" dataKey="user" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.4} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Readiness by Role Bar Chart */}
                <motion.div variants={item} className="h-full">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Role Readiness Index</CardTitle>
                            <CardDescription>How you stack up against different market roles</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={marketData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis dataKey="role" type="category" width={80} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                        <Bar dataKey="readiness" name="Readiness %" barSize={32} radius={[0, 4, 4, 0]}>
                                            {marketData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.readiness > 80 ? '#22c55e' : entry.readiness > 60 ? '#3b82f6' : '#f59e0b'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center text-sm text-muted-foreground mt-2">
                                Calculated based on 500+ recent job descriptions.
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Dynamic Action Plan */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-red-500" />
                            Critical Action Plan
                        </CardTitle>
                        <CardDescription>Steps to close your 28% gap for "Senior Full Stack Engineer"</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="urgent" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="urgent" className="px-6">Urgent Gaps</TabsTrigger>
                                <TabsTrigger value="recommended" className="px-6">Recommended</TabsTrigger>
                                <TabsTrigger value="bonus" className="px-6">Bonus Skills</TabsTrigger>
                            </TabsList>

                            <TabsContent value="urgent" className="space-y-4">
                                <ActionItem
                                    skill="System Design: Scalability"
                                    desc="Unlock 'Senior' status by mastering distributed caching and load balancing."
                                    impact="High"
                                    time="~12 Hours"
                                />
                                <ActionItem
                                    skill="Cloud Infrastructure (AWS)"
                                    desc="Practical experience with ECS/EKS and Lambda is missing from your profile."
                                    impact="High"
                                    time="~15 Hours"
                                />
                            </TabsContent>

                            <TabsContent value="recommended" className="space-y-4">
                                <ActionItem
                                    skill="Advanced SQL Optimization"
                                    desc="Learn indexing strategies to improve query performance."
                                    impact="Medium"
                                    time="~5 Hours"
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}

function ActionItem({ skill, desc, impact, time }: { skill: string, desc: string, impact: string, time: string }) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors bg-card">
            <div className="flex items-start gap-4">
                <div className="mt-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-full">
                    <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                    <h4 className="font-semibold text-base">{skill}</h4>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2 min-w-[100px]">
                <Badge variant={impact === 'High' ? 'destructive' : 'secondary'}>{impact} Impact</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {time}
                </span>
            </div>
        </div>
    )
}
