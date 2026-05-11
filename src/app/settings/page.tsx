'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Shield, LogOut, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-none bg-background/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal information and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Input id="email" value={user?.email || ''} disabled className="bg-muted/50 border-none" />
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none">Verified</Badge>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="id">User ID</Label>
              <Input id="id" value={user?.id || ''} disabled className="bg-muted/50 border-none font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-background/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your password and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <Button variant="outline">Enable 2FA</Button>
          </CardContent>
        </Card>

        <Card className="border-none bg-rose-500/5 backdrop-blur-sm shadow-xl border-rose-500/10">
          <CardHeader>
            <CardTitle className="text-rose-500 flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Actions that can have a permanent impact on your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, className, variant = 'default' }: any) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
