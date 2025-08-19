'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  contact_user_id: string
  contact_username: string
}

export default function RecordVideo() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [showEmojis, setShowEmojis] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [loading, setLoading] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const filters = [
    { name: 'None', value: 'none', css: 'filter: none' },
    { name: 'Sepia', value: 'sepia', css: 'filter: sepia(100%)' },
    { name: 'Grayscale', value: 'grayscale', css: 'filter: grayscale(100%)' },
    { name: 'Blur', value: 'blur', css: 'filter: blur(2px)' },
    { name: 'Brightness', value: 'brightness', css: 'filter: brightness(150%)' },
    { name: 'Contrast', value: 'contrast', css: 'filter: contrast(150%)' },
    { name: 'Hue Rotate', value: 'hue-rotate', css: 'filter: hue-rotate(90deg)' },
    { name: 'Saturate', value: 'saturate', css: 'filter: saturate(200%)' },
  ]

  const emojis = ['😀', '😂', '🥰', '😎', '🤔', '😮', '🎉', '❤️', '👍', '🔥', '⭐', '🌈']

  useEffect(() => {
    initializeCamera()
    loadContacts()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)

      if (data) {
        setContacts(data)
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return

    const mediaRecorder = new MediaRecorder(streamRef.current)
    const chunks: BlobPart[] = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      setRecordedBlob(blob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
    setRecordingTime(0)

    // Start timer (10 second limit)
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 9) {
          stopRecording()
          return 10
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const retakeVideo = () => {
    setRecordedBlob(null)
    setRecordingTime(0)
    setSelectedEmoji('')
    setSelectedFilter('none')
  }

  const sendVideo = async () => {
    if (!recordedBlob || !selectedContact) {
      alert('Please select a contact to send the video to.')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create a unique filename
      const fileName = `video_${Date.now()}_${user.id}.webm`
      
      // Upload video to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, recordedBlob)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      // Create video message record
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

      const { error: messageError } = await supabase
        .from('video_messages')
        .insert([
          {
            sender_id: user.id,
            recipient_id: selectedContact,
            video_url: publicUrl,
            expires_at: expiresAt.toISOString(),
            viewed: false
          }
        ])

      if (messageError) {
        throw messageError
      }

      alert('Video sent successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error sending video:', error)
      alert('Failed to send video. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getFilterStyle = () => {
    const filter = filters.find(f => f.value === selectedFilter)
    return filter ? filter.css : 'filter: none'
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Record Video 🎥</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Video Preview */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-2xl"
              style={{ transform: 'scaleX(-1)', ...{ filter: getFilterStyle().split(': ')[1] } }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Emoji Overlay */}
            {selectedEmoji && (
              <div className="absolute top-4 right-4 text-6xl animate-bounce">
                {selectedEmoji}
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                REC {recordingTime}s
              </div>
            )}

            {/* Timer Bar */}
            {isRecording && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(recordingTime / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {!recordedBlob ? (
          <div className="space-y-4">
            {/* Enhancement Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Enhance Your Video</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Filters */}
                <div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    🎨 Filters
                  </button>
                  {showFilters && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {filters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setSelectedFilter(filter.value)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedFilter === filter.value
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {filter.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emojis */}
                <div>
                  <button
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    😀 Emojis
                  </button>
                  {showEmojis && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                          className={`p-2 rounded-lg text-2xl transition-colors ${
                            selectedEmoji === emoji
                              ? 'bg-yellow-500/50'
                              : 'bg-white/20 hover:bg-white/30'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recording Button */}
            <div className="text-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isRecording && recordingTime >= 10}
                className={`w-20 h-20 rounded-full text-white font-bold text-lg transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isRecording ? '⏹️' : '🎥'}
              </button>
              <p className="text-white/80 mt-2">
                {isRecording ? 'Tap to stop' : 'Tap to record'}
              </p>
            </div>
          </div>
        ) : (
          /* Send Video Controls */
          <div className="space-y-4">
            {/* Contact Selection */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Send To:</h3>
              <select
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.contact_user_id} className="text-black">
                    {contact.contact_username}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={retakeVideo}
                className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-white py-3 px-6 rounded-xl transition-colors"
              >
                Retake
              </button>
              <button
                onClick={sendVideo}
                disabled={loading || !selectedContact}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-white py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Video'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}