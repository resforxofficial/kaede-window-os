<script lang="ts">
  import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";
  import { getMemberById } from "#lib/content/members.ts";

  import {
    searchContent,
    categoryLabels,
    type SearchDocument,
    type SearchCategory,
  } from "#lib/ts/trigle/trigle.ts";
  import "#lib/css/trigle.css";

  type View = "home" | "results" | "page";

  let {
    windowId,
    fileSystem,
    initialPath,
    onOpenFile,
  }: {
    windowId: string;
    fileSystem: VirtualFileSystem;
    initialPath?: string;
    onOpenFile?: (path: string) => void;
  } = $props();

  // 이 앱의 MVP에서는 VFS를 직접 사용하지 않음.
  // svelte-ignore state_referenced_locally
  void fileSystem;
  // svelte-ignore state_referenced_locally
  void initialPath;
  // svelte-ignore state_referenced_locally
  void onOpenFile;

  let view = $state<View>("home");
  let query = $state("");
  let submittedQuery = $state("");
  let results = $state<SearchDocument[]>([]);
  let activeCategory = $state<SearchCategory | "all">("all");
  let currentPage = $state<SearchDocument | null>(null);
  const currentMember = $derived(
    currentPage?.memberId
      ? (getMemberById(currentPage.memberId) ?? null)
      : null,
  );
  // svelte-ignore non_reactive_update
  let searchInput: HTMLInputElement | undefined;

  const visibleResults = $derived(
    activeCategory === "all"
      ? results
      : results.filter((item) => item.category === activeCategory),
  );
  const categories: {
    id: SearchCategory | "all";
    label: string;
  }[] = [
    { id: "all", label: "전체" },
    { id: "member", label: "멤버" },
    { id: "gallery", label: "갤러리" },
    { id: "music", label: "음악" },
    { id: "archive", label: "아카이브" },
  ];

  // -------------------------
  // Search
  // -------------------------

  function runSearch(event?: SubmitEvent, keyword?: string) {
    event?.preventDefault();

    const target = (keyword ?? query).trim();

    if (!target) {
      searchInput?.focus();
      return;
    }

    query = target;
    submittedQuery = target;

    results = searchContent(target);

    activeCategory = "all";
    currentPage = null;
    view = "results";
  }

  // -------------------------
  // Internal Pages
  // -------------------------

  function openPage(document: SearchDocument) {
    currentPage = document;
    view = "page";
  }

  function goBack() {
    if (view === "page") {
      currentPage = null;
      view = "results";
      return;
    }

    if (view === "results") {
      view = "home";
      query = "";
      return;
    }
  }

  function goHome() {
    view = "home";
    currentPage = null;
    query = "";
  }

  function getCategoryLabel(category: SearchCategory): string {
    return categoryLabels[category];
  }
</script>

