'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  username: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const username = authUser.user_metadata?.username ||
                        authUser.email?.split('@')[0] ||
                        'user'

        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.id,
              email: authUser.email!,
              username: username,
            }
          ])
          .select()
          .single()

        if (createError) {
          console.error('Failed to create user profile:', createError)
          router.push('/auth/login')
          return
        }

        setUser(newProfile)
      } else if (profile) {
        setUser(profile)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Welcome, {user.username}! ☀️
              </h1>
              <p className="text-white/80">Ready to share some sunny videos?</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Record Video */}
          <Link href="/record">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center hover:bg-white/20 transition-colors cursor-pointer shadow-2xl">
              <div className="text-6xl mb-4">🎥</div>
              <h2 className="text-2xl font-bold text-white mb-2">Record Video</h2>
              <p className="text-white/80">Create a new video message</p>
            </div>
          </Link>

          {/* View Messages */}
          <Link href="/messages">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center hover:bg-white/20 transition-colors cursor-pointer shadow-2xl">
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-2xl font-bold text-white mb-2">Messages</h2>
              <p className="text-white/80">View received videos</p>
            </div>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contacts */}
          <Link href="/contacts">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-center hover:bg-white/20 transition-colors cursor-pointer shadow-2xl">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-xl font-bold text-white mb-1">Contacts</h3>
              <p className="text-white/70 text-sm">Manage your friends</p>
            </div>
          </Link>

          {/* Profile */}
          <Link href="/profile">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-center hover:bg-white/20 transition-colors cursor-pointer shadow-2xl">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-1">Profile</h3>
              <p className="text-white/70 text-sm">Account settings</p>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mt-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-white/70 text-sm">Videos Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-white/70 text-sm">Videos Received</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-white/70 text-sm">Contacts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}