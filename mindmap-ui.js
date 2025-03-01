/**
 * マインドマップエディター - UIイベント設定
 * ユーザーインタフェース関連のイベントハンドラとUI制御を担当
 */

/***************************************************
 * ページ読み込み時の初期化
 ***************************************************/
document.addEventListener("DOMContentLoaded", function() {
  // イベントリスナーの設定
  setupEventListeners();
  
  // 保存されたマップがあれば読み込む
  if (localStorage.getItem("mindmap-data")) {
    loadSavedMap();
  }
});

/***************************************************
 * イベントリスナー設定
 ***************************************************/
function setupEventListeners() {
  // エクスポート・インポート関連
  document.getElementById("export-button").addEventListener("click", exportMap);
  document.getElementById("import-button").addEventListener("click", importMap);
  document.getElementById("clear-button").addEventListener("click", clearMap);
  
  // マップ生成関連
  document.getElementById("generate-button").addEventListener("click", generateMapFromTopic);
  document.getElementById("generate-chat-map-button").addEventListener("click", generateMapFromChat);
  document.getElementById("update-chat-map-button").addEventListener("click", updateMapFromChat);
  
  // 表示設定関連
  document.getElementById("toggle-mode-button").addEventListener("click", toggleMode);
  document.getElementById("auto-layout-button").addEventListener("click", applyAutoLayout);
  
  // ノード詳細関連
  document.getElementById("save-node-button").addEventListener("click", saveNodeDetails);
  document.getElementById("add-child-node-button").addEventListener("click", addChildToSelected);
  document.getElementById("delete-selected-node-button").addEventListener("click", deleteSelectedNode);
  document.getElementById("search-button").addEventListener("click", searchNodes);
  
  // タイプセレクタのイベント
  document.querySelectorAll(".node-type-option").forEach(option => {
    option.addEventListener("click", function() {
      document.querySelectorAll(".node-type-option").forEach(opt => {
        opt.classList.remove("active");
      });
      this.classList.add("active");
    });
  });
  
  // AIツール関連
  document.getElementById("expand-node-ai-button").addEventListener("click", () => {
    if (selectedNode) {
      expandNodeWithAI(selectedNode);
    } else {
      showNotification("ノードが選択されていません", "warning");
    }
  });
  
  document.getElementById("generate-related-ideas-button").addEventListener("click", generateRelatedIdeas);
  document.getElementById("restructure-map-button").addEventListener("click", restructureMap);
  document.getElementById("generate-summary-button").addEventListener("click", generateSummary);
  document.getElementById("generate-insights-button").addEventListener("click", generateInsightsWithAI);
  
  document.getElementById("ai-suggest-toggle").addEventListener("change", function() {
    if (this.checked && selectedNode) {
      generateNodeSuggestions(selectedNode);
    } else {
      document.getElementById("ai-suggestions").innerHTML = "";
    }
  });
  
  // チャット関連
  document.getElementById("send-button").addEventListener("click", sendChatMessage);
  document.getElementById("chat-input").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });
  
  document.getElementById("clear-chat-button").addEventListener("click", clearChat);
  
  document.getElementById("toggle-chat-button").addEventListener("click", toggleChat);
  
  // モーダル関連
  document.getElementById("confirm-update").addEventListener("click", function() {
    // グローバル変数としてupdatedMapが利用可能と仮定
    if (window.updatedMapData) {
      confirmMapUpdate(window.updatedMapData);
      window.updatedMapData = null; // 使用後はクリア
    } else {
      showNotification("更新データが見つかりません", "error");
    }
    document.getElementById("update-modal").style.display = "none";
  });
  
  document.getElementById("cancel-update").addEventListener("click", function() {
    document.getElementById("update-modal").style.display = "none";
    window.updatedMapData = null; // キャンセル時もクリア
    showNotification("更新をキャンセルしました");
  });
  
  document.getElementById("ask-about-node").addEventListener("click", askAboutNode);
  document.getElementById("close-node-context").addEventListener("click", closeNodeContext);
  
  // モーダルの閉じるボタン
  document.querySelectorAll(".btn-close").forEach(btn => {
    btn.addEventListener("click", function() {
      this.closest(".modal").style.display = "none";
    });
  });
  
  // ズームコントロール
  document.getElementById("zoom-in").addEventListener("click", zoomIn);
  document.getElementById("zoom-out").addEventListener("click", zoomOut);
  document.getElementById("zoom-reset").addEventListener("click", resetZoom);
  
  // テーマ切り替え
  document.getElementById("theme-toggle").addEventListener("click", function() {
    if (currentTheme === "light") {
      document.body.setAttribute("data-theme", "dark");
      currentTheme = "dark";
      this.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.removeAttribute("data-theme");
      currentTheme = "light";
      this.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
  
  // タブ切り替え
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function() {
      // アクティブなタブをリセット
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      // クリックされたタブとそれに対応するコンテンツをアクティブに
      this.classList.add("active");
      const tabId = this.dataset.tab;
      document.getElementById(`${tabId}-content`).classList.add("active");
    });
  });
  
  // コンテキストメニューアイテム
  document.getElementById("context-add-child").addEventListener("click", function() {
    if (selectedNode) {
      addChild(null, selectedNode);
    }
    document.getElementById("context-menu").style.display = "none";
  });
  
  document.getElementById("context-edit-node").addEventListener("click", function() {
    if (selectedNode) {
      // ノードテキストの編集を開始
      const nodeElements = document.querySelectorAll(".node");
      const selectedElement = Array.from(nodeElements).find(el => {
        const nodeData = d3.select(el).datum();
        return nodeData.id === selectedNode.id;
      });
      
      if (selectedElement) {
        const titleElement = selectedElement.querySelector(".node-title");
        if (titleElement) {
          editNodeText({ target: titleElement }, selectedNode);
        }
      }
    }
    document.getElementById("context-menu").style.display = "none";
  });
  
  document.getElementById("context-delete-node").addEventListener("click", function() {
    if (selectedNode && selectedNode.parent) {
      deleteNode(null, selectedNode);
    } else if (selectedNode && !selectedNode.parent) {
      showNotification("ルートノードは削除できません", "error");
    }
    document.getElementById("context-menu").style.display = "none";
  });
  
  document.getElementById("context-ask-ai").addEventListener("click", function() {
    if (selectedNode) {
      openNodeContextModal(selectedNode);
    }
    document.getElementById("context-menu").style.display = "none";
  });
  
  document.getElementById("context-expand-node").addEventListener("click", function() {
    if (selectedNode) {
      expandNodeWithAI(selectedNode);
    }
    document.getElementById("context-menu").style.display = "none";
  });
  
  // クリックでコンテキストメニューを閉じる
  document.addEventListener("click", function() {
    document.getElementById("context-menu").style.display = "none";
  });
  
  // SVGをクリックしたらノード選択解除
  svg.on("click", function() {
    selectedNode = null;
    update();
    updateNodeSelection();
  });
  
  // キーボードショートカット
  document.addEventListener("keydown", handleKeyboardShortcuts);
  
  // フォーカスモードトグル
  document.getElementById("focus-mode-toggle").addEventListener("click", toggleFocusMode);
  
  // マップ保存
  document.getElementById("save-map-button").addEventListener("click", saveMap);
}

