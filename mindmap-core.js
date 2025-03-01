/**
 * マインドマップエディター - コア機能
 * マインドマップの描画、操作、データ管理を担当
 */

/***************************************************
 * グローバル変数と設定
 ***************************************************/
let nodeIdCounter = 1;
let data = { id: 0, title: "Root", children: [], type: "default" };
data.parent = null;
let selectedNode = null;
let currentMode = "node"; // "node" または "zoom"
let undoStack = [];
let redoStack = [];
const MAX_STACK_SIZE = 20;
let lastMousePosition = { x: 0, y: 0 };
let currentTheme = "light";

// D3.js要素
const svg = d3.select("#mindmap svg");
const linkGroup = svg.append("g").attr("class", "links");
const nodeGroup = svg.append("g").attr("class", "nodes");

// ズームビヘイビア
let zoomBehavior = d3.zoom()
  .scaleExtent([0.3, 3])
  .on("zoom", event => {
    nodeGroup.attr("transform", event.transform);
    linkGroup.attr("transform", event.transform);
  });

/***************************************************
 * ノード形状関連
 ***************************************************/
// ヘキサゴンの形状計算
function hexagonPoints(r) {
  let points = [];
  for (let i = 0; i < 6; i++) {
    let angle = Math.PI / 6 + i * Math.PI / 3;
    let x = r * Math.cos(angle);
    let y = r * Math.sin(angle);
    points.push(x + "," + y);
  }
  return points.join(" ");
}

// 長方形の形状計算（テキスト幅に応じた長方形）
function rectanglePoints(text) {
  const minWidth = 70;
  // テキストの長さに応じて幅を計算（大まかな見積もり）
  const width = Math.max(minWidth, text.length * 7);
  const height = 30;
  return {
    width: width,
    height: height,
    points: [
      -width/2, -height/2,
      width/2, -height/2,
      width/2, height/2,
      -width/2, height/2
    ]
  };
}

/***************************************************
 * マインドマップ描画・更新
 ***************************************************/
// マインドマップ更新関数
function update() {
  const nodes = [];
  const links = [];
  
  // ノード・リンクデータの構築
  (function traverse(node) {
    nodes.push(node);
    if (node.children) {
      node.children.forEach(child => {
        child.parent = node;
        links.push({ source: node, target: child });
        traverse(child);
      });
    }
  })(data);

  // リンク描画
  const linkSelection = linkGroup.selectAll("line").data(links, d => d.target.id);
  linkSelection.enter()
    .append("line")
    .attr("class", "link")
    .merge(linkSelection)
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);
  linkSelection.exit().remove();

  // ノード描画
  const nodeSelection = nodeGroup.selectAll("g.node").data(nodes, d => d.id);
  const nodeEnter = nodeSelection.enter()
    .append("g")
    .attr("class", d => {
      let classes = "node";
      if (d.type) classes += ` node-${d.type}`;
      return classes;
    })
    .on("click", selectNode)
    .on("contextmenu", showContextMenu)
    // ノード操作モードならドラッグを有効にする
    .call(d3.drag()
      .filter(() => currentMode === "node")
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded)
    );

  // ノードの形状描画
  nodeEnter.each(function(d) {
    if (!d.parent) {
      // ルートノードは六角形
      d3.select(this).append("polygon")
        .attr("points", hexagonPoints(30))
        .attr("class", "node-shape");
    } else if (d.type === "task") {
      // タスクノードは長方形
      const rect = rectanglePoints(d.title);
      d3.select(this).append("rect")
        .attr("x", -rect.width/2)
        .attr("y", -rect.height/2)
        .attr("width", rect.width)
        .attr("height", rect.height)
        .attr("rx", 5)
        .attr("class", "node-shape");
    } else {
      // 通常ノードは円形
      d3.select(this).append("circle")
        .attr("r", 25)
        .attr("class", "node-shape");
    }
  });

  // ノードのテキスト
  nodeEnter.append("text")
    .attr("class", "node-title")
    .attr("dy", 4)
    .attr("text-anchor", "middle")
    .text(d => d.title.length > 25 ? d.title.substring(0, 22) + "..." : d.title)
    .on("dblclick", editNodeText);

  // ノードのコントロールアイコン（子ノード追加）
  nodeEnter.append("text")
    .attr("class", "add-child node-control")
    .attr("x", 30)
    .attr("y", 0)
    .text("＋")
    .on("click", addChild);

  // ノードのコントロールアイコン（削除）
  nodeEnter.filter(d => d.parent !== null)
    .append("text")
    .attr("class", "delete-node node-control")
    .attr("x", 0)
    .attr("y", -30)
    .text("✕")
    .on("click", deleteNode);

  // 更新処理
  const nodeUpdate = nodeSelection.merge(nodeEnter)
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .classed("selected", d => selectedNode && d.id === selectedNode.id);

  // ノードタイトルの更新
  nodeUpdate.select("text.node-title")
    .text(d => d.title.length > 25 ? d.title.substring(0, 22) + "..." : d.title);

  // ノードタイプクラスの更新
  nodeUpdate.attr("class", d => {
    let classes = "node";
    if (d.type) classes += ` node-${d.type}`;
    if (selectedNode && d.id === selectedNode.id) classes += " selected";
    return classes;
  });

  // ノード形状の更新
  nodeUpdate.each(function(d) {
    if (d.parent && d.type === "task") {
      const rect = rectanglePoints(d.title);
      d3.select(this).select(".node-shape")
        .attr("x", -rect.width/2)
        .attr("y", -rect.height/2)
        .attr("width", rect.width)
        .attr("height", rect.height);
    }
  });

  // 削除されたノードの処理
  nodeSelection.exit().remove();

  // ノード選択状態の更新
  updateNodeSelection();
}

