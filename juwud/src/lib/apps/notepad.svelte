<script lang="ts">
  import { onMount } from "svelte";
  import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";
  import { openDocument, saveDocument } from "#lib/ts/nt/ntfunc.ts";
  import "#lib/css/notpd.css";

  let {
    windowId,
    fileSystem,
    initialPath,
  }: {
    windowId: string;
    fileSystem: VirtualFileSystem;
    initialPath?: string;
  } = $props();

  let content = $state("");
  let savedContent = $state("");
  let currentPath = $state("");
  let statusMessage = $state("새 문서");
  let saveDialogOpen = $state(false);
  let savePath = $state("C:\\Users\\Guest\\Documents\\Untitled.txt");
  let errorMessage = $state("");
  let editorElement: HTMLTextAreaElement | undefined;
  const isDirty = $derived(content !== savedContent);

  // -------------------------
  // Document
  // -------------------------

  function loadFile(path: string) {
    try {
      const document = openDocument(fileSystem, path);

      currentPath = document.path;
      content = document.content;
      savedContent = document.content;

      statusMessage = "파일을 열었습니다.";
      errorMessage = "";
    } catch (error) {
      errorMessage = getErrorMessage(error);
      statusMessage = "파일 열기 실패";
    }
  }

  function createNewDocument() {
    if (
      isDirty &&
      !window.confirm(
        "저장하지 않은 변경 사항이 있습니다. 새 문서를 만드시겠습니까?",
      )
    ) {
      return;
    }

    content = "";
    savedContent = "";
    currentPath = "";

    statusMessage = "새 문서";
    errorMessage = "";
    editorElement?.focus();
  }

  // -------------------------
  // Save
  // -------------------------

  function saveToPath(path: string) {
    try {
      const document = saveDocument(fileSystem, path, content);

      currentPath = document.path;
      savedContent = document.content;

      saveDialogOpen = false;
      errorMessage = "";
      statusMessage = "저장 완료";

      editorElement?.focus();
    } catch (error) {
      errorMessage = getErrorMessage(error);
      statusMessage = "저장 실패";
    }
  }

  function save() {
    if (!currentPath) {
      saveAs();
      return;
    }

    saveToPath(currentPath);
  }

  function saveAs() {
    savePath = currentPath || "C:\\Users\\Guest\\Documents\\Untitled.txt";

    errorMessage = "";
    saveDialogOpen = true;
  }

  // -------------------------
  // Keyboard
  // -------------------------

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();

      if (event.shiftKey) {
        saveAs();
      } else {
        save();
      }
    }
  }

  // -------------------------
  // Helpers
  // -------------------------

  function getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : "알 수 없는 오류가 발생했습니다.";
  }

  // -------------------------
  // Lifecycle
  // -------------------------

  onMount(() => {
    if (initialPath) {
      loadFile(initialPath);
    }

    editorElement?.focus();
  });
</script>

<div class="notepad" data-window-id={windowId}>
  <!-- Toolbar -->
  <header class="notepad-toolbar">
    <div class="notepad-menu">
      <button type="button" onclick={createNewDocument}> 새 문서 </button>

      <button type="button" onclick={save}> 저장 </button>

      <button type="button" onclick={saveAs}> 다른 이름으로 저장 </button>
    </div>

    <div class="notepad-document-status">
      {#if isDirty}
        <span class="dirty-indicator">●</span>
      {/if}

      {currentPath || "제목 없음"}
    </div>
  </header>

  <!-- Editor -->
  <main class="notepad-editor">
    <textarea
      bind:this={editorElement}
      bind:value={content}
      onkeydown={handleKeyDown}
      spellcheck={false}
      aria-label="문서 내용"
      placeholder="여기에 내용을 입력하세요."></textarea>
  </main>

  <!-- Status Bar -->
  <footer class="notepad-statusbar">
    <span>{statusMessage}</span>

    <span>
      {content.length} 글자
      {isDirty ? " · 수정됨" : ""}
    </span>
  </footer>

  <!-- Error -->
  {#if errorMessage}
    <div class="notepad-error" role="alert">
      {errorMessage}
    </div>
  {/if}

  <!-- Save Dialog -->
  {#if saveDialogOpen}
    <div class="notepad-dialog-backdrop">
      <form
        class="notepad-dialog"
        onsubmit={(event) => {
          event.preventDefault();
          saveToPath(savePath);
        }}
      >
        <header>다른 이름으로 저장</header>

        <label>
          파일 경로
          <!-- svelte-ignore a11y_autofocus -->
          <input bind:value={savePath} autofocus spellcheck={false} />
        </label>

        {#if errorMessage}
          <p class="notepad-dialog-error">{errorMessage}</p>
        {/if}

        <footer>
          <button type="button" onclick={() => (saveDialogOpen = false)}>
            취소
          </button>

          <button type="submit" class="primary"> 저장 </button>
        </footer>
      </form>
    </div>
  {/if}
</div>
