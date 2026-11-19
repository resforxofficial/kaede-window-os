<script lang="ts">
  let {
    id,
    title,
    icon,
    x,
    y,
    selected = false,
    onSelect,
    onOpen,
    onMove,
    onContextMenu,
  }: {
    id: string;
    title: string;
    icon: string;
    x: number;
    y: number;
    selected?: boolean;
    onSelect: (id: string) => void;
    onOpen: (id: string) => void;
    onMove: (id: string, x: number, y: number, final?: boolean) => void;
    onContextMenu: (event: MouseEvent, id: string) => void;
  } = $props();
  import { type DragState } from '#lib/ts/dk/desktop.ts';

  let dragState = $state<DragState | null>(null);

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    onSelect(id);

    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: x,
      originY: y,
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;

    const moved = dragState.moved || Math.hypot(dx, dy) > 4;

    if (!moved) return;

    dragState = { ...dragState, moved };

    onMove(id, dragState.originX + dx, dragState.originY + dy);
  }

  function handlePointerUp(event: PointerEvent) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;

    if (dragState.moved) {
      onMove(id, dragState.originX + dx, dragState.originY + dy, true);
    }

    dragState = null;
  }

  function handlePointerCancel(event: PointerEvent) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState = null;
  }

  function handleOpen() {
    if (!dragState?.moved) {
      onOpen(id);
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    onContextMenu(event, id);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      onOpen(id);
    }
  }
</script>

<button
  type="button"
  class="desktop-icon"
  class:selected
  style:left={`${x}px`}
  style:top={`${y}px`}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  ondblclick={handleOpen}
  oncontextmenu={handleContextMenu}
  onkeydown={handleKeyDown}
  onclick={() => onSelect(id)}
>
  <span class="desktop-icon-image">
    {icon}
  </span>

  <span class="desktop-icon-title">
    {title}
  </span>
</button>
