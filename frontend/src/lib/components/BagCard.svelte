<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { apiClient } from "$lib/api-client";
  import { adminService } from "$lib/admin-service";
  import { barista } from "$lib/auth";
  import { getBagPermissions } from "$lib/permissions";
  import IconButton from "$lib/components/IconButton.svelte";
  import BeanSelector from "$lib/components/BeanSelector.svelte";
  import Chip from "$lib/components/Chip.svelte";
  import BagStatusUpdater from "$lib/components/BagStatusUpdater.svelte";
  import WeightInput from "$lib/components/WeightInput.svelte";
  import RoastLevel from "$lib/components/RoastLevel.svelte";
  import {
    ArrowTopRightOnSquareMini,
    PencilSquare,
    CheckCircle,
    XMark,
    StarMicro,
    Calendar,
  } from "$lib/icons";
  import {
    editableCard,
    editableCardVariants,
  } from "$lib/ui/components/editable-card";
  import { imageSizes } from "$lib/ui/components/image";
  import { toStyleString } from "$lib/ui/style";
  import { getTransformedImageUrl } from "$lib/utils/image-utils";
  import type {
    BagWithBarista,
    Barista as BaristaType,
    Bean,
    UpdateBagRequest,
    CreateBagRequest,
  } from "@shared/types";

  /*
    BagCard variants
    - preview: read-only list card for shelves and browsing; tap to inspect.
    - inspect: full detail view for sheets or wide layouts; primary action is start brew.
    - edit: sectioned form inside the same sheet; no inline edits inside lists.

    Mobile usage
    - Lists use preview only.
    - Inspect/edit live in a sheet overlay so only one paper surface shows at a time.
  */

  export type BagCardVariant = "preview" | "inspect" | "edit";
  export type BagCardSurface = "card" | "sheet";

  // Props for existing bag mode
  export let bag: BagWithBarista | null = null;
  export let beanName: string;
  export let roasterName: string | null = null;
  export let beanImagePath: string | null = null;
  export let beanRoastLevel: string | null = null;
  export let tastingNotes: string | null = null;
  export let baristasById: Record<string, BaristaType> = {};
  export let variant: BagCardVariant = "inspect";
  export let surface: BagCardSurface = "card";

  // Props for new bag mode
  export let beanId: string | null = null;
  export let isNewBag = false;

  const dispatch = createEventDispatcher<{
    inspect: void;
    brew: { bagId: string | null };
    updated: BagWithBarista;
    created: BagWithBarista;
    cancel: void;
  }>();

  let isSaving = false;
  let error: string | null = null;
  let internalEdit = false;
  let formData: Partial<CreateBagRequest & UpdateBagRequest> = {};
  let lastVariant: BagCardVariant = variant;
  let lastBeanId = "";
  let autoName = "";
  let isNameAuto = false;
  let nameTouched = false;
  let selectedBeanName = "";
  let selectedRoasterName: string | null = null;
  let namePlaceholder = "";
  let headerTitle = "";
  let headerRoastDate = "";
  let headerRoasterName: string | null = null;
  const todayDatePlaceholder = new Date().toISOString().slice(0, 10);

  $: bagPermissions = bag
    ? getBagPermissions($barista, bag)
    : { canEdit: true, canDelete: false };
  $: canEdit = bagPermissions.canEdit;

  $: if (variant !== lastVariant) {
    if (variant === "edit" && !isNewBag) {
      internalEdit = true;
      initializeFormData();
    }
    lastVariant = variant;
  }

  $: isEditing = isNewBag || internalEdit || variant === "edit";
  $: activeVariant =
    variant === "preview" ? "preview" : isEditing ? "edit" : "inspect";

  $: if (isNewBag && lastBeanId !== (beanId || "")) {
    lastBeanId = beanId || "";
    initializeFormData();
  }

  $: ownershipStatus = getBagOwnershipStatus();
  $: ownerName = getBagOwnerName();
  $: pricePerUnit = bag ? formatPricePerGram(bag.price, bag.weight_g) : null;
  $: formPricePerUnit = formatPricePerGram(formData.price, formData.weight_g);
  $: averageRating = bag?.average_rating ?? null;
  $: ratingCount = bag?.rating_count ?? 0;
  $: brewCount = bag?.brew_count ?? 0;
  $: beanLinkId = bag?.bean_id ?? beanId ?? null;
  $: bagTitle = bag?.name?.trim() || beanName;
  $: inventoryLabel = formatInventoryStatus(bag?.inventory_status);
  $: inventoryVariant = getInventoryVariant(bag?.inventory_status);
  $: namePlaceholder = autoName || selectedBeanName || beanName;
  $: headerTitle =
    activeVariant === "edit"
      ? formData.name?.trim() ||
        selectedBeanName ||
        beanName ||
        (isNewBag ? "New Bag" : bagTitle)
      : isNewBag
        ? "New Bag"
        : bagTitle;
  $: headerRoastDate =
    activeVariant === "edit"
      ? formData.roast_date
        ? formatRoastDate(formData.roast_date)
        : "Not specified"
      : bag?.roast_date
        ? formatRoastDate(bag.roast_date)
        : "Not specified";
  $: headerRoasterName =
    activeVariant === "edit"
      ? selectedRoasterName || roasterName
      : roasterName;
  $: if (isNewBag) {
    const trimmedBeanName =
      selectedBeanName?.trim() || beanName?.trim() || "";
    const roastDate = formData.roast_date || "";
    const isAutoReady = Boolean(trimmedBeanName && roastDate);
    if (isAutoReady) {
      autoName = buildBagName(trimmedBeanName, roastDate);
      if (isNameAuto || (!nameTouched && !formData.name?.trim())) {
        formData.name = autoName;
        isNameAuto = true;
      }
    } else {
      autoName = "";
      if (isNameAuto && !nameTouched) {
        formData.name = "";
        isNameAuto = false;
      }
    }
  } else {
    autoName = "";
    isNameAuto = false;
  }

  function formatRoastDate(dateString?: string): string {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  }

  function getBagOwnershipStatus(): "owned" | "other" {
    if (!bag) return "owned";
    return bag.owner_id === $barista?.id ? "owned" : "other";
  }

  function getBagOwnerName(): string {
    if (!bag) return "Your bag";
    if (bag.barista?.display_name) {
      return bag.barista.display_name;
    }
    const owner = baristasById[bag.owner_id];
    return owner ? owner.display_name : "Unknown";
  }

  function formatInventoryStatus(status?: string): string {
    if (!status) return "Unknown";
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function getInventoryVariant(
    status?: string,
  ): "success" | "warning" | "error" | "neutral" {
    switch (status) {
      case "plenty":
        return "success";
      case "getting_low":
        return "warning";
      case "empty":
        return "error";
      default:
        return "neutral";
    }
  }

  function formatPricePerGram(
    price?: number | null,
    weight_g?: number | null,
  ): string | null {
    if (price === null || price === undefined) return null;
    if (weight_g === null || weight_g === undefined) return null;
    if (weight_g <= 0) return null;
    const centsPerGram = (price * 100) / weight_g;
    const pricePerCup = (price * 18) / weight_g;
    return `${centsPerGram.toFixed(1)}¢/g ($${pricePerCup.toFixed(2)}/cup)`;
  }

  function initializeFormData() {
    if (isNewBag) {
      formData = {
        bean_id: beanId || "",
        name: "",
        roast_date: "",
        weight_g: undefined,
        price: undefined,
        purchase_location: "",
        inventory_status: undefined,
      };
      nameTouched = false;
      isNameAuto = false;
      autoName = "";
      selectedBeanName = beanName?.trim() || "";
      selectedRoasterName = roasterName;
      return;
    }

    if (bag) {
      formData = {
        bean_id: bag.bean_id || "",
        name: bag.name || "",
        roast_date: bag.roast_date || "",
        weight_g: bag.weight_g ?? undefined,
        price: bag.price || undefined,
        purchase_location: bag.purchase_location || "",
        inventory_status: bag.inventory_status,
      };
      nameTouched = Boolean(bag.name?.trim());
      isNameAuto = false;
      autoName = "";
      selectedBeanName = bag.bean?.name?.trim() || beanName?.trim() || "";
      selectedRoasterName = bag.bean?.roaster?.name || roasterName;
    }
  }

  function handleEdit() {
    if (!canEdit || isNewBag) return;
    initializeFormData();
    internalEdit = true;
    error = null;
  }

  function handleCancel() {
    if (isNewBag) {
      dispatch("cancel");
      return;
    }
    internalEdit = false;
    formData = {};
    error = null;
    dispatch("cancel");
  }

  function validateForm(): boolean {
    if (!formData.bean_id && isNewBag) {
      error = "Bean is required";
      return false;
    }

    if (formData.weight_g !== undefined && formData.weight_g < 0) {
      error = "Weight cannot be negative";
      return false;
    }

    if (formData.price !== undefined && formData.price < 0) {
      error = "Price cannot be negative";
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!canEdit) return;
    if (!validateForm()) return;

    try {
      isSaving = true;
      error = null;

      if (isNewBag) {
        const createData: CreateBagRequest = {
          bean_id: formData.bean_id!,
          name: formData.name?.trim() || undefined,
          roast_date: formData.roast_date || undefined,
          weight_g: formData.weight_g ?? undefined,
          price: formData.price,
          purchase_location: formData.purchase_location?.trim() || undefined,
          inventory_status: formData.inventory_status,
        };

        const response = await apiClient.createBag(createData);

        if (response.data) {
          dispatch("created", response.data);
        } else {
          throw new Error("Failed to create bag");
        }
      } else if (bag) {
        const updateData: UpdateBagRequest = {
          id: bag.id,
          ...formData,
        };

        const isAdmin = $barista?.is_admin === true;
        const isOwner = bag.owner_id === $barista?.id;

        let response;
        if (isAdmin && !isOwner) {
          const updatedBag = await adminService.updateBag(bag.id, updateData);
          response = { data: updatedBag };
        } else {
          response = await apiClient.updateBag(bag.id, updateData);
        }

        if (response.data) {
          const updatedBag = { ...response.data, barista: bag.barista };
          const existingBean = (bag as any)?.bean;
          const updatedBean = (updatedBag as any).bean;
          const mergedBean =
            existingBean || updatedBean
              ? { ...(existingBean || {}), ...(updatedBean || {}) }
              : undefined;
          const enrichedBag = {
            ...updatedBag,
            ...(mergedBean ? { bean: mergedBean } : {}),
          };
          dispatch("updated", enrichedBag);
          internalEdit = false;
          formData = {};
        } else {
          throw new Error("Failed to update bag");
        }
      }
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : `Failed to ${isNewBag ? "create" : "update"} bag`;
      console.error(`Failed to ${isNewBag ? "create" : "update"} bag:`, err);
    } finally {
      isSaving = false;
    }
  }

  function handleBagStatusUpdated(event: CustomEvent<BagWithBarista>) {
    if (!bag) return;
    const updatedBag = event.detail;
    const bagWithBarista = { ...updatedBag, barista: bag.barista };
    dispatch("updated", bagWithBarista);
  }

  function handlePreviewKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      dispatch("inspect");
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      handleCancel();
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      handleSave();
    }
  }

  function handleStartBrew(event?: Event) {
    event?.stopPropagation();
    dispatch("brew", { bagId: bag?.id ?? null });
  }

  function handleBeanSelected(
    event: CustomEvent<{ bean: Bean | null; roasterName: string | null }>,
  ) {
    selectedBeanName = event.detail.bean?.name?.trim() || "";
    selectedRoasterName = event.detail.roasterName;
  }

  function getAutoOwnerName(): string {
    if ($barista?.display_name?.trim()) return $barista.display_name.trim();
    if ($barista?.first_name?.trim()) return $barista.first_name.trim();
    return "Your";
  }

  function buildBagName(bean: string, roastDate: string): string {
    const formattedDate = formatRoastDate(roastDate);
    const ownerName = getAutoOwnerName();
    const ownerPrefix = ownerName === "Your" ? "Your" : `${ownerName}'s`;
    return [ownerPrefix, bean, formattedDate].filter(Boolean).join(" ");
  }

  function markNameTouched() {
    nameTouched = true;
    isNameAuto = false;
  }

  function applyAutoName() {
    if (!autoName) return;
    formData.name = autoName;
    isNameAuto = true;
    nameTouched = false;
  }

  const style = toStyleString({
    "--editable-card-bg": editableCard.container.background,
    "--editable-card-border": editableCard.container.borderColor,
    "--editable-card-border-width": editableCard.container.borderWidth,
    "--editable-card-border-style": editableCard.container.borderStyle,
    "--editable-card-radius": editableCard.container.borderRadius,
    "--editable-card-padding": editableCard.container.padding,
    "--editable-card-transition": editableCard.container.transition,
    "--editable-card-hover-shadow": editableCard.container.hover.shadow,
    "--editable-card-hover-border": editableCard.container.hover.borderColor,
    "--editable-card-edit-border": editableCard.state.editing.borderColor,
    "--editable-card-edit-shadow": editableCard.state.editing.shadow,
    "--editable-card-new-border": editableCard.state.newCard.borderColor,
    "--editable-card-new-border-style": editableCard.state.newCard.borderStyle,
    "--editable-card-new-bg": editableCard.state.newCard.background,
    "--editable-card-new-margin": editableCard.state.newCard.marginBottom,
    "--editable-card-new-edit-border-style":
      editableCard.state.newEditing.borderStyle,
    "--editable-card-new-edit-bg": editableCard.state.newEditing.background,
    "--editable-card-new-edit-margin":
      editableCard.state.newEditing.marginBottom,
    "--editable-card-header-gap": editableCard.header.gap,
    "--editable-card-header-margin": editableCard.header.marginBottom,
    "--editable-card-title-font": editableCard.title.fontFamily,
    "--editable-card-title-size": editableCard.title.fontSize,
    "--editable-card-title-weight": editableCard.title.fontWeight,
    "--editable-card-title-color": editableCard.title.textColor,
    "--editable-card-info-font": editableCard.info.fontFamily,
    "--editable-card-info-size": editableCard.info.fontSize,
    "--editable-card-info-color": editableCard.info.textColor,
    "--editable-card-owner-color": editableCard.owner.textColor,
    "--editable-card-owner-highlight": editableCard.owner.highlightColor,
    "--editable-card-owner-size": editableCard.owner.fontSize,
    "--editable-card-owner-weight": editableCard.owner.fontWeight,
    "--editable-card-actions-gap": editableCard.actions.gap,
    "--editable-card-edit-actions-gap": editableCard.actions.editActionsGap,
    "--editable-card-status-font-size": editableCard.statusPill.fontSize,
    "--editable-card-status-font-weight": editableCard.statusPill.fontWeight,
    "--editable-card-status-radius": editableCard.statusPill.borderRadius,
    "--editable-card-status-padding": editableCard.statusPill.padding,
    "--editable-card-status-success-bg":
      editableCard.statusPill.variants.success.background,
    "--editable-card-status-success-color":
      editableCard.statusPill.variants.success.textColor,
    "--editable-card-status-warning-bg":
      editableCard.statusPill.variants.warning.background,
    "--editable-card-status-warning-color":
      editableCard.statusPill.variants.warning.textColor,
    "--editable-card-status-error-bg":
      editableCard.statusPill.variants.error.background,
    "--editable-card-status-error-color":
      editableCard.statusPill.variants.error.textColor,
    "--editable-card-error-bg": editableCard.error.background,
    "--editable-card-error-border": editableCard.error.borderColor,
    "--editable-card-error-color": editableCard.error.textColor,
    "--editable-card-error-radius": editableCard.error.borderRadius,
    "--editable-card-error-padding": editableCard.error.padding,
    "--editable-card-error-font": editableCard.error.fontFamily,
    "--editable-card-error-size": editableCard.error.fontSize,
    "--editable-card-grid-gap": editableCard.detailGrid.gap,
    "--editable-card-detail-min-col":
      editableCardVariants.compact.detailMinColumnWidth,
    "--editable-card-label-font": editableCard.detail.label.fontFamily,
    "--editable-card-label-size": editableCard.detail.label.fontSize,
    "--editable-card-label-weight": editableCard.detail.label.fontWeight,
    "--editable-card-label-color": editableCard.detail.label.textColor,
    "--editable-card-value-font": editableCard.detail.value.fontFamily,
    "--editable-card-value-size": editableCard.detail.value.fontSize,
    "--editable-card-value-color": editableCard.detail.value.textColor,
    "--editable-card-empty-font": editableCard.detail.empty.fontFamily,
    "--editable-card-empty-style": editableCard.detail.empty.fontStyle,
    "--editable-card-empty-color": editableCard.detail.empty.textColor,
    "--editable-card-input-font": editableCard.input.fontFamily,
    "--editable-card-input-size": editableCard.input.fontSize,
    "--editable-card-input-color": editableCard.input.textColor,
    "--editable-card-input-bg": editableCard.input.background,
    "--editable-card-input-border": editableCard.input.borderColor,
    "--editable-card-input-border-width": editableCard.input.borderWidth,
    "--editable-card-input-radius": editableCard.input.borderRadius,
    "--editable-card-input-padding": editableCard.input.padding,
    "--editable-card-input-focus": editableCard.input.focusRing,
    "--editable-card-section-divider": editableCard.section.dividerColor,
    "--editable-card-section-title-font": editableCard.section.title.fontFamily,
    "--editable-card-section-title-size": editableCard.section.title.fontSize,
    "--editable-card-section-title-weight":
      editableCard.section.title.fontWeight,
    "--editable-card-section-title-color": editableCard.section.title.textColor,
    "--editable-card-image-width": `${imageSizes.card.width}px`,
    "--editable-card-image-height": `${imageSizes.card.height}px`,
  });
