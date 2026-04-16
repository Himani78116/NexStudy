'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import "../../styles/auth.css"

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for confirmation')
      router.push('/login')
    }
  }

  return (
    <div className="body">
        <div className="subbox">
          <h2 className="title">Sign Up</h2>

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

          <button onClick={handleSignup} className="element confirm" >Create Account</button>

          <div className="change">
            <p>Already have an account?</p>
            <p onClick={() => router.push('/login')} className="alter">Log in</p>
          </div>
      </div>
    </div>
  )
}