/***************************************************
 * ノード操作関連
 ***************************************************/
// ノード選択状態の更新
function updateNodeSelection() {
  if (selectedNode) {
    // 選択されたノードの詳細表示
    document.getElementById("selected-node-info").style.display = "none";
    document.getElementById("node-edit-form").style.display = "block";
    document.getElementById("node-title-input").value = selectedNode.title;
    document.getElementById("node-notes").value = selectedNode.notes || "";
    
    // ノードタイプのセレクタ更新
    document.querySelectorAll(".node-type-option").forEach(option => {
      if (option.dataset.type === (selectedNode.type || "default")) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });
    
    // AIサジェスト更新（AIモジュールで実装）
    if (document.getElementById("ai-suggest-toggle").checked && typeof generateNodeSuggestions === 'function') {
      generateNodeSuggestions(selectedNode);
    }
  } else {
    document.getElementById("selected-node-info").style.display = "block";
    document.getElementById("node-edit-form").style.display = "none";
  }
}

// ノード選択処理
function selectNode(event, d) {
  event.stopPropagation();
  
  // 既に選択されているノードを再度クリックした場合は選択解除
  if (selectedNode && selectedNode.id === d.id) {
    selectedNode = null;
  } else {
    selectedNode = d;
  }
  
  update();
  updateNodeSelection();
}

// ノードコンテキストメニュー表示
function showContextMenu(event, d) {
  event.preventDefault();
  selectedNode = d;
  update();
  updateNodeSelection();
  
  const contextMenu = document.getElementById("context-menu");
  contextMenu.style.display = "block";
  contextMenu.style.left = `${event.pageX}px`;
  contextMenu.style.top = `${event.pageY}px`;
  
  // コンテキストメニューのアイテム設定 - イベントハンドラはUIモジュールで実装
}

// ドラッグ操作関連
function dragStarted(event, d) {
  d3.select(this).raise().classed("dragging", true);
  saveState();
}

function dragged(event, d) {
  d.x = event.x;
  d.y = event.y;
  update();
}

function dragEnded(event, d) {
  d3.select(this).classed("dragging", false);
}

