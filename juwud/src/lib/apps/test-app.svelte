<script lang="ts">
  let {
    windowId,
    fileSystem,
  }: {
    windowId: string;
    fileSystem: VirtualFileSystem;
  } = $props();

  const startedAt = new Date().toLocaleTimeString("ko-KR");
  // svelte-ignore state_referenced_locally
  const rootExists = fileSystem.exists("C:\\");
  import "#lib/css/testapp.css";
  import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";
</script>

<div class="test-app">
  <div class="test-app-header">
    <span class="test-app-icon">🧪</span>

    <div>
      <h2>Application Manager</h2>
      <p>프로그램이 정상적으로 실행되었습니다.</p>
    </div>
  </div>

  <div class="test-app-content">
    <section>
      <span>Application ID</span>
      <strong>test</strong>
    </section>

    <section>
      <span>Window ID</span>
      <strong>{windowId}</strong>
    </section>

    <section>
      <span>Started At</span>
      <strong>{startedAt}</strong>
    </section>
  </div>
</div>
