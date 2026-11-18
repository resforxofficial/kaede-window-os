<script lang="ts">
  import { WindowManager } from "#lib/ts/window-manager.svelte.ts";
  import WindowFrame from "#lib/components/windowframe.svelte";
  import Taskbar from "#lib/components/taskbar.svelte";

  const manager = new WindowManager();

  const startMenuApps = [
    {
      id: "test",
      title: "테스트 프로그램",
      description: "WindowManager 테스트",
      icon: "▣",
    },
  ];

  function openTestWindow() {
    manager.openWindow("test", "My First Window", {
      width: 700,
      height: 450,
    });
  }

  function launchApp(appId: string) {
    if (appId === "test") {
      openTestWindow();
    }
  }
</script>

<div class="desktop">
  <!-- Desktop Workspace -->
  <div class="desktop-workspace">
    <button onclick={openTestWindow}> 테스트 창 열기 </button>

    {#each manager.windows as win (win.id)}
      {#if !win.isMinimized}
        <WindowFrame {win} {manager}>
          <div style="padding: 24px">
            <h2>Hello, OS!</h2>
            <p>첫 번째 가상 프로그램 창입니다.</p>
          </div>
        </WindowFrame>
      {/if}
    {/each}
  </div>

  <!-- Taskbar -->
  <Taskbar {manager} apps={startMenuApps} onLaunch={launchApp} />
</div>

<style>
  .desktop {
    position: relative;

    width: 100%;
    height: 100dvh;
    overflow: hidden;
    background: #ffc935;
  }

  .desktop-workspace {
    position: absolute;
    inset: 0 0 46px 0;
    overflow: hidden;
  }
</style>
