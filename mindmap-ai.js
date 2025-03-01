/**
 * マインドマップエディター - AI機能
 * LLMとの連携、チャット機能、AI生成機能を担当
 */

/***************************************************
 * グローバル設定
 ***************************************************/
// OpenAI API設定
const OPENAI_API_KEY = "***";
let chatMessages = [];

/***************************************************
 * LLM API関連
 ***************************************************/
// チャットメッセージ送信
async function sendChatMessageToLLM(message) {
  try {
    // 現在のマップの要約を生成
    const currentSummary = generateMapSummary(data);
    const selectedNodeInfo = selectedNode ? 
      `現在選択中のノード: ${selectedNode.title}` : 
      "ノードは選択されていません";
      
    const systemMessage = `あなたは創造的なアイデア開発のアシスタントです。
以下のマインドマップの情報を前提に、質問に答えたり、アイデアを発展させるサポートをしてください。

【現在のマップ要約】
${currentSummary}

【ノード情報】
${selectedNodeInfo}

基本方針:
- ユーザーのアイデアを否定せず、建設的に発展させる
- 複数の視点からアイデアを検討する
- 具体例や実践的なアプリケーションを提案する
- 質問に対しては簡潔かつ明確に回答する
- 必要に応じてマインドマップへの反映方法をアドバイスする`;

    const messagesToSend = [
      { role: "system", content: systemMessage },
      ...chatMessages,
      { role: "user", content: message }
    ];
    
    // チャットメッセージをローディング状態にする
    const loadingMessageDiv = document.createElement("div");
    loadingMessageDiv.className = "chat-message assistant-message";
    loadingMessageDiv.textContent = "考え中...";
    document.getElementById("chat-messages").appendChild(loadingMessageDiv);
    document.getElementById("chat-messages").scrollTop = document.getElementById("chat-messages").scrollHeight;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.5-preview",
        messages: messagesToSend,
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) throw new Error("OpenAI APIエラー: " + response.statusText);
    const result = await response.json();
    
    // ローディングメッセージを削除
    loadingMessageDiv.remove();
    
    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API (chat):", error);
    return "エラーが発生しました: " + error.message;
  }
}

// マインドマップ生成リクエスト
async function sendMindMapMessageToLLM(message) {
  try {
    const loadingElement = document.createElement("div");
    loadingElement.className = "progress-container";
    loadingElement.innerHTML = '<div class="progress-bar" style="width: 0%"></div>';
    document.querySelector(".panel-section").appendChild(loadingElement);
    
    // アニメーション
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress > 90) progress = 90;
      loadingElement.querySelector(".progress-bar").style.width = `${progress}%`;
    }, 200);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.5-preview",
        messages: [
          {
            role: "system",
            content: `
あなたはマインドマップ生成アシスタントです。
ユーザーの指示に応じて、必ず指定したJSON形式のみを返答してください。
余計な説明や文章は一切含めないでください。

【期待するJSON形式の例】
{
  "title": "メインテーマ",
  "children": [
    { 
      "title": "サブテーマ1", 
      "children": [],
      "type": "default" 
    },
    { 
      "title": "サブテーマ2", 
      "children": [],
      "type": "idea" 
    }
  ],
  "type": "default"
}

nodeのtypeには以下のいずれかの値を設定してください:
- default: 通常のノード（特に指定がない場合）
- idea: アイデアノード（新しいアイデアや発想）
- task: タスクノード（実行すべき作業）
- question: 質問ノード（検討すべき疑問）
- note: メモノード（補足情報）

深い階層のマインドマップを作成する場合も、各階層にちょうど良い数の子ノード（3-7個程度）を配置してください。
            `
          },
          { role: "user", content: message }
        ],
        temperature: 0.2,
        max_tokens: 5000
      })
    });
    
    clearInterval(interval);
    loadingElement.remove();
    
    if (!response.ok) throw new Error("OpenAI APIエラー: " + response.statusText);
    const result = await response.json();
    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API (mind map):", error);
    return "エラーが発生しました: " + error.message;
  }
}

