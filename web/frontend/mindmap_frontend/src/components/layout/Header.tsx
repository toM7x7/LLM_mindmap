import React from 'react';
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, UserIcon, CreditCardIcon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-background border-b border-border py-3 px-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">
          <span className="text-primary">LLM</span> マインドマップ
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {isAuthenticated ? (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/credits')}
              className="flex items-center"
            >
              <CreditCardIcon className="h-4 w-4 mr-1" />
              <span>{user?.credits || 0} クレジット</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/profile')}
              className="flex items-center"
            >
              <UserIcon className="h-4 w-4 mr-1" />
              <span>{user?.username}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
            >
              ログアウト
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/login')}
            >
              ログイン
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate('/register')}
            >
              登録
            </Button>
          </>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        >
          {theme === 'dark' ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};

export default Header;
