import { Loader2, Mic, Pause, Play, Save, Square, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/aiService';
import { meetingService } from '../../services/meetingService';

export function MeetingRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [title, setTitle] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const navigate = useNavigate();

    // Audio Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // webm is standard for MediaRecorder
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.error('No se pudo acceder al micrófono');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Relaxed validation for testing: Accept almost any audio/video
            // Log for debugging but allow it

            const isMedia = file.type.startsWith('audio/') || file.type.startsWith('video/');
            const hasMediaExt = /\.(webm|mp3|mp4|m4a|wav|ogg|mkv|mov|avi|wma|aac|flac)$/i.test(file.name);

            if (!isMedia && !hasMediaExt) {
                // Only block if it looks completely wrong (like a PDF or image)
                toast.error('El archivo no parece ser audio o video válido.');
                console.warn('Rejected file type:', file.type, file.name);
                return;
            }

            setAudioBlob(file);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Por favor ingresa un título para la reunión');
            return;
        }
        if (!audioBlob) {
            toast.error('No hay grabación o archivo de audio');
            return;
        }

        setProcessing(true);
        const loadingToast = toast.loading('Procesando audio con IA...');

        try {
            // 1. Upload to Supabase Storage
            // Convert Blob to File
            const fileExt = audioBlob.type.includes('mp3') ? 'mp3' : 'webm';
            const file = new File([audioBlob], `recording.${fileExt}`, { type: audioBlob.type });
            const audioPath = await meetingService.uploadRecording(file);

            // 2. Process with AI
            const aiResult = await aiService.processMeetingAudio(audioBlob);

            // 3. Save to Database
            await meetingService.create({
                title,
                date: new Date().toISOString(),
                audio_url: audioPath,
                summary: aiResult.summary,
                action_items: aiResult.actionItems,
                transcription: aiResult.transcription // Assuming AI returns this
            });

            toast.dismiss(loadingToast);
            toast.success('Reunión guardada y procesada correctamente');
            navigate('/meetings');
        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error('Error al procesar la reunión');
        } finally {
            setProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlayback = () => {
        if (!audioRef.current && audioBlob) {
            const url = URL.createObjectURL(audioBlob);
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };


    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Título de la Reunión</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Daily Standup de Ingeniería"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                    {!audioBlob ? (
                        <>
                            {isRecording ? (
                                <div className="text-center">
                                    <div className="animate-pulse text-red-500 mb-4">
                                        <Mic className="w-12 h-12 mx-auto" />
                                    </div>
                                    <div className="text-2xl font-mono text-white mb-6">{formatTime(recordingTime)}</div>
                                    <button
                                        onClick={stopRecording}
                                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full flex items-center gap-2 mx-auto transition-colors"
                                    >
                                        <Square className="w-4 h-4" />
                                        Detener Grabación
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <button
                                        onClick={startRecording}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 mb-2 transition-transform hover:scale-105"
                                    >
                                        <Mic className="w-8 h-8" />
                                    </button>
                                    <p className="text-slate-400">Haz clic para empezar a grabar</p>
                                    <div className="text-slate-600 text-sm">- O -</div>
                                    <label className="inline-block cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors">
                                        <input
                                            type="file"
                                            accept="audio/*,video/*,.mkv,.mov,.avi,.wmv,.flac"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            Subir archivo de audio
                                        </div>
                                    </label>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center w-full">
                            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg mb-4">
                                <div className="flex items-center gap-3">
                                    <button onClick={togglePlayback} className="p-2 bg-slate-700 rounded-full text-white hover:bg-slate-600">
                                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <span className="text-slate-300 text-sm">Grabación lista</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setAudioBlob(null);
                                        setRecordingTime(0);
                                        if (audioRef.current) {
                                            audioRef.current.pause();
                                            audioRef.current = null;
                                        }
                                        setIsPlaying(false);
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={processing}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Procesando con IA...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Guardar y Procesar Reunión
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-xs text-slate-500 text-center">
                    La IA generará automáticamente un resumen y lista de tareas.
                </div>
            </div>
        </div>
    );
}