/***************************************************
 * チャット関連
 ***************************************************/
// チャットメッセージの表示
function renderChat() {
  const chatContainer = document.getElementById("chat-messages");
  chatContainer.innerHTML = "";
  
  chatMessages.forEach(msg => {
    const div = document.createElement("div");
    div.className = `chat-message ${msg.role === "user" ? "user-message" : "assistant-message"}`;
    
    // メッセージ内容の改行をHTMLの改行に変換
    const formattedContent = msg.content.replace(/\n/g, "<br>");
    div.innerHTML = formattedContent;
    
    chatContainer.appendChild(div);
  });
  
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// チャットメッセージの送信
async function sendChatMessage() {
  const userInput = document.getElementById("chat-input").value.trim();
  if (!userInput) return;
  
  // ユーザーメッセージを追加
  chatMessages.push({ role: "user", content: userInput });
  renderChat();
  document.getElementById("chat-input").value = "";
  
  // AIの応答を取得
  const assistantResponse = await sendChatMessageToLLM(userInput);
  chatMessages.push({ role: "assistant", content: assistantResponse });
  renderChat();
}

/***************************************************
 * AIアシスト機能
 ***************************************************/
// ノードのサジェスト生成
async function generateNodeSuggestions(node) {
  if (!node) return;
  
  try {
    const suggestionsContainer = document.getElementById("ai-suggestions");
    suggestionsContainer.innerHTML = '<div class="suggestion-chip">生成中...</div>';
    
    const currentSummary = generateMapSummary(data);
    const nodeContext = `
選択ノード: ${node.title}
${node.notes ? `ノートの内容: ${node.notes}` : ""}
${node.children ? `子ノード: ${node.children.map(c => c.title).join(", ")}` : "子ノードなし"}`;
    
    const prompt = `以下のマインドマップと現在選択されているノードの情報から、
このノードに関連する質問やアイデアのサジェストを5つ生成してください。
各サジェストは短く簡潔にしてください（10語以内）。

【マップ要約】
${currentSummary}

【ノード情報】
${nodeContext}

JSON形式で以下のように返してください:
{ "suggestions": ["サジェスト1", "サジェスト2", "サジェスト3", "サジェスト4", "サジェスト5"] }`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.5-preview",
        messages: [
          { role: "system", content: "あなたはマインドマップ作成を支援するアシスタントです。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });
    
    if (!response.ok) throw new Error("OpenAI APIエラー: " + response.statusText);
    const result = await response.json();
    const content = result.choices[0].message.content.trim();
    
    try {
      const cleaned = cleanJSON(content);
      const suggestions = JSON.parse(cleaned).suggestions;
      
      suggestionsContainer.innerHTML = "";
      suggestions.forEach(suggestion => {
        const chip = document.createElement("div");
        chip.className = "suggestion-chip";
        chip.textContent = suggestion;
        chip.addEventListener("click", () => {
          document.getElementById("chat-input").value = suggestion;
          document.getElementById("chat-input").focus();
        });
        suggestionsContainer.appendChild(chip);
      });
    } catch (e) {
      console.error("サジェスト解析エラー:", e);
      suggestionsContainer.innerHTML = "";
    }
  } catch (error) {
    console.error("サジェスト生成エラー:", error);
    document.getElementById("ai-suggestions").innerHTML = "";
  }
}

// AIによるノード展開
async function expandNodeWithAI(node) {
  if (!node) {
    if (selectedNode) {
      node = selectedNode;
    } else {
      showNotification("展開するノードが選択されていません", "warning");
      return;
    }
  }
  
  saveState();
  
  const currentSummary = generateMapSummary(data);
  const prompt = `以下のマインドマップの情報を基に、「${node.title}」というノードを展開して
子ノードのアイデアを提案してください。

【現在のマップ要約】
${currentSummary}

次の形式でJSONを返してください:
{
  "children": [
    { "title": "アイデア1", "type": "idea" },
    { "title": "質問1", "type": "question" },
    { "title": "タスク1", "type": "task" }
  ]
}

様々な視点からのアイデアを5つほど提案し、適切なノードタイプを設定してください。`;
  
  try {
    showNotification("ノードを展開中...");
    
    const response = await sendMindMapMessageToLLM(prompt);
    let newChildren;
    
    try {
      const cleaned = cleanJSON(response);
      newChildren = JSON.parse(cleaned).children;
    } catch (e) {
      showNotification("展開結果の解析に失敗しました", "error");
      console.error(e);
      return;
    }
    
    if (!node.children) node.children = [];
    
    // 位置調整のための準備
    const baseX = node.x;
    const baseY = node.y;
    const startY = baseY - ((newChildren.length - 1) * 40) / 2;
    
    // 新しい子ノードの追加
    newChildren.forEach((child, index) => {
      const newNode = {
        id: nodeIdCounter++,
        title: child.title,
        type: child.type || "default",
        children: [],
        parent: node
      };
      
      // 円形に配置
      const angle = (index / newChildren.length) * Math.PI * 2;
      const radius = 150;
      newNode.x = baseX + Math.cos(angle) * radius;
      newNode.y = baseY + Math.sin(angle) * radius;
      
      node.children.push(newNode);
    });
    
    update();
    showNotification(`「${node.title}」ノードを展開しました`);
  } catch (error) {
    console.error("ノード展開エラー:", error);
    showNotification("ノード展開に失敗しました", "error");
  }
}

// AIによるマップ要約生成
async function generateInsightsWithAI() {
  const summaryText = document.getElementById("map-summary");
  summaryText.value = "洞察を抽出中...";
  
  const currentMapJSON = generateExportData(data);
  const prompt = `以下のマインドマップのJSONデータから、重要な洞察やパターン、
または見落としている可能性のある視点を抽出してください。

【マインドマップJSON】
${currentMapJSON}

以下の形式で回答してください:
1. 主要な洞察: マップから見えてくる重要なポイント
2. パターン: 繰り返し出現するテーマや関係性
3. 見落としている可能性のある視点: マップに含まれていない重要な考慮点
4. 次のステップ: このマップを発展させるための提案`;
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.5-preview",
        messages: [
          { role: "system", content: "あなたはマインドマップの分析と洞察抽出の専門家です。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) throw new Error("OpenAI APIエラー: " + response.statusText);
    const result = await response.json();
    summaryText.value = result.choices[0].message.content.trim();
  } catch (error) {
    console.error("洞察抽出エラー:", error);
    summaryText.value = "エラーが発生しました: " + error.message;
  }
}

// ノードコンテキストモーダルを開く
function openNodeContextModal(node) {
  if (!node) return;
  
  document.getElementById("node-context-modal").style.display = "block";
  document.querySelector("#node-context-modal .modal-title").textContent = 
    `「${node.title}」について深掘りする`;
  
  // ノードの情報を表示
  let contextHTML = `<div style="margin-bottom: 15px;">
    <strong>ノード:</strong> ${node.title}<br>
    ${node.notes ? `<strong>メモ:</strong> ${node.notes}<br>` : ""}
    <strong>タイプ:</strong> ${node.type || "デフォルト"}<br>
    <strong>子ノード数:</strong> ${node.children ? node.children.length : 0}
  </div>
  <p>このノードについて質問や指示を入力してください。例:</p>
  <ul style="margin-bottom: 15px;">
    <li>このアイデアの課題は何ですか？</li>
    <li>実装するための手順を教えてください</li>
    <li>類似事例や参考になる例を教えてください</li>
    <li>このコンセプトを発展させるには？</li>
  </ul>`;
  
  document.getElementById("node-context-content").innerHTML = contextHTML;
  document.getElementById("node-context-prompt").value = "";
}

// チャット履歴からマインドマップ生成
async function generateMapFromChat() {
  if (chatMessages.length === 0) {
    showNotification("チャット履歴がありません", "warning");
    return;
  }
  
  let aggregatedChat = chatMessages.map(msg => {
    return (msg.role === "user" ? "You: " : "Assistant: ") + msg.content;
  }).join("\n");
  
  const prompt = `以下のチャット履歴を元に、マインドマップを生成してください。出力は必ず以下のJSON形式のみで返してください。
【形式の例】
{
  "title": "メインテーマ",
  "children": [
    { "title": "サブテーマ1", "children": [], "type": "idea" },
    { "title": "サブテーマ2", "children": [], "type": "task" }
  ],
  "type": "default"
}

チャット履歴:
${aggregatedChat}`;
  
  const assistantResponse = await sendMindMapMessageToLLM(prompt);
  let newMap;
  try {
    const cleaned = cleanJSON(assistantResponse);
    newMap = JSON.parse(cleaned);
  } catch(e) {
    showNotification("マインドマップのJSONをパースできませんでした", "error");
    console.error(e, assistantResponse);
    return;
  }
  
  saveState();
  
  nodeIdCounter = 1;
  computeTreeLayout(newMap);
  assignIds(newMap);
  data = newMap;
  rebuildParentReferences(data);
  selectedNode = null;
  
  update();
  
  showNotification("チャット履歴からマインドマップを生成しました");
}

// チャットからマインドマップ更新
async function updateMapFromChat() {
  if (chatMessages.length === 0) {
    showNotification("チャット履歴がありません", "warning");
    return;
  }

  // 現在のマインドマップJSONを取得
  const currentMapJSON = generateExportData(data);

  // チャット履歴の集約
  let aggregatedChat = chatMessages.map(msg => {
    return (msg.role === "user" ? "You: " : "Assistant: ") + msg.content;
  }).join("\n");

  const prompt = `以下は現在のマインドマップとチャット履歴です。

【現在のマインドマップJSON】
${currentMapJSON}

【チャット履歴】
${aggregatedChat}

上記情報を基に、既存の構造をできるだけ維持しつつ、必要な部分のみ追加・修正した新しいマインドマップのJSONを生成してください。
出力は必ず以下のJSON形式のみで返答してください：
{
  "title": "メインテーマ",
  "children": [
    { "title": "サブテーマ1", "children": [], "type": "idea" },
    { "title": "サブテーマ2", "children": [], "type": "task" }
  ],
  "type": "default"
}`;
  
  const assistantResponse = await sendMindMapMessageToLLM(prompt);
  let updatedMap;
  try {
    const cleaned = cleanJSON(assistantResponse);
    updatedMap = JSON.parse(cleaned);
  } catch(e) {
    showNotification("更新後のマインドマップJSONをパースできませんでした", "error");
    console.error(e, assistantResponse);
    return;
  }

  // 差分検出
  function findChangedNodes(oldData, newData, path = "") {
    let changes = [];
    
    // タイトルの変更をチェック
    if (oldData.title !== newData.title) {
      changes.push({
        type: "changed",
        path: path,
        oldValue: oldData.title,
        newValue: newData.title
      });
    }
    
    // ノードタイプの変更をチェック
    if (oldData.type !== newData.type) {
      changes.push({
        type: "typeChanged",
        path: path,
        oldValue: oldData.type || "default",
        newValue: newData.type || "default"
      });
    }
    
    // 子ノードのチェック
    const oldChildren = oldData.children || [];
    const newChildren = newData.children || [];
    
    // 新しい子ノードを検出
    for (let i = 0; i < newChildren.length; i++) {
      const newChild = newChildren[i];
      const matchingOldChild = oldChildren.find(c => c.title === newChild.title);
      
      if (!matchingOldChild) {
        changes.push({
          type: "added",
          path: path ? `${path} > ${newData.title}` : newData.title,
          value: newChild.title
        });
      } else {
        // 再帰的に子ノードも検証
        const childChanges = findChangedNodes(
          matchingOldChild, 
          newChild, 
          path ? `${path} > ${newData.title}` : newData.title
        );
        changes = changes.concat(childChanges);
      }
    }
    
    // 削除された子ノードを検出
    for (let i = 0; i < oldChildren.length; i++) {
      const oldChild = oldChildren[i];
      const matchingNewChild = newChildren.find(c => c.title === oldChild.title);
      
      if (!matchingNewChild) {
        changes.push({
          type: "removed",
          path: path ? `${path} > ${oldData.title}` : oldData.title,
          value: oldChild.title
        });
      }
    }
    
    return changes;
  }
  
  const changes = findChangedNodes(data, updatedMap);
  
  // 差分情報をモーダル内に表示
  let diffHTML = "<p>以下の変更が検出されました：</p><ul>";
  
  if (changes.length === 0) {
    diffHTML = "<p>変更点はありません</p>";
  } else {
    changes.forEach(change => {
      if (change.type === "added") {
        diffHTML += `<li style="color:var(--success-color)">追加: ${change.path} に「${change.value}」</li>`;
      } else if (change.type === "removed") {
        diffHTML += `<li style="color:var(--danger-color)">削除: ${change.path} から「${change.value}」</li>`;
      } else if (change.type === "changed") {
        diffHTML += `<li style="color:var(--warning-color)">変更: ${change.path} を「${change.oldValue}」から「${change.newValue}」に</li>`;
      } else if (change.type === "typeChanged") {
        diffHTML += `<li style="color:var(--accent-color)">タイプ変更: ${change.path} を「${change.oldValue}」から「${change.newValue}」に</li>`;
      }
    });
  }
  
  diffHTML += "</ul>";
  document.getElementById("diff-content").innerHTML = diffHTML;
  
  // モーダル表示
  document.getElementById("update-modal").style.display = "block";
}

// 更新確認後の処理
function confirmMapUpdate(updatedMap) {
  saveState();
  
  nodeIdCounter = 1;
  // 位置情報を維持するために、新しいデータに古いデータの位置をコピー
  function copyPositions(oldNode, newNode) {
    if (oldNode && newNode) {
      if (oldNode.x !== undefined && oldNode.y !== undefined) {
        newNode.x = oldNode.x;
        newNode.y = oldNode.y;
      }
      
      const oldChildren = oldNode.children || [];
      const newChildren = newNode.children || [];
      
      newChildren.forEach(newChild => {
        const matchingOldChild = oldChildren.find(c => c.title === newChild.title);
        if (matchingOldChild) {
          copyPositions(matchingOldChild, newChild);
        }
      });
    }
  }
  
  copyPositions(data, updatedMap);
  
  // 位置情報がないノードは自動レイアウト
  function setDefaultPositions(node, parentX, parentY, index) {
    if (!node.x || !node.y) {
      if (parentX !== undefined && parentY !== undefined) {
        // 親の周りに円形に配置
        const siblings = node.parent ? (node.parent.children || []).length : 1;
        const angle = (index / siblings) * Math.PI * 2;
        const radius = 150;
        node.x = parentX + Math.cos(angle) * radius;
        node.y = parentY + Math.sin(angle) * radius;
      } else {
        // ルートノードの場合は中央に配置
        node.x = 400;
        node.y = 200;
      }
    }
    
    if (node.children) {
      node.children.forEach((child, i) => {
        setDefaultPositions(child, node.x, node.y, i);
      });
    }
  }
  
  setDefaultPositions(updatedMap);
  
  data = updatedMap;
  rebuildParentReferences(data);
  
  // 現在選択中のノードがまだ存在するか確認
  if (selectedNode) {
    let stillExists = false;
    
    function findNodeById(node, id) {
      if (node.id === id) return node;
      if (node.children) {
        for (let child of node.children) {
          const found = findNodeById(child, id);
          if (found) return found;
        }
      }
      return null;
    }
    
    const foundNode = findNodeById(data, selectedNode.id);
    if (foundNode) {
      selectedNode = foundNode;
    } else {
      selectedNode = null;
    }
  }
  
  update();
  document.getElementById("update-modal").style.display = "none";
  showNotification("マインドマップが更新されました");
}
