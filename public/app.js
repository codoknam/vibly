const LOCAL_STATE_KEY = "vibly-local-state-v6";

const state = {
  data: null,
  storageMode: "loading",
  chatOpen: false,
  aiBusy: false
};

const AI_PRESETS = {
  openai: {
    label: "OpenAI",
    provider: "openai",
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    hint: "OpenAI 키는 sk-로 시작하는 경우가 많습니다. 모델은 직접 바꿔도 됩니다."
  },
  openrouter: {
    label: "OpenRouter",
    provider: "openai",
    model: "",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    hint: "OpenRouter는 OpenAI 호환 방식입니다. 감지 후 원하는 모델을 선택하세요."
  },
  groq: {
    label: "Groq",
    provider: "openai",
    model: "",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    hint: "Groq는 OpenAI 호환 방식입니다. 모델 감지 또는 직접 입력을 사용할 수 있습니다."
  },
  anthropic: {
    label: "Anthropic",
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
    baseUrl: "https://api.anthropic.com/v1/messages",
    hint: "Anthropic 키는 sk-ant-로 시작하는 경우가 많습니다."
  },
  gemini: {
    label: "Google Gemini",
    provider: "gemini",
    model: "gemini-1.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    hint: "Gemini 키는 AIza로 시작하는 경우가 많습니다."
  },
  custom: {
    label: "직접 입력",
    provider: "auto",
    model: "",
    baseUrl: "",
    hint: "임의 API는 제공사 문서의 chat/completions 주소와 모델명을 직접 넣으면 됩니다."
  }
};

const els = {
  serverAddress: document.getElementById("serverAddress"),
  deployPattern: document.getElementById("deployPattern"),
  storageModePill: document.getElementById("storageModePill"),
  heroAiBtn: document.getElementById("heroAiBtn"),
  projectSummary: document.getElementById("projectSummary"),
  projectList: document.getElementById("projectList"),
  projectNameInput: document.getElementById("projectNameInput"),
  frameworkSelect: document.getElementById("frameworkSelect"),
  librariesInput: document.getElementById("librariesInput"),
  deploySlugInput: document.getElementById("deploySlugInput"),
  deployAliasesInput: document.getElementById("deployAliasesInput"),
  deploySlugHint: document.getElementById("deploySlugHint"),
  applySettingsBtn: document.getElementById("applySettingsBtn"),
  saveVersionBtn: document.getElementById("saveVersionBtn"),
  deleteProjectBtn: document.getElementById("deleteProjectBtn"),
  cloneProjectBtn: document.getElementById("cloneProjectBtn"),
  newProjectBtn: document.getElementById("newProjectBtn"),
  fileTabs: document.getElementById("fileTabs"),
  activeFileLabel: document.getElementById("activeFileLabel"),
  editorArea: document.getElementById("editorArea"),
  addFileBtn: document.getElementById("addFileBtn"),
  deleteFileBtn: document.getElementById("deleteFileBtn"),
  formatBtn: document.getElementById("formatBtn"),
  editorAiBtn: document.getElementById("editorAiBtn"),
  previewBtn: document.getElementById("previewBtn"),
  openPreviewBtn: document.getElementById("openPreviewBtn"),
  openLiveBtn: document.getElementById("openLiveBtn"),
  deployBtn: document.getElementById("deployBtn"),
  exportBtn: document.getElementById("exportBtn"),
  previewFrame: document.getElementById("previewFrame"),
  deployBadge: document.getElementById("deployBadge"),
  liveUrlLabel: document.getElementById("liveUrlLabel"),
  deployList: document.getElementById("deployList"),
  versionList: document.getElementById("versionList"),
  chatToggleBtn: document.getElementById("chatToggleBtn"),
  chatToggleMeta: document.getElementById("chatToggleMeta"),
  chatDock: document.getElementById("chatDock"),
  chatCloseBtn: document.getElementById("chatCloseBtn"),
  aiSetupHint: document.getElementById("aiSetupHint"),
  providerSelect: document.getElementById("providerSelect"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  modelInput: document.getElementById("modelInput"),
  modelSelect: document.getElementById("modelSelect"),
  baseUrlInput: document.getElementById("baseUrlInput"),
  headersInput: document.getElementById("headersInput"),
  promptInput: document.getElementById("promptInput"),
  detectApiBtn: document.getElementById("detectApiBtn"),
  testAiBtn: document.getElementById("testAiBtn"),
  saveAiSettingsBtn: document.getElementById("saveAiSettingsBtn"),
  aiChatBtn: document.getElementById("aiChatBtn"),
  aiCreateBtn: document.getElementById("aiCreateBtn"),
  aiFixBtn: document.getElementById("aiFixBtn"),
  clearChatBtn: document.getElementById("clearChatBtn"),
  chatHistory: document.getElementById("chatHistory"),
  aiStatus: document.getElementById("aiStatus")
};

bootstrap();

async function bootstrap() {
  reflectAddresses();
  wireEvents();
  await loadState();
  render();
}

function reflectAddresses() {
  const origin = getBaseOrigin();
  els.serverAddress.textContent = origin;
  els.deployPattern.textContent = `${origin}/my-site`;
}

function wireEvents() {
  els.newProjectBtn.onclick = createProject;
  els.cloneProjectBtn.onclick = cloneProject;
  els.applySettingsBtn.onclick = applyProjectSettings;
  els.saveVersionBtn.onclick = saveVersion;
  els.deleteProjectBtn.onclick = deleteProject;
  els.addFileBtn.onclick = addFile;
  els.deleteFileBtn.onclick = deleteFile;
  els.formatBtn.onclick = formatActiveFile;
  els.previewBtn.onclick = refreshPreview;
  els.heroAiBtn.onclick = () => setChatOpen(true);
  els.editorAiBtn.onclick = () => setChatOpen(true);
  els.openPreviewBtn.onclick = openPreviewWindow;
  els.openLiveBtn.onclick = openLiveWindow;
  els.deployBtn.onclick = deployProject;
  els.exportBtn.onclick = exportProject;
  els.aiChatBtn.onclick = () => callAI("chat");
  els.aiCreateBtn.onclick = () => callAI("build");
  els.aiFixBtn.onclick = () => callAI("fix");
  els.detectApiBtn.onclick = runDetectApiConfig;
  els.testAiBtn.onclick = testAiConnection;
  els.saveAiSettingsBtn.onclick = () => saveAiSettings({ showStatus: true });
  els.clearChatBtn.onclick = clearChat;
  els.providerSelect.onchange = () => {
    applyProviderDefaults();
    updateAiSetupHint();
  };
  els.modelSelect.onchange = () => {
    if (els.modelSelect.value) {
      els.modelInput.value = els.modelSelect.value;
      updateAiSetupHint();
    }
  };
  document.querySelectorAll("[data-ai-preset]").forEach((button) => {
    button.onclick = () => applyAiPreset(button.getAttribute("data-ai-preset"));
  });
  els.apiKeyInput.addEventListener("input", handleApiKeyInput);
  els.modelInput.addEventListener("input", updateAiSetupHint);
  els.baseUrlInput.addEventListener("input", updateAiSetupHint);
  els.headersInput.addEventListener("input", updateAiSetupHint);
  els.deploySlugInput.addEventListener("input", handleDeploySlugInput);
  els.deployAliasesInput.addEventListener("input", handleDeployAliasesInput);
  els.chatToggleBtn.onclick = toggleChatDock;
  els.chatCloseBtn.onclick = () => setChatOpen(false);
  els.editorArea.addEventListener("input", syncEditorToProject);
  els.editorArea.addEventListener("keydown", handleEditorKeydown);
  els.promptInput.addEventListener("keydown", handlePromptKeydown);
}

async function loadState() {
  try {
    const response = await fetch("api/state", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("State API unavailable");
    }
    state.data = migrateState(await response.json());
    state.storageMode = "server";
  } catch (error) {
    const local = localStorage.getItem(LOCAL_STATE_KEY);
    state.data = local ? migrateState(JSON.parse(local)) : createInitialState();
    state.storageMode = "browser";
  }

  if (!state.data.activeProjectId && state.data.projects[0]) {
    state.data.activeProjectId = state.data.projects[0].id;
  }

  updateStoragePill();
}

async function persistState() {
  state.data.updatedAt = formatNow();

  if (state.storageMode === "server") {
    try {
      const response = await fetch("api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.data)
      });
      if (!response.ok) {
        const data = await readJsonResponse(response);
        throw new Error(data.error || "상태 저장에 실패했습니다.");
      }
      return;
    } catch (error) {
      if (!(error instanceof TypeError)) {
        throw error;
      }
      state.storageMode = "browser";
      updateStoragePill();
    }
  }

  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state.data));
}

