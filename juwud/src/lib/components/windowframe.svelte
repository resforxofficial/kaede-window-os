<script lang="ts">
  import type { Snippet } from "svelte";
  import "#lib/css/wdframe.css";

  import type { WindowState, WindowRect } from "#lib/types/oscore.ts";
  import type { WindowManager } from "#lib/ts/window-manager.svelte.ts";

  type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

  type DragState = {
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  };

  type ResizeState = {
    pointerId: number;
    direction: ResizeDirection;
    startX: number;
    startY: number;
    origin: WindowRect;
  };

  let {
    win,
    manager,
    children,
  }: {
    win: WindowState;
    manager: WindowManager;
    children: Snippet;
  } = $props();

  let dragState = $state<DragState | null>(null);
  let resizeState = $state<ResizeState | null>(null);

  const resizeDirections: ResizeDirection[] = [
    "n",
    "s",
    "e",
    "w",
    "ne",
    "nw",
    "se",
    "sw",
  ];

  const isActive = $derived(manager.activeWindowId === win.id);

  // -------------------------
  // Window Drag
  // -------------------------

  function startDrag(event: PointerEvent) {
    if (event.button !== 0 || win.isMaximized) return;

    // 창 제어 버튼을 누른 경우 드래그하지 않는다.
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }

    event.preventDefault();

    manager.focusWindow(win.id);

    const target = event.currentTarget as HTMLElement;

    target.setPointerCapture(event.pointerId);

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: win.rect.x,
      originY: win.rect.y,
    };
  }

  function moveDrag(event: PointerEvent) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const x = dragState.originX + event.clientX - dragState.startX;

    const y = dragState.originY + event.clientY - dragState.startY;

    manager.moveWindow(win.id, x, y);
  }

  function endDrag(event: PointerEvent) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState = null;
  }

  // -------------------------
  // Window Resize
  // -------------------------

  function startResize(event: PointerEvent, direction: ResizeDirection) {
    if (event.button !== 0 || win.isMaximized) return;

    event.preventDefault();
    event.stopPropagation();

    manager.focusWindow(win.id);

    const target = event.currentTarget as HTMLElement;

    target.setPointerCapture(event.pointerId);

    resizeState = {
      pointerId: event.pointerId,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...win.rect },
    };
  }

  function moveResize(event: PointerEvent) {
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    const { direction, origin } = resizeState;

    const dx = event.clientX - resizeState.startX;
    const dy = event.clientY - resizeState.startY;

    let { x, y, width, height } = origin;

    if (direction.includes("e")) {
      width = Math.max(win.minWidth, origin.width + dx);
    }

    if (direction.includes("s")) {
      height = Math.max(win.minHeight, origin.height + dy);
    }

    if (direction.includes("w")) {
      width = Math.max(win.minWidth, origin.width - dx);
      x = origin.x + origin.width - width;
    }

    if (direction.includes("n")) {
      height = Math.max(win.minHeight, origin.height - dy);
      y = origin.y + origin.height - height;
    }

    manager.resizeWindow(win.id, {
      x,
      y,
      width,
      height,
    });
  }

  function endResize(event: PointerEvent) {
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    resizeState = null;
  }

  // -------------------------
  // Window Controls
  // -------------------------

  function toggleMaximize() {
    manager.toggleMaximizeWindow(win.id);
  }
</script>

<section
  class="window-frame"
  class:active={isActive}
  class:maximized={win.isMaximized}
  style:left={win.isMaximized ? "0px" : `${win.rect.x}px`}
  style:top={win.isMaximized ? "0px" : `${win.rect.y}px`}
  style:width={win.isMaximized ? "100%" : `${win.rect.width}px`}
  style:height={win.isMaximized ? "100%" : `${win.rect.height}px`}
  style:z-index={win.zIndex}
  onpointerdown={() => manager.focusWindow(win.id)}
  aria-label={win.title}
>
  <!-- Titlebar -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <header
    class="window-titlebar"
    onpointerdown={startDrag}
    onpointermove={moveDrag}
    onpointerup={endDrag}
    onpointercancel={endDrag}
    ondblclick={(event) => {
      if (event.target instanceof Element && event.target.closest("button"))
        return;

      toggleMaximize();
    }}
  >
    <div class="window-title">
      <span class="window-title-text">
        {win.title}
      </span>
    </div>

    <div class="window-controls">
      <button
        type="button"
        class="window-button minimize"
        aria-label="최소화"
        onclick={(event) => {
          event.stopPropagation();
          manager.minimizeWindow(win.id);
        }}
      >
        −
      </button>

      <button
        type="button"
        class="window-button maximize"
        aria-label={win.isMaximized ? "복원" : "최대화"}
        onclick={(event) => {
          event.stopPropagation();
          toggleMaximize();
        }}
      >
        {#if win.isMaximized}
          ❐
        {:else}
          □
        {/if}
      </button>

      <button
        type="button"
        class="window-button close"
        aria-label="닫기"
        onclick={(event) => {
          event.stopPropagation();
          manager.closeWindow(win.id);
        }}
      >
        ×
      </button>
    </div>
  </header>

  <!-- Application Content -->
  <main class="window-content">
    {@render children()}
  </main>

  <!-- Resize Handles -->
  {#if !win.isMaximized}
    {#each resizeDirections as direction (direction)}
      <div
        class={`resize-handle ${direction}`}
        aria-hidden="true"
        onpointerdown={(event) => startResize(event, direction)}
        onpointermove={moveResize}
        onpointerup={endResize}
        onpointercancel={endResize}
      ></div>
    {/each}
  {/if}
</section>
