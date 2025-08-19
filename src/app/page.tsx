'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ☀️ Sunny Video
          </h1>
          <p className="text-white/80 text-lg">
            Share ephemeral video messages with friends
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="block w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-xl hover:bg-white/90 transition-colors"
          >
            Sign In
          </Link>
          
          <Link
            href="/auth/register"
            className="block w-full bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/10 transition-colors"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-8 text-white/60 text-sm">
          <p>Record • Enhance • Share • Disappear</p>
        </div>
      </div>
    </div>
  )
}