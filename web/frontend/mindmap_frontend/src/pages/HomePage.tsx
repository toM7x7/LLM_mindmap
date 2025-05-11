import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <h1 className="text-4xl font-bold mb-6">
        <span className="text-primary">LLM</span> マインドマップ
      </h1>
      
      <p className="text-xl mb-8 max-w-2xl">
        AIを活用したマインドマッピングで、アイデアを整理し、思考を可視化しましょう。
        簡単な操作で複雑な概念を整理し、新しい洞察を得ることができます。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl">
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">思考の整理</h2>
          <p className="mb-4">
            複雑なアイデアや概念を視覚的に整理し、関連性を明確にします。
            思考の流れを可視化することで、新たな気づきを得ることができます。
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">AIによるサポート</h2>
          <p className="mb-4">
            AIがあなたのマインドマップ作成をサポート。
            トピックの展開や関連するアイデアの提案を自動的に行います。
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">簡単な議論</h2>
          <p className="mb-4">
            チームでのブレインストーミングや議論に最適。
            アイデアを共有し、共同で発展させることができます。
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">日本語に最適化</h2>
          <p className="mb-4">
            日本語での思考整理に特化したインターフェースと機能を提供。
            日本人の思考プロセスに合わせた使いやすさを実現しています。
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          size="lg" 
          onClick={() => navigate('/register')}
          className="px-8"
        >
          無料で始める
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => navigate('/login')}
          className="px-8"
        >
          ログイン
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