/***************************************************
 * UI操作ハンドラ
 ***************************************************/
// エクスポート・インポート関連
function exportMap() {
  document.getElementById("export-data").value = generateExportData(data);
  showNotification("マインドマップをエクスポートしました");
}

function importMap() {
  const text = document.getElementById("export-data").value.trim();
  if (!text) {
    showNotification("インポートするデータを入力してください", "warning");
    return;
  }
  
  const importedRoot = importExportData(text);
  if (importedRoot) {
    saveState();
    
    // インポート後にIDを再割り当て
    nodeIdCounter = 1;
    assignIds(importedRoot);
    data = importedRoot;
    rebuildParentReferences(data);
    
    // ノードの位置がない場合は自動レイアウト
    if (!data.x || !data.y) {
      computeTreeLayout(data);
    }
    
    nodeGroup.selectAll("*").remove();
    linkGroup.selectAll("*").remove();
    selectedNode = null;
    update();
    
    showNotification("マインドマップをインポートしました");
  }
}

function clearMap() {
  if (confirm("マインドマップをクリアして新しいマップを作成しますか？")) {
    saveState();
    nodeIdCounter = 1;
    data = { id: 0, title: "Root", children: [], type: "default" };
    data.parent = null;
    data.x = 400;
    data.y = 200;
    selectedNode = null;
    nodeGroup.selectAll("*").remove();
    linkGroup.selectAll("*").remove();
    update();
    showNotification("マインドマップをクリアしました");
  }
}

