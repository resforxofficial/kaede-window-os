<script lang="ts">
  import { WindowManager } from "#lib/ts/window-manager.svelte.ts";
  import { ApplicationManager } from "#lib/ts/app-manager.svelte.ts";

  import WindowFrame from "#lib/components/windowframe.svelte";
  import Desktop from "#lib/components/deskt.svelte";
  import Taskbar from "#lib/components/taskbar.svelte";
  import "#lib/css/mainpage.css";
  import { onMount } from 'svelte';
  import { VirtualFileSystem } from '#lib/ts/filesystem.svelte.ts';

  const windowManager = new WindowManager();
  const appManager = new ApplicationManager(windowManager);

  // Desktop Icons
  const desktopIcons = [
    {
      id: "test",
      title: "테스트 프로그램",
      appId: "test",
      icon: "🧪",
      x: 16,
      y: 16,
    },
  ];
  const filesystem = new VirtualFileSystem();

  // 프로그램 실행 요청
  function launchApp(appId: string) {
    void appManager.launch(appId);
  }

  onMount(() => {
    filesystem.initialize();
  });
</script>

<div class="desktop">
  <!-- Desktop -->
  <Desktop icons={desktopIcons} onLaunch={launchApp}>
    {#each windowManager.windows as win (win.id)}
      {#if !win.isMinimized}
        {@const App = appManager.loadedApps[win.appId]}

        <WindowFrame {win} manager={windowManager}>
          {#if App}
            <App windowId={win.id} />
          {:else}
            <div class="app-loading">프로그램을 불러오는 중...</div>
          {/if}
        </WindowFrame>
      {/if}
    {/each}
  </Desktop>

  <!-- Taskbar -->
  <Taskbar
    manager={windowManager}
    apps={appManager.availableApps}
    onLaunch={launchApp}
  />

  <!-- Application Error -->
  {#if appManager.lastError}
    <div class="app-error" role="alert">
      {appManager.lastError}
    </div>
  {/if}
</div>
