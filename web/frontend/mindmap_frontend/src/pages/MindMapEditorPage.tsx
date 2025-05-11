import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useCredits } from '../hooks/useCredits';
import MindMapEditor from '../components/mindmap/MindMapEditor';
import { Button } from '../components/ui/button';
import { Save, ArrowLeft, Zap, Download, Upload } from 'lucide-react';

interface MindMapData {
  id: number;
  title: string;
  data: any;
  created_at: string;
  updated_at: string | null;
}

const MindMapEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mapData, setMapData] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [isAIFeatureEnabled, setIsAIFeatureEnabled] = useState(false);
  const api = useApi();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { credits, decrementCredits } = useCredits();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchMindMap();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setIsAIFeatureEnabled(credits > 0);
  }, [credits]);

  const fetchMindMap = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/mindmaps/${id}`);
      
      if (response.success) {
        setMindmap(response.data);
        setMapData(response.data.data);
        setTitle(response.data.title);
      } else {
        toast({
          title: 'エラー',
          description: 'マインドマップの取得に失敗しました',
          variant: 'destructive'
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('マインドマップ取得エラー:', error);
      toast({
        title: 'エラー',
        description: '予期せぬエラーが発生しました',
        variant: 'destructive'
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMindMap = async () => {
    if (!mapData) return;
    
    try {
      setIsSaving(true);
      
      const payload = {
        title,
        data: mapData
      };
      
      let response;
      if (id) {
        response = await api.put(`/mindmaps/${id}`, payload);
      } else {
        response = await api.post('/mindmaps/', payload);
      }
      
      if (response.success) {
        toast({
          title: '保存完了',
          description: 'マインドマップを保存しました',
          variant: 'success'
        });
        
        if (!id && response.data.id) {
          navigate(`/mindmap/${response.data.id}`, { replace: true });
        }
      } else {
        toast({
          title: 'エラー',
          description: response.error || 'マインドマップの保存に失敗しました',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('マインドマップ保存エラー:', error);
      toast({
        title: 'エラー',
        description: '予期せぬエラーが発生しました',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapDataChange = (newData: any) => {
    setMapData(newData);
  };

  const handleAIFeatureUse = () => {
    const success = decrementCredits();
    if (!success) {
      toast({
        title: 'クレジット不足',
        description: 'AI機能を使用するにはクレジットが必要です',
        variant: 'warning'
      });
      return false;
    }
    return true;
  };

  const exportMindMap = () => {
    if (!mapData) return;
    
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${title || 'mindmap'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importMindMap = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          setMapData(importedData);
          toast({
            title: 'インポート完了',
            description: 'マインドマップをインポートしました',
            variant: 'success'
          });
        } catch (error) {
          toast({
            title: 'エラー',
            description: '無効なJSONファイルです',
            variant: 'destructive'
          });
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            title="ダッシュボードに戻る"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-none bg-transparent text-xl font-semibold focus:outline-none focus:ring-0 w-full max-w-md"
            placeholder="マインドマップのタイトル"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground mr-2">
            {isAIFeatureEnabled ? (
              <span className="flex items-center">
                <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                AI機能: 有効 ({credits} クレジット)
              </span>
            ) : (
              <span className="flex items-center">
                <Zap className="h-4 w-4 text-muted-foreground mr-1" />
                AI機能: 無効
              </span>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={importMindMap}
            title="マインドマップをインポート"
          >
            <Upload className="h-4 w-4 mr-1" />
            インポート
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportMindMap}
            title="マインドマップをエクスポート"
          >
            <Download className="h-4 w-4 mr-1" />
            エクスポート
          </Button>
          
          <Button 
            onClick={saveMindMap}
            disabled={isSaving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden">
        <MindMapEditor 
          initialData={mapData || {
            id: 0,
            title: 'メインテーマ',
            children: [],
            type: 'default'
          }}
          onDataChange={handleMapDataChange}
          onAIFeatureUse={handleAIFeatureUse}
          isAIFeatureEnabled={isAIFeatureEnabled}
        />
      </div>
    </div>
  );
};

export default MindMapEditorPage;