// マップ生成関連
async function generateMapFromTopic() {
  const topic = document.getElementById("topic-input").value.trim();
  if (!topic) {
    showNotification("トピックを入力してください", "warning");
    return;
  }

  showNotification("マインドマップを生成中...");
  
  try {
    const assistantResponse = await sendMindMapMessageToLLM(`以下のトピックでマインドマップを生成してください: ${topic}`);
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
    
    nodeGroup.selectAll("*").remove();
    linkGroup.selectAll("*").remove();
    update();
    
    showNotification(`トピック「${topic}」のマインドマップを生成しました`);
    
    // 生成したことをチャットに記録
    chatMessages.push({ 
      role: "system", 
      content: `トピック「${topic}」に基づくマインドマップを新たに生成しました。` 
    });
    renderChat();
  } catch (error) {
    showNotification("マインドマップの生成に失敗しました", "error");
    console.error("マップ生成エラー:", error);
  }
}

// 表示設定関連
function toggleMode() {
  if (currentMode === "node") {
    enableZoomMode();
  } else {
    enableNodeMode();
  }
}

function applyAutoLayout() {
  saveState();
  computeTreeLayout(data);
  update();
  showNotification("自動レイアウトを適用しました");
}

// ノード詳細関連
function saveNodeDetails() {
  if (!selectedNode) {
    showNotification("ノードが選択されていません", "warning");
    return;
  }
  
  saveState();
  
  const newTitle = document.getElementById("node-title-input").value.trim();
  if (!newTitle) {
    showNotification("タイトルを入力してください", "warning");
    return;
  }
  
  selectedNode.title = newTitle;
  selectedNode.notes = document.getElementById("node-notes").value;
  
  // ノードタイプの取得
  const activeType = document.querySelector(".node-type-option.active");
  if (activeType) {
    selectedNode.type = activeType.dataset.type;
  }
  
  update();
  showNotification("ノード情報を保存しました");
}

function addChildToSelected() {
  if (selectedNode) {
    addChild(null, selectedNode);
  } else {
    showNotification("ノードが選択されていません", "warning");
  }
}

function deleteSelectedNode() {
  if (!selectedNode) {
    showNotification("ノードが選択されていません", "warning");
    return;
  }
  
  if (!selectedNode.parent) {
    showNotification("ルートノードは削除できません", "error");
    return;
  }
  
  deleteNode(null, selectedNode);
}

function searchNodes() {
  const searchTerm = document.getElementById("search-input").value.trim().toLowerCase();
  if (!searchTerm) {
    showNotification("検索語を入力してください", "warning");
    return;
  }
  
  // 検索結果ハイライトをリセット
  d3.selectAll(".node").classed("highlight-search", false);
  
  let found = false;
  
  // ノードを検索
  function searchInNode(node) {
    const titleMatches = node.title.toLowerCase().includes(searchTerm);
    const notesMatch = node.notes && node.notes.toLowerCase().includes(searchTerm);
    
    if (titleMatches || notesMatch) {
      found = true;
      // ノードをハイライト
      d3.selectAll(".node")
        .filter(d => d.id === node.id)
        .classed("highlight-search", true);
      
      // このノードを選択
      selectedNode = node;
      update();
      updateNodeSelection();
      
      return true;
    }
    
    if (node.children) {
      for (let child of node.children) {
        if (searchInNode(child)) return true;
      }
    }
    
    return false;
  }
  
  searchInNode(data);
  
  if (found) {
    showNotification(`「${searchTerm}」が見つかりました`);
  } else {
    showNotification(`「${searchTerm}」は見つかりませんでした`, "warning");
  }
}

