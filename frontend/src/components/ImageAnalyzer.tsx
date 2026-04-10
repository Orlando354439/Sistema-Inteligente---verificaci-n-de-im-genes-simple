import { useState, useRef, useCallback } from 'react'

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
  const inputRef = useRef<HTMLInputElement>(null)

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
        <p className="text-gray-400 mt-1 text-sm">Sube una imagen y deja que la IA la analice</p>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${dragging ? 'border-violet-400 bg-violet-950/30' : 'border-gray-700 hover:border-gray-500'}
          ${preview ? 'p-2' : 'p-10'}`}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onInputChange} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-72 object-contain rounded-lg" />
            <button
              onClick={(e) => { e.stopPropagation(); handleReset() }}
              className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-300">Arrastra una imagen aquí</p>
              <p className="text-xs mt-1">o haz clic para seleccionar · JPG, PNG</p>
            </div>
          </div>
        )}
      </div>

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
