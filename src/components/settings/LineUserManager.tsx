'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LineUser {
  _id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  isFollowing: boolean;
  followedAt?: string;
  tags?: string[];
  notes?: string;
}

interface LineUserManagerProps {
  title: string;
  description: string;
  addUserText: string;
  userIdLabel: string;
  loadingText: string;
  followersText: string;
  noUsersText: string;
  sendTestMessageText: string;
}

export default function LineUserManager({
  title,
  description,
  addUserText,
  userIdLabel,
  loadingText,
  followersText,
  noUsersText,
  sendTestMessageText,
}: LineUserManagerProps) {
  const [users, setUsers] = useState<LineUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/line/users?following=true');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      const response = await fetch('/api/line/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId: newUserId.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers([data.user, ...users]);
        setNewUserId('');
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to add user');
    } finally {
      setIsAdding(false);
    }
  };

  const sendTestMessage = async (userId: string, displayName: string) => {
    try {
      const response = await fetch('/api/line/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userId,
          type: 'push',
          messages: [{
            type: 'text',
            text: `こんにちは、${displayName}さん！これはテストメッセージです。`,
          }],
        }),
      });
      
      if (response.ok) {
        alert('Test message sent successfully!');
      } else {
        const data = await response.json();
        alert(`Failed to send message: ${data.error}`);
      }
    } catch {
      alert('Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{loadingText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add User Form */}
        <form onSubmit={addUser} className="space-y-2">
          <Label htmlFor="lineUserId">{userIdLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="lineUserId"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="U1234567890abcdef1234567890abcdef"
              disabled={isAdding}
            />
            <Button type="submit" disabled={isAdding || !newUserId.trim()}>
              {isAdding ? loadingText : addUserText}
            </Button>
          </div>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Users List */}
        <div>
          <h4 className="text-sm font-medium mb-2">
            {followersText} ({users.length})
          </h4>
          
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">{noUsersText}</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    {user.pictureUrl && (
                      <div 
                        className="w-8 h-8 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${user.pictureUrl})` }}
                        aria-label={user.displayName}
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.lineUserId}
                      </p>
                      {user.statusMessage && (
                        <p className="text-xs text-muted-foreground">
                          {user.statusMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendTestMessage(user.lineUserId, user.displayName)}
                  >
                    {sendTestMessageText}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}