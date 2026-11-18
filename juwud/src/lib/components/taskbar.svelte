<script lang="ts">
  import { onMount } from "svelte";

  import type { WindowManager } from "#lib/ts/window-manager.svelte.ts";

  import "#lib/css/taskbar.css";

  type StartMenuApp = {
    id: string;
    title: string;
    description?: string;
    icon?: string;
  };

  let {
    manager,
    apps = [],
    onLaunch,
  }: {
    manager: WindowManager;
    apps?: StartMenuApp[];
    onLaunch?: (appId: string) => void;
  } = $props();

  let startMenuOpen = $state(false);
  let currentTime = $state<Date | null>(null);

  // -------------------------
  // Clock
  // -------------------------

  onMount(() => {
    const updateClock = () => {
      currentTime = new Date();
    };

    updateClock();

    const timer = window.setInterval(updateClock, 15_000);

    return () => window.clearInterval(timer);
  });

  // -------------------------
  // Window Management
  // -------------------------

  function handleWindowClick(id: string) {
    const win = manager.windows.find((item) => item.id === id);

    if (!win) return;

    if (win.isMinimized || manager.activeWindowId !== id) {
      manager.focusWindow(id);
    } else {
      manager.minimizeWindow(id);
    }
  }

  function getWindowIcon(appId: string) {
    const icons: Record<string, string> = {
      explorer: "📁",
      terminal: "⌨",
      trigle: "🔍",
      notepad: "📝",
      paint: "🎨",
      gallery: "🖼",
      music: "♫",
      test: "▣",
    };

    return icons[appId] ?? "▣";
  }

  // -------------------------
  // Start Menu
  // -------------------------

  function launchApp(appId: string) {
    if (!onLaunch) return;

    onLaunch(appId);
    startMenuOpen = false;
  }
</script>

<div class="taskbar">
  <!-- Start Button -->
  <button
    type="button"
    class="start-button"
    class:opened={startMenuOpen}
    aria-label="시작 메뉴"
    aria-expanded={startMenuOpen}
    onclick={() => {
      startMenuOpen = !startMenuOpen;
    }}
  >
    <span class="start-orb">
      <span class="start-logo">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </span>
    </span>

    <span class="start-label">시작</span>
  </button>

  <!-- Running Windows -->
  <div class="taskbar-window-list">
    {#each manager.windows as win (win.id)}
      <button
        type="button"
        class="taskbar-window-button"
        class:active={manager.activeWindowId === win.id && !win.isMinimized}
        class:minimized={win.isMinimized}
        title={win.title}
        aria-label={`${win.title} 창 활성화`}
        onclick={() => handleWindowClick(win.id)}
      >
        <span class="taskbar-window-icon">
          {getWindowIcon(win.appId)}
        </span>

        <span class="taskbar-window-title">
          {win.title}
        </span>
      </button>
    {/each}
  </div>

  <!-- System Tray -->
  <div class="system-tray">
    <span class="tray-language">KO</span>

    <div class="tray-clock">
      {#if currentTime}
        <time datetime={currentTime.toISOString()}>
          {currentTime.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      {:else}
        <span>--:--</span>
      {/if}
    </div>
  </div>

  <!-- Start Menu -->
  {#if startMenuOpen}
    <section class="start-menu">
      <header class="start-menu-header">
        <div class="start-menu-avatar">♡</div>

        <div class="start-menu-user">
          <strong>Guest</strong>
          <span>tripleS Desktop</span>
        </div>
      </header>

      <div class="start-menu-body">
        <!-- Programs -->
        <div class="start-menu-programs">
          <div class="start-menu-heading">고정된 프로그램</div>

          {#if apps.length > 0}
            {#each apps as app (app.id)}
              <button
                type="button"
                class="start-menu-app"
                disabled={!onLaunch}
                onclick={() => launchApp(app.id)}
              >
                <span class="start-menu-app-icon">
                  {app.icon ?? "▣"}
                </span>

                <span class="start-menu-app-info">
                  <strong>{app.title}</strong>

                  {#if app.description}
                    <small>{app.description}</small>
                  {/if}
                </span>
              </button>
            {/each}
          {:else}
            <div class="start-menu-empty">
              <span>프로그램이 없습니다.</span>
              <small> 프로그램을 추가하면 이곳에 표시됩니다. </small>
            </div>
          {/if}
        </div>

        <!-- Information -->
        <aside class="start-menu-side">
          <div class="start-menu-brand">
            tripleS
            <span>Desktop</span>
          </div>

          <div class="start-menu-divider"></div>

          <div class="start-menu-info">
            <span>실행 중인 창</span>
            <strong>{manager.windows.length}</strong>
          </div>

          <div class="start-menu-info">
            <span>디자인</span>
            <strong>Windows XP / 7</strong>
          </div>
        </aside>
      </div>

      <footer class="start-menu-footer">
        <span>Personal Desktop</span>

        <button type="button" onclick={() => (startMenuOpen = false)}>
          닫기
        </button>
      </footer>
    </section>
  {/if}
</div>
