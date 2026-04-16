'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import "../../styles/auth.css"

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className='body'>
      <div className='subbox'>
        <h2 className="title">Log In</h2>

        <input className="element"
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input className="element"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin} className="element confirm">Login</button>

        <div className="change">
            <p>Don't have an account?</p>
            <p onClick={() => router.push('/signup')} className="alter">Sign Up</p>
          </div>

      </div>
    </div>
  )
}