"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wand2, Rocket, ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function PostJobPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        type: "Full-time",
        salary: "",
        company: "Momentum AI" // Default for now
    })

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
            } else {
                // Optional: Redirect to login if absolutely needed, or just leave null
                // router.push("/login")
            }
        })
        return () => unsubscribe()
    }, [])

    const handlePublish = async () => {
        if (!formData.title || !formData.description) {
            alert("Please fill in the job title and description.")
            return
        }

        if (!user) {
            alert("Checking session... please wait a moment and try again.")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    uid: user.uid, // Send the recruiter's UID from state
                    email: user.email // Send the recruiter's email
                })
            })

            if (response.ok) {
                router.push("/recruiter/dashboard/jobs")
            } else {
                throw new Error("Failed to publish job")
            }
        } catch (error) {
            console.error(error)
            alert("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const [isAILoading, setIsAILoading] = useState(false)

    const handleAIAssist = async () => {
        if (!formData.title) {
            alert("Please enter a Job Title first so the AI knows what to generate.")
            return
        }

        setIsAILoading(true)
        try {
            const res = await fetch("/api/ai/generate-job-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    type: formData.type,
                    location: formData.location,
                    salary: formData.salary
                })
            })

            const data = await res.json()
            if (data.description) {
                setFormData(prev => ({ ...prev, description: data.description }))
            } else {
                alert("Failed to generate description. Please try again.")
            }
        } catch (error) {
            console.error(error)
            alert("Error generating description.")
        } finally {
            setIsAILoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-12"
        >
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/recruiter/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Post a New Role</h1>
                    <p className="text-muted-foreground">Reach out to thousands of top-tier candidates.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl bg-gradient-to-b from-background to-muted/20">
                        <CardHeader className="border-b bg-muted/10">
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                                Job Information
                            </CardTitle>
                            <CardDescription>Comprehensive details help attract the right talent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Job Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className="h-12 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Job Description</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={handleAIAssist}
                                        disabled={isAILoading}
                                    >
                                        {isAILoading ? (
                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Wand2 className="mr-2 h-3.5 w-3.5" />
                                        )}
                                        AI Assist
                                    </Button>
                                </div>
                                <textarea
                                    id="description"
                                    className="flex min-h-[250px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                    placeholder="Describe responsibilities, requirements, and benefits..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="e.g. Remote / New York"
                                        className="h-11"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Employment Type</Label>
                                    <select
                                        id="type"
                                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Contract</option>
                                        <option>Internship</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="salary" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Salary Range</Label>
                                <Input
                                    id="salary"
                                    placeholder="e.g. $120k - $150k"
                                    className="h-11"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-3 border-t bg-muted/10 pt-4">
                            <Button variant="ghost" className="hover:bg-red-50 hover:text-red-600 font-bold" disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePublish}
                                className="bg-blue-600 hover:bg-blue-700 px-8 py-6 rounded-xl text-lg font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="mr-2 h-5 w-5" /> Publish Job
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-blue-600 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Rocket className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg">Tips for Success</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-blue-50 text-sm">
                            <div className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</div>
                                <p>Be specific about the role and expectations.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</div>
                                <p>List 3-5 key performance indicators.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</div>
                                <p>Describe your company culture briefly.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-3">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold uppercase text-[10px] tracking-widest">
                            <AlertCircle className="h-4 w-4" />
                            AI Compliance Check
                        </div>
                        <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                            Our AI will scan your job description for bias and clarity before publishing to ensure maximum reach.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
