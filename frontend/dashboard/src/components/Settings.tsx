// src/pages/Settings.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Settings() {
  interface User {
    email: string;
    isLoggedIn: boolean;
  }
  // ... (your state and handlers)
  const [activePage, setActivePage] = useState('Dashboard');
  const [user, setUser] = useState<User>({ email: '', isLoggedIn: false });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogout = () => {
    setUser({ email: '', isLoggedIn: false });
    localStorage.removeItem('user');
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail) {
      setUser({ ...user, email: newEmail });
      localStorage.setItem('user', JSON.stringify({ ...user, email: newEmail }));
      setNewEmail('');
      setError('');
    } else {
      setError('Please enter a new email');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword) {
      setNewPassword('');
      setError('');
    } else {
      setError('Please enter a new password');
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {(
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Change Email</h3>
              <form onSubmit={handleChangeEmail} className="mt-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">Update Email</Button>
              </form>
            </div>
            <div>
              <h3 className="text-lg font-medium">Change Password</h3>
              <form onSubmit={handleChangePassword} className="mt-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </div>
            <Button onClick={handleLogout} variant="destructive">Log Out</Button>
          </div>
        )}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