<div class="trigle" data-window-id={windowId}>
  <!-- Home -->
  {#if view === "home"}
    <main class="trigle-home">
      <div class="trigle-home-content">
        <div class="trigle-logo">
          <span class="logo-blue">Tri</span><span class="logo-red">(</span><span
            class="logo-yellow">ples</span
          ><span class="logo-blue">)</span><span class="logo-green">gle</span>
        </div>

        <p class="trigle-subtitle">tripleS fan search engine</p>

        <form class="trigle-search-form" onsubmit={(event) => runSearch(event)}>
          <span class="search-icon">⌕</span>

          <input
            bind:this={searchInput}
            bind:value={query}
            placeholder="검색어를 입력하세요"
            aria-label="검색어"
            autocomplete="off"
            spellcheck={false}
          />

          {#if query}
            <button
              type="button"
              class="search-clear"
              aria-label="검색어 지우기"
              onclick={() => {
                query = "";
                searchInput?.focus();
              }}
            >
              ×
            </button>
          {/if}
        </form>

        <div class="trigle-search-buttons">
          <button type="button" onclick={() => runSearch(undefined)}>
            Tri(ples)gle 검색
          </button>

          <button type="button" onclick={() => runSearch(undefined, "프로필")}>
            프로필 둘러보기
          </button>
        </div>
        <div class="trigle-quick-links">
          <button onclick={() => runSearch(undefined, "멤버")}>
            전체 멤버
          </button>

          <button onclick={() => runSearch(undefined, "카에데")}>
            Kaede
          </button>

          <button onclick={() => runSearch(undefined, "사진")}> 갤러리 </button>

          <button onclick={() => runSearch(undefined, "음악")}> 음악 </button>
        </div>
      </div>

      <footer class="trigle-home-footer">
        Tri(ples)gle · tripleS Fan Portal
      </footer>
    </main>

    <!-- Search Results -->
  {:else if view === "results"}
    <div class="trigle-results-page">
      <header class="trigle-results-header">
        <button
          type="button"
          class="trigle-small-logo"
          onclick={goHome}
          aria-label="Tri(ples)gle 홈"
        >
          <span class="logo-blue">Tri</span><span class="logo-red">(</span><span
            class="logo-yellow">ples</span
          ><span class="logo-blue">)</span><span class="logo-green">gle</span>
        </button>

        <form
          class="trigle-search-form results-search"
          onsubmit={(event) => runSearch(event)}
        >
          <span class="search-icon">⌕</span>

          <input bind:value={query} aria-label="검색어" autocomplete="off" />

          <button type="submit" class="results-search-button"> 검색 </button>
        </form>
      </header>

      <nav class="trigle-category-nav">
        {#each categories as category}
          <button
            type="button"
            class:active={activeCategory === category.id}
            onclick={() => {
              activeCategory = category.id;
            }}
          >
            {category.label}
          </button>
        {/each}
      </nav>

      <main class="trigle-results-content">
        <div class="trigle-result-summary">
          '{submittedQuery}' 검색 결과
          <span>{visibleResults.length}개</span>
        </div>

        {#if visibleResults.length > 0}
          {#each visibleResults as item (item.id)}
            <article class="trigle-result-item">
              <div class="result-url">
                <span class="result-favicon">T</span>
                <span>{item.url}</span>
              </div>

              <button
                type="button"
                class="result-title"
                onclick={() => openPage(item)}
              >
                {item.title}
              </button>

              <p class="result-description">
                {item.description}
              </p>

              <span class="result-category">
                {getCategoryLabel(item.category)}
              </span>
            </article>
          {/each}
        {:else}
          <div class="trigle-no-results">
            <span>🔎</span>
            <strong>검색 결과가 없습니다.</strong>
            <p>다른 검색어를 입력해 보세요.</p>
          </div>
        {/if}
      </main>
    </div>

    <!-- Internal Page -->
  {:else if view === "page" && currentPage}
    <div class="trigle-internal-page">
      <header class="internal-browser-bar">
        <button type="button" onclick={goBack}> ← 뒤로 </button>

        <button type="button" onclick={goHome}> 홈 </button>

        <div class="internal-address">
          <span>🔒</span>
          {currentPage.url}
        </div>
      </header>

      <main class="internal-page-content">
        {#if currentMember}
          <div class="member-profile">
            <div class="member-number">
              S{currentMember.sNumber}
            </div>

            <h1>{currentMember.name}</h1>

            <p class="member-korean-name">
              {currentMember.koreanName}
            </p>

            <div class="member-profile-divider"></div>

            <div class="member-profile-info">
              <div>
                <span>Member Number</span>
                <strong>S{currentMember.sNumber}</strong>
              </div>

              <div>
                <span>English Name</span>
                <strong>{currentMember.name}</strong>
              </div>

              <div>
                <span>Korean Name</span>
                <strong>{currentMember.koreanName}</strong>
              </div>
            </div>

            <div class="member-content-placeholder">
              <span>✦</span>
              <strong>{currentMember.name} Archive</strong>
              <p>
                멤버의 사진, 활동 기록 및 상세 프로필이 이곳에 추가될
                예정입니다.
              </p>
            </div>
          </div>
        {:else}
          <div class="internal-page-category">
            {getCategoryLabel(currentPage.category)}
          </div>

          <h1>{currentPage.title}</h1>

          <p class="internal-page-description">
            {currentPage.description}
          </p>

          <div class="internal-page-placeholder">
            <span>✦</span>
            <strong>페이지의 콘텐츠를 준비하고 있습니다.</strong>
            <p>이곳에 관련 콘텐츠를 추가할 예정입니다.</p>
          </div>
        {/if}
      </main>
    </div>
  {/if}
</div>
