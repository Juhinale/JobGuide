"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, Download, Zap, TrendingUp, Clock, Target, Award, BrainCircuit } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts'

export default function ReportPage() {
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

    // Mock Data for Professional Charts
    const engagementData = [
        { name: 'Mon', hours: 4.2, focus: 85 },
        { name: 'Tue', hours: 6.5, focus: 92 },
        { name: 'Wed', hours: 3.8, focus: 78 },
        { name: 'Thu', hours: 7.0, focus: 95 },
        { name: 'Fri', hours: 5.5, focus: 88 },
        { name: 'Sat', hours: 8.2, focus: 96 },
        { name: 'Sun', hours: 4.0, focus: 80 },
    ]

    const skillRadarData = [
        { subject: 'Algorithms', A: 120, fullMark: 150 },
        { subject: 'Sys Design', A: 98, fullMark: 150 },
        { subject: 'Database', A: 86, fullMark: 150 },
        { subject: 'Frontend', A: 99, fullMark: 150 },
        { subject: 'Backend', A: 85, fullMark: 150 },
        { subject: 'Security', A: 65, fullMark: 150 },
    ]

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
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                        Weekly Focus & Performance
                    </h1>
                    <p className="text-muted-foreground">Comprehensive analysis of your coding momentum and cognitive load.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        This Week
                    </Button>
                    <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 border-none text-white shadow-md hover:shadow-lg transition-all">
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </motion.div>

            {/* High-Level Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Deep Work Hours"
                    value="39.2h"
                    change="+4.5h vs last week"
                    icon={<Clock className="h-5 w-5 text-indigo-500" />}
                    delay={0.1}
                    trend="up"
                />
                <MetricCard
                    title="Problem Solving Velocity"
                    value="12/day"
                    change="+20% efficiency"
                    icon={<Zap className="h-5 w-5 text-yellow-500" />}
                    delay={0.2}
                    trend="up"
                />
                <MetricCard
                    title="Interview Readiness"
                    value="78%"
                    change="Solid Mid-Level"
                    icon={<Target className="h-5 w-5 text-green-500" />}
                    delay={0.3}
                    trend="neutral"
                />
                <MetricCard
                    title="Cognitive Load"
                    value="Optimal"
                    change="Peak Focus: 10AM"
                    icon={<BrainCircuit className="h-5 w-5 text-pink-500" />}
                    delay={0.4}
                    trend="up"
                />
            </div>

            {/* Main Analytical Section */}
            <div className="grid gap-6 md:grid-cols-7">

                {/* User Engagement (Area Chart) */}
                <motion.div variants={item} className="md:col-span-4 lg:col-span-5 h-full">
                    <Card className="h-full border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Session Engagement & Focus</CardTitle>
                            <CardDescription>Correlation between hours spent and focus intensity score (0-100).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={engagementData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                        />
                                        <Legend iconType="circle" />
                                        <Area type="monotone" dataKey="hours" name="Coding Hours" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                                        <Area type="monotone" dataKey="focus" name="Focus Score" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Skill Radar */}
                <motion.div variants={item} className="md:col-span-3 lg:col-span-2 h-full">
                    <Card className="h-full border-none bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 shadow-md">
                        <CardHeader>
                            <CardTitle>Skill Competency</CardTitle>
                            <CardDescription>Relative strengths across domains.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-0">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillRadarData}>
                                        <PolarGrid stroke="#94a3b8" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar
                                            name="My Skills"
                                            dataKey="A"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            fill="#8b5cf6"
                                            fillOpacity={0.4}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Professional Insights Checkpoints */}
            <div className="grid gap-6 md:grid-cols-2">
                <motion.div variants={item}>
                    <Card className="h-full border-l-4 border-l-green-500 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Award className="h-5 w-5 text-green-600" />
                                Key Professional Milestones
                            </CardTitle>
                            <CardDescription>Achievements unlocked this week</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                                <div>
                                    <p className="font-semibold text-sm">System Design Mastery</p>
                                    <p className="text-xs text-muted-foreground">Successfully designed a scalable detailed URL shortener system.</p>
                                </div>
                            </div>
                            <div className="border-l border-slate-200 dark:border-slate-800 ml-1 pl-7 py-1" />
                            <div className="flex gap-4">
                                <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                                <div>
                                    <p className="font-semibold text-sm">Consistency King</p>
                                    <p className="text-xs text-muted-foreground">Maintained a 4-hour daily average for 7 consecutive days.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="h-full border-l-4 border-l-orange-500 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                                Growth Opportunities
                            </CardTitle>
                            <CardDescription>AI-identified areas for refinement</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md border border-orange-100 dark:border-orange-900/50">
                                <h4 className="flex items-center gap-2 font-medium text-sm text-orange-800 dark:text-orange-200">
                                    <Clock className="h-3 w-3" /> Time Complexity Analysis
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 ml-5">
                                    You often skip the Big-O explanation in mock interviews.
                                    <span className="underline cursor-pointer ml-1">Practice drills available.</span>
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-100 dark:border-blue-900/50">
                                <h4 className="flex items-center gap-2 font-medium text-sm text-blue-800 dark:text-blue-200">
                                    <Target className="h-3 w-3" /> Graph Traversal
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 ml-5">
                                    Efficiency score on BFS problems is 15% lower than DFS. Consider reviewing BFS patterns.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}

function MetricCard({ title, value, change, icon, delay, trend }: { title: string, value: string, change: string, icon: any, delay: number, trend: 'up' | 'down' | 'neutral' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
        >
            <Card className="hover:shadow-md transition-shadow cursor-default">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            {icon}
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-bold">{value}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                            {change}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
