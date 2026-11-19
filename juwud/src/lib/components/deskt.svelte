<script lang="ts">
  import type { Snippet } from "svelte";

  import DesktopIcon from "#lib/components/desktop-icon.svelte";
  import "#lib/css/desktop.css";
  import {
    type DesktopIconItem,
    type ContextMenuState,
  } from "#lib/ts/dk/desktop.ts";

  const ICON_WIDTH = 88;
  const ICON_HEIGHT = 94;

  const GRID_ORIGIN = 14;
  const GRID_X = 96;
  const GRID_Y = 100;

  const defaultIcons: DesktopIconItem[] = [
    {
      id: "test",
      title: "테스트 프로그램",
      appId: "test",
      icon: "🧪",
      x: 16,
      y: 16,
    },
  ];

  let {
    children,
    icons = defaultIcons,
    onLaunch,
  }: {
    children: Snippet;
    icons?: DesktopIconItem[];
    onLaunch?: (appId: string) => void;
  } = $props();

  let desktopElement: HTMLElement | null = $state(null);

  let desktopIcons = $state<DesktopIconItem[]>(
    // svelte-ignore state_referenced_locally
    icons.map((icon) => ({ ...icon })),
  );

  let selectedIconId = $state<string | null>(null);
  let contextMenu = $state<ContextMenuState | null>(null);

  function clearSelection() {
    selectedIconId = null;
    contextMenu = null;
  }

  function selectIcon(id: string) {
    selectedIconId = id;
    contextMenu = null;
  }

  // -------------------------
  // Icon Position
  // -------------------------

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), Math.max(min, max));
  }

  function moveIcon(id: string, x: number, y: number, final = false) {
    if (!desktopElement) return;

    const maxX = desktopElement.clientWidth - ICON_WIDTH;
    const maxY = desktopElement.clientHeight - ICON_HEIGHT;

    let nextX = x;
    let nextY = y;

    // 드래그가 끝났을 때 그리드에 맞춰 정렬
    if (final) {
      nextX = GRID_ORIGIN + Math.round((nextX - GRID_ORIGIN) / GRID_X) * GRID_X;

      nextY = GRID_ORIGIN + Math.round((nextY - GRID_ORIGIN) / GRID_Y) * GRID_Y;
    }

    nextX = clamp(nextX, 0, maxX);
    nextY = clamp(nextY, 0, maxY);

    desktopIcons = desktopIcons.map((item) =>
      item.id === id ? { ...item, x: nextX, y: nextY } : item,
    );
  }

  function arrangeIcons() {
    if (!desktopElement) return;

    const columns = Math.max(
      1,
      Math.floor((desktopElement.clientWidth - GRID_ORIGIN * 2) / GRID_X),
    );

    const sorted = [...desktopIcons].sort((a, b) =>
      a.title.localeCompare(b.title, "ko"),
    );

    desktopIcons = sorted.map((item, index) => ({
      ...item,
      x: clamp(
        GRID_ORIGIN + (index % columns) * GRID_X,
        0,
        desktopElement!.clientWidth - ICON_WIDTH,
      ),
      y: clamp(
        GRID_ORIGIN + Math.floor(index / columns) * GRID_Y,
        0,
        desktopElement!.clientHeight - ICON_HEIGHT,
      ),
    }));
  }

  // -------------------------
  // Context Menu
  // -------------------------

  function openContextMenu(event: MouseEvent, targetId: string | null = null) {
    if (!desktopElement) return;

    event.preventDefault();

    const rect = desktopElement.getBoundingClientRect();

    const menuWidth = 190;
    const menuHeight = targetId ? 90 : 85;

    const x = clamp(
      event.clientX - rect.left,
      0,
      desktopElement.clientWidth - menuWidth,
    );

    const y = clamp(
      event.clientY - rect.top,
      0,
      desktopElement.clientHeight - menuHeight,
    );

    selectedIconId = targetId;

    contextMenu = {
      x,
      y,
      targetId,
    };
  }

  function handleWorkspaceContextMenu(event: MouseEvent) {
    // 창이나 아이콘 위에서 발생한 우클릭은 제외
    if (event.target !== desktopElement) return;

    openContextMenu(event);
  }

  function handleContextAction(action: "open" | "refresh" | "arrange") {
    if (action === "open" && contextMenu?.targetId) {
      const target = desktopIcons.find(
        (item) => item.id === contextMenu?.targetId,
      );

      if (target) onLaunch?.(target.appId);
    }

    if (action === "refresh") {
      selectedIconId = null;
    }

    if (action === "arrange") {
      arrangeIcons();
    }

    contextMenu = null;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      contextMenu = null;
      selectedIconId = null;
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<main
  bind:this={desktopElement}
  class="desktop-workspace"
  tabindex="0"
  role="application"
  onpointerdown={(event) => {
    if (event.target === desktopElement) {
      clearSelection();
    }
  }}
  oncontextmenu={handleWorkspaceContextMenu}
  onkeydown={handleKeyDown}
>
  <!-- Desktop Icons -->
  <div class="desktop-icons-layer">
    {#each desktopIcons as item (item.id)}
      <DesktopIcon
        id={item.id}
        title={item.title}
        icon={item.icon}
        x={item.x}
        y={item.y}
        selected={selectedIconId === item.id}
        onSelect={selectIcon}
        onOpen={(id) => {
          const target = desktopIcons.find((item) => item.id === id);

          if (target) onLaunch?.(target.appId);
        }}
        onMove={moveIcon}
        onContextMenu={(event, id) => {
          openContextMenu(event, id);
        }}
      />
    {/each}
  </div>

  <!-- Windows -->
  {@render children()}

  <!-- Context Menu -->
  {#if contextMenu}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      class="desktop-context-menu"
      style:left={`${contextMenu.x}px`}
      style:top={`${contextMenu.y}px`}
      role="menu"
      oncontextmenu={(event) => event.preventDefault()}
    >
      {#if contextMenu.targetId}
        <button
          type="button"
          role="menuitem"
          onclick={() => handleContextAction("open")}
        >
          <span>↗</span>
          <strong>열기</strong>
        </button>
      {:else}
        <button
          type="button"
          role="menuitem"
          onclick={() => handleContextAction("refresh")}
        >
          <span>↻</span>
          <strong>새로 고침</strong>
        </button>
      {/if}

      <div class="context-divider"></div>

      <button
        type="button"
        role="menuitem"
        onclick={() => handleContextAction("arrange")}
      >
        <span>▤</span>
        <strong>이름순 정렬</strong>
      </button>
    </div>
  {/if}
</main>