function render() {
  const project = getActiveProject();
  if (!project) return;

  renderProjectSummary(project);
  renderProjectList(project);
  renderSettings(project);
  renderFiles(project);
  renderPreview(project);
  renderDeployments(project);
  renderVersions(project);
  renderChat(project);
  renderChatDock(project);
  attachDynamicHandlers();
}

function renderProjectSummary(project) {
  const aliases = project.deployAliases || [];
  const redirects = project.redirectSlugs || [];
  els.projectSummary.innerHTML = `
    <div class="row">
      <strong>${escapeHtml(project.name)}</strong>
      <span class="tiny">${project.framework.toUpperCase()}</span>
    </div>
    <div class="tiny">최근 수정: ${escapeHtml(project.updatedAt)}</div>
    <div class="tiny">배포 주소: /${escapeHtml(project.deploySlug)}</div>
    ${aliases.length ? `<div class="tiny">추가 주소: ${aliases.map((slug) => `/${escapeHtml(slug)}`).join(", ")}</div>` : ""}
    ${redirects.length ? `<div class="tiny">이전 주소 리디렉트: ${redirects.slice(0, 3).map((slug) => `/${escapeHtml(slug)}`).join(", ")}${redirects.length > 3 ? "..." : ""}</div>` : ""}
    <div class="tiny mono">${getLiveUrl(project)}</div>
  `;
}

function renderProjectList(activeProject) {
  els.projectList.innerHTML = state.data.projects.map((project) => `
    <div class="list-item ${project.id === activeProject.id ? "active" : ""}" data-project-id="${project.id}">
      <strong>${escapeHtml(project.name)}</strong>
      <div class="tiny">${project.framework.toUpperCase()} · 배포 ${project.deployments.length}개 · 추가 주소 ${(project.deployAliases || []).length}개</div>
      <div class="tiny mono">${getLiveUrl(project)}</div>
    </div>
  `).join("");
}

function renderSettings(project) {
  els.projectNameInput.value = project.name;
  els.frameworkSelect.value = project.framework;
  els.librariesInput.value = (project.libraries || []).join("\n");
  els.deploySlugInput.value = project.deploySlug;
  els.deployAliasesInput.value = (project.deployAliases || []).join("\n");
  els.providerSelect.value = project.ai.provider;
  els.modelInput.value = project.ai.model;
  els.baseUrlInput.value = project.ai.baseUrl;
  els.headersInput.value = project.ai.headersJson;
  els.apiKeyInput.value = project.ai.apiKey || "";
  renderModelOptions(project.ai.detectedModels || [], project.ai.model);
  renderDeploySlugHint(project.deploySlug, project.id, project.deployAliases || []);
  updateAiSetupHint();
}

function renderModelOptions(models, selectedModel) {
  const uniqueModels = [...new Set((models || []).filter(Boolean))];
  const options = uniqueModels.length
    ? uniqueModels.map((model) => `<option value="${escapeAttribute(model)}">${escapeHtml(model)}</option>`).join("")
    : `<option value="">모델 감지 전</option>`;
  els.modelSelect.innerHTML = options;
  if (selectedModel && uniqueModels.includes(selectedModel)) {
    els.modelSelect.value = selectedModel;
  }
}

function renderFiles(project) {
  const fileNames = Object.keys(project.files);
  els.fileTabs.innerHTML = fileNames.map((fileName) => `
    <div class="file-tab ${fileName === project.activeFile ? "active" : ""}" data-file-name="${encodeURIComponent(fileName)}">
      ${escapeHtml(fileName)}
    </div>
  `).join("");
  els.editorArea.value = project.files[project.activeFile] || "";
  els.activeFileLabel.textContent = `${project.activeFile} · 현재 편집 중`;
}

function renderPreview(project) {
  if (isSmallScreen()) {
    els.previewFrame.removeAttribute("srcdoc");
  } else {
    els.previewFrame.srcdoc = buildPreviewHtml(project);
  }
  els.liveUrlLabel.textContent = getLiveUrl(project);

  const live = project.deployments.find((item) => item.id === project.liveDeploymentId);
  if (live) {
    els.deployBadge.className = "status ok";
    els.deployBadge.textContent = `라이브 ${live.label}`;
  } else {
    els.deployBadge.className = "status warn";
    els.deployBadge.textContent = "아직 배포되지 않음";
  }
}

function renderDeployments(project) {
  if (!project.deployments.length) {
    els.deployList.innerHTML = `<div class="empty">배포 이력이 아직 없습니다.</div>`;
    return;
  }

  els.deployList.innerHTML = [...project.deployments].reverse().map((item) => `
    <div class="history-item">
      <div class="row">
        <strong>${escapeHtml(item.label)}</strong>
        <span class="tiny">${escapeHtml(item.createdAt)}</span>
      </div>
      <div class="tiny mono">${getLiveUrl(project)}</div>
      <div class="button-row">
        <button class="button small ghost" data-restore-deploy="${item.id}">이 버전으로 복원</button>
        <button class="button small ghost" data-open-deploy="${item.id}">라이브 열기</button>
      </div>
    </div>
  `).join("");
}

function renderVersions(project) {
  if (!project.versions.length) {
    els.versionList.innerHTML = `<div class="empty">저장된 버전이 아직 없습니다.</div>`;
    return;
  }

  els.versionList.innerHTML = [...project.versions].reverse().map((item) => `
    <div class="history-item">
      <div class="row">
        <strong>${escapeHtml(item.label)}</strong>
        <span class="tiny">${escapeHtml(item.createdAt)}</span>
      </div>
      <div class="button-row">
        <button class="button small ghost" data-restore-version="${item.id}">복원</button>
      </div>
    </div>
  `).join("");
}

function renderChat(project) {
  const messages = project.ai.messages || [];

  if (!messages.length) {
    els.chatHistory.innerHTML = `<div class="empty">아직 대화가 없습니다. 사이트 설명을 적거나 궁금한 점을 물어보세요.</div>`;
    return;
  }

  els.chatHistory.innerHTML = messages.map((message) => `
    <div class="chat-bubble ${message.role}">
      <div class="chat-meta">
        <strong>${message.role === "user" ? "You" : "AI"}</strong>
        <span>${escapeHtml(message.createdAt)}</span>
      </div>
      <div class="chat-text">${escapeMultiline(message.text)}</div>
    </div>
  `).join("");

  els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
}

function renderChatDock(project) {
  const count = project.ai.messages.length;
  const last = project.ai.messages[count - 1];
  els.chatToggleMeta.textContent = state.chatOpen
    ? `${count}개 메시지`
    : last
      ? `최근: ${truncate(last.text, 18)}`
      : "닫힘";
  els.chatToggleBtn.setAttribute("aria-expanded", String(state.chatOpen));
  els.chatToggleBtn.classList.toggle("open", state.chatOpen);
  els.chatDock.classList.toggle("collapsed", !state.chatOpen);
  els.chatDock.setAttribute("aria-hidden", String(!state.chatOpen));
}