// ノード追加
function addChild(event, d) {
  if (event) event.stopPropagation();
  
  saveState();
  
  if (!d.children) d.children = [];
  const newNode = { 
    id: nodeIdCounter++, 
    title: "新規ノード", 
    children: [], 
    parent: d, 
    type: "default"
  };
  
  // 親の位置から少しずらした位置に配置
  newNode.x = d.x + 150;
  newNode.y = d.y + (d.children.length * 60);
  
  d.children.push(newNode);
  
  // 新規ノードを選択状態にする
  selectedNode = newNode;
  
  update();
  updateNodeSelection();
  showNotification("ノードを追加しました");
  
  // 自動的に編集モードにする
  setTimeout(() => {
    const nodeElements = document.querySelectorAll(".node");
    const newNodeElement = Array.from(nodeElements).find(el => {
      const nodeData = d3.select(el).datum();
      return nodeData.id === newNode.id;
    });
    
    if (newNodeElement) {
      const titleElement = newNodeElement.querySelector(".node-title");
      if (titleElement) {
        editNodeText({ target: titleElement }, newNode);
      }
    }
  }, 100);
}

// ノード削除
function deleteNode(event, d) {
  if (event) event.stopPropagation();
  
  if (!d.parent) {
    showNotification("ルートノードは削除できません", "error");
    return;
  }
  
  saveState();
  
  d.parent.children = d.parent.children.filter(child => child.id !== d.id);
  
  // 選択ノードが削除されたノードだった場合、選択を解除
  if (selectedNode && selectedNode.id === d.id) {
    selectedNode = null;
  }
  
  update();
  updateNodeSelection();
  showNotification("ノードを削除しました");
}

// ノードテキスト編集
function editNodeText(event, d) {
  if (event) event.stopPropagation();
  
  const g = d3.select(event.target.parentNode);
  g.selectAll("foreignObject").remove();
  
  const fo = g.append("foreignObject")
    .attr("x", -75).attr("y", -15)
    .attr("width", 150).attr("height", 30);
  
  const input = fo.append("xhtml:input")
    .attr("type", "text")
    .style("width", "100%")
    .style("height", "100%")
    .style("font-size", "12px")
    .style("border", "1px solid var(--accent-color)")
    .style("border-radius", "4px")
    .style("padding", "4px")
    .style("background-color", "var(--bg-color)")
    .style("color", "var(--text-color)")
    .node();
  
  input.value = d.title;
  input.focus();
  input.select();
  
  // 編集完了時の処理
  const finishEdit = () => {
    if (d.title !== input.value) {
      saveState();
      d.title = input.value;
    }
    fo.remove();
    update();
  };
  
  input.addEventListener("blur", finishEdit);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      finishEdit();
    } else if (e.key === "Escape") {
      fo.remove();
      update();
    }
  });
}

/***************************************************
 * レイアウト関連
 ***************************************************/
// ノードレイアウトの計算
function computeTreeLayout(rootData) {
  let rootHierarchy = d3.hierarchy(rootData);
  let treeLayout = d3.tree().nodeSize([120, 100]);
  treeLayout(rootHierarchy);
  
  // レイアウト結果の最小値を取得
  let minX = d3.min(rootHierarchy.descendants(), d => d.x);
  let minY = d3.min(rootHierarchy.descendants(), d => d.y);
  
  // 最小値をオフセットして、全てのノードが正の座標に来るようにする
  rootHierarchy.each(d => {
    d.data.x = d.x - minX + 50;
    d.data.y = d.y - minY + 50;
  });
}

// 初期位置の割り当て
function attachInitialPositions(node, x, y) {
  node.x = x; node.y = y;
  if (node.children) {
    node.children.forEach((child, i) => {
      attachInitialPositions(child, x + 150, y + i * 80);
    });
  }
}

// ノードIDの割り当て
function assignIds(node) {
  if (node.id === undefined || node.id === null) {
    node.id = nodeIdCounter++;
  }
  if (node.children) {
    node.children.forEach(child => assignIds(child));
  }     
}

// 親参照の再構築
function rebuildParentReferences(node) {
  if (node.children) {
    node.children.forEach(child => {
      child.parent = node;
      rebuildParentReferences(child);
    });
  }
}

/***************************************************
 * ズーム操作
 ***************************************************/
// ズーム制御
function zoomIn() {
  svg.transition().duration(300).call(
    zoomBehavior.scaleBy, 1.3
  );
}

function zoomOut() {
  svg.transition().duration(300).call(
    zoomBehavior.scaleBy, 0.7
  );
}

