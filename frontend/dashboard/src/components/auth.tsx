import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuthStore } from '../stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldHalf } from 'lucide-react'

export default function AuthComponent({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const { supabaseClient, login, logout, register } = useAuthStore((state) => state)
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const { error } = await supabaseClient.auth.signOut()
    if (error) console.log('Error signing out:', error)
  }

  if (!session) {
    return (
        <div className="flex h-screen w-screen">
        {/* Left side - Logo and Brand Description */}
        <div className="flex-1 bg-primary flex flex-col items-center justify-center p-8 text-white">
          <ShieldHalf size={64} />
          <h1 className="text-4xl font-bold mt-4">YouthSageAgent</h1>
          <p className="text-xl mt-2 text-center max-w-md">
          YouthSageAgent is a parental control platform that helps parents monitor and control their children's online activities.
          </p>
        </div>
  
        {/* Right side - Auth UI */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{session ? 'Welcome Back!' : 'Welcome to YouthSageAgent!'}</CardTitle>
            </CardHeader>
            <CardContent>
              {!session ? (
                <Auth
                  supabaseClient={supabaseClient}
                  appearance={{ theme: ThemeSupa }}
                  theme="light"
                  providers={[]}
                  redirectTo={`${window.location.origin}/family`}
                />
              ) : (
                <div>
                  <p className="text-center mb-4">You are logged in as {session.user.email}</p>
                  <Button onClick={handleSignOut} className="w-full">
                    Sign out
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } else {
    return children
  }
}