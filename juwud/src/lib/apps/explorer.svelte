<script lang="ts">
  import { onMount } from "svelte";

  import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";

  import {
    createExplorerState,
    getSelectedNode,
    initializeExplorer,
    goBack,
    goForward,
    navigate,
    refreshExplorer,
    getIcon,
    selectNode,
    openNode,
    openDialog,
    submitDialog,
    deleteSelected,
  } from "#lib/ts/explorer.ts";

  import "#lib/css/explorer.css";

  let {
    windowId,
    fileSystem,
    initialPath,
    onOpenFile,
  }: {
    windowId: string;
    fileSystem: VirtualFileSystem;
    initialPath?: string;
    onOpenFile?: (path: string) => void;
  } = $props();

  // Explorer State
  // svelte-ignore state_referenced_locally
  const state = $state(createExplorerState(initialPath));

  // Derived State
  const selectedNode = $derived(getSelectedNode(state));

  // -------------------------
  // Lifecycle
  // -------------------------

  onMount(() => {
    initializeExplorer(state, fileSystem);
  });
</script>

<div class="file-explorer" data-window-id={windowId}>
  <!-- Navigation Toolbar -->
  <header class="explorer-toolbar">
    <div class="navigation-buttons">
      <button
        type="button"
        title="뒤로"
        disabled={state.backHistory.length === 0}
        onclick={() => goBack(state, fileSystem)}>←</button
      >

      <button
        type="button"
        title="앞으로"
        disabled={state.forwardHistory.length === 0}
        onclick={() => goForward(state, fileSystem)}>→</button
      >

      <button type="button" title="새로 고침" onclick={() => refreshExplorer(state, fileSystem)}>↻</button>
    </div>

    <form
      class="address-bar"
      onsubmit={(event) => {
        event.preventDefault();
        navigate(state, fileSystem, state.addressValue);
      }}
    >
      <span>📁</span>

      <input
        bind:value={state.addressValue}
        aria-label="폴더 경로"
        spellcheck={false}
      />
    </form>
  </header>

  <!-- Action Toolbar -->
  <nav class="explorer-actions">
    <button type="button" onclick={() => openDialog(state, "folder")}>
      <span>📁</span> 새 폴더
    </button>

    <button type="button" onclick={() => openDialog(state, "file")}>
      <span>📄</span> 새 텍스트 파일
    </button>

    <span class="toolbar-separator"></span>

    <button
      type="button"
      disabled={!selectedNode}
      onclick={() => openDialog(state, "rename")}
    >
      이름 바꾸기
    </button>

    <button
      type="button"
      class="delete-button"
      disabled={!selectedNode}
      onclick={() => deleteSelected(
        state, fileSystem, (msg) => window.confirm(msg)
      )}
    >
      삭제
    </button>
  </nav>

  <!-- Explorer Body -->
  <div class="explorer-body">
    <!-- Sidebar -->

    <!-- Main Content -->
    <section class="explorer-main">
      <div class="file-list">
        <div class="file-list-header">
          <span>이름</span>
          <span>유형</span>
          <span>수정 날짜</span>
        </div>

        {#if state.items.length === 0}
          <div class="empty-folder">이 폴더는 비어 있습니다.</div>
        {:else}
          {#each state.items as item (item.id)}
            <button
              type="button"
              class="file-row"
              class:selected={state.selectedId === item.id}
              onclick={() => selectNode(state, item)}
              ondblclick={() => openNode(state, fileSystem, item, onOpenFile)}
            >
              <span class="file-name">
                <span class="file-icon">{getIcon(item)}</span>
                <span class="file-label">{item.name}</span>
              </span>

              <span class="file-type">
                {item.type === "directory" ? "파일 폴더" : "파일"}
              </span>

              <span class="file-date">
                {new Date(item.updatedAt).toLocaleDateString("ko-KR")}
              </span>
            </button>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <!-- Status Bar -->
  <footer class="explorer-status">
    <span>{state.statusMessage || `항목 ${state.items.length}개`}</span>
    {#if selectedNode}
      <span>선택됨: {selectedNode.name}</span>
    {/if}
  </footer>

  <!-- Create / Rename Dialog -->
  {#if state.dialog}
    <div class="explorer-dialog-backdrop">
      <form class="explorer-dialog" onsubmit={(e) => {
        e.preventDefault();
        submitDialog(state, fileSystem);
      }}>
        <header>
          {state.dialog.kind === "folder"
            ? "새 폴더"
            : state.dialog.kind === "file"
              ? "새 텍스트 파일"
              : "이름 바꾸기"}
        </header>

        <label>
          이름
          <!-- svelte-ignore a11y_autofocus -->
          <input bind:value={state.dialog.value} maxlength="255" autofocus />
        </label>

        {#if state.dialogError}
          <p class="dialog-error">{state.dialogError}</p>
        {/if}

        <footer>
          <button type="button" onclick={() => (state.dialog = null)}> 취소 </button>

          <button type="submit" class="primary"> 확인 </button>
        </footer>
      </form>
    </div>
  {/if}
</div>
