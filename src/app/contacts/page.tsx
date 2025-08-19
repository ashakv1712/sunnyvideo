'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  contact_username: string
  created_at: string
}

interface User {
  id: string
  username: string
  email: string
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadCurrentUser()
    loadContacts()
  }, [])

  const loadCurrentUser = async () => {
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
        setCurrentUser(profile)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading contacts:', error)
      } else {
        setContacts(data || [])
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim() || !currentUser) return

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', currentUser.id)
        .limit(10)

      if (error) {
        console.error('Error searching users:', error)
      } else {
        // Filter out users that are already contacts
        const existingContactIds = contacts.map(c => c.contact_user_id)
        const filteredResults = data?.filter(user => !existingContactIds.includes(user.id)) || []
        setSearchResults(filteredResults)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const addContact = async (user: User) => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([
          {
            user_id: currentUser.id,
            contact_user_id: user.id,
            contact_username: user.username
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error adding contact:', error)
        alert('Failed to add contact')
      } else {
        setContacts(prev => [data, ...prev])
        setSearchResults(prev => prev.filter(u => u.id !== user.id))
        alert(`${user.username} added to your contacts!`)
      }
    } catch (error) {
      console.error('Error adding contact:', error)
      alert('Failed to add contact')
    }
  }

  const removeContact = async (contactId: string, username: string) => {
    if (!confirm(`Remove ${username} from your contacts?`)) return

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) {
        console.error('Error removing contact:', error)
        alert('Failed to remove contact')
      } else {
        setContacts(prev => prev.filter(c => c.id !== contactId))
      }
    } catch (error) {
      console.error('Error removing contact:', error)
      alert('Failed to remove contact')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchUsers()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading contacts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Contacts 👥</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-500/20 hover:bg-gray-500/30 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Add New Contact</h2>
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Search Results:</h3>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center bg-white/10 rounded-xl p-4"
                  >
                    <div>
                      <h4 className="text-white font-semibold">{user.username}</h4>
                      <p className="text-white/60 text-sm">{user.email}</p>
                    </div>
                    <button
                      onClick={() => addContact(user)}
                      className="bg-green-500/20 hover:bg-green-500/30 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <div className="mt-4 text-center text-white/60">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">
            Your Contacts ({contacts.length})
          </h2>

          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-white mb-2">No Contacts Yet</h3>
              <p className="text-white/80">Search for users above to add them as contacts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex justify-between items-center bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                      {contact.contact_username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{contact.contact_username}</h4>
                      <p className="text-white/60 text-sm">
                        Added {new Date(contact.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/record?contact=${contact.contact_user_id}`)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Send Video
                    </button>
                    <button
                      onClick={() => removeContact(contact.id, contact.contact_username)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mt-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-3">💡 Tips</h3>
          <ul className="text-white/80 space-y-2 text-sm">
            <li>• Search for friends by their exact username</li>
            <li>• You can only send videos to users in your contacts</li>
            <li>• Contact requests are automatically accepted</li>
            <li>• Remove contacts you no longer want to share videos with</li>
          </ul>
        </div>
      </div>
    </div>
  )
}