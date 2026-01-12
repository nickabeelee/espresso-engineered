<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewForm from '$lib/components/BrewForm.svelte';
  import BrewReflectionForm from '$lib/components/BrewReflectionForm.svelte';
  import Chip from '$lib/components/Chip.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import { ChevronDown, PencilSquare, Trash, XMark } from '$lib/icons';
  import { getTransformedImageUrl } from '$lib/utils/image-utils';
  import { imageFrame, imageSizes } from '$lib/ui/components/image';
  import { alertBase, alertSizes, alertVariants } from '$lib/ui/components/alert';
  import { cardVariants, detailGrid, equipmentCard, recordCard, sectionSurface } from '$lib/ui/components/card';
  import { colorCss } from '$lib/ui/foundations/color';
  import { motion } from '$lib/ui/foundations/motion';
  import { gap, spacing } from '$lib/ui/foundations/spacing';
  import { textStyles } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';

  
  let brew = null;
  let loading = true;
  let error = null;
  let editing = false;
  let reflectionMode = false;
  let canEdit = false;
  let deleting = false;
  let equipmentLoading = false;

  let machine: Machine | null = null;
  let grinder: Grinder | null = null;
  let bag: Bag | null = null;
  let bean: Bean | null = null;
  let roaster: Roaster | null = null;
  let bagOwnerName = 'Unknown';
  let guestShareUrl: string | null = null;
  let guestShareError: string | null = null;
  let guestRequestLoading = false;
  let nowTimestamp = Date.now();
  let guestLockActive = false;
  let guestState: 'none' | 'draft' | 'editing' | 'locked' = 'none';
  let guestStatusLabel: string | null = null;
  let guestStatusVariant: 'neutral' | 'warning' | 'success' = 'neutral';
  let guestCountdown: string | null = null;
  let guestShareQrUrl: string | null = null;
  let guestLockMessage = 'Locked while guest completes reflection';
  const detailStyle = toStyleString({
    '--page-gap': spacing["2xl"],
    '--header-gap': spacing.xl,
    '--page-title-color': colorCss.text.ink.primary,
    '--page-title-size': textStyles.headingPrimary.fontSize,
    '--page-title-family': textStyles.headingPrimary.fontFamily,
    '--page-title-weight': textStyles.headingPrimary.fontWeight,
    '--page-title-line-height': textStyles.headingPrimary.lineHeight,
    '--page-title-margin-top': spacing.sm,
    '--actions-gap': spacing.sm,
    '--link-color': colorCss.accent.primary,
    '--link-font-family': textStyles.helper.fontFamily,
    '--link-font-size': textStyles.helper.fontSize,
    '--link-font-weight': textStyles.helper.fontWeight,
    '--state-padding': spacing["2xl"],
    '--state-color': colorCss.text.ink.muted,
    '--state-font-family': textStyles.helper.fontFamily,
    '--state-font-size': textStyles.helper.fontSize,
    '--error-color': colorCss.semantic.error,
    '--detail-section-padding': sectionSurface.padding,
    '--detail-section-bg': sectionSurface.background,
    '--detail-section-border': sectionSurface.borderColor,
    '--detail-section-border-width': sectionSurface.borderWidth,
    '--detail-section-border-style': sectionSurface.borderStyle,
    '--detail-section-radius': sectionSurface.borderRadius,
    '--detail-section-gap': spacing.xl,
    '--detail-title-color': colorCss.text.ink.secondary,
    '--detail-title-size': textStyles.headingTertiary.fontSize,
    '--detail-title-family': textStyles.headingTertiary.fontFamily,
    '--detail-title-weight': textStyles.headingTertiary.fontWeight,
    '--detail-title-line-height': textStyles.headingTertiary.lineHeight,
    '--detail-title-margin': spacing.lg,
    '--detail-grid-min': detailGrid.minColumnWidth,
    '--detail-grid-gap': detailGrid.gap,
    '--metric-card-bg': recordCard.container.background,
    '--metric-card-border': recordCard.container.borderColor,
    '--metric-card-border-width': recordCard.container.borderWidth,
    '--metric-card-border-style': recordCard.container.borderStyle,
    '--metric-card-radius': recordCard.container.borderRadius,
    '--metric-card-gap': spacing.sm,
    '--metric-card-padding-y': spacing.md,
    '--metric-card-padding-x': spacing.lg,
    '--metric-label-size': textStyles.label.fontSize,
    '--metric-label-family': textStyles.label.fontFamily,
    '--metric-label-weight': textStyles.label.fontWeight,
    '--metric-label-line-height': textStyles.label.lineHeight,
    '--metric-label-color': colorCss.text.ink.muted,
    '--metric-value-size': textStyles.headingQuaternary.fontSize,
    '--metric-value-family': textStyles.headingQuaternary.fontFamily,
    '--metric-value-weight': textStyles.headingQuaternary.fontWeight,
    '--metric-value-line-height': textStyles.headingQuaternary.lineHeight,
    '--metric-value-color': colorCss.text.ink.primary,
    '--metric-empty-size': textStyles.helper.fontSize,
    '--metric-empty-family': textStyles.helper.fontFamily,
    '--metric-empty-line-height': textStyles.helper.lineHeight,
    '--metric-empty-color': colorCss.text.ink.muted,
    '--reflection-grid-gap': gap.lg,
    '--reflection-field-gap': spacing.sm,
    '--reflection-label-size': textStyles.label.fontSize,
    '--reflection-label-family': textStyles.label.fontFamily,
    '--reflection-label-weight': textStyles.label.fontWeight,
    '--reflection-label-line-height': textStyles.label.lineHeight,
    '--reflection-label-color': colorCss.text.ink.muted,
    '--reflection-rating-size': textStyles.headingSecondary.fontSize,
    '--reflection-rating-family': textStyles.headingSecondary.fontFamily,
    '--reflection-rating-weight': textStyles.headingSecondary.fontWeight,
    '--reflection-rating-line-height': textStyles.headingSecondary.lineHeight,
    '--reflection-rating-color': colorCss.text.ink.primary,
    '--reflection-rating-gap': spacing.xs,
    '--reflection-denominator-size': textStyles.helper.fontSize,
    '--reflection-denominator-family': textStyles.helper.fontFamily,
    '--reflection-denominator-line-height': textStyles.helper.lineHeight,
    '--reflection-denominator-color': colorCss.text.ink.secondary,
    '--reflection-body-bg': recordCard.container.background,
    '--reflection-body-border': recordCard.container.borderColor,
    '--reflection-body-border-width': recordCard.container.borderWidth,
    '--reflection-body-border-style': recordCard.container.borderStyle,
    '--reflection-body-radius': recordCard.container.borderRadius,
    '--reflection-body-padding-y': spacing.md,
    '--reflection-body-padding-x': spacing.lg,
    '--reflection-body-color': colorCss.text.ink.secondary,
    '--reflection-body-line-height': textStyles.body.lineHeight,
    '--reflection-body-family': textStyles.body.fontFamily,
    '--reflection-body-size': textStyles.body.fontSize,
    '--reflection-empty-bg': cardVariants.empty.background,
    '--reflection-empty-border': cardVariants.empty.borderColor,
    '--reflection-empty-border-style': cardVariants.empty.borderStyle,
    '--reflection-empty-border-width': recordCard.container.borderWidth,
    '--reflection-empty-radius': recordCard.container.borderRadius,
    '--reflection-empty-padding-y': spacing.md,
    '--reflection-empty-padding-x': spacing.lg,
    '--reflection-empty-color': colorCss.text.ink.muted,
    '--reflection-empty-size': textStyles.helper.fontSize,
    '--reflection-empty-family': textStyles.helper.fontFamily,
    '--reflection-empty-line-height': textStyles.helper.lineHeight,
    '--incomplete-bg': alertVariants.warning.background,
    '--incomplete-border': alertVariants.warning.borderColor,
    '--incomplete-border-width': alertBase.borderWidth,
    '--incomplete-border-style': recordCard.container.borderStyle,
    '--incomplete-radius': alertBase.borderRadius,
    '--incomplete-padding': alertSizes.lg.padding,
    '--incomplete-margin-top': spacing["2xl"],
    '--incomplete-color': alertVariants.warning.textColor,
    '--incomplete-font-family': alertBase.fontFamily,
    '--incomplete-font-size': alertSizes.lg.fontSize,
  });

  const equipmentStyle = toStyleString({
    '--equipment-grid-min': equipmentCard.grid.minColumnWidth,
    '--equipment-grid-gap': equipmentCard.grid.gap,
    '--equipment-card-gap': equipmentCard.layout.cardGap,
    '--equipment-card-bg': recordCard.container.background,
    '--equipment-card-border': recordCard.container.borderColor,
    '--equipment-card-border-width': recordCard.container.borderWidth,
    '--equipment-card-border-style': recordCard.container.borderStyle,
    '--equipment-card-radius': recordCard.container.borderRadius,
    '--equipment-card-padding': recordCard.container.padding,
    '--equipment-card-hover-shadow': recordCard.container.hover.shadow,
    '--equipment-card-hover-border': recordCard.container.hover.borderColor,
    '--equipment-card-focus-width': recordCard.container.focusRing.width,
    '--equipment-card-focus-color': recordCard.container.focusRing.color,
    '--equipment-card-focus-offset': recordCard.container.focusRing.offset,
    '--equipment-card-transition': `box-shadow ${motion.duration.fast} ${motion.easing.standard}, border-color ${motion.duration.fast} ${motion.easing.standard}`,
    '--equipment-card-main-gap': spacing.xs,
    '--equipment-title-margin': spacing.xs,
    '--equipment-loading-padding': spacing.md,
    '--equipment-title-size': textStyles.headingQuaternary.fontSize,
    '--equipment-title-weight': textStyles.headingQuaternary.fontWeight,
    '--equipment-title-family': textStyles.headingQuaternary.fontFamily,
    '--equipment-title-line-height': textStyles.headingQuaternary.lineHeight,
    '--equipment-title-color': colorCss.text.ink.primary,
    '--equipment-title-gap': spacing.none,
    '--equipment-meta-size': textStyles.helper.fontSize,
    '--equipment-meta-family': textStyles.helper.fontFamily,
    '--equipment-meta-weight': textStyles.helper.fontWeight,
    '--equipment-meta-line-height': textStyles.helper.lineHeight,
    '--equipment-meta-color': colorCss.text.ink.muted,
    '--equipment-meta-margin-top': spacing.none,
    '--equipment-title-row-margin': spacing.sm,
    '--equipment-label-size': textStyles.label.fontSize,
    '--equipment-label-family': textStyles.label.fontFamily,
    '--equipment-label-weight': textStyles.label.fontWeight,
    '--equipment-label-line-height': textStyles.label.lineHeight,
    '--equipment-label-color': colorCss.text.ink.muted,
    '--equipment-content-gap': spacing.lg,
    '--equipment-details-gap': spacing.sm,
    '--equipment-detail-gap': spacing.xs,
    '--equipment-detail-value-size': textStyles.helper.fontSize,
    '--equipment-detail-value-family': textStyles.helper.fontFamily,
    '--equipment-detail-value-line-height': textStyles.helper.lineHeight,
    '--equipment-detail-value-color': colorCss.text.ink.secondary,
    '--equipment-image-width': `${imageSizes.thumbnail.width}px`,
    '--equipment-image-height': `${imageSizes.thumbnail.height}px`,
    '--equipment-image-radius': imageFrame.borderRadius,
    '--equipment-image-bg': imageFrame.background,
    '--equipment-image-border': imageFrame.borderColor,
    '--equipment-image-border-width': imageFrame.borderWidth,
    '--equipment-image-border-style': imageFrame.borderStyle,
    '--equipment-image-placeholder-bg': imageFrame.placeholder.background,
    '--equipment-image-placeholder-border-style': imageFrame.placeholder.borderStyle,
    '--equipment-loading-color': colorCss.text.ink.muted,
    '--equipment-loading-family': textStyles.helper.fontFamily,
    '--equipment-loading-size': textStyles.helper.fontSize,
  });

  $: brewId = $page.params.id;
  $: reflectionMode = $page.url.searchParams.get('reflect') === 'true';
  $: if (reflectionMode) {
    editing = false;
  }

  onMount(async () => {
    const timer = window.setInterval(() => {
      nowTimestamp = Date.now();
    }, 1000);
    if (brewId) {
      await loadBrew(brewId);
    }
    return () => window.clearInterval(timer);
  });

  async function loadBrew(id: string) {
    loading = true;
    error = null;
    
    try {
      const response = await apiClient.getBrew(id);
      if (response.data) {
        brew = response.data;
        guestShareUrl = null;
        guestShareError = null;
        
        // Check if current user can edit this brew
        const currentBarista = $barista;
        canEdit = currentBarista?.id === brew.barista_id || Boolean(currentBarista?.is_admin);
        await loadEquipmentDetails(brew);
      } else {
        throw new Error('Brew not found');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load brew';
    } finally {
      loading = false;
    }
  }

  async function loadEquipmentDetails(currentBrew: Brew) {
    equipmentLoading = true;

    try {
      const [
        machinesResponse,
        grindersResponse,
        bagResponse,
        beansResponse,
        roastersResponse,
        baristasResponse
      ] = await Promise.all([
        apiClient.getMachines(),
        apiClient.getGrinders(),
        apiClient.getBag(currentBrew.bag_id),
        apiClient.getBeans(),
        apiClient.getRoasters(),
        apiClient.getBaristas()
      ]);

      machine = machinesResponse.data.find((item) => item.id === currentBrew.machine_id) || null;
      grinder = grindersResponse.data.find((item) => item.id === currentBrew.grinder_id) || null;
      bag = bagResponse.data || null;
      bean = bag ? beansResponse.data.find((item) => item.id === bag.bean_id) || null : null;
      roaster = bean ? roastersResponse.data.find((item) => item.id === bean.roaster_id) || null : null;
      if (bag) {
        const owner = baristasResponse.data.find((entry) => entry.id === bag.owner_id);
        bagOwnerName = owner?.display_name || owner?.username || 'Unknown';
      } else {
        bagOwnerName = 'Unknown';
      }
    } catch (err) {
      machine = null;
      grinder = null;
      bag = null;
      bean = null;
      roaster = null;
      bagOwnerName = 'Unknown';
    } finally {
      equipmentLoading = false;
    }
  }

  function toggleEdit() {
    if (reflectionMode) return;
    editing = !editing;
    error = null; // Clear any previous errors when toggling edit mode
  }

  async function handleSave(event: CustomEvent<CreateBrewRequest>) {
    if (!brew) return;
    
    const brewData = event.detail;
    loading = true;
    error = null;

    try {
      const response = await apiClient.updateBrew(brew.id, brewData);
      if (response.data) {
        brew = response.data;
        await loadEquipmentDetails(brew);
        editing = false;
      } else {
        throw new Error('Failed to update brew');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save changes';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    editing = false;
    error = null;
  }

  async function handleReflectionSave(event: CustomEvent<Partial<UpdateBrewRequest>>) {
    if (!brew) return;

    const brewData = event.detail;
    loading = true;
    error = null;

    try {
      const response = await apiClient.updateBrew(brew.id, brewData);
      if (response.data) {
        brew = response.data;
        await loadEquipmentDetails(brew);
        await goto(`/brews/${brew.id}`);
      } else {
        throw new Error('Failed to update brew');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save changes';
    } finally {
      loading = false;
    }
  }

  function handleReflectionCancel() {
    if (brew) {
      goto(`/brews/${brew.id}`);
    }
  }

  function openReflection() {
    if (brew) {
      goto(`/brews/${brew.id}?reflect=true`);
    }
  }

  async function handleDelete() {
    if (!brew || deleting) return;
    
    const confirmMessage = `Are you sure you want to delete "${brew.name || 'this brew'}"? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    deleting = true;
    error = null;
    
    try {
      await apiClient.deleteBrew(brew.id);
      goto('/brews');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete brew';
      deleting = false;
    }
  }

  function formatEquipmentName(item: Machine | Grinder): string {
    const parts = [item.manufacturer, item.model].filter(Boolean);
    return parts.join(' ');
  }

  function formatEquipmentModel(item: Machine | Grinder): string {
    const model = item.model?.trim();
    return model ? model : 'Unknown Model';
  }

  function formatEquipmentManufacturer(item: Machine | Grinder): string {
    const manufacturer = item.manufacturer?.trim();
    return `by ${manufacturer ? manufacturer : 'Unknown'}`;
  }

  function formatRoasterMeta(roasterRecord: Roaster | null): string {
    const name = roasterRecord?.name?.trim();
    return `by ${name ? name : 'Unknown'}`;
  }

  function formatBagTitle(bag: Bag | null, bean: Bean | null): string {
    if (bag?.name && bag.name.trim()) {
      return bag.name;
    }
    if (bean?.name) {
      return bean.name;
    }
    return 'Unknown Bag';
  }

  function handleClose() {
    goto('/');
  }

  function handleBagCardClick() {
    if (!bean) return;
    goto(`/beans/${bean.id}`);
  }

  function handleBagCardKeydown(event: KeyboardEvent) {
    if (!bean) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goto(`/beans/${bean.id}`);
    }
  }

  function getGuestState(currentBrew: Brew | null): 'none' | 'draft' | 'editing' | 'locked' {
    if (!currentBrew?.guest_token_hash) {
      return 'none';
    }
    if (!currentBrew.guest_submitted_at) {
      return 'draft';
    }
    if (currentBrew.guest_edit_expires_at) {
      const expiresAt = new Date(currentBrew.guest_edit_expires_at).getTime();
      if (nowTimestamp < expiresAt) {
        return 'editing';
      }
    }
    return 'locked';
  }

  function formatCountdown(expiresAt: string): string {
    const diffMs = Math.max(0, new Date(expiresAt).getTime() - nowTimestamp);
    const totalSeconds = Math.ceil(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }

  async function handleRequestGuestReflection() {
    if (!brew || guestRequestLoading) return;
    guestRequestLoading = true;
    guestShareError = null;

    try {
      const response = await apiClient.requestGuestReflectionToken(brew.id);
      const token = response.data?.token;
      if (!token) {
        throw new Error('Guest reflection link could not be created');
      }

      guestShareUrl = `${window.location.origin}/guest/${token}`;
      await loadBrew(brew.id);
    } catch (err) {
      guestShareError = err instanceof Error ? err.message : 'Failed to create guest reflection link';
    } finally {
      guestRequestLoading = false;
    }
  }

  $: guestState = getGuestState(brew);
  $: guestLockActive = guestState === 'editing';
  $: guestStatusLabel = guestState === 'draft'
    ? 'Guest draft'
    : guestState === 'editing'
      ? 'Guest editing'
      : guestState === 'locked'
        ? 'Guest finalized'
        : null;
  $: guestStatusVariant = guestState === 'editing'
    ? 'warning'
    : guestState === 'locked'
      ? 'success'
      : 'neutral';
  $: guestCountdown = guestState === 'editing' && brew?.guest_edit_expires_at
    ? formatCountdown(brew.guest_edit_expires_at)
    : null;
  $: guestShareQrUrl = guestShareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(guestShareUrl)}`
    : null;
</script>

<svelte:head>
  <title>{brew?.name || 'Brew'} - Espresso Engineered</title>
  <meta name="description" content="View and edit espresso brew details" />
</svelte:head>

<AuthGuard>
    <div class="brew-detail-page" style={detailStyle}>
    <header>
      <div>
        <h1>{brew?.name || 'Untitled Brew'}</h1>
      </div>
      
      <div class="actions">
        {#if !editing && !reflectionMode}
          <IconButton on:click={handleClose} ariaLabel="Back to brews" title="Close" variant="neutral" disabled={loading}>
            <XMark />
          </IconButton>
        {/if}
        {#if reflectionMode && brew}
          <IconButton on:click={handleReflectionCancel} ariaLabel="Close reflection view" title="Close reflection" variant="neutral" disabled={loading}>
            <XMark />
          </IconButton>
        {/if}
        {#if canEdit && brew && !reflectionMode}
          {#if editing}
            <IconButton on:click={toggleEdit} ariaLabel="Cancel editing" title="Cancel" variant="neutral" disabled={loading}>
              <XMark />
            </IconButton>
          {:else}
            <IconButton on:click={toggleEdit} ariaLabel="Edit brew" variant="accent" disabled={loading}>
              <PencilSquare />
            </IconButton>
          {/if}
          <IconButton
            on:click={handleDelete}
            ariaLabel={deleting ? 'Deleting brew' : 'Delete brew'}
            title={deleting ? 'Deleting...' : 'Delete'}
            variant="danger"
            disabled={loading || deleting}
          >
            <Trash />
          </IconButton>
        {/if}
      </div>
    </header>

  {#if loading}
    <div class="loading">Loading brew...</div>
  {:else if error}
    <div class="error">Error: {error}</div>
  {:else if brew}
    <!-- TypeScript workaround: create local variable with proper type -->
    {@const currentBrew = brew}
    <div class="brew-content">
      {#if reflectionMode}
        <div class="brew-details reflection-details">
          <div class="detail-section">
            <div class="guest-reflection-toolbar">
              {#if guestStatusLabel}
                <div class="guest-reflection-status">
                  <Chip variant={guestStatusVariant} size="sm">{guestStatusLabel}</Chip>
                  {#if guestCountdown}
                    <span class="guest-reflection-meta">Guest edit window ends in {guestCountdown}</span>
                  {:else if guestState === 'locked' && brew?.guest_edit_expires_at}
                    <span class="guest-reflection-meta">
                      Guest reflection finalized at {new Date(brew.guest_edit_expires_at).toLocaleTimeString()}
                    </span>
                  {/if}
                </div>
              {/if}
              {#if canEdit && guestState !== 'locked'}
                <button
                  class="btn-primary"
                  type="button"
                  on:click={handleRequestGuestReflection}
                  disabled={guestRequestLoading}
                >
                  {guestRequestLoading ? 'Preparing guest link...' : 'Request Guest Reflection'}
                </button>
              {/if}
            </div>
            {#if guestShareError}
              <div class="guest-reflection-error">{guestShareError}</div>
            {/if}
            {#if guestShareUrl}
              <div class="guest-share-card">
                <div class="guest-share-details">
                  <span class="guest-share-label">Share link</span>
                  <div class="guest-share-link">{guestShareUrl}</div>
                </div>
                {#if guestShareQrUrl}
                  <div class="guest-share-qr">
                    <img src={guestShareQrUrl} alt="Guest reflection QR code" />
                  </div>
                {/if}
              </div>
            {/if}
            <BrewReflectionForm
              {brew}
              beanTastingNotes={bean?.tasting_notes ?? null}
              reflectionLocked={guestLockActive}
              lockMessage={guestLockMessage}
              on:save={handleReflectionSave}
              on:cancel={handleReflectionCancel}
            />
          </div>
          <details class="reference-section">
            <summary>
              <span class="reference-toggle">
                <span class="reference-icon" aria-hidden="true">
                  <ChevronDown size={18} />
                </span>
                <span>Reference details</span>
              </span>
              <span class="reference-divider" aria-hidden="true"></span>
            </summary>
            <div class="detail-section">
              <h3>Equipment</h3>
              {#if equipmentLoading}
                <div class="loading equipment-loading">Loading equipment details...</div>
              {:else}
                <div class="equipment-grid" style={equipmentStyle}>
                  <article class="equipment-card">
                    <div class="equipment-card-main">
                      <div class="equipment-label-row">
                        <p class="equipment-label">Machine</p>
                      </div>
                      <div class="equipment-title-row">
                        <h4>{machine ? formatEquipmentModel(machine) : 'Unknown Machine'}</h4>
                        <p class="equipment-meta">{machine ? formatEquipmentManufacturer(machine) : 'by Unknown'}</p>
                      </div>
                      <div class="equipment-content-row">
                        {#if machine?.image_path}
                          <div class="equipment-image">
                            <img
                              src={getTransformedImageUrl(machine.image_path, 'machine', imageSizes.thumbnail)}
                              alt={formatEquipmentName(machine)}
                              loading="lazy"
                              on:error={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                        {:else}
                          <div class="equipment-image equipment-image--placeholder" aria-hidden="true"></div>
                        {/if}
                      </div>
                    </div>
                  </article>

                  <article class="equipment-card">
                    <div class="equipment-card-main">
                      <div class="equipment-label-row">
                        <p class="equipment-label">Grinder</p>
                      </div>
                      <div class="equipment-title-row">
                        <h4>{grinder ? formatEquipmentModel(grinder) : 'Unknown Grinder'}</h4>
                        <p class="equipment-meta">{grinder ? formatEquipmentManufacturer(grinder) : 'by Unknown'}</p>
                      </div>
                      <div class="equipment-content-row">
                        {#if grinder?.image_path}
                          <div class="equipment-image">
                            <img
                              src={getTransformedImageUrl(grinder.image_path, 'grinder', imageSizes.thumbnail)}
                              alt={formatEquipmentName(grinder)}
                              loading="lazy"
                              on:error={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                        {:else}
                          <div class="equipment-image equipment-image--placeholder" aria-hidden="true"></div>
                        {/if}
                      </div>
                    </div>
                  </article>

                  <article
                    class="equipment-card bag-card bag-card--wide"
                    class:bag-card--clickable={Boolean(bean)}
                    role={bean ? 'link' : undefined}
                    tabindex={bean ? 0 : -1}
                    aria-label={bean ? `View ${formatBagTitle(bag, bean)}` : undefined}
                    on:click={handleBagCardClick}
                    on:keydown={handleBagCardKeydown}
                  >
                    <div class="equipment-card-main">
                      <div class="equipment-label-row">
                        <p class="equipment-label">Coffee Bag</p>
                      </div>
                      <div class="equipment-title-row">
                        <h4>{bean?.name || formatBagTitle(bag, bean)}</h4>
                        <p class="equipment-meta">{formatRoasterMeta(roaster)}</p>
                      </div>
                      <div class="equipment-content-row equipment-content-row--split">
                        <div class="equipment-details">
                          <div class="equipment-detail">
                            <span class="equipment-detail-value">{bagOwnerName}'s bag</span>
                          </div>
                          <div class="equipment-detail">
                            <span class="equipment-detail-value">
                              Roasted on {bag?.roast_date ? new Date(bag.roast_date).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                          <div class="equipment-detail">
                            {#if bean?.roast_level}
                              <RoastLevel value={bean.roast_level} size="small" />
                            {:else}
                              <span class="equipment-detail-value">Unknown</span>
                            {/if}
                          </div>
                        </div>
                        {#if bean?.image_path}
                          <div class="equipment-image">
                            <img
                              src={getTransformedImageUrl(bean.image_path, 'bean', imageSizes.thumbnail)}
                              alt={bean?.name || formatBagTitle(bag, bean)}
                              loading="lazy"
                              on:error={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                        {:else}
                          <div class="equipment-image equipment-image--placeholder" aria-hidden="true"></div>
                        {/if}
                      </div>
                    </div>
                  </article>
                </div>
              {/if}
            </div>

            <div class="detail-section">
              <h3>Input Parameters</h3>
              <div class="metric-grid">
                <div class="metric-card">
                  <span class="metric-label">Dose</span>
                  <div class="metric-value">{currentBrew.dose_g}g</div>
                </div>
                <div class="metric-card">
                  <span class="metric-label">Grind Setting</span>
                  {#if currentBrew.grind_setting}
                    <div class="metric-value">{currentBrew.grind_setting}</div>
                  {:else}
                    <div class="metric-empty">Not recorded yet</div>
                  {/if}
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Output Measurements</h3>
              <div class="metric-grid">
                <div class="metric-card">
                  <span class="metric-label">Yield</span>
                  {#if currentBrew.yield_g}
                    <div class="metric-value">{currentBrew.yield_g}g</div>
                  {:else}
                    <div class="metric-empty">Not recorded yet</div>
                  {/if}
                </div>
                <div class="metric-card">
                  <span class="metric-label">Brew Time</span>
                  {#if currentBrew.brew_time_s}
                    <div class="metric-value">{currentBrew.brew_time_s.toFixed(1)}s</div>
                  {:else}
                    <div class="metric-empty">Not recorded yet</div>
                  {/if}
                </div>
                <div class="metric-card">
                  <span class="metric-label">Ratio</span>
                  {#if currentBrew.ratio}
                    <div class="metric-value">1:{currentBrew.ratio.toFixed(2)}</div>
                  {:else}
                    <div class="metric-empty">Not recorded yet</div>
                  {/if}
                </div>
                <div class="metric-card">
                  <span class="metric-label">Flow Rate</span>
                  {#if currentBrew.flow_rate_g_per_s}
                    <div class="metric-value">{currentBrew.flow_rate_g_per_s.toFixed(1)} g/s</div>
                  {:else}
                    <div class="metric-empty">Not recorded yet</div>
                  {/if}
                </div>
              </div>
            </div>
          </details>
        </div>
      {:else if editing}
        <BrewForm
          {brew}
          reflectionLocked={guestLockActive}
          lockMessage={guestLockMessage}
          on:save={handleSave}
          on:cancel={handleCancel}
        />
      {:else}
        <div class="brew-details">
          <div class="detail-section">
            <h3>Equipment</h3>
            {#if equipmentLoading}
              <div class="loading equipment-loading">Loading equipment details...</div>
            {:else}
              <div class="equipment-grid" style={equipmentStyle}>
                <article class="equipment-card">
                  <div class="equipment-card-main">
                    <div class="equipment-label-row">
                      <p class="equipment-label">Machine</p>
                    </div>
                    <div class="equipment-title-row">
                      <h4>{machine ? formatEquipmentModel(machine) : 'Unknown Machine'}</h4>
                      <p class="equipment-meta">{machine ? formatEquipmentManufacturer(machine) : 'by Unknown'}</p>
                    </div>
                    <div class="equipment-content-row">
                      {#if machine?.image_path}
                        <div class="equipment-image">
                          <img
                            src={getTransformedImageUrl(machine.image_path, 'machine', imageSizes.thumbnail)}
                            alt={formatEquipmentName(machine)}
                            loading="lazy"
                            on:error={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      {:else}
                        <div class="equipment-image equipment-image--placeholder" aria-hidden="true"></div>
                      {/if}
                    </div>
                  </div>
                </article>

                <article class="equipment-card">
                  <div class="equipment-card-main">
                    <div class="equipment-label-row">
                      <p class="equipment-label">Grinder</p>
                    </div>
                    <div class="equipment-title-row">
                      <h4>{grinder ? formatEquipmentModel(grinder) : 'Unknown Grinder'}</h4>
                      <p class="equipment-meta">{grinder ? formatEquipmentManufacturer(grinder) : 'by Unknown'}</p>
                    </div>
                    <div class="equipment-content-row">
                      {#if grinder?.image_path}
                        <div class="equipment-image">
                          <img
                            src={getTransformedImageUrl(grinder.image_path, 'grinder', imageSizes.thumbnail)}
                            alt={formatEquipmentName(grinder)}
                            loading="lazy"
                            on:error={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      {:else}
                        <div class="equipment-image equipment-image--placeholder" aria-hidden="true"></div>
                      {/if}
                    </div>
                  </div>
                </article>

                <article
                  class="equipment-card bag-card bag-card--wide"
                  class:bag-card--clickable={Boolean(bean)}
                  role={bean ? 'link' : undefined}
                  tabindex={bean ? 0 : -1}
                  aria-label={bean ? `View ${formatBagTitle(bag, bean)}` : undefined}
                  on:click={handleBagCardClick}
                  on:keydown={handleBagCardKeydown}
                >
                  <div class="equipment-card-main">
                    <div class="equipment-label-row">
                      <p class="equipment-label">Coffee Bag</p>
                    </div>
                    <div class="equipment-title-row">
                      <h4>{bean?.name || formatBagTitle(bag, bean)}</h4>
                      <p class="equipment-meta">{formatRoasterMeta(roaster)}</p>
                    </div>
                    <div class="equipment-content-row equipment-content-row--split">
                      <div class="equipment-details">
                        <div class="equipment-detail">
                          <span class="equipment-detail-value">{bagOwnerName}'s bag</span>
                        </div>
                        <div class="equipment-detail">
                          <span class="equipment-detail-value">
                            Roasted on {bag?.roast_date ? new Date(bag.roast_date).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        <div class="equipment-detail">
                          {#if bean?.roast_level}
                            <RoastLevel value={bean.roast_level} size="small" />
                          {:else}
                            <span class="equipment-detail-value">Unknown</span>
                          {/if}
                        </div>
                      </div>
                      {#if bean?.image_path}
                        <div class="equipment-image">
                          <img
                            src={getTransformedImageUrl(bean.image_path, 'bean', imageSizes.thumbnail)}
                            alt={bean?.name || formatBagTitle(bag, bean)}
                            loading="lazy"
                            on:error={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      {:else}
                        <div class="equipment-image equipment-image--placeholder" aria-hidden="true"></div>
                      {/if}
                    </div>
                  </div>
                </article>
              </div>
            {/if}
          </div>

          <div class="detail-section">
            <h3>Input Parameters</h3>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">Dose</span>
                <div class="metric-value">{currentBrew.dose_g}g</div>
              </div>
              <div class="metric-card">
                <span class="metric-label">Grind Setting</span>
                {#if currentBrew.grind_setting}
                  <div class="metric-value">{currentBrew.grind_setting}</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Output Measurements</h3>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">Yield</span>
                {#if currentBrew.yield_g}
                  <div class="metric-value">{currentBrew.yield_g}g</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="metric-card">
                <span class="metric-label">Brew Time</span>
                {#if currentBrew.brew_time_s}
                  <div class="metric-value">{currentBrew.brew_time_s.toFixed(1)}s</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="metric-card">
                <span class="metric-label">Ratio</span>
                {#if currentBrew.ratio}
                  <div class="metric-value">1:{currentBrew.ratio.toFixed(2)}</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="metric-card">
                <span class="metric-label">Flow Rate</span>
                {#if currentBrew.flow_rate_g_per_s}
                  <div class="metric-value">{currentBrew.flow_rate_g_per_s.toFixed(1)} g/s</div>
                {:else}
                  <div class="metric-empty">Not recorded yet</div>
                {/if}
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Reflections</h3>
            {#if guestStatusLabel}
              <div class="guest-reflection-status-line">
                <Chip variant={guestStatusVariant} size="sm">{guestStatusLabel}</Chip>
                {#if guestCountdown}
                  <span class="guest-reflection-meta">Guest edit window ends in {guestCountdown}</span>
                {:else if guestState === 'locked' && brew?.guest_edit_expires_at}
                  <span class="guest-reflection-meta">
                    Guest reflection finalized at {new Date(brew.guest_edit_expires_at).toLocaleTimeString()}
                  </span>
                {/if}
              </div>
            {/if}
            <div class="reflection-grid">
              <div class="reflection-field reflection-field--rating">
                <span class="reflection-label">Rating</span>
                {#if currentBrew.rating}
                  <div class="reflection-rating">
                    <span class="rating-value">{currentBrew.rating}</span>
                    <span class="rating-denominator">/10</span>
                  </div>
                {:else}
                  <div class="reflection-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="reflection-field reflection-field--wide">
                <span class="reflection-label">Tasting Notes</span>
                {#if currentBrew.tasting_notes}
                  <div class="reflection-body">{currentBrew.tasting_notes}</div>
                {:else}
                  <div class="reflection-empty">Not recorded yet</div>
                {/if}
              </div>
              <div class="reflection-field reflection-field--wide">
                <span class="reflection-label">Reflections</span>
                {#if currentBrew.reflections}
                  <div class="reflection-body">{currentBrew.reflections}</div>
                {:else}
                  <div class="reflection-empty">Not recorded yet</div>
                {/if}
              </div>
            </div>
          </div>

          {#if !currentBrew.yield_g || !currentBrew.rating}
            <div class="incomplete-notice">
              <p>This brew is incomplete. {#if canEdit}<button on:click={openReflection} class="link-button">Complete it now</button>.{/if}</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div class="not-found">Brew not found</div>
  {/if}
  </div>
</AuthGuard>

<style>
  .brew-detail-page {
    display: flex;
    flex-direction: column;
    gap: var(--page-gap);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--header-gap);
  }

  h1 {
    color: var(--page-title-color);
    font-size: var(--page-title-size);
    font-family: var(--page-title-family);
    font-weight: var(--page-title-weight);
    line-height: var(--page-title-line-height);
    margin: var(--page-title-margin-top) 0 0 0;
  }

  .actions {
    display: flex;
    gap: var(--actions-gap);
  }

  .guest-reflection-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .guest-reflection-status,
  .guest-reflection-status-line {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .guest-reflection-status-line {
    margin-bottom: 0.75rem;
  }

  .guest-reflection-meta {
    color: var(--state-color);
    font-family: var(--state-font-family);
    font-size: var(--state-font-size);
  }

  .guest-reflection-error {
    color: var(--error-color);
    font-family: var(--state-font-family);
    font-size: var(--state-font-size);
    margin-bottom: 0.75rem;
  }

  .guest-share-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    border: var(--reflection-body-border-width) var(--reflection-body-border-style) var(--reflection-body-border);
    border-radius: var(--reflection-body-radius);
    background: var(--reflection-body-bg);
    margin-bottom: 1.5rem;
  }

  .guest-share-details {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .guest-share-label {
    color: var(--reflection-label-color);
    font-family: var(--reflection-label-family);
    font-size: var(--reflection-label-size);
    font-weight: var(--reflection-label-weight);
  }

  .guest-share-link {
    color: var(--reflection-body-color);
    font-family: var(--reflection-body-family);
    font-size: var(--reflection-body-size);
    word-break: break-all;
  }

  .guest-share-qr img {
    width: 120px;
    height: 120px;
    border-radius: var(--reflection-body-radius);
    border: var(--reflection-body-border-width) var(--reflection-body-border-style) var(--reflection-body-border);
  }

  .link-button {
    background: none;
    border: none;
    color: var(--link-color);
    font-family: var(--link-font-family);
    font-size: var(--link-font-size);
    font-weight: var(--link-font-weight);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }

  button:disabled:hover {
    background: inherit;
  }

  .loading, .error, .not-found {
    text-align: center;
    padding: var(--state-padding);
    color: var(--state-color);
    font-family: var(--state-font-family);
    font-size: var(--state-font-size);
  }

  .error {
    color: var(--error-color);
  }

  .brew-details {
    display: flex;
    flex-direction: column;
    gap: var(--detail-section-gap);
  }

  .reference-section {
    display: flex;
    flex-direction: column;
    gap: var(--detail-section-gap);
  }

  .reference-section summary {
    list-style: none;
    cursor: pointer;
    padding: 0;
    background: none;
    border: none;
    font-weight: var(--detail-title-weight);
    color: var(--detail-title-color);
    font-size: var(--detail-title-size);
    font-family: var(--detail-title-family);
    line-height: var(--detail-title-line-height);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.75rem;
  }

  .reference-section summary::-webkit-details-marker {
    display: none;
  }

  .reference-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .reference-icon {
    display: inline-flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .reference-divider {
    height: 1px;
    width: 100%;
    background: var(--detail-section-border);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .reference-section[open] summary .reference-icon {
    transform: rotate(0deg);
  }

  .reference-section:not([open]) summary .reference-icon {
    transform: rotate(-90deg);
  }

  .reference-section[open] summary .reference-divider {
    opacity: 1;
  }

  .reference-section .detail-section + .detail-section {
    margin-top: var(--detail-section-gap);
  }

  .detail-section {
    padding: var(--detail-section-padding);
    background: var(--detail-section-bg);
    border: var(--detail-section-border-width) var(--detail-section-border-style) var(--detail-section-border);
    border-radius: var(--detail-section-radius);
  }

  .detail-section h3 {
    color: var(--detail-title-color);
    margin: 0 0 var(--detail-title-margin) 0;
    font-size: var(--detail-title-size);
    font-family: var(--detail-title-family);
    font-weight: var(--detail-title-weight);
    line-height: var(--detail-title-line-height);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--detail-grid-min), 1fr));
    gap: var(--detail-grid-gap);
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--detail-grid-min), 1fr));
    gap: var(--detail-grid-gap);
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    gap: var(--metric-card-gap);
    background: var(--metric-card-bg);
    border: var(--metric-card-border-width) var(--metric-card-border-style) var(--metric-card-border);
    border-radius: var(--metric-card-radius);
    padding: var(--metric-card-padding-y) var(--metric-card-padding-x);
  }

  .metric-card--wide {
    grid-column: span 2;
  }

  .metric-label {
    font-weight: var(--metric-label-weight);
    color: var(--metric-label-color);
    font-size: var(--metric-label-size);
    font-family: var(--metric-label-family);
    line-height: var(--metric-label-line-height);
  }

  .metric-value {
    color: var(--metric-value-color);
    font-size: var(--metric-value-size);
    font-family: var(--metric-value-family);
    font-weight: var(--metric-value-weight);
    line-height: var(--metric-value-line-height);
  }

  .metric-empty {
    color: var(--metric-empty-color);
    font-size: var(--metric-empty-size);
    font-family: var(--metric-empty-family);
    line-height: var(--metric-empty-line-height);
  }

  .reflection-grid {
    display: grid;
    gap: var(--reflection-grid-gap);
  }

  .reflection-field {
    display: flex;
    flex-direction: column;
    gap: var(--reflection-field-gap);
  }

  .reflection-field--rating {
    justify-self: start;
    width: min(220px, 100%);
  }

  .reflection-label {
    font-weight: var(--reflection-label-weight);
    color: var(--reflection-label-color);
    font-size: var(--reflection-label-size);
    font-family: var(--reflection-label-family);
    line-height: var(--reflection-label-line-height);
  }

  .reflection-rating {
    display: inline-flex;
    align-items: baseline;
    gap: var(--reflection-rating-gap);
    font-size: var(--reflection-rating-size);
    font-family: var(--reflection-rating-family);
    font-weight: var(--reflection-rating-weight);
    line-height: var(--reflection-rating-line-height);
    color: var(--reflection-rating-color);
  }

  .rating-denominator {
    font-size: var(--reflection-denominator-size);
    font-family: var(--reflection-denominator-family);
    line-height: var(--reflection-denominator-line-height);
    color: var(--reflection-denominator-color);
  }

  .reflection-body {
    background: var(--reflection-body-bg);
    border: var(--reflection-body-border-width) var(--reflection-body-border-style) var(--reflection-body-border);
    border-radius: var(--reflection-body-radius);
    padding: var(--reflection-body-padding-y) var(--reflection-body-padding-x);
    color: var(--reflection-body-color);
    font-family: var(--reflection-body-family);
    font-size: var(--reflection-body-size);
    line-height: var(--reflection-body-line-height);
    white-space: pre-wrap;
  }

  .reflection-empty {
    background: var(--reflection-empty-bg);
    border: var(--reflection-empty-border-width) var(--reflection-empty-border-style) var(--reflection-empty-border);
    border-radius: var(--reflection-empty-radius);
    padding: var(--reflection-empty-padding-y) var(--reflection-empty-padding-x);
    color: var(--reflection-empty-color);
    font-size: var(--reflection-empty-size);
    font-family: var(--reflection-empty-family);
    line-height: var(--reflection-empty-line-height);
  }


  .equipment-loading {
    text-align: left;
    padding: var(--equipment-loading-padding) 0;
    color: var(--equipment-loading-color);
    font-family: var(--equipment-loading-family);
    font-size: var(--equipment-loading-size);
  }

  .equipment-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--equipment-grid-gap);
  }

  .equipment-card {
    display: flex;
    flex-direction: column;
    gap: var(--equipment-card-gap);
    padding: var(--equipment-card-padding);
    border-radius: var(--equipment-card-radius);
    background: var(--equipment-card-bg);
    border: var(--equipment-card-border-width) var(--equipment-card-border-style) var(--equipment-card-border);
  }

  .bag-card--clickable {
    cursor: pointer;
    transition: var(--equipment-card-transition);
  }

  .bag-card--clickable:hover {
    box-shadow: var(--equipment-card-hover-shadow);
    border-color: var(--equipment-card-hover-border);
  }

  .bag-card--clickable:focus-visible {
    outline: var(--equipment-card-focus-width) solid var(--equipment-card-focus-color);
    outline-offset: var(--equipment-card-focus-offset);
  }

  .equipment-card-main {
    display: flex;
    flex-direction: column;
    gap: var(--equipment-card-main-gap);
    flex: 1;
  }

  .equipment-card-main h4 {
    margin: var(--equipment-title-margin) 0 0 0;
    font-size: var(--equipment-title-size);
    font-weight: var(--equipment-title-weight);
    font-family: var(--equipment-title-family);
    line-height: var(--equipment-title-line-height);
    color: var(--equipment-title-color);
  }

  .equipment-title-row {
    display: flex;
    flex-direction: column;
    gap: var(--equipment-title-gap);
    margin-bottom: var(--equipment-title-row-margin);
  }

  .equipment-meta {
    margin: var(--equipment-meta-margin-top) 0 0 0;
    font-size: var(--equipment-meta-size);
    font-family: var(--equipment-meta-family);
    font-weight: var(--equipment-meta-weight);
    line-height: var(--equipment-meta-line-height);
    color: var(--equipment-meta-color);
  }

  .equipment-label {
    margin: 0;
    font-size: var(--equipment-label-size);
    font-family: var(--equipment-label-family);
    font-weight: var(--equipment-label-weight);
    line-height: var(--equipment-label-line-height);
    color: var(--equipment-label-color);
  }

  .equipment-content-row {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .equipment-content-row--split {
    gap: var(--equipment-content-gap);
    justify-content: space-between;
    align-items: flex-start;
  }

  .equipment-details {
    display: flex;
    flex-direction: column;
    gap: var(--equipment-details-gap);
    flex: 1;
    min-width: 0;
  }

  .equipment-detail {
    display: flex;
    align-items: baseline;
    gap: var(--equipment-detail-gap);
    flex-wrap: wrap;
  }

  .equipment-detail-value {
    font-size: var(--equipment-detail-value-size);
    font-family: var(--equipment-detail-value-family);
    line-height: var(--equipment-detail-value-line-height);
    color: var(--equipment-detail-value-color);
  }

  .bag-card--wide {
    grid-column: span 2;
  }

  .equipment-image {
    flex-shrink: 0;
    width: var(--equipment-image-width);
    height: var(--equipment-image-height);
    align-self: flex-start;
    border-radius: var(--equipment-image-radius);
    overflow: hidden;
    border: var(--equipment-image-border-width) var(--equipment-image-border-style) var(--equipment-image-border);
    background: var(--equipment-image-bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .equipment-image--placeholder {
    background: var(--equipment-image-placeholder-bg);
    border-style: var(--equipment-image-placeholder-border-style);
  }

  .equipment-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-item label {
    font-weight: var(--metric-label-weight);
    color: var(--metric-label-color);
    font-size: var(--metric-label-size);
    font-family: var(--metric-label-family);
    line-height: var(--metric-label-line-height);
  }

  .detail-item span {
    color: var(--metric-value-color);
  }

  .incomplete-notice {
    background: var(--incomplete-bg);
    border: var(--incomplete-border-width) var(--incomplete-border-style) var(--incomplete-border);
    border-radius: var(--incomplete-radius);
    padding: var(--incomplete-padding);
    margin-top: 0;
    color: var(--incomplete-color);
    font-family: var(--incomplete-font-family);
    font-size: var(--incomplete-font-size);
  }

  .incomplete-notice p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .metric-card--wide {
      grid-column: span 1;
    }

    .equipment-content-row {
      flex-direction: column;
    }

    .equipment-grid {
      grid-template-columns: 1fr;
    }

    .bag-card--wide {
      grid-column: auto;
    }
  }
</style>