// AIツール関連
function generateRelatedIdeas() {
  if (!selectedNode) {
    showNotification("ノードが選択されていません", "warning");
    return;
  }
  
  // チャットに関連アイデアの提案をリクエスト
  const message = `「${selectedNode.title}」に関連するアイデアや視点を提案してください。様々な角度から考えられる発展性や関連トピックを教えてください。`;
  document.getElementById("chat-input").value = message;
  sendChatMessage();
}

function restructureMap() {
  // マップ全体の再構成をLLMに依頼
  const message = `現在のマインドマップを分析して、より論理的な構造に再構成するためのアドバイスをください。
特に以下の点について助言をお願いします：
1. 現在の構造で改善できる点
2. より適切なグループ化や階層化の提案
3. 見落としている可能性のある重要な関連性
4. 全体の一貫性を高めるための具体的な提案`;
  
  document.getElementById("chat-input").value = message;
  sendChatMessage();
}

function generateSummary() {
  const summary = generateMapSummary(data);
  document.getElementById("map-summary").value = summary;
  showNotification("マップ要約を生成しました");
}

// チャット関連
function clearChat() {
  if (confirm("チャット履歴をクリアしますか？")) {
    chatMessages = [];
    renderChat();
    document.getElementById("chat-input").value = "";
    showNotification("チャット履歴をクリアしました");
  }
}

function toggleChat() {
  const chatContainer = document.getElementById("chat-container");
  const currentHeight = chatContainer.style.height;
  
  if (!currentHeight || currentHeight === "30%") {
    chatContainer.style.height = "50px";
    document.getElementById("chat-messages").style.display = "none";
    document.getElementById("chat-input-area").style.display = "none";
    document.getElementById("toggle-chat-button").innerHTML = '<i class="fas fa-chevron-up"></i>';
  } else {
    chatContainer.style.height = "30%";
    document.getElementById("chat-messages").style.display = "block";
    document.getElementById("chat-input-area").style.display = "flex";
    document.getElementById("toggle-chat-button").innerHTML = '<i class="fas fa-chevron-down"></i>';
  }
}

// モーダル関連
function askAboutNode() {
  if (!selectedNode) return;
  
  const promptText = document.getElementById("node-context-prompt").value.trim();
  if (!promptText) {
    showNotification("質問内容を入力してください", "warning");
    return;
  }
  
  // モーダルを閉じる
  document.getElementById("node-context-modal").style.display = "none";
  
  // チャットにメッセージを追加
  const formattedPrompt = `「${selectedNode.title}」について: ${promptText}`;
  document.getElementById("chat-input").value = formattedPrompt;
  sendChatMessage();
}

function closeNodeContext() {
  document.getElementById("node-context-modal").style.display = "none";
}

