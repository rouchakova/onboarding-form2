import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseClient'

export default function AuthComponent() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Logo/Title Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
            <p className="text-gray-600 mt-2">Sign in to access the Sovrn Tech Form</p>
          </div>

          {/* Auth UI - removed Google provider */}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#facc15',
                    brandAccent: '#eab308',
                  },
                },
              },
            }}
            theme="light"
          />
        </div>
      </div>

      {/* Add some custom styles */}
      <style>{`
        .auth-container {
          width: 100%;
        }
        .auth-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 150ms ease-in-out;
        }
        .auth-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  )
} 