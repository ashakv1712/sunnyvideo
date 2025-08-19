'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface VideoMessage {
  id: string
  sender_id: string
  recipient_id: string
  video_url: string
  created_at: string
  expires_at: string
  viewed: boolean
  viewed_at?: string
  sender?: {
    username: string
  }
}

export default function Messages() {
  const [messages, setMessages] = useState<VideoMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<VideoMessage | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get messages for current user with sender info
      const { data, error } = await supabase
        .from('video_messages')
        .select(`
          *,
          sender:users!video_messages_sender_id_fkey(username)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading messages:', error)
      } else {
        // Filter out expired messages
        const now = new Date()
        const validMessages = data?.filter(msg => new Date(msg.expires_at) > now) || []
        setMessages(validMessages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const openMessage = async (message: VideoMessage) => {
    setSelectedMessage(message)
    
    // Mark as viewed if not already viewed
    if (!message.viewed) {
      const { error } = await supabase
        .from('video_messages')
        .update({ 
          viewed: true, 
          viewed_at: new Date().toISOString() 
        })
        .eq('id', message.id)

      if (!error) {
        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, viewed: true, viewed_at: new Date().toISOString() }
              : msg
          )
        )
      }
    }
  }

  const closeMessage = () => {
    setSelectedMessage(null)
    setIsPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  const downloadVideo = async () => {
    if (!selectedMessage) return

    try {
      const response = await fetch(selectedMessage.video_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sunny_video_${selectedMessage.id}.webm`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading video:', error)
      alert('Failed to download video')
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const { error } = await supabase
        .from('video_messages')
        .delete()
        .eq('id', messageId)

      if (error) {
        console.error('Error deleting message:', error)
        alert('Failed to delete message')
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        if (selectedMessage?.id === messageId) {
          closeMessage()
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffInMinutes = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m left`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h left`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d left`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Messages 📬</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center shadow-2xl">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Messages</h2>
            <p className="text-white/80">You haven't received any video messages yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl cursor-pointer hover:bg-white/20 transition-colors ${
                  !message.viewed ? 'ring-2 ring-yellow-400/50' : ''
                }`}
                onClick={() => openMessage(message)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">🎥</div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          From: {message.sender?.username || 'Unknown'}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {formatTimeAgo(message.created_at)}
                        </p>
                      </div>
                      {!message.viewed && (
                        <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                          NEW
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <span>⏰ Expires: {getExpiryTime(message.expires_at)}</span>
                      {message.viewed && message.viewed_at && (
                        <span>👁️ Viewed: {formatTimeAgo(message.viewed_at)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMessage(message.id)
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 text-white p-2 rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 max-w-2xl w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Video from {selectedMessage.sender?.username}
                </h3>
                <button
                  onClick={closeMessage}
                  className="bg-gray-500/20 hover:bg-gray-500/30 text-white p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  src={selectedMessage.video_url}
                  controls
                  className="w-full rounded-2xl"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={downloadVideo}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-white py-3 px-6 rounded-xl transition-colors"
                >
                  💾 Save to Device
                </button>
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white py-3 px-6 rounded-xl transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>

              <div className="mt-4 text-center text-white/60 text-sm">
                <p>This message will expire in {getExpiryTime(selectedMessage.expires_at)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}