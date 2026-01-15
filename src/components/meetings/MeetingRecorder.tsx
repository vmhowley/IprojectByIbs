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

    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/aac',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getSupportedMimeType();

            console.log('Using mimeType for recording:', mimeType);

            const options = mimeType ? { mimeType } : {};
            mediaRecorderRef.current = new MediaRecorder(stream, options);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || mimeType || 'audio/webm' });
                console.log('Recording stopped. Blob size:', blob.size, 'type:', blob.type);
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
            const isMedia = file.type.startsWith('audio/') || file.type.startsWith('video/');
            const hasMediaExt = /\.(webm|mp3|mp4|m4a|wav|ogg|mkv|mov|avi|wma|aac|flac)$/i.test(file.name);

            if (!isMedia && !hasMediaExt) {
                toast.error('El archivo no parece ser audio o video válido.');
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
            // Determine file extension based on mimeType
            let fileExt = 'webm';
            if (audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a')) fileExt = 'm4a';
            else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) fileExt = 'mp3';
            else if (audioBlob.type.includes('wav')) fileExt = 'wav';
            else if (audioBlob.type.includes('aac')) fileExt = 'aac';

            const file = new File([audioBlob], `recording.${fileExt}`, { type: audioBlob.type });
            const audioPath = await meetingService.uploadRecording(file);

            const aiResult = await aiService.processMeetingAudio(audioBlob);

            await meetingService.create({
                title,
                date: new Date().toISOString(),
                audio_url: audioPath,
                summary: aiResult.summary,
                action_items: aiResult.action_items,
                transcription: aiResult.transcription
            });

            toast.dismiss(loadingToast);
            toast.success('Reunión guardada y procesada correctamente');
            navigate('/meetings');
        } catch (error) {
            console.error('Error processing meeting:', error);
            toast.dismiss(loadingToast);
            toast.error('Error al procesar la reunión con IA');
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto">
            <div className="space-y-8">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Título de la Reunión</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Daily Standup de Ingeniería"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    {!audioBlob ? (
                        <>
                            {isRecording ? (
                                <div className="text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 animate-ping bg-red-100 rounded-full scale-150 opacity-75"></div>
                                        <div className="relative bg-red-500 text-white p-4 rounded-full">
                                            <Mic className="w-10 h-10" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-mono text-slate-900 mb-8 tracking-wider">{formatTime(recordingTime)}</div>
                                    <button
                                        onClick={stopRecording}
                                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl flex items-center gap-2 mx-auto transition-all shadow-lg hover:shadow-red-500/20"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                        <span className="font-semibold">Detener Grabación</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <button
                                        onClick={startRecording}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-6 mb-2 transition-all hover:scale-110 shadow-lg hover:shadow-emerald-500/20 group"
                                    >
                                        <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <div>
                                        <p className="text-slate-900 font-semibold text-lg">Empezar a grabar</p>
                                        <p className="text-slate-500 text-sm mt-1">Asegúrate de permitir el acceso al micrófono</p>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-300 py-2">
                                        <div className="h-px flex-1 bg-slate-200"></div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">O</div>
                                        <div className="h-px flex-1 bg-slate-200"></div>
                                    </div>

                                    <label className="inline-block cursor-pointer group">
                                        <input
                                            type="file"
                                            accept="audio/*,video/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all font-medium">
                                            <Upload className="w-4 h-4" />
                                            Subir archivo existente
                                        </div>
                                    </label>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center w-full">
                            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl mb-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={togglePlayback}
                                        className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                    </button>
                                    <div className="text-left">
                                        <p className="text-slate-900 font-semibold text-sm">Grabación lista</p>
                                        <p className="text-slate-500 text-xs">{(audioBlob.size / (1024 * 1024)).toFixed(2)} MB • {audioBlob.type || 'audio/media'}</p>
                                    </div>
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
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Eliminar"
                                >
                                    <Square className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={processing}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="font-semibold text-lg">Procesando con IA...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-6 h-6" />
                                        <span className="font-semibold text-lg">Guardar y Procesar Reunión</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    La IA generará automáticamente un resumen y lista de tareas.
                </div>
            </div>
        </div>
    );
}
