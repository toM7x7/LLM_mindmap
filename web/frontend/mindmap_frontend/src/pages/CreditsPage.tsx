import React, { useState, useEffect } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Zap, CreditCard, Clock, Info } from 'lucide-react';

interface CreditPackage {
  id: number;
  name: string;
  amount: number;
  price: number;
  description: string;
}

interface Transaction {
  id: number;
  type: 'purchase' | 'usage';
  amount: number;
  description: string;
  created_at: string;
}

const CreditsPage: React.FC = () => {
  const { credits, fetchCredits } = useCredits();
  const api = useApi();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isPurchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCreditPackages();
    fetchTransactions();
  }, []);
  
  const fetchCreditPackages = async () => {
    try {
      const response = await api.get('/credits/packages');
      
      if (response.success) {
        setPackages(response.data);
      } else {
        console.error('クレジットパッケージの取得に失敗しました:', response.error);
      }
    } catch (error) {
      console.error('クレジットパッケージ取得エラー:', error);
    }
  };
  
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/credits/transactions');
      
      if (response.success) {
        setTransactions(response.data);
      } else {
        console.error('取引履歴の取得に失敗しました:', response.error);
      }
    } catch (error) {
      console.error('取引履歴取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePurchase = async (packageId: number) => {
    setError(null);
    
    try {
      setPurchasing(true);
      
      const response = await api.post('/credits/purchase', {
        package_id: packageId
      });
      
      if (response.success) {
        toast({
          title: '購入完了',
          description: 'クレジットを購入しました',
          variant: 'success'
        });
        
        fetchCredits();
        fetchTransactions();
      } else {
        setError(response.error || 'クレジットの購入に失敗しました');
      }
    } catch (error) {
      console.error('クレジット購入エラー:', error);
      setError('予期せぬエラーが発生しました');
    } finally {
      setPurchasing(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  const dummyPackages: CreditPackage[] = [
    {
      id: 1,
      name: 'スターターパック',
      amount: 10,
      price: 500,
      description: 'マインドマップ作成や拡張に使用できる10クレジット'
    },
    {
      id: 2,
      name: 'スタンダードパック',
      amount: 50,
      price: 2000,
      description: '頻繁に使用する方向けの50クレジット。お得な割引価格'
    },
    {
      id: 3,
      name: 'プロフェッショナルパック',
      amount: 200,
      price: 6000,
      description: 'プロフェッショナル向けの大容量パック。最もお得な価格'
    }
  ];
  
  const dummyTransactions: Transaction[] = [
    {
      id: 1,
      type: 'purchase',
      amount: 10,
      description: 'スターターパック購入',
      created_at: '2025-05-01T10:30:00Z'
    },
    {
      id: 2,
      type: 'usage',
      amount: -1,
      description: 'マインドマップ生成',
      created_at: '2025-05-02T14:20:00Z'
    },
    {
      id: 3,
      type: 'usage',
      amount: -1,
      description: 'ノード展開',
      created_at: '2025-05-03T09:15:00Z'
    }
  ];
  
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <h1 className="text-2xl font-bold">クレジット管理</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            現在のクレジット
          </CardTitle>
          <CardDescription>
            AI機能を使用するためのクレジット残高
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{credits}</p>
              <p className="text-sm text-muted-foreground">利用可能なクレジット</p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg max-w-xs">
              <h3 className="font-medium mb-2 flex items-center gap-1">
                <Info className="h-4 w-4" />
                クレジットについて
              </h3>
              <p className="text-sm text-muted-foreground">
                クレジットはAI機能を使用するために必要です。マインドマップの生成、ノードの展開、AIチャットなどの機能に使用されます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            クレジットを購入
          </CardTitle>
          <CardDescription>
            AI機能を使用するためのクレジットを購入できます
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(packages.length > 0 ? packages : dummyPackages).map((pkg) => (
              <Card key={pkg.id} className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold">{pkg.amount}</span>
                    <span className="text-lg">¥{pkg.price.toLocaleString()}</span>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? '処理中...' : '購入する'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            取引履歴
          </CardTitle>
          <CardDescription>
            クレジットの購入と使用履歴
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日時</TableHead>
                  <TableHead>種類</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead className="text-right">変動</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(transactions.length > 0 ? transactions : dummyTransactions).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                    <TableCell>
                      {transaction.type === 'purchase' ? '購入' : '使用'}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsPage;
