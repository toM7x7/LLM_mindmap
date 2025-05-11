import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  ZoomInIcon, ZoomOutIcon, RefreshCwIcon, SaveIcon, 
  PlusIcon, TrashIcon, SearchIcon, BrainIcon,
  MessageSquareIcon, DownloadIcon, UploadIcon, 
  LayoutIcon, SunIcon, MoonIcon
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/useToast';
import { useApi } from '@/hooks/useApi';

type NodeType = 'default' | 'idea' | 'task' | 'question' | 'note';

interface MindMapNode {
  id: number;
  title: string;
  children: MindMapNode[];
  type: NodeType;
  notes?: string;
  x?: number;
  y?: number;
  parent?: MindMapNode | null;
}

interface MindMapEditorProps {
  initialData: MindMapNode;
  onDataChange: (newData: MindMapNode) => void;
  onAIFeatureUse: () => boolean;
  isAIFeatureEnabled: boolean;
}

const MindMapEditor: React.FC<MindMapEditorProps> = ({ 
  initialData, 
  onDataChange, 
  onAIFeatureUse,
  isAIFeatureEnabled 
}) => {
  const [data, setData] = useState<MindMapNode>(initialData);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [currentMode, setCurrentMode] = useState<'node' | 'zoom'>('node');
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [undoStack, setUndoStack] = useState<MindMapNode[]>([]);
  const [redoStack, setRedoStack] = useState<MindMapNode[]>([]);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [exportData, setExportData] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeGroupRef = useRef<SVGGElement>(null);
  const linkGroupRef = useRef<SVGGElement>(null);
  
  const { theme } = useTheme();
  const { credits } = useCredits();
  const { toast } = useToast();
  const api = useApi();
  
  const width = 1200;
  const height = 800;
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      if (nodeGroupRef.current && linkGroupRef.current) {
        d3.select(nodeGroupRef.current).attr('transform', event.transform.toString());
        d3.select(linkGroupRef.current).attr('transform', event.transform.toString());
      }
    });
  
  useEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).call(zoom);
    }
    
    const savedMap = localStorage.getItem('mindmap-data');
    if (savedMap) {
      try {
        const mapData = JSON.parse(savedMap);
        setNodeIdCounter(1);
        assignIds(mapData);
        rebuildParentReferences(mapData);
        setData(mapData);
        
        const savedChat = localStorage.getItem('mindmap-chat');
        if (savedChat) {
          setChatMessages(JSON.parse(savedChat));
        }
      } catch (e) {
        console.error('読み込みエラー:', e);
        toast({
          title: 'エラー',
          description: 'マインドマップの読み込みに失敗しました',
          variant: 'destructive'
        });
      }
    }
  }, []);
  
  useEffect(() => {
    updateMindMap();
  }, [data, selectedNode, theme]);
  
  useEffect(() => {
    onDataChange(data);
  }, [data, onDataChange]);
  
  useEffect(() => {
    if (selectedNode && isAIFeatureEnabled) {
      generateNodeSuggestions(selectedNode);
    } else {
      setAiSuggestions([]);
    }
  }, [selectedNode, isAIFeatureEnabled]);
  
  const assignIds = (node: MindMapNode) => {
    node.id = nodeIdCounter;
    setNodeIdCounter(prev => prev + 1);
    
    if (node.children) {
      node.children.forEach(child => {
        assignIds(child);
      });
    }
  };
  
  const rebuildParentReferences = (node: MindMapNode, parent: MindMapNode | null = null) => {
    node.parent = parent;
    
    if (node.children) {
      node.children.forEach(child => {
        rebuildParentReferences(child, node);
      });
    }
  };
  
  const saveState = () => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(data))]);
    setRedoStack([]);
  };
  
  const undo = () => {
    if (undoStack.length > 0) {
      const prevState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(data))]);
      setUndoStack(prev => prev.slice(0, -1));
      
      const newData = JSON.parse(JSON.stringify(prevState));
      rebuildParentReferences(newData);
      setData(newData);
      setSelectedNode(null);
    }
  };
  
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(data))]);
      setRedoStack(prev => prev.slice(0, -1));
      
      const newData = JSON.parse(JSON.stringify(nextState));
      rebuildParentReferences(newData);
      setData(newData);
      setSelectedNode(null);
    }
  };
  
  const updateMindMap = () => {
    if (!nodeGroupRef.current || !linkGroupRef.current) return;
    
  };
  
  const addChild = (parent: MindMapNode | null = null) => {
    saveState();
    
    const targetNode = parent || selectedNode;
    if (!targetNode) return;
    
    const newNode: MindMapNode = {
      id: nodeIdCounter,
      title: '新しいノード',
      children: [],
      type: 'default',
      parent: targetNode
    };
    
    setNodeIdCounter(prev => prev + 1);
    
    if (!targetNode.children) {
      targetNode.children = [];
    }
    
    targetNode.children.push(newNode);
    setData({...data});
    setSelectedNode(newNode);
  };
  
  const deleteNode = (node: MindMapNode | null = null) => {
    const targetNode = node || selectedNode;
    if (!targetNode || !targetNode.parent) return;
    
    saveState();
    
    const parent = targetNode.parent;
    parent.children = parent.children.filter(child => child.id !== targetNode.id);
    
    setData({...data});
    setSelectedNode(null);
  };
  
  const saveNodeDetails = () => {
    if (!selectedNode) return;
    
    saveState();
    
    const titleInput = document.getElementById('node-title-input') as HTMLInputElement;
    const notesInput = document.getElementById('node-notes') as HTMLTextAreaElement;
    const activeType = document.querySelector('.node-type-option.active') as HTMLElement;
    
    if (titleInput && titleInput.value.trim()) {
      selectedNode.title = titleInput.value.trim();
    }
    
    if (notesInput) {
      selectedNode.notes = notesInput.value;
    }
    
    if (activeType && activeType.dataset.type) {
      selectedNode.type = activeType.dataset.type as NodeType;
    }
    
    setData({...data});
    toast({
      title: '保存完了',
      description: 'ノード情報を保存しました',
    });
  };
  
  const saveMap = () => {
    try {
      const mapData = JSON.stringify(data);
      localStorage.setItem('mindmap-data', mapData);
      
      if (chatMessages.length > 0) {
        localStorage.setItem('mindmap-chat', JSON.stringify(chatMessages));
      }
      
      toast({
        title: '保存完了',
        description: 'マインドマップを保存しました',
      });
    } catch (e) {
      console.error('保存エラー:', e);
      toast({
        title: 'エラー',
        description: '保存に失敗しました',
        variant: 'destructive'
      });
    }
  };
  
  const exportMap = () => {
    setExportData(JSON.stringify(data, null, 2));
    toast({
      title: 'エクスポート完了',
      description: 'マインドマップをエクスポートしました',
    });
  };
  
  const importMap = () => {
    if (!exportData.trim()) {
      toast({
        title: '警告',
        description: 'インポートするデータを入力してください',
        variant: 'warning'
      });
      return;
    }
    
    try {
      saveState();
      
      const importedRoot = JSON.parse(exportData);
      setNodeIdCounter(1);
      assignIds(importedRoot);
      rebuildParentReferences(importedRoot);
      setData(importedRoot);
      setSelectedNode(null);
      
      toast({
        title: 'インポート完了',
        description: 'マインドマップをインポートしました',
      });
    } catch (e) {
      console.error('インポートエラー:', e);
      toast({
        title: 'エラー',
        description: 'インポートに失敗しました',
        variant: 'destructive'
      });
    }
  };
  
  const clearMap = () => {
    if (window.confirm('マインドマップをクリアして新しいマップを作成しますか？')) {
      saveState();
      
      setNodeIdCounter(1);
      const newData: MindMapNode = {
        id: 0,
        title: 'メインテーマ',
        children: [],
        type: 'default'
      };
      
      rebuildParentReferences(newData);
      setData(newData);
      setSelectedNode(null);
      
      toast({
        title: 'クリア完了',
        description: 'マインドマップをクリアしました',
      });
    }
  };
  
  const generateMapFromTopic = async () => {
    if (!topicInput.trim()) {
      toast({
        title: '警告',
        description: 'トピックを入力してください',
        variant: 'warning'
      });
      return;
    }
    
    if (!onAIFeatureUse()) {
      return;
    }
    
    setIsLoading(true);
    toast({
      title: '生成中',
      description: 'マインドマップを生成中...',
    });
    
    try {
      const response = await api.post('/ai/chat', {
        prompt: `以下のトピックでマインドマップを生成してください: ${topicInput}`,
        type: 'mindmap_generation'
      });
      
      if (response.success) {
        saveState();
        
        const newMap = JSON.parse(response.response);
        setNodeIdCounter(1);
        assignIds(newMap);
        rebuildParentReferences(newMap);
        setData(newMap);
        setSelectedNode(null);
        
        const newMessage = {
          role: 'system',
          content: `トピック「${topicInput}」に基づくマインドマップを新たに生成しました。`
        };
        setChatMessages(prev => [...prev, newMessage]);
        
        toast({
          title: '生成完了',
          description: `トピック「${topicInput}」のマインドマップを生成しました`,
        });
      } else {
        throw new Error(response.error || 'マインドマップの生成に失敗しました');
      }
    } catch (error) {
      console.error('マップ生成エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'マインドマップの生成に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const expandNodeWithAI = async (node: MindMapNode | null = null) => {
    const targetNode = node || selectedNode;
    if (!targetNode) {
      toast({
        title: '警告',
        description: 'ノードが選択されていません',
        variant: 'warning'
      });
      return;
    }
    
    if (!onAIFeatureUse()) {
      return;
    }
    
    setIsLoading(true);
    toast({
      title: '生成中',
      description: 'ノードを展開中...',
    });
    
    try {
      const response = await api.post('/ai/chat', {
        prompt: `「${targetNode.title}」ノードを展開してください`,
        context: {
          node_title: targetNode.title,
          node_notes: targetNode.notes,
          map_context: JSON.stringify(data)
        },
        type: 'node_expansion'
      });
      
      if (response.success) {
        saveState();
        
        const childNodes = JSON.parse(response.response);
        if (!targetNode.children) {
          targetNode.children = [];
        }
        
        childNodes.forEach((childData: any) => {
          const newNode: MindMapNode = {
            id: nodeIdCounter,
            title: childData.title,
            children: [],
            type: childData.type || 'default',
            parent: targetNode
          };
          
          setNodeIdCounter(prev => prev + 1);
          targetNode.children.push(newNode);
        });
        
        setData({...data});
        
        toast({
          title: '展開完了',
          description: `「${targetNode.title}」ノードを展開しました`,
        });
      } else {
        throw new Error(response.error || 'ノードの展開に失敗しました');
      }
    } catch (error) {
      console.error('ノード展開エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ノードの展開に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateNodeSuggestions = async (node: MindMapNode) => {
    if (credits <= 0) {
      setAiSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.post('/ai/chat', {
        prompt: `「${node.title}」に関連するキーワードやアイデアを5つ提案してください`,
        context: {
          node_title: node.title,
          node_notes: node.notes
        },
        type: 'node_suggestions'
      });
      
      if (response.success) {
        const suggestions = response.response.split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => line.replace(/^[0-9\-\*\.\s]+/, '').trim());
        
        setAiSuggestions(suggestions);
        
      } else {
        setAiSuggestions([]);
      }
    } catch (error) {
      console.error('提案生成エラー:', error);
      setAiSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    if (!onAIFeatureUse()) {
      return;
    }
    
    const userMessage = {
      role: 'user',
      content: chatInput
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);
    
    try {
      const mapContext = JSON.stringify(data);
      
      const response = await api.post('/ai/chat', {
        prompt: chatInput,
        context: {
          chat_history: chatMessages,
          current_map: mapContext
        },
        type: 'chat'
      });
      
      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.response
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'チャットメッセージの送信に失敗しました');
      }
    } catch (error) {
      console.error('チャットエラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'チャットメッセージの送信に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearChat = () => {
    if (window.confirm('チャット履歴をクリアしますか？')) {
      setChatMessages([]);
      toast({
        title: 'クリア完了',
        description: 'チャット履歴をクリアしました',
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div className="bg-background border-b border-border p-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={saveMap}>
            <SaveIcon className="h-4 w-4 mr-1" />
            保存
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportMap}>
            <DownloadIcon className="h-4 w-4 mr-1" />
            エクスポート
          </Button>
          
          <Button variant="outline" size="sm" onClick={importMap}>
            <UploadIcon className="h-4 w-4 mr-1" />
            インポート
          </Button>
          
          <Button variant="outline" size="sm" onClick={clearMap}>
            クリア
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={currentMode === 'node' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setCurrentMode('node')}
          >
            ノードモード
          </Button>
          
          <Button 
            variant={currentMode === 'zoom' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setCurrentMode('zoom')}
          >
            ズームモード
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => {}}>
            <ZoomInIcon className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => {}}>
            <ZoomOutIcon className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => {}}>
            <RefreshCwIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* マインドマップエリア */}
        <div className="flex-1 overflow-hidden">
          <svg 
            ref={svgRef} 
            width="100%" 
            height="100%" 
            className="bg-background"
          >
            <g ref={linkGroupRef}></g>
            <g ref={nodeGroupRef}></g>
          </svg>
        </div>
        
        {/* サイドパネル */}
        <div className="w-80 border-l border-border bg-background overflow-y-auto">
          <Tabs defaultValue="edit">
            <TabsList className="w-full">
              <TabsTrigger value="edit" className="flex-1">マップ編集</TabsTrigger>
              <TabsTrigger value="node" className="flex-1">ノード詳細</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">AIツール</TabsTrigger>
            </TabsList>
            
            {/* マップ編集タブ */}
            <TabsContent value="edit" className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">トピックからマップ生成</h3>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="トピックを入力" 
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                  />
                  <Button 
                    onClick={generateMapFromTopic}
                    disabled={isLoading || !topicInput.trim() || credits <= 0}
                  >
                    <BrainIcon className="h-4 w-4 mr-1" />
                    生成
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">JSONエクスポート/インポート</h3>
                <Textarea 
                  placeholder="JSONデータ" 
                  rows={10}
                  value={exportData}
                  onChange={(e) => setExportData(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={exportMap}
                  >
                    エクスポート
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={importMap}
                  >
                    インポート
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">表示設定</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {}}
                  >
                    <LayoutIcon className="h-4 w-4 mr-1" />
                    自動レイアウト
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {}}
                  >
                    {theme === 'dark' ? (
                      <><SunIcon className="h-4 w-4 mr-1" />ライト</>
                    ) : (
                      <><MoonIcon className="h-4 w-4 mr-1" />ダーク</>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* ノード詳細タブ */}
            <TabsContent value="node" className="p-4 space-y-4">
              {selectedNode ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">タイトル</label>
                    <Input 
                      id="node-title-input"
                      defaultValue={selectedNode.title}
                      placeholder="ノードタイトル"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ノードタイプ</label>
                    <div className="flex space-x-1">
                      {['default', 'idea', 'task', 'question', 'note'].map((type) => (
                        <Button 
                          key={type}
                          variant="outline"
                          size="sm"
                          className={`node-type-option ${selectedNode.type === type ? 'active' : ''}`}
                          data-type={type}
                          onClick={() => {
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">メモ</label>
                    <Textarea 
                      id="node-notes"
                      defaultValue={selectedNode.notes || ''}
                      placeholder="ノードに関するメモ"
                      rows={5}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1"
                      onClick={saveNodeDetails}
                    >
                      保存
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => addChild()}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      子ノード追加
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => deleteNode()}
                      disabled={!selectedNode.parent}
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      削除
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">AI提案</label>
                      <input 
                        type="checkbox" 
                        id="ai-suggest-toggle"
                        checked={isAIFeatureEnabled}
                        disabled={true} // User can't toggle this directly, controlled by parent
                      />
                    </div>
                    
                    <div id="ai-suggestions" className="space-y-1">
                      {isAIFeatureEnabled && (
                        isLoading ? (
                          <p className="text-sm text-muted-foreground">提案を生成中...</p>
                        ) : (
                          aiSuggestions.length > 0 ? (
                            aiSuggestions.map((suggestion, index) => (
                              <div 
                                key={index}
                                className="text-sm p-1 border border-border rounded cursor-pointer hover:bg-accent"
                                onClick={() => {
                                }}
                              >
                                {suggestion}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">提案はありません</p>
                          )
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">ノードが選択されていません</p>
                </div>
              )}
            </TabsContent>
            
            {/* AIツールタブ */}
            <TabsContent value="ai" className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">AIアシスタント</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => expandNodeWithAI()}
                    disabled={!selectedNode || isLoading || credits <= 0}
                  >
                    <BrainIcon className="h-4 w-4 mr-1" />
                    ノード展開
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">マップ分析</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {}}
                    disabled={isLoading || credits <= 0}
                  >
                    洞察生成
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {}}
                    disabled={isLoading || credits <= 0}
                  >
                    再構成提案
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">検索</h3>
                <div className="flex space-x-2">
                  <Input 
                    id="search-input"
                    placeholder="検索語を入力"
                  />
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => {}}
                  >
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">マップ要約</h3>
                <Textarea 
                  id="map-summary"
                  placeholder="マップ要約がここに表示されます"
                  rows={5}
                  readOnly
                />
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  disabled={isLoading || credits <= 0}
                >
                  要約生成
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* チャットコンテナ */}
      <div 
        id="chat-container"
        className="border-t border-border bg-background h-[30%] flex flex-col"
      >
        <div className="flex justify-between items-center p-2 border-b border-border">
          <h3 className="text-sm font-medium">AIアシスタントチャット</h3>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearChat}
            >
              クリア
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {}}
              id="toggle-chat-button"
            >
              <MessageSquareIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div 
          id="chat-messages"
          className="flex-1 overflow-y-auto p-2 space-y-2"
        >
          {chatMessages.map((msg, index) => (
            <div 
              key={index}
              className={`p-2 rounded max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
        
        <div 
          id="chat-input-area"
          className="p-2 border-t border-border flex space-x-2"
        >
          <Textarea 
            id="chat-input"
            placeholder="AIアシスタントに質問..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
            className="resize-none"
            rows={2}
          />
          <Button 
            id="send-button"
            onClick={sendChatMessage}
            disabled={isLoading || !chatInput.trim() || credits <= 0}
          >
            送信
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MindMapEditor;
