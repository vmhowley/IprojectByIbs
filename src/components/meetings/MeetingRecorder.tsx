import { KeyRound, Mic, Pause, Play, Square, Trash2, Upload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/aiService';
import { meetingService } from '../../services/meetingService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

/** The minutes form: a title and the audio; the AI writes the rest. */
export function MeetingRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [title, setTitle] = useState('');
    const [titleError, setTitleError] = useState<string | undefined>();
    const [askKey, setAskKey] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const navigate = useNavigate();

    // Audio Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Leaving the page turns the microphone off and stops playback.
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            streamRef.current?.getTracks().forEach(track => track.stop());
            if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioRef.current.src);
            }
        };
    }, []);

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
        if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            toast.error('Este navegador no puede grabar audio. Sube un archivo.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mimeType = getSupportedMimeType();

            const options = mimeType ? { mimeType } : {};
            mediaRecorderRef.current = new MediaRecorder(stream, options);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || mimeType || 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setRecordingTime(0);
            setIsRecording(true);

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.error('No se pudo usar el micrófono. Revisa el permiso del navegador.');
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
        e.target.value = '';
        if (file) {
            const isMedia = file.type.startsWith('audio/') || file.type.startsWith('video/');
            const hasMediaExt = /\.(webm|mp3|mp4|m4a|wav|ogg|mkv|mov|avi|wma|aac|flac)$/i.test(file.name);

            if (!isMedia && !hasMediaExt) {
                toast.error('El archivo no parece ser audio o video.');
                return;
            }

            setAudioBlob(file);
        }
    };

    const discardAudio = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        if (audioRef.current) {
            audioRef.current.pause();
            URL.revokeObjectURL(audioRef.current.src);
            audioRef.current = null;
        }
        setIsPlaying(false);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setTitleError('Escribe un título para la reunión.');
            return;
        }
        if (!audioBlob) {
            toast.error('Graba la reunión o sube un archivo primero.');
            return;
        }
        // The key lives only in this browser. Ask for it here, not in a prompt.
        if (!aiService.hasKey()) {
            setAskKey(true);
            return;
        }

        setProcessing(true);
        const loadingToast = toast.loading('Procesando el audio con IA…');

        try {
            // The AI goes first: if it fails, nothing was uploaded and the audio is still here to retry.
            const aiResult = await aiService.processMeetingAudio(audioBlob);

            // Determine file extension based on mimeType
            let fileExt = 'webm';
            if (audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a')) fileExt = 'm4a';
            else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) fileExt = 'mp3';
            else if (audioBlob.type.includes('wav')) fileExt = 'wav';
            else if (audioBlob.type.includes('aac')) fileExt = 'aac';

            const file = new File([audioBlob], `recording.${fileExt}`, { type: audioBlob.type });
            const audioPath = await meetingService.uploadRecording(file);

            const created = await meetingService.create({
                title: title.trim(),
                date: new Date().toISOString(),
                audio_url: audioPath,
                summary: aiResult.summary,
                action_items: aiResult.action_items,
                transcription: aiResult.transcription
            });

            toast.dismiss(loadingToast);
            toast.success('Reunión guardada');
            navigate(`/meetings/${created.id}`);
        } catch (error) {
            console.error('Error processing meeting:', error);
            toast.dismiss(loadingToast);
            toast.error('No se pudo procesar la reunión. El audio sigue aquí para intentarlo de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    const saveKeyAndContinue = () => {
        if (!apiKey.trim()) return;
        aiService.setApiKey(apiKey.trim());
        setApiKey('');
        setAskKey(false);
        handleSave();
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

    const fileName = audioBlob instanceof File ? audioBlob.name : `Grabación de ${formatTime(recordingTime)}`;

    return (
        <Card padding="none" className="max-w-2xl">
            <div className="space-y-5 p-5">
                <Input
                    label="Título de la reunión"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setTitleError(undefined);
                    }}
                    placeholder="Ej.: Revisión semanal del proyecto"
                    error={titleError}
                    disabled={processing}
                />

                <fieldset>
                    <legend className="caption mb-1.5">Audio</legend>
                    <div className="rounded-control border border-dashed border-rule-strong/70 bg-well/50 px-5 py-6">
                        {!audioBlob ? (
                            isRecording ? (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <p role="status" className="flex items-center gap-2 text-sm font-semibold text-st-red">
                                        <span className="h-2.5 w-2.5 rounded-full bg-st-red motion-safe:animate-pulse" aria-hidden="true" />
                                        Grabando
                                    </p>
                                    <p className="font-mono text-4xl tabular-nums text-ink" aria-label={`Tiempo grabado: ${formatTime(recordingTime)}`}>
                                        {formatTime(recordingTime)}
                                    </p>
                                    <Button variant="secondary" onClick={stopRecording}>
                                        <Square size={14} className="fill-current" aria-hidden="true" />
                                        Detener grabación
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                                        <Button onClick={startRecording}>
                                            <Mic size={16} aria-hidden="true" />
                                            Empezar a grabar
                                        </Button>
                                        <span className="text-xs text-ink-3">o</span>
                                        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-control border border-rule-strong/70 bg-paper px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-well focus-within:ring-2 focus-within:ring-focus">
                                            <input type="file" accept="audio/*,video/*" className="sr-only" onChange={handleFileUpload} />
                                            <Upload size={15} aria-hidden="true" />
                                            Subir un archivo
                                        </label>
                                    </div>
                                    <p className="text-xs text-ink-3">El navegador pedirá permiso para el micrófono. También acepta video.</p>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={togglePlayback}
                                    aria-label={isPlaying ? 'Pausar' : 'Escuchar'}
                                    title={isPlaying ? 'Pausar' : 'Escuchar'}
                                >
                                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                </Button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink">{fileName}</p>
                                    <p className="text-xs tabular-nums text-ink-3">
                                        {(audioBlob.size / (1024 * 1024)).toFixed(2)} MB · {audioBlob.type || 'audio'}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={discardAudio} disabled={processing}>
                                    <Trash2 size={14} aria-hidden="true" />
                                    Descartar
                                </Button>
                            </div>
                        )}
                    </div>
                </fieldset>

                {askKey && (
                    <div className="rounded-control border border-rule bg-well p-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <KeyRound size={15} aria-hidden="true" className="text-ink-3" />
                            Clave de Google Gemini
                        </p>
                        <p className="mt-1 text-xs text-ink-2">La IA necesita tu clave. Se guarda solo en este navegador.</p>
                        <div className="mt-2 flex gap-2">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                aria-label="Clave de Google Gemini"
                                className="field h-8 py-1 font-mono text-[13px]"
                                placeholder="AIza…"
                                autoComplete="off"
                            />
                            <Button type="button" size="sm" variant="secondary" onClick={saveKeyAndContinue} disabled={!apiKey.trim()}>
                                Guardar y seguir
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setAskKey(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {audioBlob && (
                <div className="flex flex-col gap-3 border-t border-rule bg-well px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-ink-3">
                        {processing ? 'Puede tardar unos minutos según la duración del audio.' : 'La IA escribe el resumen y los pendientes. Revísalos antes de compartirlos.'}
                    </p>
                    <Button onClick={handleSave} isLoading={processing}>
                        {processing ? 'Procesando…' : 'Guardar y procesar'}
                    </Button>
                </div>
            )}
        </Card>
    );
}
