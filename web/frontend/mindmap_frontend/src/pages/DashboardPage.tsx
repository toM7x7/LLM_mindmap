import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { PlusCircle, Trash2, Edit, FileText } from 'lucide-react';

interface MindMap {
  id: number;
  title: string;
  created_at: string;
  updated_at: string | null;
}

const DashboardPage: React.FC = () => {
  const [mindmaps, setMindmaps] = useState<MindMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMindmaps();
  }, []);

  const fetchMindmaps = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/mindmaps/');
      
      if (response.success) {
        setMindmaps(response.data);
      } else {
        toast({
          title: 'エラー',
          description: 'マインドマップの取得に失敗しました',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('マインドマップ取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'マインドマップの取得に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewMindmap = async () => {
    try {
      const response = await api.post('/mindmaps/', {
        title: '新しいマインドマップ',
        data: {
          id: 0,
          title: 'メインテーマ',
          children: [],
          type: 'default'
        }
      });
      
      if (response.success) {
        toast({
          title: '成功',
          description: '新しいマインドマップを作成しました',
          variant: 'success'
        });
        navigate(`/mindmap/${response.data.id}`);
      } else {
        toast({
          title: 'エラー',
          description: response.error || 'マインドマップの作成に失敗しました',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('マインドマップ作成エラー:', error);
      toast({
        title: 'エラー',
        description: '予期せぬエラーが発生しました',
        variant: 'destructive'
      });
    }
  };

  const deleteMindmap = async (id: number) => {
    if (!confirm('このマインドマップを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      const response = await api.del(`/mindmaps/${id}`);
      
      if (response.success) {
        toast({
          title: '成功',
          description: 'マインドマップを削除しました',
          variant: 'success'
        });
        fetchMindmaps();
      } else {
        toast({
          title: 'エラー',
          description: response.error || 'マインドマップの削除に失敗しました',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('マインドマップ削除エラー:', error);
      toast({
        title: 'エラー',
        description: '予期せぬエラーが発生しました',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">マインドマップ一覧</h1>
        <Button onClick={createNewMindmap} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          新規作成
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : mindmaps.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">マインドマップがありません</h3>
          <p className="text-muted-foreground mb-6">
            新しいマインドマップを作成して思考を整理しましょう
          </p>
          <Button onClick={createNewMindmap} className="flex items-center gap-2 mx-auto">
            <PlusCircle className="h-4 w-4" />
            新規作成
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mindmaps.map(mindmap => (
            <div key={mindmap.id} className="bg-card border rounded-lg overflow-hidden">
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2 truncate">{mindmap.title}</h3>
                <p className="text-sm text-muted-foreground">
                  作成日: {formatDate(mindmap.created_at)}
                </p>
                {mindmap.updated_at && (
                  <p className="text-sm text-muted-foreground">
                    更新日: {formatDate(mindmap.updated_at)}
                  </p>
                )}
              </div>
              <div className="flex border-t">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-none py-2 h-auto"
                  onClick={() => navigate(`/mindmap/${mindmap.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-none py-2 h-auto text-destructive hover:text-destructive"
                  onClick={() => deleteMindmap(mindmap.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