function attachDynamicHandlers() {
  document.querySelectorAll("[data-project-id]").forEach((node) => {
    node.onclick = () => setActiveProject(node.getAttribute("data-project-id"));
  });

  document.querySelectorAll("[data-file-name]").forEach((node) => {
    node.onclick = () => {
      syncEditorToProject();
      const project = getActiveProject();
      project.activeFile = decodeURIComponent(node.getAttribute("data-file-name"));
      persistState().then(render);
    };
  });

  document.querySelectorAll("[data-restore-version]").forEach((node) => {
    node.onclick = () => restoreVersion(node.getAttribute("data-restore-version"));
  });

  document.querySelectorAll("[data-restore-deploy]").forEach((node) => {
    node.onclick = () => restoreDeployment(node.getAttribute("data-restore-deploy"));
  });

  document.querySelectorAll("[data-open-deploy]").forEach((node) => {
    node.onclick = openLiveWindow;
  });
}

function getActiveProject() {
  return state.data.projects.find((project) => project.id === state.data.activeProjectId);
}

function setActiveProject(projectId) {
  state.data.activeProjectId = projectId;
  persistState().then(render);
}

function syncEditorToProject() {
  const project = getActiveProject();
  if (!project) return;
  project.files[project.activeFile] = els.editorArea.value;
  project.updatedAt = formatNow();
}

function refreshPreview() {
  syncEditorToProject();
  if (isSmallScreen()) {
    openPreviewWindow();
    return;
  }
  renderPreview(getActiveProject());
}

function toggleChatDock() {
  setChatOpen(!state.chatOpen);
}

function setChatOpen(open) {
  state.chatOpen = open;
  renderChatDock(getActiveProject());
  if (open) {
    setTimeout(() => els.promptInput.focus(), 50);
  }
}

async function createProject() {
  const name = prompt("새 프로젝트 이름을 입력하세요.", `Project ${state.data.projects.length + 1}`);
  if (name === null) return;

  const framework = prompt("프레임워크를 입력하세요. html / react / vue", "html");
  const safeFramework = ["html", "react", "vue"].includes((framework || "").trim().toLowerCase())
    ? framework.trim().toLowerCase()
    : "html";

  const project = makeProject(name.trim() || `Project ${state.data.projects.length + 1}`, safeFramework, state.data.projects.length);
  state.data.projects.push(project);
  state.data.activeProjectId = project.id;
  await persistState();
  render();
}

async function cloneProject() {
  const project = getActiveProject();
  const clone = deepClone(project);
  clone.id = makeId();
  clone.name = `${project.name} Copy`;
  clone.deploySlug = makeUniqueDeploySlug(`${project.deploySlug}-copy`, clone.id);
  clone.deployAliases = [];
  clone.redirectSlugs = [];
  clone.liveDeploymentId = null;
  clone.deployments = [];
  clone.versions = [];
  clone.ai.messages = [];
  clone.createdAt = formatNow();
  clone.updatedAt = formatNow();
  state.data.projects.push(clone);
  state.data.activeProjectId = clone.id;
  await persistState();
  render();
}

async function applyProjectSettings() {
  const project = getActiveProject();
  const nextName = els.projectNameInput.value.trim() || project.name;
  const nextFramework = els.frameworkSelect.value;
  const nextLibraries = els.librariesInput.value.split("\n").map((line) => line.trim()).filter(Boolean);
  const nextSlug = sanitizeDeploySlug(els.deploySlugInput.value.trim() || project.deploySlug || nextName);
  const nextAliases = parseDeployAliases(els.deployAliasesInput.value);
  const nextRedirects = (project.redirectSlugs || []).filter((slug) => slug !== nextSlug && !nextAliases.includes(slug));
  const frameworkChanged = nextFramework !== project.framework;
  const slugError = getRouteSlugError({
    projectId: project.id,
    primarySlug: nextSlug,
    aliases: nextAliases,
    redirects: nextRedirects
  });

  if (slugError) {
    renderDeploySlugHint(nextSlug, project.id, nextAliases);
    alert(slugError);
    return;
  }

  const previousSlug = project.deploySlug;
  project.name = nextName;
  project.libraries = nextLibraries;
  project.deploySlug = nextSlug;
  project.deployAliases = nextAliases;
  if (previousSlug && previousSlug !== nextSlug && !nextAliases.includes(previousSlug)) {
    project.redirectSlugs = uniqueSlugs([...nextRedirects, previousSlug])
      .filter((slug) => slug !== nextSlug && !nextAliases.includes(slug));
  } else {
    project.redirectSlugs = nextRedirects;
  }

  if (frameworkChanged) {
    project.framework = nextFramework;
    project.files = getTemplate(nextFramework);
    project.activeFile = pickDefaultFile(nextFramework, project.files);
  }

  project.updatedAt = formatNow();
  await persistState();
  render();
}

async function saveVersion() {
  syncEditorToProject();
  const project = getActiveProject();
  project.versions.push({
    id: makeId(),
    label: `saved v${project.versions.length + 1}`,
    createdAt: formatNow(),
    files: deepClone(project.files)
  });
  project.updatedAt = formatNow();
  await persistState();
  render();
}

async function deleteProject() {
  const project = getActiveProject();
  if (!confirm(`${project.name} 프로젝트를 삭제할까요?`)) return;

  state.data.projects = state.data.projects.filter((item) => item.id !== project.id);
  if (!state.data.projects.length) {
    state.data.projects.push(makeProject("Welcome Project", "html", 0));
  }

  state.data.activeProjectId = state.data.projects[0].id;
  await persistState();
  render();
}

async function addFile() {
  const project = getActiveProject();
  const fileName = prompt("새 파일 이름을 입력하세요. 예: about.html 또는 utils.js");
  if (!fileName) return;
  if (project.files[fileName]) {
    alert("같은 이름의 파일이 이미 있습니다.");
    return;
  }

  project.files[fileName] = "";
  project.activeFile = fileName;
  project.updatedAt = formatNow();
  await persistState();
  render();
}

async function deleteFile() {
  const project = getActiveProject();
  const fileNames = Object.keys(project.files);
  if (fileNames.length <= 1) {
    alert("최소 한 개의 파일은 남아 있어야 합니다.");
    return;
  }
  if (!confirm(`${project.activeFile} 파일을 삭제할까요?`)) return;

  delete project.files[project.activeFile];
  project.activeFile = Object.keys(project.files)[0];
  project.updatedAt = formatNow();
  await persistState();
  render();
}

function formatActiveFile() {
  els.editorArea.value = els.editorArea.value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  syncEditorToProject();
  persistState().then(() => renderPreview(getActiveProject()));
}

async function deployProject() {
  syncEditorToProject();
  const project = getActiveProject();
  const slugError = getRouteSlugError({
    projectId: project.id,
    primarySlug: project.deploySlug,
    aliases: project.deployAliases || [],
    redirects: project.redirectSlugs || []
  });
  if (slugError) {
    renderDeploySlugHint(project.deploySlug, project.id, project.deployAliases || []);
    alert(slugError);
    return;
  }
  const deployment = {
    id: makeId(),
    label: `deploy v${project.deployments.length + 1}`,
    createdAt: formatNow(),
    files: deepClone(project.files)
  };

  project.deployments.push(deployment);
  project.liveDeploymentId = deployment.id;
  project.updatedAt = formatNow();
  await persistState();
  render();
}

function exportProject() {
  syncEditorToProject();
  const project = getActiveProject();
  const html = buildPreviewHtml(project);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.replace(/\s+/g, "-").toLowerCase() || "vibly-site"}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function restoreVersion(versionId) {
  const project = getActiveProject();
  const version = project.versions.find((item) => item.id === versionId);
  if (!version) return;

  project.files = deepClone(version.files);
  project.activeFile = pickDefaultFile(project.framework, project.files);
  project.updatedAt = formatNow();
  await persistState();
  render();
}

