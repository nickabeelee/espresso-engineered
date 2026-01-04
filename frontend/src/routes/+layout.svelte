<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    authService,
    barista,
    isAuthenticated,
    isLoading,
    authStatus,
    authError,
  } from "$lib/auth";
  import { apiClient } from "$lib/api-client";
  import BaristaProfile from "$lib/components/BaristaProfile.svelte";
  import { UserCircle } from "$lib/icons";
  import logoInverted from "../assets/brand/espresso-engineered-logo-inverted.svg";

  // Pages that don't require authentication
  const publicPages = ["/auth", "/"];

  $: isPublicPage =
    publicPages.includes($page.url.pathname) &&
    !($page.url.pathname === "/" && $isAuthenticated);

  let isNavHidden = false;
  let lastScrollY = 0;
  let scrollTicking = false;
  const hideThreshold = 24;
  const revealDistance = 96;
  let scrollUpDistance = 0;
  let reflectionDraftCount = 0;
  let reflectionDraftDisplay = "";
  let isDraftCountLoading = false;

  onMount(() => {
    console.log("Layout: Initializing auth service...");
    authService.initialize().then(() => {
      console.log("Layout: Auth service initialized");
    });

    lastScrollY = window.scrollY;
    const onDocumentClick = (event: MouseEvent) => {
      if (!profileMenu?.open) {
        return;
      }

      if (event.target instanceof Node && profileMenu.contains(event.target)) {
        return;
      }

      profileMenu.open = false;
    };

    const onScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;

        if (currentY <= hideThreshold) {
          isNavHidden = false;
          scrollUpDistance = 0;
        } else if (delta > 6) {
          isNavHidden = true;
          scrollUpDistance = 0;
        } else if (delta < -6) {
          if (isNavHidden) {
            scrollUpDistance += Math.abs(delta);
            if (scrollUpDistance >= revealDistance) {
              isNavHidden = false;
              scrollUpDistance = 0;
            }
          } else {
            isNavHidden = false;
          }
        }

        lastScrollY = currentY;
        scrollTicking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onDocumentClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onDocumentClick);
    };
  });

  async function handleSignOut() {
    try {
      if (profileMenu) {
        profileMenu.open = false;
      }
      await authService.signOut();
      goto("/auth");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  }

  async function handleRetryProfile() {
    await authService.reloadProfile();
  }

  let profileMenu: HTMLDetailsElement | null = null;

  function closeProfileMenu() {
    if (profileMenu) {
      profileMenu.open = false;
    }
  }

  async function refreshDraftCount() {
    if (isDraftCountLoading) return;
    isDraftCountLoading = true;
    try {
      const response = await apiClient.getDraftBrews();
      reflectionDraftCount = response.count ?? response.data?.length ?? 0;
    } catch (error) {
      console.error("Failed to load reflection draft count:", error);
    } finally {
      isDraftCountLoading = false;
    }
  }

  $: reflectionDraftDisplay =
    reflectionDraftCount > 99 ? "99+" : `${reflectionDraftCount}`;
  $: if ($isAuthenticated && $barista && !isPublicPage) {
    void refreshDraftCount();
  }
</script>

<div class="app-shell">
  {#if !isPublicPage && $isAuthenticated && $barista}
    <div class="app-chrome">
      <header class="top-nav" class:hidden={isNavHidden}>
        <div class="top-nav-inner">
          <a href="/" class="logo">
            <img
              src={logoInverted}
              alt="Espresso Engineered"
              class="logo-mark"
            />
            <span class="logo-text">Espresso Engineered</span>
          </a>
          <nav class="top-nav-links">
            <a
              href="/brews"
              class:active={$page.url.pathname === "/brews" ||
                ($page.url.pathname.startsWith("/brews/") &&
                  !$page.url.pathname.startsWith("/brews/drafts"))}
            >
              Brews
            </a>
            <a
              href="/brews/drafts"
              class="reflection-link"
              class:active={$page.url.pathname === "/brews/drafts" ||
                $page.url.pathname.startsWith("/brews/drafts/")}
              aria-label={reflectionDraftCount > 0
                ? `Reflection (${reflectionDraftCount} drafts waiting)`
                : "Reflection"}
            >
              Reflection
              {#if reflectionDraftCount > 0}
                <span class="reflection-badge">{reflectionDraftDisplay}</span>
              {/if}
            </a>
            <a
              href="/beans"
              class:active={$page.url.pathname === "/beans" ||
                $page.url.pathname.startsWith("/beans/")}
            >
              Beans
            </a>
            <a
              href="/equipment"
              class:active={$page.url.pathname === "/equipment" ||
                $page.url.pathname.startsWith("/equipment/")}
            >
              Equipment
            </a>
          </nav>
          <div class="top-nav-actions">
            <details class="profile-menu" bind:this={profileMenu}>
              <summary
                class="profile-menu-trigger"
                aria-label="Open profile menu"
              >
                <span class="profile-menu-label">
                  <span class="profile-menu-name">
                    <BaristaProfile compact={true} minimal={true} />
                  </span>
                  <UserCircle size={18} />
                </span>
              </summary>
              <div class="profile-menu-panel">
                <a href="/profile" on:click={closeProfileMenu}>Profile</a>
                <button on:click={handleSignOut} class="profile-menu-action">
                  Sign Out
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main class="page-main">
        {#if $authStatus === "profile_missing"}
          <div class="page-frame">
            <div class="page-surface loading-screen">
              <p>We couldn't find your barista profile.</p>
              <div class="auth-actions">
                <button on:click={handleRetryProfile} class="btn-primary"
                  >Retry</button
                >
                <button on:click={handleSignOut} class="btn-secondary"
                  >Sign Out</button
                >
              </div>
            </div>
          </div>
        {:else if $authStatus === "error"}
          <div class="page-frame">
            <div class="page-surface loading-screen">
              <p>{$authError || "Authentication failed. Please try again."}</p>
              <div class="auth-actions">
                <button on:click={handleRetryProfile} class="btn-primary"
                  >Retry</button
                >
                <button on:click={handleSignOut} class="btn-secondary"
                  >Sign Out</button
                >
              </div>
            </div>
          </div>
        {:else if $isLoading}
          <div class="page-frame">
            <div class="page-surface loading-screen">
              <div class="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        {:else}
          <div class="page-frame">
            <div class="page-surface">
              <slot />
            </div>
          </div>
        {/if}
      </main>
    </div>
  {:else}
    <main>
      <div class="page-frame public-frame">
        <div class="page-surface">
          <slot />
        </div>
      </div>
    </main>
  {/if}
</div>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--text-ink-inverted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
  }

  .logo-mark {
    width: auto;
    height: 28px;
    display: block;
  }

  .logo:hover {
    color: var(--text-ink-inverted-muted);
  }

  .profile-menu-label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  @media (max-width: 640px) {
    .profile-menu-name {
      display: none;
    }
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40vh;
    gap: 1rem;
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(214, 199, 174, 0.2);
    border-top: 4px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    /* Isolate the transform to prevent affecting siblings */
    will-change: transform;
    transform-origin: center;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-screen p {
    color: var(--text-ink-secondary);
    font-size: 1rem;
  }

  .auth-actions {
    display: flex;
    gap: 0.75rem;
  }

  @media (max-width: 900px) {
    .logo {
      letter-spacing: 0.06em;
    }
  }

  .reflection-link {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .reflection-badge {
    position: absolute;
    top: -0.45rem;
    right: -0.9rem;
    min-width: 1.1rem;
    height: 1.1rem;
    padding: 0 0.3rem;
    border-radius: 999px;
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border: 1px solid var(--accent-primary-dark);
    font-size: 0.65rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(43, 33, 24, 0.2);
  }
</style>
