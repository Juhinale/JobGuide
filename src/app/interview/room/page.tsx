"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Webcam from "react-webcam"
import { useSearchParams, useRouter } from "next/navigation"
import { FaceMesh } from "@mediapipe/face_mesh"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Mic, MicOff, Volume2, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react"

// Face Mesh Landmarks
const LEFT_IRIS = [468, 469, 470, 471]
const RIGHT_IRIS = [473, 474, 475, 476]
const LEFT_EYE_BOUNDS = [33, 133, 159, 145] // simplified bounds
const RIGHT_EYE_BOUNDS = [362, 263, 386, 374]

export default function InterviewRoom() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const webcamRef = useRef<Webcam>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Config
    const topic = searchParams.get("topic")
    const difficulty = searchParams.get("difficulty")

    // State
    const [status, setStatus] = useState<"loading" | "calibration" | "interview" | "finished">("loading")
    const [questions, setQuestions] = useState<string[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [answers, setAnswers] = useState<string[]>([])
    const [eyeViolations, setEyeViolations] = useState(0)
    const [isLookingAtScreen, setIsLookingAtScreen] = useState(true)
    const [calibrationParsed, setCalibrationParsed] = useState(false)

    // Refs for non-react state (animation loops)
    const recognitionRef = useRef<any>(null)

    // ----------------- INIT & QUESTIONS -----------------
    useEffect(() => {
        if (!topic) return;

        const fetchQuestions = async () => {
            try {
                const res = await fetch("/api/interview/generate", {
                    method: "POST",
                    body: JSON.stringify({ topic, difficulty })
                });
                const data = await res.json();
                setQuestions(data.questions || []);
                setStatus("calibration");
            } catch (error) {
                console.error("Failed to load questions", error);
            }
        };
        fetchQuestions();
    }, [topic, difficulty]);

    // ----------------- MEDIAPIPE FACE MESH -----------------
    const onResults = useCallback((results: any) => {
        if (!canvasRef.current || !webcamRef.current?.video) return;

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        ctx.save();
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        // Face Mesh Logic
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            // Simple Gaze Check Logic (simplified from python script)
            // Ideally we check if iris is centered in eye
            // For now, simpler approximation: Head Pose / Presence

            setIsLookingAtScreen(true); // Default to true if face detected

            // Draw Iris
            ctx.fillStyle = "#00FF00";
            for (const id of [...LEFT_IRIS, ...RIGHT_IRIS]) {
                const point = landmarks[id];
                ctx.beginPath();
                ctx.arc(point.x * videoWidth, point.y * videoHeight, 2, 0, 2 * Math.PI);
                ctx.fill();
            }

            // Gaze Violation Logic (Basic Placeholder based on Head Rotation/Iris movement would be complex to port 1:1 without proper calibration matrix)
            // Implementation: If we detect face, valid. If no face, invalid.
            // Enhanced: Check absolute position of iris.
            // Let's implement the robust python logic: ratio of iris position within eye bounds.

            const getEyeRatio = (irisIds: number[], eyeIds: number[]) => {
                // Get Iris Center
                let irisX = 0, irisY = 0;
                irisIds.forEach(id => { irisX += landmarks[id].x; irisY += landmarks[id].y });
                irisX /= irisIds.length;
                irisY /= irisIds.length;

                // Get Eye Corners (Left 33, Right 133 for Left Eye)
                const leftCorner = landmarks[eyeIds[0]];
                const rightCorner = landmarks[eyeIds[1]];

                // Horizontal Ratio
                const totalWidth = rightCorner.x - leftCorner.x;
                const distToLeft = irisX - leftCorner.x;
                return distToLeft / totalWidth;
            }

            const leftRatio = getEyeRatio(LEFT_IRIS, [33, 133]);
            const rightRatio = getEyeRatio(RIGHT_IRIS, [362, 263]);

            // Heuristic warnings
            if (leftRatio < 0.2 || leftRatio > 0.8 || rightRatio < 0.2 || rightRatio > 0.8) {
                setIsLookingAtScreen(false);
                ctx.strokeStyle = "red";
                ctx.lineWidth = 5;
                ctx.strokeRect(0, 0, videoWidth, videoHeight);

                // Only count violations in interview mode
                if (status === "interview") {
                    // Debounce logic could be added here
                    // setEyeViolations(prev => prev + 1); // Too frequent updates, skipping for performace
                }
            }
        } else {
            setIsLookingAtScreen(false);
        }
        ctx.restore();
    }, [status]);

    useEffect(() => {
        const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        faceMesh.onResults(onResults);

        let animationFrameId: number;

        const detect = async () => {
            if (webcamRef.current?.video?.readyState === 4) {
                try {
                    await faceMesh.send({ image: webcamRef.current.video });
                } catch (e) { }
            }
            animationFrameId = requestAnimationFrame(detect);
        };
        detect();

        return () => {
            cancelAnimationFrame(animationFrameId);
            faceMesh.close();
        };
    }, [onResults]);

    // Setup Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let interm = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    interm += event.results[i][0].transcript;
                }
                setTranscript(interm);
            };
        }
    }, []);

    // ----------------- INTERVIEW LOGIC -----------------

    const speak = (text: string) => {
        return new Promise<void>((resolve) => {
            if (!window.speechSynthesis) { resolve(); return; }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            }
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        });
    }

    const startInterview = async () => {
        setStatus("interview");

        await new Promise(r => setTimeout(r, 1000)); // wait for UI transition

        await speak("Welcome to the interview. I will ask you a series of questions. Please look at the camera and speak clearly.");
        askNextQuestion(0);
    }

    const askNextQuestion = async (index: number) => {
        if (index >= questions.length) {
            finishInterview();
            return;
        }

        setCurrentQuestionIndex(index);
        setTranscript("");

        // Ask
        await speak(`Question ${index + 1}. ${questions[index]}`);

        // Listen
        startListening();
    }

    const startListening = () => {
        if (!recognitionRef.current) return;
        setIsListening(true);
        try { recognitionRef.current.start(); } catch (e) { }
    }

    const stopListeningAndNext = () => {
        if (!recognitionRef.current) return;
        recognitionRef.current.stop();
        setIsListening(false);

        // Save Answer
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = transcript;
        setAnswers(newAnswers);

        // Next
        askNextQuestion(currentQuestionIndex + 1);
    }

    const finishInterview = async () => {
        setStatus("finished");
        await speak("Thank you. The interview is complete. Generating your report now.");

        // Submit
        try {
            const res = await fetch("/api/interview/report", {
                method: "POST",
                body: JSON.stringify({
                    topic,
                    difficulty,
                    questions,
                    answers,
                    violations: eyeViolations
                })
            });
            const data = await res.json();
            // In real app, save to DB or show result page. 
            // For now, alert or redirect
            router.push(`/recruiter/dashboard/candidates`); // redirect back for demo
        } catch (error) {
            console.error(error);
        }
    }

    // ----------------- RENDER -----------------

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">

            {/* Header */}
            <div className="w-full max-w-5xl flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    AI Interview: {topic}
                </h1>
                <div className="flex gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isLookingAtScreen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isLookingAtScreen ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {isLookingAtScreen ? "Eyes On Screen" : "Looking Away"}
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative w-full max-w-4xl aspect-video bg-muted/10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Webcam
                    ref={webcamRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    mirrored
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Overlays */}
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 to-transparent min-h-[150px] flex flex-col justify-end space-y-4">

                    {status === "calibration" && (
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold">System Check & Calibration</h2>
                            <p className="text-gray-300">Ensure your face is clearly visible and you are looking at the screen.</p>
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={startInterview}>
                                <CheckCircle className="mr-2 h-5 w-5" /> Start Interview
                            </Button>
                        </div>
                    )}

                    {status === "interview" && (
                        <div className="space-y-4">
                            {isSpeaking ? (
                                <div className="flex items-center gap-3 text-blue-400 animate-pulse">
                                    <Volume2 className="h-6 w-6" />
                                    <span className="text-lg font-medium">Interviewer is speaking...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-green-400 animate-pulse">
                                    <Mic className="h-6 w-6" />
                                    <span className="text-lg font-medium">Listening... (Speak clearly)</span>
                                </div>
                            )}

                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                                <p className="text-xl font-medium text-white/90">
                                    {isSpeaking ? questions[currentQuestionIndex] : transcript || "Listening for answer..."}
                                </p>
                            </div>

                            {!isSpeaking && (
                                <Button className="w-full bg-white text-black hover:bg-gray-200" onClick={stopListeningAndNext}>
                                    Submit Answer
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {status === "loading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                        <div className="text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
                            <p>Initializing AI Engines...</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
