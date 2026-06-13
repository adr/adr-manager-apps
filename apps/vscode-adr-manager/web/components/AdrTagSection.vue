<template>
  <div class="tag-section">
    <!-- Assigned chips row -->
    <div class="tag-row">
      <span
        v-for="tag in tags"
        :key="tag.id"
        class="tag-chip"
        :style="{ '--tag-color': tag.color }"
      >
        <span class="tag-dot"></span>
        <span class="tag-label">{{ tag.label }}</span>
        <button type="button" class="tag-remove" :aria-label="`Remove tag ${tag.label}`" @click="removeTag(tag)">
          <i class="codicon codicon-close"></i>
        </button>
      </span>

      <div ref="pickerWrap" class="picker-wrap">
        <button
          type="button"
          class="tag-add-btn"
          :class="{ open: dropdownOpen }"
          @click="dropdownOpen = !dropdownOpen"
        >
          <i class="codicon codicon-tag"></i>
          Add tag
        </button>

        <!-- Dropdown -->
        <div v-if="dropdownOpen" class="tag-menu">
          <!-- Recently used -->
          <template v-if="suggestions.length > 0">
            <p class="menu-label">Recently used</p>
            <div
              v-for="tag in suggestions"
              :key="tag.id"
              class="menu-tag-row"
              @click="addTag(tag)"
            >
              <span class="tag-chip" :style="{ '--tag-color': tag.color }">
                <span class="tag-dot"></span>
                <span class="tag-label">{{ tag.label }}</span>
              </span>
            </div>
            <hr class="menu-divider" />
          </template>

          <!-- Create new -->
          <p class="menu-label">New tag</p>
          <input
            ref="labelInputEl"
            v-model="newLabel"
            class="new-tag-input"
            placeholder="Label…"
            maxlength="32"
            @keydown.enter.prevent="createTag"
          />
          <div class="palette-row">
            <button
              v-for="c in TAG_PALETTE"
              :key="c"
              type="button"
              class="swatch"
              :class="{ selected: newColor === c }"
              :style="{ background: c }"
              :aria-label="`Pick color ${c}`"
              @click="newColor = c"
            ></button>
          </div>
          <div class="menu-foot">
            <button
              type="button"
              class="create-btn"
              :disabled="!newLabel.trim()"
              @click="createTag"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { TAG_PALETTE } from "@adr-manager/core";
import type { Tag } from "@adr-manager/core";

const MAX_RECENT = 4;

export default defineComponent({
  name: "AdrTagSection",
  props: {
    tags: {
      type: Array as PropType<Tag[]>,
      default: () => []
    },
    recentTags: {
      type: Array as PropType<Tag[]>,
      default: () => []
    }
  },
  emits: ["update:tags", "update:recentTags"],
  setup(props, { emit }) {
    const dropdownOpen = ref(false);
    const newLabel = ref("");
    const newColor = ref<string>(TAG_PALETTE[0]);
    const pickerWrap = ref<HTMLElement | null>(null);
    const labelInputEl = ref<HTMLInputElement | null>(null);

    const suggestions = computed((): Tag[] => {
      const assignedIds = new Set(props.tags.map((t) => t.id));
      return props.recentTags.filter((t) => !assignedIds.has(t.id)).slice(0, MAX_RECENT);
    });

    function pushRecent(tag: Tag): Tag[] {
      const updated = props.recentTags.filter((t) => t.id !== tag.id);
      updated.unshift(tag);
      return updated.slice(0, MAX_RECENT);
    }

    function addTag(tag: Tag) {
      if (props.tags.some((t) => t.id === tag.id)) return;
      const updatedRecent = pushRecent(tag);
      emit("update:recentTags", updatedRecent);
      emit("update:tags", [...props.tags, tag]);
      dropdownOpen.value = false;
    }

    function removeTag(tag: Tag) {
      emit("update:tags", props.tags.filter((t) => t.id !== tag.id));
    }

    function createTag() {
      const label = newLabel.value.trim();
      if (!label) return;
      const id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const tag: Tag = { id, label, color: newColor.value };
      const updatedRecent = pushRecent(tag);
      emit("update:recentTags", updatedRecent);
      emit("update:tags", [...props.tags, tag]);
      newLabel.value = "";
      dropdownOpen.value = false;
    }

    // Focus label input when dropdown opens.
    watch(dropdownOpen, (isOpen) => {
      if (isOpen) {
        nextTick(() => labelInputEl.value?.focus());
      }
    });

    // Close dropdown on outside click.
    function onDocClick(e: MouseEvent) {
      if (pickerWrap.value && !pickerWrap.value.contains(e.target as Node)) {
        dropdownOpen.value = false;
      }
    }
    onMounted(() => document.addEventListener("click", onDocClick, true));
    onBeforeUnmount(() => document.removeEventListener("click", onDocClick, true));

    return {
      TAG_PALETTE,
      dropdownOpen,
      newLabel,
      newColor,
      pickerWrap,
      labelInputEl,
      suggestions,
      addTag,
      removeTag,
      createTag
    };
  }
});
</script>