function resetZoom() {
  svg.transition().duration(300).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(svg.node().width.baseVal.value / 2, svg.node().height.baseVal.value / 2)
  );
}

// 表示モードの切り替え
function enableZoomMode() {
  currentMode = "zoom";
  svg.call(zoomBehavior);
  // ノードドラッグイベントを無効化するため再バインド
  nodeGroup.selectAll("g.node").on(".drag", null);
  document.getElementById("toggle-mode-button").innerText = "ズームモード（有効）";
}

function enableNodeMode() {
  currentMode = "node";
  svg.on(".zoom", null); // ズームを解除
  update(); // update()でドラッグイベントが再設定される
  document.getElementById("toggle-mode-button").innerText = "ノードモード（有効）";
}

/***************************************************
 * データ操作
 ***************************************************/
// 状態保存（アンドゥ用）
function saveState() {
  // 現在の状態をコピーしてundoStackにプッシュ
  const currentState = JSON.parse(JSON.stringify(data, (key, value) => {
    if (key === "parent") return undefined;
    return value;
  }));
  
  undoStack.push(currentState);
  if (undoStack.length > MAX_STACK_SIZE) {
    undoStack.shift();
  }
  // 新しい変更を加えたらredoStackをクリア
  redoStack = [];
}

// アンドゥ
function undo() {
  if (undoStack.length === 0) return;
  
  // 現在の状態をredoStackに保存
  const currentState = JSON.parse(JSON.stringify(data, (key, value) => {
    if (key === "parent") return undefined;
    return value;
  }));
  redoStack.push(currentState);
  
  // 前の状態を復元
  const previousState = undoStack.pop();
  data = previousState;
  // parent参照を再構築
  rebuildParentReferences(data);
  update();
  
  showNotification("操作を元に戻しました");
}

// リドゥ
function redo() {
  if (redoStack.length === 0) return;
  
  // 現在の状態をundoStackに保存
  const currentState = JSON.parse(JSON.stringify(data, (key, value) => {
    if (key === "parent") return undefined;
    return value;
  }));
  undoStack.push(currentState);
  
  // 次の状態を復元
  const nextState = redoStack.pop();
  data = nextState;
  // parent参照を再構築
  rebuildParentReferences(data);
  update();
  
  showNotification("操作をやり直しました");
}

// JSONデータのエクスポート
function generateExportData(root) {
  return JSON.stringify(root, (key, value) => {
    if (key === "parent") return undefined;
    return value;
  }, 2);
}

// JSONデータのインポート
function importExportData(text) {
  try {
    return JSON.parse(text);
  } catch(e) {
    showNotification("無効なJSONです", "error");
    return null;
  }
}

// nodeIdCounterの更新
function updateNodeIdCounter(node) {
  let maxId = node.id;
  if (node.children) {
    node.children.forEach(child => {
      let childMax = updateNodeIdCounter(child);
      if (childMax > maxId) maxId = childMax;
    });
  }
  return maxId;
}

/***************************************************
 * ユーティリティ
 ***************************************************/
// 通知表示
function showNotification(message, type = "success") {
  const notificationElement = document.getElementById("notification");
  notificationElement.textContent = message;
  notificationElement.style.display = "block";
  
  // タイプに応じた背景色
  if (type === "success") {
    notificationElement.style.backgroundColor = "var(--success-color)";
  } else if (type === "error") {
    notificationElement.style.backgroundColor = "var(--danger-color)";
  } else if (type === "warning") {
    notificationElement.style.backgroundColor = "var(--warning-color)";
  }
  
  // アニメーションを適用(CSSアニメーションが終わると自動的に非表示)
  notificationElement.style.animation = "none";
  setTimeout(() => {
    notificationElement.style.animation = "fadeInOut 3s forwards";
  }, 10);
}

// マップ要約の生成
function generateMapSummary(node) {
  let summary = node.title;
  if (node.children && node.children.length > 0) {
    summary += " → [" + node.children.map(child => generateMapSummary(child)).join(", ") + "]";
  }
  return summary;
}

// JSONのクリーンアップ
function cleanJSON(output) {
  return output
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```[\s]*$/i, '')
    .trim();
}

// 初期化
attachInitialPositions(data, 400, 200);
update();