async function restoreDeployment(deploymentId) {
  const project = getActiveProject();
  const deployment = project.deployments.find((item) => item.id === deploymentId);
  if (!deployment) return;

  project.files = deepClone(deployment.files);
  project.activeFile = pickDefaultFile(project.framework, project.files);
  project.liveDeploymentId = deploymentId;
  project.updatedAt = formatNow();
  await persistState();
  render();
}

async function clearChat() {
  const project = getActiveProject();
  if (!confirm("현재 프로젝트의 AI 대화 기록을 지울까요?")) return;
  project.ai.messages = [];
  await persistState();
  render();
}

function readAiConfig() {
  const headersJson = els.headersInput.value.trim();
  return {
    provider: els.providerSelect.value || "auto",
    apiKey: els.apiKeyInput.value.trim(),
    model: els.modelInput.value.trim(),
    baseUrl: els.baseUrlInput.value.trim(),
    headersJson,
    headers: parseHeadersJson(headersJson)
  };
}

function parseHeadersJson(headersJson) {
  if (!headersJson) return {};
  try {
    const parsed = JSON.parse(headersJson);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Headers must be an object");
    }
    return parsed;
  } catch (error) {
    throw new Error("추가 헤더 JSON 형식이 올바르지 않습니다.");
  }
}

async function saveAiSettings(options = {}) {
  const project = getActiveProject();
  const config = readAiConfig();
  project.ai.provider = config.provider;
  project.ai.model = config.model;
  project.ai.baseUrl = config.baseUrl;
  project.ai.headersJson = config.headersJson;
  project.ai.apiKey = config.apiKey;
  await persistState();
  updateAiSetupHint();
  if (options.showStatus) {
    setAiStatus("AI 설정을 저장했습니다. 이제 연결 테스트 또는 대화를 눌러보세요.", "ok");
  }
  return config;
}

async function runDetectApiConfig() {
  if (state.aiBusy) return;
  setAiBusy(true, "API와 모델을 감지하는 중입니다...");
  try {
    await detectApiConfig();
  } catch (error) {
    setAiStatus(friendlyAiError(error), "warn");
  } finally {
    setAiBusy(false);
  }
}

async function testAiConnection() {
  if (state.aiBusy) return;
  setAiBusy(true, "AI 연결을 테스트하는 중입니다...");
  try {
    let config = await saveAiSettings();
    if (!config.apiKey) {
      throw new Error("API Key를 먼저 붙여넣어 주세요.");
    }

    if (config.provider === "auto" || !config.model || !config.baseUrl) {
      const detected = await detectApiConfig({ silent: true });
      config = {
        ...config,
        provider: detected.provider,
        model: detected.model,
        baseUrl: detected.baseUrl
      };
    }

    if (!config.model || !config.baseUrl || config.provider === "auto") {
      throw new Error("모델명과 Base URL이 필요합니다. 자동 감지가 안 되면 직접 입력해 주세요.");
    }

    const project = getActiveProject();
    const result = await requestAi({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      headers: config.headers,
      mode: "chat",
      prompt: "연결 테스트입니다. 한국어로 한 문장만 답해 주세요.",
      history: [],
      project: {
        name: project.name,
        framework: project.framework,
        libraries: project.libraries || [],
        files: project.files
      }
    });

    setAiStatus(`연결 성공: ${result.message || "AI 응답을 받았습니다."}`, "ok");
  } catch (error) {
    setAiStatus(friendlyAiError(error), "warn");
  } finally {
    setAiBusy(false);
  }
}

async function detectApiConfig(options = {}) {
  const project = getActiveProject();
  const config = readAiConfig();

  if (!config.apiKey) {
    throw new Error("API Key를 먼저 입력해야 합니다.");
  }

  if (!options.silent) {
    setAiStatus("API와 모델을 자동 감지하는 중입니다...", "");
  }

  const detected = await detectApi({
    provider: config.provider,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    headers: config.headers
  });

  project.ai.provider = detected.provider;
  project.ai.model = detected.model;
  project.ai.baseUrl = detected.baseUrl;
  project.ai.headersJson = config.headersJson;
  project.ai.apiKey = config.apiKey;
  project.ai.detectedModels = detected.models || [];

  els.providerSelect.value = detected.provider;
  els.modelInput.value = detected.model;
  els.baseUrlInput.value = detected.baseUrl;
  renderModelOptions(detected.models || [], detected.model);
  updateAiSetupHint(detected);

  await persistState();

  if (!options.silent) {
    setAiStatus(`${detected.label} 감지 완료: ${detected.model}`, "ok");
  }

  return detected;
}

async function detectApi(config) {
  if (state.storageMode === "server" && window.location.protocol !== "file:") {
    const response = await fetch("api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.error || "API 자동 감지 실패");
    }
    return data;
  }

  return detectApiDirect(config);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
}

async function detectApiDirect({ provider, apiKey, baseUrl, headers }) {
  const candidates = getDetectionCandidates(provider, apiKey, baseUrl);
  const errors = [];

  for (const candidate of candidates) {
    try {
      if (candidate.provider === "gemini") {
        return await detectGemini(apiKey, candidate.baseUrl, headers);
      }
      if (candidate.provider === "anthropic") {
        return await detectAnthropic(apiKey, candidate.baseUrl, headers);
      }
      return await detectOpenAiCompatible(apiKey, candidate.baseUrl, headers);
    } catch (error) {
      errors.push(`${candidate.provider}: ${error.message}`);
    }
  }

  throw new Error(errors.join(" / ") || "알 수 없는 API 형식입니다.");
}

function getDetectionCandidates(provider, apiKey, baseUrl) {
  const lowerUrl = (baseUrl || "").toLowerCase();

  if (provider && provider !== "auto") {
    return [{ provider, baseUrl }];
  }

  if (lowerUrl.includes("generativelanguage.googleapis.com") || lowerUrl.includes("gemini")) {
    return [{ provider: "gemini", baseUrl }];
  }
  if (lowerUrl.includes("anthropic")) {
    return [{ provider: "anthropic", baseUrl }];
  }
  if (lowerUrl) {
    return [{ provider: "openai", baseUrl }];
  }
  if (apiKey.startsWith("sk-ant-")) {
    return [{ provider: "anthropic", baseUrl: "https://api.anthropic.com/v1/messages" }];
  }
  if (apiKey.startsWith("sk-or-v1-")) {
    return [{ provider: "openai", baseUrl: "https://openrouter.ai/api/v1/chat/completions" }];
  }
  if (apiKey.startsWith("gsk_")) {
    return [{ provider: "openai", baseUrl: "https://api.groq.com/openai/v1/chat/completions" }];
  }
  if (apiKey.startsWith("AIza")) {
    return [{ provider: "gemini", baseUrl: "" }];
  }

  return [
    { provider: "openai", baseUrl: "https://api.openai.com/v1/chat/completions" },
    { provider: "anthropic", baseUrl: "https://api.anthropic.com/v1/messages" },
    { provider: "gemini", baseUrl: "" }
  ];
}

async function detectOpenAiCompatible(apiKey, baseUrl, headers = {}) {
  const chatUrl = normalizeOpenAiChatUrl(baseUrl || "https://api.openai.com/v1/chat/completions");
  const modelsUrl = deriveOpenAiModelsUrl(chatUrl);
  const response = await fetch(modelsUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...headers
    }
  });
  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI 호환 모델 목록 조회 실패");
  }
  const models = (data.data || []).map((model) => model.id).filter(Boolean);
  if (!models.length) {
    throw new Error("사용 가능한 모델을 찾지 못했습니다.");
  }
  const model = choosePreferredModel(models, ["gpt-4o-mini", "gpt-4.1-mini", "o4-mini", "gpt-4o"]);
  return {
    provider: "openai",
    label: "OpenAI 호환 API",
    model,
    models,
    baseUrl: chatUrl
  };
}