<style scoped>
.tag-section {
  margin: 14px 0 4px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* Chip */
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 7px 0 6px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--tag-color) 35%, transparent);
  background: color-mix(in srgb, var(--tag-color) 12%, transparent);
  color: color-mix(in srgb, var(--tag-color) 85%, var(--vscode-foreground));
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  user-select: none;
}

.tag-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tag-color);
  flex: 0 0 auto;
}

.tag-label {
  line-height: 1;
}

.tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  color: inherit;
  padding: 0;
  opacity: 0.6;
  margin-left: 1px;
}

.tag-remove:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--tag-color) 25%, transparent);
}

.tag-remove .codicon {
  font-size: 10px;
}

/* Add button */
.picker-wrap {
  position: relative;
  display: inline-block;
}

.tag-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px 0 6px;
  border-radius: 999px;
  border: 1px dashed var(--vscode-input-border, #555);
  background: transparent;
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--vscode-font-family);
  transition: border-color 0.12s, color 0.12s;
}

.tag-add-btn:hover,
.tag-add-btn.open {
  border-color: var(--vscode-focusBorder, #007fd4);
  color: var(--vscode-focusBorder, #007fd4);
}

.tag-add-btn .codicon {
  font-size: 13px;
}

/* Dropdown */
.tag-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 230px;
  background: var(--vscode-dropdown-background, #252526);
  border: 1px solid var(--vscode-dropdown-border, #454545);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
  padding: 10px;
  z-index: 60;
}

.menu-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground);
  margin: 0 0 5px;
}

.menu-tag-row {
  padding: 3px 4px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  margin-bottom: 2px;
}

.menu-tag-row:hover {
  background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.06));
}

.menu-divider {
  border: 0;
  border-top: 1px solid var(--vscode-dropdown-border, #454545);
  margin: 7px 0;
}

.new-tag-input {
  width: 100%;
  box-sizing: border-box;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--vscode-input-border, #3c3c3c);
  border-radius: 2px;
  background: var(--vscode-input-background, #3c3c3c);
  color: var(--vscode-input-foreground);
  font-size: 12px;
  font-family: var(--vscode-font-family);
  margin-bottom: 8px;
  outline: none;
}

.new-tag-input:focus {
  border-color: var(--vscode-focusBorder, #007fd4);
}

.palette-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.1s;
  flex: 0 0 auto;
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch.selected {
  border-color: var(--vscode-foreground);
  transform: scale(1.15);
}

.menu-foot {
  display: flex;
  justify-content: flex-end;
}

.create-btn {
  height: 26px;
  padding: 0 12px;
  font-size: 11px;
  font-family: var(--vscode-font-family);
  background: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, #fff);
  border: none;
  border-radius: 2px;
  cursor: pointer;
}

.create-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.create-btn:not(:disabled):hover {
  background: var(--vscode-button-hoverBackground, #1177bb);
}
</style>
