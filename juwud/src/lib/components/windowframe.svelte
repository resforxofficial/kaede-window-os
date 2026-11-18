<script lang="ts">
  import type { Snippet } from "svelte";
  import "#lib/css/wdframe.css";

  import type { WindowState } from "#lib/types/oscore.ts";
  import type { WindowManager } from "#lib/ts/window-manager.svelte.ts";
  import type {
    DragState,
    ResizeDirection,
    ResizeState,
  } from "#lib/ts/wd/wdts.ts";
  import * as wd from "#lib/ts/wd/wdfunc.ts";

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
  let frameElement: HTMLElement | null = null;

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
</script>

<section
  class="window-frame"
  bind:this={frameElement}
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
    onpointerdown={(event) => {
      dragState = wd.startDrag(event, win, manager, dragState);
    }}
    onpointermove={(event) => {
      wd.moveDrag(event, frameElement, dragState, win, manager);
    }}
    onpointerup={(event) => {
      dragState = wd.endDrag(event, dragState);
    }}
    onpointercancel={(event) => {
      dragState = wd.endDrag(event, dragState);
    }}
    ondblclick={(event) => {
      if (event.target instanceof Element && event.target.closest("button"))
        return;

      wd.toggleMaximize(manager, win);
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
          wd.toggleMaximize(manager, win);
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
        onpointerdown={(event) => {
          resizeState = wd.startResize(
            event,
            direction,
            win,
            manager,
            resizeState,
          );
        }}
        onpointermove={(event) => {
          wd.moveResize(event, frameElement, resizeState, win, manager);
        }}
        onpointerup={(event) => {
          resizeState = wd.endResize(event, resizeState);
        }}
        onpointercancel={(event) => {
          resizeState = wd.endResize(event, resizeState);
        }}
      ></div>
    {/each}
  {/if}
</section>