async function detectAnthropic(apiKey, baseUrl, headers = {}) {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      ...headers
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Anthropic model lookup failed");
  }

  const models = (data.data || []).map((model) => model.id).filter(Boolean);
  if (!models.length) {
    throw new Error("No Anthropic models found");
  }
  const model = choosePreferredModel(models, ["claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest", "claude-sonnet-4-0"]);
  return {
    provider: "anthropic",
    label: "Anthropic",
    model,
    models,
    baseUrl: baseUrl || "https://api.anthropic.com/v1/messages"
  };
}

async function detectGemini(apiKey, baseUrl, headers = {}) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
    headers
  });
  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini 모델 목록 조회 실패");
  }
  const models = (data.models || [])
    .map((model) => (model.name || "").replace(/^models\//, ""))
    .filter((name) => name && !name.includes("embedding"));
  if (!models.length) {
    throw new Error("Gemini 모델을 찾지 못했습니다.");
  }
  const model = choosePreferredModel(models, ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"]);
  return {
    provider: "gemini",
    label: "Google Gemini",
    model,
    models,
    baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  };
}

function normalizeOpenAiChatUrl(baseUrl) {
  const trimmed = (baseUrl || "").trim().replace(/\/$/, "");
  if (!trimmed) return "https://api.openai.com/v1/chat/completions";
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/models")) return trimmed.replace(/\/models$/, "/chat/completions");
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  if (trimmed.includes("/v1/")) return trimmed.replace(/\/v1\/.*$/, "/v1/chat/completions");
  return `${trimmed}/v1/chat/completions`;
}

function deriveOpenAiModelsUrl(chatUrl) {
  const normalized = normalizeOpenAiChatUrl(chatUrl);
  return normalized.replace(/\/chat\/completions$/, "/models");
}

function choosePreferredModel(models, preferred) {
  for (const item of preferred) {
    const exact = models.find((model) => model === item);
    if (exact) return exact;
    const partial = models.find((model) => model.includes(item));
    if (partial) return partial;
  }
  return models[0];
}

function applyAiPreset(presetName, options = {}) {
  const preset = AI_PRESETS[presetName] || AI_PRESETS.custom;
  const keepExisting = Boolean(options.keepExisting);
  els.providerSelect.value = preset.provider;
  if (!keepExisting || !els.modelInput.value.trim()) {
    els.modelInput.value = preset.model;
  }
  if (!keepExisting || !els.baseUrlInput.value.trim()) {
    els.baseUrlInput.value = preset.baseUrl;
  }
  renderModelOptions([], els.modelInput.value.trim());
  updateAiSetupHint(null, preset.hint);
  if (!options.silent) {
    setAiStatus(`${preset.label} 설정을 적용했습니다. 키를 넣고 자동 감지 또는 연결 테스트를 눌러보세요.`, "ok");
  }
}

function handleApiKeyInput() {
  const presetName = inferPresetFromApiKey(els.apiKeyInput.value.trim());
  if (presetName && (els.providerSelect.value === "auto" || !els.baseUrlInput.value.trim())) {
    applyAiPreset(presetName, { keepExisting: true, silent: true });
  } else {
    updateAiSetupHint();
  }
}

function handleDeploySlugInput() {
  const sanitized = sanitizeDeploySlug(els.deploySlugInput.value);
  if (els.deploySlugInput.value !== sanitized) {
    els.deploySlugInput.value = sanitized;
  }
  const project = getActiveProject();
  renderDeploySlugHint(sanitized, project?.id, parseDeployAliases(els.deployAliasesInput.value));
}

function handleDeployAliasesInput() {
  const aliases = parseDeployAliases(els.deployAliasesInput.value);
  const normalized = aliases.join("\n");
  if (els.deployAliasesInput.value.trim() !== normalized) {
    els.deployAliasesInput.value = normalized;
  }
  const project = getActiveProject();
  renderDeploySlugHint(els.deploySlugInput.value, project?.id, aliases);
}

function inferPresetFromApiKey(apiKey) {
  if (!apiKey) return "";
  if (apiKey.startsWith("sk-ant-")) return "anthropic";
  if (apiKey.startsWith("sk-or-v1-")) return "openrouter";
  if (apiKey.startsWith("gsk_")) return "groq";
  if (apiKey.startsWith("AIza")) return "gemini";
  if (apiKey.startsWith("sk-")) return "openai";
  return "";
}

function updateAiSetupHint(detected, overrideText) {
  if (!els.aiSetupHint) return;
  if (overrideText) {
    els.aiSetupHint.textContent = overrideText;
    els.aiSetupHint.className = "setup-hint";
    return;
  }

  const apiKey = els.apiKeyInput.value.trim();
  const provider = els.providerSelect.value;
  const model = els.modelInput.value.trim();
  const baseUrl = els.baseUrlInput.value.trim();
  const presetName = inferPresetFromApiKey(apiKey);

  if (detected?.model) {
    els.aiSetupHint.textContent = `${detected.label || "API"} 감지 완료. 사용할 모델: ${detected.model}`;
    els.aiSetupHint.className = "setup-hint ok";
    return;
  }

  if (!apiKey) {
    els.aiSetupHint.textContent = "API Key를 붙여넣고 제공사를 선택하세요. OpenAI 호환 API는 Base URL과 모델명을 직접 넣을 수도 있습니다.";
    els.aiSetupHint.className = "setup-hint";
    return;
  }

  if (presetName && (!model || !baseUrl)) {
    els.aiSetupHint.textContent = "키 형식을 인식했습니다. 자동 감지를 누르면 모델 목록을 불러옵니다.";
    els.aiSetupHint.className = "setup-hint ok";
    return;
  }

  if (!presetName && provider === "auto" && !baseUrl) {
    els.aiSetupHint.textContent = "이 키는 형식만으로 제공사를 알 수 없습니다. 제공사를 고르거나 OpenAI 호환 Base URL을 입력해 주세요.";
    els.aiSetupHint.className = "setup-hint warn";
    return;
  }

  if (apiKey && model && baseUrl && provider !== "auto") {
    els.aiSetupHint.textContent = "필수 설정이 채워졌습니다. 연결 테스트를 누르면 실제 AI 응답까지 확인합니다.";
    els.aiSetupHint.className = "setup-hint ok";
    return;
  }

  if (apiKey && baseUrl && !model) {
    els.aiSetupHint.textContent = "Base URL은 준비됐습니다. 자동 감지로 모델 목록을 불러오거나 모델명을 직접 입력하세요.";
    els.aiSetupHint.className = "setup-hint";
    return;
  }

  if (apiKey && model && !baseUrl) {
    els.aiSetupHint.textContent = "모델명은 준비됐습니다. 제공사 Base URL을 입력하거나 빠른 연결에서 제공사를 선택하세요.";
    els.aiSetupHint.className = "setup-hint";
    return;
  }

  els.aiSetupHint.textContent = "모델명과 Base URL이 비어 있으면 자동 감지를 먼저 눌러보세요.";
  els.aiSetupHint.className = "setup-hint";
}

function setAiBusy(isBusy, message) {
  state.aiBusy = isBusy;
  [els.aiChatBtn, els.aiCreateBtn, els.aiFixBtn, els.detectApiBtn, els.testAiBtn, els.saveAiSettingsBtn].forEach((button) => {
    if (button) button.disabled = isBusy;
  });
  if (message) {
    setAiStatus(message, "");
  }
}

function renderDeploySlugHint(slug, projectId, aliases = []) {
  const safeSlug = sanitizeDeploySlug(slug || "");
  const project = getActiveProject();
  const error = getRouteSlugError({
    projectId,
    primarySlug: safeSlug,
    aliases,
    redirects: project?.id === projectId ? project.redirectSlugs || [] : []
  });
  if (!safeSlug) {
    els.deploySlugHint.textContent = "배포 주소는 영어 소문자, 숫자, 하이픈만 사용할 수 있습니다.";
    els.deploySlugHint.className = "status subtle-status";
    return;
  }
  if (error) {
    els.deploySlugHint.textContent = error;
    els.deploySlugHint.className = "status error subtle-status";
    return;
  }
  const aliasText = aliases.length ? ` · 추가 주소 ${aliases.length}개` : "";
  els.deploySlugHint.textContent = `사용 가능: /${safeSlug}${aliasText}`;
  els.deploySlugHint.className = "status ok subtle-status";
}

function friendlyAiError(error) {
  const message = error?.message || String(error);
  if (message.includes("fetch failed") || message.includes("Failed to fetch")) {
    return "AI 서버에 접속하지 못했습니다. 인터넷 연결, Base URL, 또는 현재 실행 환경의 네트워크 제한을 확인해 주세요.";
  }
  if (message.includes("401") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("invalid api key")) {
    return "API Key가 거절되었습니다. 키가 맞는지, 결제가 필요한 계정인지 확인해 주세요.";
  }
  if (message.includes("404")) {
    return "API 주소를 찾지 못했습니다. Base URL이 /v1/chat/completions 형태인지 확인해 주세요.";
  }
  if (message.includes("model")) {
    return `모델 설정을 확인해 주세요. ${message}`;
  }
  return message;
}

async function callAI(mode) {
  syncEditorToProject();
  const project = getActiveProject();
  const prompt = els.promptInput.value.trim();

  if (!prompt) {
    setAiStatus("AI에게 보낼 요청을 먼저 입력해주세요.", "warn");
    return;
  }

  if (state.aiBusy) {
    setAiStatus("이미 AI 요청을 처리하는 중입니다. 잠깐만 기다려 주세요.", "warn");
    return;
  }

  let config;
  try {
    config = readAiConfig();
  } catch (error) {
    setAiStatus(friendlyAiError(error), "warn");
    return;
  }

  setChatOpen(true);
  setAiBusy(true, mode === "chat" ? "AI가 답변을 준비하는 중입니다..." : "AI가 코드를 만들고 수정하는 중입니다...");

  try {
    project.ai.provider = config.provider;
    project.ai.model = config.model;
    project.ai.baseUrl = config.baseUrl;
    project.ai.headersJson = config.headersJson;
    project.ai.apiKey = config.apiKey;
    project.ai.messages.push({
      role: "user",
      text: prompt,
      createdAt: formatNow()
    });

    renderChat(project);
    renderChatDock(project);
    els.promptInput.value = "";

    if (config.apiKey && (config.provider === "auto" || !config.model || !config.baseUrl)) {
      try {
        const detected = await detectApiConfig({ silent: true });
        config = {
          ...config,
          provider: detected.provider,
          model: detected.model,
          baseUrl: detected.baseUrl
        };
        project.ai.provider = config.provider;
        project.ai.model = config.model;
        project.ai.baseUrl = config.baseUrl;
      } catch (error) {
        project.ai.messages.push({
          role: "assistant",
          text: `API 자동 감지를 시도했지만 실패했어요. ${friendlyAiError(error)} OpenAI 호환 API라면 Base URL을 /v1/chat/completions 형태로 넣고 모델명을 직접 입력해 주세요.`,
          createdAt: formatNow()
        });
      }
    }

    if (!config.apiKey || !config.model || !config.baseUrl || config.provider === "auto") {
      project.ai.messages.push({
        role: "assistant",
        text: "메시지는 받았어요. 실제 AI 답변을 받으려면 API Key, 모델명, Base URL이 필요합니다. 위의 빠른 연결에서 제공사를 고르거나 Base URL을 직접 넣어주세요.",
        createdAt: formatNow()
      });
      await persistState();
      renderChat(project);
      renderChatDock(project);
      setAiStatus("AI 설정이 부족해서 실제 요청은 보내지 않았습니다.", "warn");
      return;
    }

    await persistState();
    const historyBeforeRequest = project.ai.messages.slice(0, -1);
    const data = await requestAi({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      headers: config.headers,
      mode,
      prompt,
      history: historyBeforeRequest,
      project: {
        name: project.name,
        framework: project.framework,
        libraries: project.libraries || [],
        files: project.files
      }
    });

    if (data.applyChanges !== false) {
      if (data.name) project.name = data.name;
      if (data.framework && ["html", "react", "vue"].includes(data.framework)) {
        project.framework = data.framework;
      }
      if (Array.isArray(data.libraries)) {
        project.libraries = data.libraries;
      }
      if (data.files && typeof data.files === "object" && Object.keys(data.files).length) {
        project.files = data.files;
      }

      project.activeFile = pickDefaultFile(project.framework, project.files);
      project.updatedAt = formatNow();
      project.versions.push({
        id: makeId(),
        label: `ai ${mode} ${project.versions.length + 1}`,
        createdAt: formatNow(),
        files: deepClone(project.files)
      });
    }

    project.ai.messages.push({
      role: "assistant",
      text: data.message || (mode === "chat"
        ? "답변을 정리해뒀어요."
        : "코드를 수정해서 바로 반영해뒀어요. 미리보기와 파일 탭에서 확인해보세요."),
      createdAt: formatNow()
    });

    await persistState();
    render();
    setAiStatus(
      mode === "chat" || data.applyChanges === false
        ? "AI 답변이 도착했습니다."
        : "AI 반영 완료. 코드와 미리보기에 바로 적용됐습니다.",
      "ok"
    );
  } catch (error) {
    project.ai.messages.push({
      role: "assistant",
      text: `요청 처리 중 문제가 생겼습니다: ${friendlyAiError(error)}`,
      createdAt: formatNow()
    });
    await persistState();
    renderChat(project);
    renderChatDock(project);
    setAiStatus(`AI 요청 실패: ${friendlyAiError(error)}`, "warn");
  } finally {
    setAiBusy(false);
  }
}

async function requestAi(payload) {
  if (state.storageMode === "server" && window.location.protocol !== "file:") {
    const response = await fetch("api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.error || "AI request failed");
    }
    return data;
  }

  return requestAiDirect(payload);
}

async function requestAiDirect(payload) {
  const { provider, apiKey, model, baseUrl, headers, mode, prompt, history, project } = payload;
  const systemPrompt = [
    "You are Vibly, an AI website builder.",
    "Return only JSON.",
    'Use this exact shape: {"message":"short Korean reply for the chat UI","applyChanges":true,"name":"optional","framework":"html|react|vue","libraries":["optional urls"],"files":{"fileName":"content"}}',
    "For html projects use index.html, style.css, script.js.",
    "For react projects use index.html, style.css, app.jsx.",
    "For vue projects use index.html, style.css, app.js.",
    "If the user is only chatting, set applyChanges to false and omit file edits."
  ].join(" ");

  const userPrompt = [
    mode === "fix" ? "Fix and improve this project." : mode === "chat" ? "Answer the user and only edit code if truly needed." : "Create or update this project.",
    "User request:",
    prompt,
    "Current project bundle JSON:",
    JSON.stringify(project)
  ].join("\n");

  if (provider === "anthropic") {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...headers
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          ...history.map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: [{ type: "text", text: message.text }]
          })),
          { role: "user", content: [{ type: "text", text: userPrompt }] }
        ]
      })
    });
    const payloadJson = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payloadJson.error?.message || "Anthropic request failed");
    }
    const text = (payloadJson.content || []).filter((item) => item.type === "text").map((item) => item.text).join("\n");
    return extractJsonFromText(text, mode);
  }

  if (provider === "gemini") {
    const url = baseUrl.includes("?key=") ? baseUrl : `${baseUrl}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          ...history.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.text }]
          })),
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7
        }
      })
    });
    const payloadJson = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(payloadJson.error?.message || "Gemini request failed");
    }
    const text = (payloadJson.candidates?.[0]?.content?.parts || []).map((item) => item.text || "").join("\n");
    return extractJsonFromText(text, mode);
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...headers
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.text
        })),
        { role: "user", content: userPrompt }
      ]
    })
  });
  const payloadJson = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(payloadJson.error?.message || "OpenAI-compatible request failed");
  }
  return extractJsonFromText(payloadJson.choices?.[0]?.message?.content || "", mode);
}

function extractJsonFromText(text, mode = "build") {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return {
      message: text.trim() || "AI가 응답했지만 읽을 수 있는 내용이 비어 있습니다.",
      applyChanges: false
    };
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (error) {
    return {
      message: text.trim() || "AI가 답변했지만 JSON 형식은 아니었습니다.",
      applyChanges: false
    };
  }
}

function applyProviderDefaults() {
  const provider = els.providerSelect.value;

  if (provider === "openai") {
    if (!els.baseUrlInput.value || els.baseUrlInput.value.includes("anthropic") || els.baseUrlInput.value.includes("gemini")) {
      els.baseUrlInput.value = "https://api.openai.com/v1/chat/completions";
    }
    if (!els.modelInput.value) {
      els.modelInput.value = "gpt-4o-mini";
    }
    return;
  }

  if (provider === "anthropic") {
    els.baseUrlInput.value = "https://api.anthropic.com/v1/messages";
    if (!els.modelInput.value || els.modelInput.value === "gpt-4o-mini") {
      els.modelInput.value = "claude-3-5-sonnet-latest";
    }
    return;
  }

  if (provider === "gemini") {
    els.baseUrlInput.value = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
    if (!els.modelInput.value || els.modelInput.value === "gpt-4o-mini" || els.modelInput.value.includes("claude")) {
      els.modelInput.value = "gemini-1.5-pro";
    }
  }
}

function openPreviewWindow() {
  syncEditorToProject();
  openBlobHtml(buildPreviewHtml(getActiveProject()));
}

function openLiveWindow() {
  const project = getActiveProject();
  if (!project.liveDeploymentId) {
    alert("먼저 한 번 배포해야 라이브 주소를 열 수 있습니다.");
    return;
  }

  if (state.storageMode === "server") {
    window.open(getLiveUrl(project), "_blank");
    return;
  }

  const deployment = project.deployments.find((item) => item.id === project.liveDeploymentId);
  if (!deployment) return;
  openBlobHtml(buildPreviewHtml(project, deployment.files));
}

function openBlobHtml(html) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    alert("팝업이 차단됐습니다. 브라우저에서 새 창 열기를 허용한 뒤 다시 눌러주세요.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function isSmallScreen() {
  return window.matchMedia("(max-width: 960px)").matches;
}

function handleEditorKeydown(event) {
  if (event.key !== "Tab") return;
  event.preventDefault();
  const start = els.editorArea.selectionStart;
  const end = els.editorArea.selectionEnd;
  const value = els.editorArea.value;
  els.editorArea.value = `${value.slice(0, start)}  ${value.slice(end)}`;
  els.editorArea.selectionStart = els.editorArea.selectionEnd = start + 2;
  syncEditorToProject();
}

function handlePromptKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    callAI("chat");
  }
}

function buildPreviewHtml(project, filesOverride) {
  const files = filesOverride || project.files;
  const libs = Array.isArray(project.libraries) ? project.libraries : [];
  const cssLinks = libs
    .filter((url) => /\.css(\?|$)/i.test(url))
    .map((url) => `<link rel="stylesheet" href="${escapeAttribute(url)}">`)
    .join("\n");
  const jsLinks = libs
    .filter((url) => !/\.css(\?|$)/i.test(url))
    .map((url) => `<script src="${escapeAttribute(url)}"><\/script>`)
    .join("\n");
  const styleTag = files["style.css"] ? `<style>${files["style.css"]}</style>` : "";

  if (project.framework === "react") {
    const baseHtml = files["index.html"] || "";
    return baseHtml.replace("</head>", `${cssLinks}\n${styleTag}\n</head>`).replace(
      "</body>",
      `
      <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
      ${jsLinks}
      <script type="text/babel">
${files["app.jsx"] || ""}
      <\/script>
      </body>`
    );
  }

  if (project.framework === "vue") {
    const baseHtml = files["index.html"] || "";
    return baseHtml.replace("</head>", `${cssLinks}\n${styleTag}\n</head>`).replace(
      "</body>",
      `
      <script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>
      ${jsLinks}
      <script>
${files["app.js"] || ""}
      <\/script>
      </body>`
    );
  }

  let html = files["index.html"] || "";
  html = html.includes("</head>")
    ? html.replace("</head>", `${cssLinks}\n${styleTag}\n</head>`)
    : `${cssLinks}\n${styleTag}\n${html}`;

  if (files["script.js"]) {
    html = html.includes("</body>")
      ? html.replace("</body>", `${jsLinks}\n<script>${files["script.js"]}<\/script>\n</body>`)
      : `${html}\n${jsLinks}\n<script>${files["script.js"]}<\/script>`;
  } else if (jsLinks) {
    html = html.includes("</body>")
      ? html.replace("</body>", `${jsLinks}\n</body>`)
      : `${html}\n${jsLinks}`;
  }

  return html;
}

function updateStoragePill() {
  if (state.storageMode === "server") {
    els.storageModePill.textContent = "서버 저장 모드";
    return;
  }
  if (state.storageMode === "browser") {
    els.storageModePill.textContent = "파일 열기 / 브라우저 저장 모드";
    return;
  }
  els.storageModePill.textContent = "로딩 중...";
}

function setAiStatus(message, tone) {
  els.aiStatus.textContent = message;
  els.aiStatus.className = `status ${tone || ""}`.trim();
}

function createInitialState() {
  return {
    projects: [makeProject("Welcome Project", "html", 0)],
    activeProjectId: null,
    updatedAt: formatNow()
  };
}

function makeProject(name, framework, orderNumber) {
  const files = getTemplate(framework);
  const slugBase = sanitizeDeploySlug(name) || `site-${orderNumber}`;
  return {
    id: makeId(),
    name,
    framework,
    libraries: [],
    files,
    activeFile: pickDefaultFile(framework, files),
    versions: [],
    deployments: [],
    liveDeploymentId: null,
    deploySlug: makeUniqueDeploySlug(slugBase),
    deployAliases: [],
    redirectSlugs: [],
    ai: {
      provider: "auto",
      model: "",
      baseUrl: "",
      headersJson: "",
      apiKey: "",
      messages: [],
      detectedModels: []
    },
    createdAt: formatNow(),
    updatedAt: formatNow()
  };
}

function getTemplate(framework) {
  if (framework === "react") {
    return {
      "index.html": `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Vibly Site</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      "style.css": `body {
  margin: 0;
  font-family: "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #fff7ef, #f0e1cf);
  color: #1f160f;
}

.wrap {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 16px;
  text-align: center;
  padding: 24px;
}`,
      "app.jsx": `function App() {
  return (
    <section className="wrap">
      <h1>React site by Vibly</h1>
      <p>자연어로 수정하거나 코드를 직접 바꿔보세요.</p>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);`
    };
  }

  if (framework === "vue") {
    return {
      "index.html": `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Vibly Site</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>`,
      "style.css": `body {
  margin: 0;
  font-family: "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #fff7ef, #eadccc);
  color: #1d140d;
}

.shell {
  min-height: 100vh;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 16px;
  padding: 24px;
}`,
      "app.js": `Vue.createApp({
  data() {
    return {
      title: "Vue site by Vibly",
      description: "자연어로 사이트를 만들고 수정해보세요."
    };
  },
  template: \`
    <section class="shell">
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </section>
  \`
}).mount("#app");`
    };
  }

  return {
    "index.html": `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Vibly Site</title>
</head>
<body>
  <main class="hero">
    <h1>Welcome to Vibly</h1>
    <p>AI로 사이트를 만들고 여기서 바로 수정해보세요.</p>
    <button id="ctaBtn">Get Started</button>
  </main>
</body>
</html>`,
    "style.css": `body {
  margin: 0;
  font-family: "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #fff8ef, #f3e6d6);
  color: #1f160f;
}

.hero {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 16px;
  text-align: center;
  padding: 24px;
}`,
    "script.js": `document.getElementById("ctaBtn")?.addEventListener("click", () => {
  alert("Vibly says hi.");
});`
  };
}

