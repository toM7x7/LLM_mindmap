import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, User, Mail, Lock } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, fetchUser } = useAuth();
  const api = useApi();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const response = await api.put('/users/me', {
        username,
        email
      });
      
      if (response.success) {
        toast({
          title: '更新完了',
          description: 'プロフィールを更新しました',
          variant: 'success'
        });
        fetchUser();
      } else {
        setError(response.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setError('予期せぬエラーが発生しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    
    if (!currentPassword) {
      setPasswordError('現在のパスワードを入力してください');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('新しいパスワードを入力してください');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードと確認用パスワードが一致しません');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      const response = await api.put('/users/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if (response.success) {
        toast({
          title: '更新完了',
          description: 'パスワードを変更しました',
          variant: 'success'
        });
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.error || 'パスワードの変更に失敗しました');
      }
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      setPasswordError('予期せぬエラーが発生しました');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      <h1 className="text-2xl font-bold">プロフィール設定</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            アカウント情報
          </CardTitle>
          <CardDescription>
            アカウントの基本情報を管理します
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleProfileUpdate}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                メールアドレスは変更できません
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isUpdating}
            >
              {isUpdating ? '更新中...' : '更新する'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            パスワード変更
          </CardTitle>
          <CardDescription>
            アカウントのパスワードを変更します
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="current-password">現在のパスワード</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isChangingPassword}
            >
              {isChangingPassword ? '変更中...' : 'パスワードを変更'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
