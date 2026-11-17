<script lang="ts">
  import { WindowManager } from "#lib/ts/window-manager.svelte.ts";

  import WindowFrame from "#lib/components/windowframe.svelte";

  const manager = new WindowManager();

  function openTestWindow() {
    manager.openWindow("test", "My First Window", {
      width: 700,
      height: 450,
    });
  }
</script>

<div class="desktop">
  <button onclick={openTestWindow}> 창 열기 </button>

  {#each manager.windows as win (win.id)}
    <WindowFrame {win} {manager}>
      <div class="test-content">
        <h2>Hello, OS!</h2>
        <p>첫 번째 가상 프로그램 창입니다.</p>
      </div>
    </WindowFrame>
  {/each}
</div>

<style>
  .desktop {
    position: relative;

    width: 100%;
    height: 100vh;

    overflow: hidden;

    background: linear-gradient(135deg, #2863a0, #79b5dc);
  }

  .test-content {
    padding: 24px;
    color: #222;
  }
</style>
