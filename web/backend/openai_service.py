import os
from typing import List, Dict, Any, Optional
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key-here")

client = OpenAI(api_key=OPENAI_API_KEY)

async def generate_chat_completion(
    messages: List[Dict[str, str]], 
    model: str = "gpt-4-turbo-preview",
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> Dict[str, Any]:
    """
    OpenAI APIを使用してチャット応答を生成する
    
    Args:
        messages: チャットメッセージのリスト
        model: 使用するモデル
        temperature: 応答の多様性（0-1）
        max_tokens: 最大トークン数
        
    Returns:
        APIレスポンス
    """
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return {
            "success": True,
            "content": response.choices[0].message.content,
            "usage": response.usage.to_dict() if response.usage else None
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def generate_mindmap(
    prompt: str,
    context: Optional[Dict[str, Any]] = None,
    model: str = "gpt-4-turbo-preview"
) -> Dict[str, Any]:
    """
    マインドマップを生成するためのAI応答を取得
    
    Args:
        prompt: マインドマップ生成のためのプロンプト
        context: 追加コンテキスト（現在のマップデータなど）
        model: 使用するモデル
        
    Returns:
        マインドマップデータを含むレスポンス
    """
    system_message = """
    あなたはマインドマップ生成の専門家です。ユーザーの入力に基づいて、構造化されたマインドマップを
    JSON形式で生成してください。出力は以下の形式に従ってください：
    
    {
      "title": "メインテーマ",
      "children": [
        { "title": "サブテーマ1", "children": [], "type": "idea" },
        { "title": "サブテーマ2", "children": [], "type": "task" }
      ],
      "type": "default"
    }
    
    ノードタイプは以下のいずれかを使用してください：
    - default: 標準ノード
    - idea: アイデアノード
    - task: タスクノード
    - question: 質問ノード
    - note: メモノード
    
    JSONのみを返してください。説明や追加テキストは含めないでください。
    """
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ]
    
    if context and context.get("current_map"):
        context_message = f"現在のマインドマップ: {context['current_map']}"
        messages.append({"role": "user", "content": context_message})
    
    return await generate_chat_completion(messages, model=model, temperature=0.7)

async def expand_node(
    node_title: str,
    node_content: Optional[str] = None,
    map_context: Optional[str] = None,
    model: str = "gpt-4-turbo-preview"
) -> Dict[str, Any]:
    """
    既存のノードを展開するための子ノードを生成
    
    Args:
        node_title: 展開するノードのタイトル
        node_content: ノードの追加コンテンツ（メモなど）
        map_context: マップの他の部分に関するコンテキスト
        model: 使用するモデル
        
    Returns:
        子ノードのリストを含むレスポンス
    """
    system_message = """
    あなたはマインドマップ作成の専門家です。与えられたノードに対して、関連性の高い子ノードを
    生成してください。出力は以下のJSON形式に従ってください：
    
    [
      { "title": "子ノード1", "type": "idea" },
      { "title": "子ノード2", "type": "task" },
      { "title": "子ノード3", "type": "question" }
    ]
    
    ノードタイプは以下のいずれかを使用してください：
    - default: 標準ノード
    - idea: アイデアノード
    - task: タスクノード
    - question: 質問ノード
    - note: メモノード
    
    JSONのみを返してください。説明や追加テキストは含めないでください。
    """
    
    prompt = f"以下のノードに対する関連性の高い子ノードを5-7個生成してください：\n\nタイトル: {node_title}"
    
    if node_content:
        prompt += f"\n\nノード内容: {node_content}"
    
    if map_context:
        prompt += f"\n\nマップコンテキスト: {map_context}"
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ]
    
    return await generate_chat_completion(messages, model=model, temperature=0.8)

async def generate_insights(
    map_data: Dict[str, Any],
    model: str = "gpt-4-turbo-preview"
) -> Dict[str, Any]:
    """
    マインドマップから洞察を生成
    
    Args:
        map_data: マインドマップのデータ
        model: 使用するモデル
        
    Returns:
        洞察を含むレスポンス
    """
    system_message = """
    あなたはマインドマップ分析の専門家です。提供されたマインドマップを分析し、
    重要な洞察、パターン、関連性、および次のステップの提案を提供してください。
    分析は以下のセクションに分けてください：
    
    1. 主要な洞察
    2. 見つかったパターンと関連性
    3. 潜在的な盲点や見落としている可能性のある領域
    4. 次のステップの提案
    
    マークダウン形式で回答してください。
    """
    
    map_json = str(map_data)
    prompt = f"以下のマインドマップを分析し、洞察を提供してください：\n\n{map_json}"
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ]
    
    return await generate_chat_completion(messages, model=model, temperature=0.7)
