import { useState, useRef, useCallback, useEffect } from 'react'

type AnalysisMode = 'prompt' | 'digitalNotes' | 'classifyDocs' | 'relevantInfo'

interface ApiResponse {
  filename: string
  prompt: string
  ai_response: string
}

const MODES: { value: AnalysisMode; label: string; description: string }[] = [
  { value: 'prompt', label: 'Pregunta libre', description: 'Escribe tu propia pregunta sobre la imagen' },
  { value: 'digitalNotes', label: 'Notas digitales', description: 'Extrae notas y texto de la imagen' },
  { value: 'classifyDocs', label: 'Clasificar documento', description: 'Identifica el tipo de documento' },
  { value: 'relevantInfo', label: 'Info relevante', description: 'Obtiene los datos más importantes' },
]

export default function ImageAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mode, setMode] = useState<AnalysisMode>('prompt')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
    setCameraError(null)
  }, [])

  const openCamera = async () => {
    setCameraError(null)
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    }
  }

  // Assign stream to video element once it mounts inside the modal
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraOpen])

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      const captured = new File([blob], `captura_${Date.now()}.png`, { type: 'image/png' })
      handleFile(captured)
      stopCamera()
    }, 'image/png')
  }

  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setError('Solo se aceptan imágenes JPG o PNG.')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
    setResponse(null)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResponse(null)

    const formData = new FormData()
    formData.append('img', file)

    if (mode === 'prompt') {
      formData.append('prompt', prompt)
    } else {
      formData.append('prompt', '')
      formData.append('DigitalNotes', mode === 'digitalNotes' ? 'true' : 'false')
      formData.append('ClasificationDocuments', mode === 'classifyDocs' ? 'true' : 'false')
      formData.append('RelevantInfo', mode === 'relevantInfo' ? 'true' : 'false')
    }

    try {
      const res = await fetch('/api/upload_image/', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail ?? `Error ${res.status}`)
      }
      const data: ApiResponse = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setResponse(null)
    setError(null)
    setPrompt('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const canSubmit = !!file && (mode !== 'prompt' || prompt.trim().length > 0) && !loading

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Analizador de Imágenes</h1>
        <p className="text-gray-400 mt-1 text-sm">Sube una imagen o toma una foto y deja que la IA la analice</p>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative border-2 border-dashed rounded-xl transition-colors
          ${dragging ? 'border-violet-400 bg-violet-950/30' : 'border-gray-700'}
          ${preview ? 'p-2' : 'p-10'}`}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onInputChange} />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-72 object-contain rounded-lg" />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-center text-xs text-gray-500">Arrastra una imagen aquí · JPG, PNG</p>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Subir imagen
              </button>
              <button
                onClick={openCamera}
                className="flex items-center gap-2 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                Usar cámara
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-white font-semibold">Tomar foto</h2>
              <button onClick={stopCamera} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative bg-black">
              {cameraError ? (
                <div className="flex items-center justify-center h-48 px-6 text-center text-red-400 text-sm">
                  {cameraError}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-96 object-contain"
                />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {!cameraError && (
              <div className="flex justify-center py-4 border-t border-gray-800">
                <button
                  onClick={capturePhoto}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" strokeWidth={2} stroke="currentColor" fill="currentColor" className="text-white" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  </svg>
                  Capturar foto
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            title={m.description}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors text-center
              ${mode === m.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Prompt input (only for free mode) */}
      {mode === 'prompt' && (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe tu pregunta sobre la imagen..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none transition-colors"
        />
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all
          bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analizando...
          </span>
        ) : 'Analizar imagen'}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-950/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Respuesta de la IA</h2>
            <span className="text-xs text-gray-500">{response.filename}</span>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{response.ai_response}</p>
        </div>
      )}
    </div>
  )
}