function migrateState(raw) {
  const source = raw && Array.isArray(raw.projects) ? raw : createInitialState();
  source.projects = source.projects.map((project, index) => migrateProject(project, index));
  source.projects = reserveRouteSlugs(source.projects);
  if (!source.activeProjectId && source.projects[0]) {
    source.activeProjectId = source.projects[0].id;
  }
  source.updatedAt = source.updatedAt || formatNow();
  return source;
}

function migrateProject(project, index) {
  const framework = ["html", "react", "vue"].includes(project.framework) ? project.framework : "html";
  const files = project.files && typeof project.files === "object" ? project.files : getTemplate(framework);
  const fallbackSlug = sanitizeDeploySlug(project.name || `project-${index + 1}`) || `site-${index}`;
  return {
    id: project.id || makeId(),
    name: project.name || `Project ${index + 1}`,
    framework,
    libraries: Array.isArray(project.libraries) ? project.libraries : [],
    files,
    activeFile: project.activeFile && files[project.activeFile] !== undefined ? project.activeFile : pickDefaultFile(framework, files),
    versions: Array.isArray(project.versions) ? project.versions : [],
    deployments: Array.isArray(project.deployments) ? project.deployments : [],
    liveDeploymentId: project.liveDeploymentId || null,
    deploySlug: sanitizeDeploySlug(project.deploySlug || project.deployNumber || fallbackSlug) || `site-${index}`,
    deployAliases: uniqueSlugs(project.deployAliases || []),
    redirectSlugs: uniqueSlugs(project.redirectSlugs || []),
    ai: {
      provider: project.ai?.provider || "auto",
      model: project.ai?.model || "",
      baseUrl: project.ai?.baseUrl || "",
      headersJson: project.ai?.headersJson || "",
      apiKey: project.ai?.apiKey || "",
      messages: Array.isArray(project.ai?.messages) ? project.ai.messages : [],
      detectedModels: Array.isArray(project.ai?.detectedModels) ? project.ai.detectedModels : []
    },
    createdAt: project.createdAt || formatNow(),
    updatedAt: project.updatedAt || formatNow()
  };
}

