'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  username: string
  created_at: string
}

interface Stats {
  videosSent: number
  videosReceived: number
  contactsCount: number
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({ videosSent: 0, videosReceived: 0, contactsCount: 0 })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [showUsernameEdit, setShowUsernameEdit] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProfile()
    loadStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser(profile)
        setNewUsername(profile.username)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Get videos sent count
      const { count: sentCount } = await supabase
        .from('video_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', authUser.id)

      // Get videos received count
      const { count: receivedCount } = await supabase
        .from('video_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', authUser.id)

      // Get contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)

      setStats({
        videosSent: sentCount || 0,
        videosReceived: receivedCount || 0,
        contactsCount: contactsCount || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const updateUsername = async () => {
    if (!user || !newUsername.trim() || newUsername === user.username) {
      setShowUsernameEdit(false)
      setNewUsername(user?.username || '')
      return
    }

    setUpdating(true)
    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', newUsername.trim())
        .neq('id', user.id)
        .single()

      if (existingUser) {
        alert('Username is already taken. Please choose a different one.')
        return
      }

      // Update username
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername.trim() })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating username:', error)
        alert('Failed to update username')
      } else {
        setUser(prev => prev ? { ...prev, username: newUsername.trim() } : null)
        setShowUsernameEdit(false)
        alert('Username updated successfully!')
      }
    } catch (error) {
      console.error('Error updating username:', error)
      alert('Failed to update username')
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete all your data including videos and contacts. Are you absolutely sure?')) {
      return
    }

    try {
      // Note: In a production app, you'd want to handle this server-side
      // to properly clean up all related data and storage files
      const { error } = await supabase.auth.admin.deleteUser(user!.id)
      
      if (error) {
        console.error('Error deleting account:', error)
        alert('Failed to delete account. Please contact support.')
      } else {
        alert('Account deleted successfully.')
        router.push('/')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Profile ⚙️</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
            <p className="text-white/60">{user.email}</p>
            <p className="text-white/40 text-sm mt-2">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Username Edit */}
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Username
              </label>
              {showUsernameEdit ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Enter new username"
                    minLength={3}
                    maxLength={20}
                  />
                  <button
                    onClick={updateUsername}
                    disabled={updating}
                    className="bg-green-500/20 hover:bg-green-500/30 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {updating ? '...' : '✓'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUsernameEdit(false)
                      setNewUsername(user.username)
                    }}
                    className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-white/10 rounded-xl p-4">
                  <span className="text-white">{user.username}</span>
                  <button
                    onClick={() => setShowUsernameEdit(true)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Your Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{stats.videosSent}</div>
              <div className="text-white/70 text-sm">Videos Sent</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{stats.videosReceived}</div>
              <div className="text-white/70 text-sm">Videos Received</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{stats.contactsCount}</div>
              <div className="text-white/70 text-sm">Contacts</div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-white py-3 px-6 rounded-xl transition-colors"
            >
              🚪 Logout
            </button>
            <button
              onClick={deleteAccount}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-white py-3 px-6 rounded-xl transition-colors"
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mt-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-3">About Sunny Video</h3>
          <div className="text-white/80 space-y-2 text-sm">
            <p>• Videos are automatically deleted after 24 hours</p>
            <p>• Maximum video length: 10 seconds</p>
            <p>• Videos are stored securely and privately</p>
            <p>• Only you and your recipient can view your videos</p>
          </div>
        </div>
      </div>
    </div>
  )
}