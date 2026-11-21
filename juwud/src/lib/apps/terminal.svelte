<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";
  import { executeCommand } from "#lib/ts/terminal/terminal-engine.ts";
  import "#lib/css/terminal.css";

  type TerminalEntry = {
    id: number;
    prompt: string;
    output: string[];
  };

  let {
    windowId,
    fileSystem,
  }: {
    windowId: string;
    fileSystem: VirtualFileSystem;
  } = $props();

  let cwd = $state("C:\\Users\\Guest");
  let inputValue = $state("");
  let entries = $state<TerminalEntry[]>([
    {
      id: 0,
      prompt: "",
      output: [
        "tripleS OS [Version 1.0.0]",
        "(c) tripleS Virtual Desktop",
        "",
        "명령어 목록을 보려면 HELP를 입력하세요.",
        "",
      ],
    },
  ]);

  let history = $state<string[]>([]);
  let historyIndex = $state(-1);

  let outputElement: HTMLDivElement | undefined;
  let inputElement: HTMLInputElement | undefined;

  let sequence = 0;

  onMount(() => {
    if (!fileSystem.exists(cwd)) {
      cwd = "C:\\";
    }

    inputElement?.focus();
  });

  // -------------------------
  // Command Submit
  // -------------------------

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const command = inputValue.trim();
    if (!command) return;
    const commandPrompt = `${cwd}> ${command}`;
    history = [...history, command];
    historyIndex = -1;

    const result = executeCommand(command, {
      fileSystem,
      cwd,
    });

    inputValue = "";
    cwd = result.cwd;

    if (result.clear) {
      entries = [];
    } else {
      entries = [
        ...entries,
        {
          id: ++sequence,
          prompt: commandPrompt,
          output: result.output,
        },
      ];
    }

    await tick();

    if (outputElement) {
      outputElement.scrollTop = outputElement.scrollHeight;
    }

    inputElement?.focus();
  }

  // -------------------------
  // Command History
  // -------------------------

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (history.length === 0) return;

      if (historyIndex === -1) {
        historyIndex = history.length - 1;
      } else {
        historyIndex = Math.max(0, historyIndex - 1);
      }

      inputValue = history[historyIndex] ?? "";

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (historyIndex === -1) return;

      if (historyIndex < history.length - 1) {
        historyIndex++;
        inputValue = history[historyIndex] ?? "";
      } else {
        historyIndex = -1;
        inputValue = "";
      }
    }
  }
</script>

<div class="terminal" data-window-id={windowId}>
  <!-- Output -->
  <div class="terminal-output" bind:this={outputElement}>
    {#each entries as entry (entry.id)}
      {#if entry.prompt}
        <div class="terminal-command">
          {entry.prompt}
        </div>
      {/if}

      {#each entry.output as line, index (`${entry.id}-${index}`)}
        <div class="terminal-output-line">
          {line || "\u00a0"}
        </div>
      {/each}
    {/each}
  </div>

  <!-- Input -->
  <form class="terminal-input-line" onsubmit={handleSubmit}>
    <span class="terminal-prompt">
      {cwd}&gt;
    </span>

    <input
      bind:this={inputElement}
      bind:value={inputValue}
      onkeydown={handleKeyDown}
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck={false}
      aria-label="터미널 명령어 입력"
    />
  </form>
</div>
