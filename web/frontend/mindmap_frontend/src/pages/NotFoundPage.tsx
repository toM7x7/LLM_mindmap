import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileQuestion } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FileQuestion className="h-24 w-24 text-muted-foreground mb-6" />
      
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">ページが見つかりませんでした</p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => navigate(-1)}
          variant="outline"
        >
          前のページに戻る
        </Button>
        
        <Button 
          onClick={() => navigate('/')}
        >
          ホームに戻る
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