function pickDefaultFile(framework, files) {
  if (framework === "react" && files["app.jsx"] !== undefined) return "app.jsx";
  if (framework === "vue" && files["app.js"] !== undefined) return "app.js";
  if (files["index.html"] !== undefined) return "index.html";
  return Object.keys(files)[0];
}

function getBaseOrigin() {
  return window.location.protocol === "file:" ? "file preview mode" : window.location.origin;
}

function getLiveUrl(project) {
  return state.storageMode === "server" ? `${window.location.origin}/${project.deploySlug}` : `local://${project.deploySlug}`;
}

function sanitizeDeploySlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function parseDeployAliases(value) {
  return uniqueSlugs(
    String(value || "")
      .split(/\r?\n|,/)
      .map((line) => sanitizeDeploySlug(line))
      .filter(Boolean)
  );
}

function uniqueSlugs(slugs) {
  return [...new Set((slugs || []).map((slug) => sanitizeDeploySlug(slug)).filter(Boolean))];
}

function getRouteSlugError({ projectId, primarySlug, aliases = [], redirects = [] }) {
  const primaryError = getSingleRouteSlugError(primarySlug, "배포 주소");
  if (primaryError) return primaryError;

  const localSeen = new Map();
  const addLocalSlug = (slug, label) => {
    const singleError = getSingleRouteSlugError(slug, label);
    if (singleError) return singleError;
    if (localSeen.has(slug)) {
      return `${label}가 다른 주소와 중복됩니다: /${slug}`;
    }
    localSeen.set(slug, label);
    return "";
  };

  let error = addLocalSlug(primarySlug, "배포 주소");
  if (error) return error;

  for (const alias of aliases) {
    error = addLocalSlug(alias, "추가 배포 주소");
    if (error) return error;
  }

  for (const redirect of redirects) {
    error = addLocalSlug(redirect, "이전 주소 리디렉트");
    if (error) return error;
  }

  for (const slug of localSeen.keys()) {
    if (routeSlugExists(slug, projectId)) {
      return "이미 사용 중인 배포 주소입니다. 다른 주소를 입력해 주세요.";
    }
  }

  return "";
}