// キーボードショートカット
function handleKeyboardShortcuts(event) {
  // フォーカスがtextareaやinputにある場合は、一部のショートカットを処理しない
  const activeElement = document.activeElement;
  const isInputActive = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
  
  // Ctrl + Z: 元に戻す
  if (event.ctrlKey && event.key === 'z' && !isInputActive) {
    event.preventDefault();
    undo();
  }
  
  // Ctrl + Y: やり直す
  if (event.ctrlKey && event.key === 'y' && !isInputActive) {
    event.preventDefault();
    redo();
  }
  
  // Delete: 選択ノード削除
  if (event.key === 'Delete' && selectedNode && selectedNode.parent && !isInputActive) {
    event.preventDefault();
    deleteNode(null, selectedNode);
  }
  
  // Tab: 子ノード追加
  if (event.key === 'Tab' && selectedNode && !isInputActive) {
    event.preventDefault();
    addChild(null, selectedNode);
  }
  
  // Enter: ノード編集
  if (event.key === 'Enter' && selectedNode && !event.ctrlKey && !event.shiftKey && !isInputActive) {
    event.preventDefault();
    // ノード編集モードを開始
    const nodeElements = document.querySelectorAll(".node");
    const selectedElement = Array.from(nodeElements).find(el => {
      const nodeData = d3.select(el).datum();
      return nodeData.id === selectedNode.id;
    });
    
    if (selectedElement) {
      const titleElement = selectedElement.querySelector(".node-title");
      if (titleElement) {
        editNodeText({ target: titleElement }, selectedNode);
      }
    }
  }
  
  // Escape: 選択解除
  if (event.key === 'Escape') {
    // モーダルが開いていればモーダルを閉じる
    const openModals = document.querySelectorAll(".modal[style*='display: block']");
    if (openModals.length > 0) {
      openModals.forEach(modal => modal.style.display = "none");
    } else if (!isInputActive) {
      // モーダルが開いていなければノードの選択を解除
      selectedNode = null;
      update();
      updateNodeSelection();
    }
  }
  
  // Ctrl + F: 検索
  if (event.ctrlKey && event.key === 'f' && !isInputActive) {
    event.preventDefault();
    document.getElementById("search-input").focus();
  }
  
  // Ctrl + S: 保存
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    saveMap();
  }
  
  // /: チャットにフォーカス
  if (event.key === '/' && !isInputActive) {
    event.preventDefault();
    document.getElementById("chat-input").focus();
  }
}

// その他のUI操作
function toggleFocusMode() {
  document.body.classList.toggle("focus-mode");
  const button = document.getElementById("focus-mode-toggle");
  
  if (document.body.classList.contains("focus-mode")) {
    button.innerHTML = '<i class="fas fa-compress"></i>';
    showNotification("フォーカスモードを有効にしました");
  } else {
    button.innerHTML = '<i class="fas fa-expand"></i>';
    showNotification("フォーカスモードを無効にしました");
  }
}

function saveMap() {
  // ローカルストレージに保存
  try {
    const mapData = generateExportData(data);
    localStorage.setItem("mindmap-data", mapData);
    
    // チャット履歴も保存
    if (chatMessages.length > 0) {
      localStorage.setItem("mindmap-chat", JSON.stringify(chatMessages));
    }
    
    showNotification("マインドマップを保存しました");
  } catch (e) {
    showNotification("保存に失敗しました", "error");
    console.error("保存エラー:", e);
  }
}

// 保存されたマップを読み込む
function loadSavedMap() {
  try {
    const savedMap = localStorage.getItem("mindmap-data");
    if (savedMap) {
      const mapData = JSON.parse(savedMap);
      nodeIdCounter = 1;
      assignIds(mapData);
      data = mapData;
      rebuildParentReferences(data);
      
      // 位置情報がない場合は自動レイアウト
      if (!data.x || !data.y) {
        computeTreeLayout(data);
      }
      
      update();
      
      // 保存されていたチャット履歴も読み込む
      const savedChat = localStorage.getItem("mindmap-chat");
      if (savedChat) {
        chatMessages = JSON.parse(savedChat);
        renderChat();
      }
      
      showNotification("保存されたマインドマップを読み込みました");
    }
  } catch (e) {
    console.error("読み込みエラー:", e);
    showNotification("マインドマップの読み込みに失敗しました", "error");
  }
}

// マップ更新時の確認と適用
async function updateMapFromChat() {
  if (chatMessages.length === 0) {
    showNotification("チャット履歴がありません", "warning");
    return;
  }

  showNotification("チャットからマップを更新中...");

  try {
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
      
      // グローバルに保存して更新確認モーダルから参照できるようにする
      window.updatedMapData = updatedMap;
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
  } catch (error) {
    console.error("マップ更新エラー:", error);
    showNotification("マップの更新処理に失敗しました", "error");
  }
}

// 更新確認後の処理（AI機能から呼び出される）
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
  
  nodeGroup.selectAll("*").remove();
  linkGroup.selectAll("*").remove();
  update();
  
  showNotification("マインドマップが更新されました");
}
