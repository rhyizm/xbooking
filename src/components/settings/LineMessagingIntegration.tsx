'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LineMessagingIntegrationProps {
  title: string;
  description: string;
  channelIdLabel: string;
  channelSecretLabel: string;
  channelAccessTokenLabel: string;
  webhookUrlLabel: string;
  saveText: string;
  deleteText: string;
  savingText: string;
  deletingText: string;
  savedText: string;
  deletedText: string;
  errorText: string;
}

export default function LineMessagingIntegration({
  title,
  description,
  channelIdLabel,
  channelSecretLabel,
  channelAccessTokenLabel,
  webhookUrlLabel,
  saveText,
  deleteText,
  savingText,
  deletingText,
  savedText,
  deletedText,
  errorText,
}: LineMessagingIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasConfig, setHasConfig] = useState(false);
  
  const [formData, setFormData] = useState({
    channelId: '',
    channelSecret: '',
    channelAccessToken: '',
    webhookUrl: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/line/config');
      const data = await response.json();
      
      if (data.exists) {
        setHasConfig(true);
        setFormData(prev => ({
          ...prev,
          channelId: data.config.channelId || '',
          webhookUrl: data.config.webhookUrl || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/line/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }
      
      setHasConfig(true);
      setSuccess(savedText);
      
      // パスワードフィールドをクリア
      setFormData(prev => ({
        ...prev,
        channelSecret: '',
        channelAccessToken: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your LINE Messaging configuration?')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/line/config', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }
      
      setHasConfig(false);
      setSuccess(deletedText);
      setFormData({
        channelId: '',
        channelSecret: '',
        channelAccessToken: '',
        webhookUrl: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="channelId">{channelIdLabel}</Label>
            <Input
              id="channelId"
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="channelSecret">{channelSecretLabel}</Label>
            <Input
              id="channelSecret"
              type="password"
              value={formData.channelSecret}
              onChange={(e) => setFormData({ ...formData, channelSecret: e.target.value })}
              required={!hasConfig}
              placeholder={hasConfig ? '••••••••' : ''}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="channelAccessToken">{channelAccessTokenLabel}</Label>
            <Input
              id="channelAccessToken"
              type="password"
              value={formData.channelAccessToken}
              onChange={(e) => setFormData({ ...formData, channelAccessToken: e.target.value })}
              required={!hasConfig}
              placeholder={hasConfig ? '••••••••' : ''}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="webhookUrl">{webhookUrlLabel}</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://example.com/webhook/line"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorText}: {error}
              </p>
            </div>
          )}
          
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                {success}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? savingText : saveText}
            </Button>
            
            {hasConfig && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isLoading}
              >
                {isDeleting ? deletingText : deleteText}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}