function getSingleRouteSlugError(slug, label) {
  if (!slug) return `${label}를 입력해 주세요.`;
  if (slug.length < 2) return `${label}는 2자 이상이어야 합니다.`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return `${label}는 영어 소문자, 숫자, 하이픈만 사용할 수 있습니다.`;
  }
  if (isReservedDeploySlug(slug)) {
    return "이 주소는 시스템에서 사용 중이라 배포 주소로 쓸 수 없습니다.";
  }
  return "";
}

function getDeploySlugError(slug, projectId) {
  return getRouteSlugError({ projectId, primarySlug: slug });
}

function isReservedDeploySlug(slug) {
  return ["api", "app", "index", "styles", "assets", "favicon"].includes(slug);
}

function routeSlugExists(slug, excludeProjectId) {
  if (!state.data?.projects) return false;
  return state.data.projects.some((project) => (
    project.id !== excludeProjectId && getProjectRouteSlugs(project).includes(slug)
  ));
}

function getProjectRouteSlugs(project) {
  return uniqueSlugs([
    project.deploySlug,
    ...(project.deployAliases || []),
    ...(project.redirectSlugs || [])
  ]);
}

function reserveRouteSlugs(projects) {
  const seen = new Set();
  return projects.map((project) => {
    const deploySlug = makeUniqueDeploySlugFromSet(project.deploySlug, seen);
    const deployAliases = [];
    for (const alias of uniqueSlugs(project.deployAliases || [])) {
      if (!getSingleRouteSlugError(alias, "추가 배포 주소") && !seen.has(alias)) {
        seen.add(alias);
        deployAliases.push(alias);
      }
    }
    const redirectSlugs = [];
    for (const redirect of uniqueSlugs(project.redirectSlugs || [])) {
      if (!getSingleRouteSlugError(redirect, "이전 주소 리디렉트") && !seen.has(redirect)) {
        seen.add(redirect);
        redirectSlugs.push(redirect);
      }
    }
    return {
      ...project,
      deploySlug,
      deployAliases,
      redirectSlugs
    };
  });
}

function makeUniqueDeploySlug(base, excludeProjectId) {
  const safeBase = sanitizeDeploySlug(base) || "site";
  let candidate = safeBase;
  let suffix = 2;
  while (getDeploySlugError(candidate, excludeProjectId)) {
    candidate = `${safeBase}-${suffix}`.slice(0, 40).replace(/-+$/g, "");
    suffix += 1;
  }
  return candidate;
}

function makeUniqueDeploySlugFromSet(base, seen) {
  const safeBase = sanitizeDeploySlug(base) || "site";
  let candidate = safeBase;
  let suffix = 2;
  while (
    getSingleRouteSlugError(candidate, "배포 주소") ||
    seen.has(candidate)
  ) {
    candidate = `${safeBase}-${suffix}`.slice(0, 40).replace(/-+$/g, "");
    suffix += 1;
  }
  seen.add(candidate);
  return candidate;
}

function truncate(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeMultiline(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function escapeAttribute(text) {
  return String(text).replace(/"/g, "&quot;");
}

function formatNow() {
  return new Date().toLocaleString("ko-KR");
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