</script>

{#if activeVariant === "preview"}
  <article class="bag-card preview" {style}>
    <div
      class="bag-preview"
      role="button"
      tabindex="0"
      aria-label={`Inspect ${bagTitle}`}
      on:click={() => dispatch("inspect")}
      on:keydown={handlePreviewKeydown}
    >
      <div class="bag-preview-top">
        <span class="bag-preview-owner"
          >{ownershipStatus === "owned" ? "Your bag" : ownerName}</span
        >
        <div class="bag-preview-chips">
          <Chip variant={inventoryVariant} size="sm">{inventoryLabel}</Chip>
          <Chip
            variant={averageRating !== null && ratingCount > 0
              ? "accent"
              : "neutral"}
            size="sm"
          >
            <span class="rating-chip">
              {averageRating !== null && ratingCount > 0
                ? averageRating.toFixed(1)
                : "—"}
              <StarMicro size={14} />
            </span>
          </Chip>
        </div>
      </div>
      <div class="bag-preview-title-full">
        <h4>{beanName}</h4>
      </div>
      <div class="bag-preview-body">
        <div class="bag-preview-media" class:placeholder={!beanImagePath}>
          {#if beanImagePath}
            <img
              src={getTransformedImageUrl(
                beanImagePath,
                "bean",
                imageSizes.card,
              )}
              alt={beanName}
              loading="lazy"
              on:error={(e) => (e.currentTarget.style.display = "none")}
            />
          {/if}
        </div>
        <div class="bag-preview-main">
          <div class="bag-preview-title">
            <p class="bag-preview-meta-text">
              {#if roasterName}
                <span>by {roasterName}</span>
              {/if}
              {#if bag?.roast_date}
                <span>{formatRoastDate(bag.roast_date)}</span>
              {:else}
                <span>Date not set</span>
              {/if}
            </p>
          </div>
          <div class="bag-preview-meta">
            {#if beanRoastLevel}
              <RoastLevel value={beanRoastLevel} size="small" />
            {/if}
          </div>
        </div>
      </div>
    </div>
  </article>
{:else}
  <article
    class="bag-card"
    class:sheet-surface={surface === "sheet"}
    class:editing={activeVariant === "edit"}
    class:new-bag={isNewBag}
    class:has-media={!isEditing}
    on:keydown={handleKeydown}
    {style}
  >
    <div class="bag-card-body">
      <div class="bag-header">
        <div class="bag-header-main">
          <div class="bag-header-text">
            {#if !isNewBag}
              <span class="bag-owner" class:own={ownershipStatus === "owned"}>
                {ownershipStatus === "owned" ? "Your bag" : ownerName}
              </span>
            {:else}
              <span class="bag-owner">New bag</span>
            {/if}
            <div class="bag-title">
              <h4>{headerTitle}</h4>
            </div>
            {#if activeVariant === "inspect" || activeVariant === "edit"}
              <div class="bag-header-meta">
                <span class="bag-roast-meta">Roasted {headerRoastDate}</span>
                {#if headerRoasterName}
                  <span class="bag-roaster-meta">{headerRoasterName}</span>
                {/if}
              </div>
            {/if}
          </div>
          <div class="bag-header-status">
            {#if activeVariant === "inspect"}
              <Chip variant={inventoryVariant} size="sm">{inventoryLabel}</Chip>
              <Chip variant="neutral" size="sm">
                {brewCount}
                {brewCount === 1 ? "brew" : "brews"}
              </Chip>
              <Chip
                variant={averageRating !== null && ratingCount > 0
                  ? "accent"
                  : "neutral"}
                size="sm"
              >
                <span class="rating-chip">
                  {averageRating !== null && ratingCount > 0
                    ? averageRating.toFixed(1)
                    : "—"}
                  <StarMicro size={14} />
                </span>
              </Chip>
            {/if}
          </div>
        </div>
      </div>

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      {#if activeVariant === "inspect"}
        <div class="bag-content">
          <div class="bag-media">
            <div
              class="card-media"
              class:placeholder={!beanImagePath}
              aria-hidden={!beanImagePath ? "true" : undefined}
            >
              {#if beanImagePath}
                <img
                  src={getTransformedImageUrl(
                    beanImagePath,
                    "bean",
                    imageSizes.card,
                  )}
                  alt={bagTitle}
                  loading="lazy"
                  on:error={(e) => (e.currentTarget.style.display = "none")}
                />
              {/if}
            </div>
            {#if beanLinkId}
              <a class="bean-link" href={`/beans/${beanLinkId}`}>
                <ArrowTopRightOnSquareMini size={16} />
                <span>View bean</span>
              </a>
            {/if}
          </div>
          <div class="bag-details">
            {#if beanRoastLevel}
              <div class="bag-detail">
                <span class="detail-label">Roast level</span>
                <div class="detail-value">
                  <RoastLevel value={beanRoastLevel} size="small" />
                </div>
              </div>
            {/if}
            <div class="bag-detail">
              <span class="detail-label">Avg rating</span>
              {#if averageRating !== null && ratingCount > 0}
                <span class="detail-value">
                  {averageRating.toFixed(1)}/10 {ratingCount > 0
                    ? `(${ratingCount})`
                    : ""}
                </span>
              {:else}
                <span class="detail-value detail-empty">No ratings yet</span>
              {/if}
            </div>
            <div class="bag-detail">
              <span class="detail-label">Purchase price</span>
              {#if bag?.price !== null && bag?.price !== undefined}
                <span class="detail-value">${bag.price.toFixed(2)}</span>
              {:else}
                <span class="detail-value detail-empty">Not specified</span>
              {/if}
            </div>
            <div class="bag-detail">
              <span class="detail-label">Bag weight</span>
              {#if bag?.weight_g !== null && bag?.weight_g !== undefined}
                <span class="detail-value">{bag.weight_g} g</span>
              {:else}
                <span class="detail-value detail-empty">Not specified</span>
              {/if}
            </div>
            <div class="bag-detail">
              <span class="detail-label">Unit price</span>
              {#if pricePerUnit}
                <span class="detail-value">{pricePerUnit}</span>
              {:else}
                <span class="detail-value detail-empty">Not specified</span>
              {/if}
            </div>
            <div class="bag-detail">
              <span class="detail-label">Purchase location</span>
              {#if bag?.purchase_location}
                <span class="detail-value">{bag.purchase_location}</span>
              {:else}
                <span class="detail-value detail-empty">Not specified</span>
              {/if}
            </div>
          </div>
        </div>

        {#if tastingNotes}
          <div class="bag-notes">
            <p class="notes-preview">{tastingNotes}</p>
          </div>
        {/if}

        {#if canEdit && bag}
          <div class="bag-status-section">
            <h5>Update Status</h5>
            <BagStatusUpdater {bag} on:updated={handleBagStatusUpdated} />
          </div>
        {/if}

        <div class="bag-actions-row">
          <div class="bag-actions">
            {#if bag}
              <button
                type="button"
                class="btn-primary"
                on:click={handleStartBrew}
              >
                Start brew with this bag
              </button>
            {/if}
            {#if canEdit && !isNewBag}
              <IconButton
                type="button"
                on:click={handleEdit}
                ariaLabel="Edit bag"
                title="Edit bag"
                variant="accent"
              >
                <PencilSquare size={16} />
              </IconButton>
            {/if}
          </div>
        </div>
      {:else}
        <div class="bag-edit-sections">
          <section class="bag-edit-section">
            <h5>Identity</h5>
            <div class="bag-edit-grid">
              <div class="bag-edit-field">
                <label>Bean</label>
                <BeanSelector
                  bind:value={formData.bean_id}
                  disabled={isSaving}
                  on:selected={handleBeanSelected}
                />
              </div>
              <div class="bag-edit-field">
                <div class="bag-name-header">
                  <label for="bag-name">Bag name</label>
                  {#if isNewBag}
                    <span
                      class={`auto-indicator ${isNameAuto ? "auto" : "custom"}`}
                    >
                      {#if isNameAuto}
                        Auto-filled
                      {:else if autoName}
                        Auto ready
                      {:else}
                        Auto name
                      {/if}
                    </span>
                  {/if}
                  {#if isNewBag && autoName && !isNameAuto}
                    <button
                      type="button"
                      class="reset-auto"
                      on:click={applyAutoName}
                      disabled={isSaving}
                    >
                      Use auto name
                    </button>
                  {/if}
                </div>
                <input
                  id="bag-name"
                  type="text"
                  bind:value={formData.name}
                  on:input={markNameTouched}
                  class="detail-input"
                  placeholder={namePlaceholder}
                  disabled={isSaving}
                />
                {#if isNewBag}
                  <small class="auto-hint">
                    {#if autoName}
                      {isNameAuto
                        ? "We'll keep this name in sync until you edit it."
                        : "This will auto-fill when your roast date is set."}
                    {:else}
                      Set a roast date to generate an automatic name.
                    {/if}
                  </small>
                {/if}
              </div>
              <div class="bag-edit-field">
                <label for="bag-roast-date">Roast date</label>
                <div class="date-input-wrapper">
                  <span class="date-input-icon" aria-hidden="true">
                    <Calendar size={16} />
                  </span>
                  <input
                    id="bag-roast-date"
                    type="date"
                    bind:value={formData.roast_date}
                    class="detail-input detail-input--date"
                    placeholder={todayDatePlaceholder}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="bag-edit-section">
            <h5>Purchase</h5>
            <div class="bag-edit-grid">
              <div class="bag-edit-field">
                <label for="bag-price">Price</label>
                <input
                  id="bag-price"
                  type="number"
                  inputmode="decimal"
                  bind:value={formData.price}
                  class="detail-input"
                  placeholder="e.g., 18.50"
                  min="0"
                  step="0.01"
                  disabled={isSaving}
                />
              </div>
              <div class="bag-edit-field">
                <WeightInput
                  id="bag-weight"
                  label="Weight"
                  valueGrams={formData.weight_g ?? null}
                  disabled={isSaving}
                  on:change={(event) => (formData.weight_g = event.detail.grams ?? undefined)}
                />
              </div>
              <div class="bag-edit-field">
                <label for="bag-location">Purchase location</label>
                <input
                  id="bag-location"
                  type="text"
                  bind:value={formData.purchase_location}
                  class="detail-input"
                  placeholder="e.g., Local roaster"
                  disabled={isSaving}
                />
              </div>
              <div class="bag-edit-field">
                <label>Unit price</label>
                <div class="detail-value detail-readonly">
                  {#if formPricePerUnit}
                    {formPricePerUnit}
                  {:else}
                    <span class="detail-empty">Not specified</span>
                  {/if}
                </div>
              </div>
            </div>
          </section>

          <section class="bag-edit-section">
            <h5>Inventory</h5>
            <div class="bag-edit-grid">
              <div class="bag-edit-field">
                <label for="bag-status">Status</label>
                <select
                  id="bag-status"
                  bind:value={formData.inventory_status}
                  class="detail-select"
                  disabled={isSaving}
                >
                  <option value="">Select status</option>
                  <option value="unopened">Unopened</option>
                  <option value="plenty">Plenty</option>
                  <option value="getting_low">Getting Low</option>
                  <option value="empty">Empty</option>
                </select>
              </div>
            </div>
          </section>

          <section class="bag-edit-section">
            <h5>Notes</h5>
            <div class="bag-edit-notes">
              {#if tastingNotes}
                <p class="notes-preview">{tastingNotes}</p>
              {:else}
                <p class="detail-empty">No tasting notes for this bean.</p>
              {/if}
            </div>
          </section>
        </div>

        <div class="bag-actions-row">
          <div class="bag-actions">
            <IconButton
              on:click={handleCancel}
              ariaLabel="Cancel"
              title="Cancel"
              variant="neutral"
              size="sm"
              disabled={isSaving}
            >
              <XMark />
            </IconButton>
            <IconButton
              on:click={handleSave}
              ariaLabel={isNewBag ? "Create bag" : "Save changes"}
              title={isNewBag ? "Create bag" : "Save"}
              variant="success"
              size="sm"
              disabled={isSaving}
            >
              <CheckCircle />
            </IconButton>
          </div>
        </div>
      {/if}
    </div>
  </article>
{/if}

<style>
  .bag-card {
    background: var(--editable-card-bg, var(--bg-surface-paper));
    border: var(--editable-card-border-width, 1px)
      var(--editable-card-border-style, solid)
      var(--editable-card-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--editable-card-radius, var(--radius-md));
    padding: var(--editable-card-padding, 1rem);
    transition: var(
      --editable-card-transition,
      border-color var(--motion-fast)
    );
  }

  .bag-card.preview {
    padding: 0.85rem;
  }

  .bag-card.sheet-surface {
    background: transparent;
    border: none;
    padding: 0;
    box-shadow: none;
    margin-bottom: 0;
  }

  .bag-card.sheet-surface:hover {
    box-shadow: none;
    border-color: transparent;
  }

  .bag-card.sheet-surface.editing {
    box-shadow: none;
  }

  .bag-card:hover {
    border-color: var(--editable-card-hover-border, var(--accent-primary));
  }

  .bag-card.editing {
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(
      --editable-card-edit-shadow,
      0 0 0 2px rgba(176, 138, 90, 0.1)
    );
  }

  .bag-card.new-bag {
    margin-bottom: var(--editable-card-new-margin, 1.5rem);
  }

  .bag-card.sheet-surface.new-bag {
    margin-bottom: 0;
  }

  .bag-preview {
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  .bag-preview-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .bag-preview-chips {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .rating-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .bag-preview-title-full h4 {
    margin: 0;
    color: var(--editable-card-title-color, var(--text-ink-primary));
    font-family: var(--editable-card-title-font, inherit);
    font-size: 0.98rem;
    font-weight: var(--editable-card-title-weight, 600);
    word-wrap: break-word;
  }

  .bag-preview-owner {
    color: var(--editable-card-owner-color, var(--text-ink-muted));
    font-size: 0.8rem;
  }

  .bag-preview-body {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.75rem;
  }

  .bag-preview:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 4px;
    border-radius: var(--radius-md);
  }

  .bag-preview-media {
    width: 86px;
    height: 86px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--editable-card-border, rgba(123, 94, 58, 0.2));
    overflow: hidden;
    background: rgba(123, 94, 58, 0.06);
    flex-shrink: 0;
  }

  .bag-preview-media.placeholder {
    background: rgba(123, 94, 58, 0.04);
    border-style: dashed;
  }

  .bag-preview-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .bag-preview-main {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .bag-preview-title h4 {
    margin: 0;
    color: var(--editable-card-title-color, var(--text-ink-primary));
    font-family: var(--editable-card-title-font, inherit);
    font-size: 0.95rem;
    font-weight: var(--editable-card-title-weight, 600);
    word-wrap: break-word;
  }

  .bag-preview-roaster {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-ink-secondary);
  }

  .bag-preview-meta-text {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-ink-secondary);
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .bag-preview-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .card-media {
    width: min(100%, var(--editable-card-image-width, 200px));
    aspect-ratio: 1 / 1;
    border-radius: var(--editable-card-radius, var(--radius-sm));
    border: 1px solid var(--editable-card-border, rgba(123, 94, 58, 0.2));
    overflow: hidden;
    background: rgba(123, 94, 58, 0.06);
    justify-self: start;
  }

  .bag-media {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .bean-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--text-ink-secondary);
    text-decoration: none;
  }

  .bean-link:hover {
    color: var(--accent-primary);
    text-decoration: underline;
  }

  .card-media.placeholder {
    background: rgba(123, 94, 58, 0.04);
    border-style: dashed;
  }

  .card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .bag-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: var(--editable-card-header-margin, 0.75rem);
  }

  .bag-header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .bag-header-text {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .bag-header-meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .bag-header-status {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .bag-title {
    flex: 1;
    min-width: 0;
  }

  .bag-title h4 {
    margin: 0;
    color: var(--editable-card-title-color, var(--text-ink-primary));
    font-family: var(--editable-card-title-font, inherit);
    font-size: var(--editable-card-title-size, 1rem);
    font-weight: var(--editable-card-title-weight, 600);
    word-wrap: break-word;
  }

  .bag-owner {
    color: var(--editable-card-owner-color, var(--text-ink-muted));
    font-size: var(--editable-card-owner-size, 0.8rem);
    display: block;
  }

  .bag-owner.own {
    color: var(--editable-card-owner-highlight, var(--semantic-success));
    font-weight: var(--editable-card-owner-weight, 600);
  }

  .bag-roast-meta,
  .bag-roaster-meta {
    color: var(--editable-card-info-color, var(--text-ink-secondary));
    font-family: var(--editable-card-info-font, inherit);
    font-size: var(--editable-card-info-size, 0.8rem);
  }

  .error-message {
    background: var(--editable-card-error-bg, rgba(122, 62, 47, 0.1));
    color: var(--editable-card-error-color, var(--semantic-error));
    border: 1px solid var(--editable-card-error-border, rgba(122, 62, 47, 0.3));
    border-radius: var(--editable-card-error-radius, var(--radius-sm));
    padding: var(--editable-card-error-padding, 0.5rem 0.75rem);
    margin-bottom: 0.75rem;
    font-family: var(--editable-card-error-font, inherit);
    font-size: var(--editable-card-error-size, 0.9rem);
  }

  .bag-content {
    display: grid;
    grid-template-columns: var(--editable-card-image-width, 200px) minmax(
        240px,
        1fr
      );
    gap: 1rem;
    align-items: start;
  }

  .bag-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--editable-card-grid-gap, 0.75rem);
  }

  .bag-detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    font-weight: var(--editable-card-label-weight, 500);
    color: var(--editable-card-label-color, var(--text-ink-secondary));
    font-size: var(--editable-card-label-size, 0.8rem);
    font-family: var(--editable-card-label-font, inherit);
  }

  .detail-value {
    color: var(--editable-card-value-color, var(--text-ink-primary));
    font-size: var(--editable-card-value-size, 0.9rem);
    font-family: var(--editable-card-value-font, inherit);
  }

  .detail-readonly {
    padding: 0.4rem 0;
  }

  .detail-empty {
    color: var(--editable-card-empty-color, var(--text-ink-muted));
    font-style: var(--editable-card-empty-style, italic);
    font-family: var(--editable-card-empty-font, inherit);
  }

  .detail-input,
  .detail-select {
    color: var(--editable-card-input-color, var(--text-ink-primary));
    font-size: max(1rem, var(--editable-card-input-size, 0.9rem));
    font-family: var(--editable-card-input-font, inherit);
    background: var(--editable-card-input-bg, var(--bg-surface-paper));
    border: var(--editable-card-input-border-width, 1px) solid
      var(--editable-card-input-border, rgba(123, 94, 58, 0.3));
    border-radius: var(--editable-card-input-radius, var(--radius-sm));
    padding: var(--editable-card-input-padding, 0.4rem 0.6rem);
    transition: border-color var(--motion-fast);
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    display: block;
  }

  .detail-input[type="date"] {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: var(--editable-card-input-padding, 0.4rem 0.6rem);
    line-height: 1.2;
    inline-size: 100%;
    max-inline-size: 100%;
    appearance: none;
    -webkit-appearance: none;
  }

  .detail-input:focus,
  .detail-select:focus {
    outline: none;
    border-color: var(--editable-card-edit-border, var(--accent-primary));
    box-shadow: var(
      --editable-card-input-focus,
      0 0 0 2px rgba(176, 138, 90, 0.1)
    );
  }

  .detail-input:disabled,
  .detail-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .bag-status-section {
    margin-top: 1rem;
  }

  .bag-status-section h5 {
    margin: 0 0 0.75rem 0;
    color: var(--editable-card-section-title-color, var(--text-ink-secondary));
    font-size: var(--editable-card-section-title-size, 0.9rem);
    font-weight: var(--editable-card-section-title-weight, 600);
    font-family: var(--editable-card-section-title-font, inherit);
  }

  .bag-notes {
    margin-top: 1rem;
    padding: var(--record-card-notes-padding, 0.75rem);
    background: var(--record-card-notes-bg, rgba(123, 94, 58, 0.08));
    border-radius: var(--record-card-notes-radius, var(--radius-sm));
    border-left: var(--record-card-notes-border-width, 3px) solid
      var(--record-card-notes-border, var(--accent-primary));
  }

  .notes-preview {
    margin: 0;
    color: var(--record-card-notes-color, var(--text-ink-secondary));
    font-size: var(--record-card-notes-size, 0.9rem);
    line-height: var(--record-card-notes-line-height, 1.4);
    font-style: italic;
  }

  .bag-actions-row {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid
      var(--editable-card-section-divider, rgba(123, 94, 58, 0.15));
    display: flex;
    justify-content: flex-end;
  }

  .bag-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .bag-edit-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .bag-edit-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bag-edit-section h5 {
    margin: 0;
    color: var(--editable-card-section-title-color, var(--text-ink-secondary));
    font-size: var(--editable-card-section-title-size, 0.95rem);
    font-weight: var(--editable-card-section-title-weight, 600);
    font-family: var(--editable-card-section-title-font, inherit);
  }

  .bag-edit-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, minmax(0, 1fr)));
    gap: 0.9rem;
  }

  .bag-edit-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .bag-name-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
  }

  .auto-indicator {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-ink-muted);
  }

  .auto-indicator.auto {
    color: var(--accent-primary);
  }

  .reset-auto {
    border: none;
    background: none;
    color: var(--accent-primary);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .reset-auto:disabled {
    color: var(--text-ink-muted);
    cursor: not-allowed;
  }

  .auto-hint {
    color: var(--text-ink-muted);
    font-size: 0.75rem;
  }

  .date-input-wrapper {
    position: relative;
  }

  .detail-input--date {
    text-align: left;
    text-align-last: left;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .date-input-icon {
    position: absolute;
    top: 50%;
    right: 0.75rem;
    transform: translateY(-50%);
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  .bag-edit-field label {
    font-weight: var(--editable-card-label-weight, 500);
    color: var(--editable-card-label-color, var(--text-ink-secondary));
    font-size: var(--editable-card-label-size, 0.8rem);
    font-family: var(--editable-card-label-font, inherit);
  }

  .bag-edit-notes {
    padding: 0.6rem 0.75rem;
    background: var(--record-card-notes-bg, rgba(123, 94, 58, 0.06));
    border-radius: var(--record-card-notes-radius, var(--radius-sm));
    border: 1px solid rgba(123, 94, 58, 0.15);
  }

  @media (max-width: 900px) {
    .bag-content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .bag-header-main {
      flex-direction: column;
      align-items: flex-start;
    }

    .bag-preview {
      grid-template-columns: 1fr;
    }

    .bag-content {
      grid-template-columns: 1fr;
    }

    .bag-edit-grid {
      grid-template-columns: 1fr;
    }

    .card-media {
      width: min(100%, var(--editable-card-image-width, 200px));
    }
  }
</style>
