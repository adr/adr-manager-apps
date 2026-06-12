import { computed, ref } from "vue";
import {
  matchesAdrSearch,
  extractAdrTitle,
  extractAdrStatus,
  isEmptyQuery,
  EMPTY_QUERY
} from "@adr-manager/core";
import { parseTagsFromMd } from "@adr-manager/core";
import type { AdrSearchQuery, SearchableAdr } from "@adr-manager/core";
import type { Tag } from "@/types/adr";
import type { AdrFile } from "@/types/adr";
import type { Repository } from "@/plugins/classes";
import { sortedAdrs } from "@/utils/adrFiles";

// ── Query state (module-level singleton so state persists across navigation) ──
const query = ref<AdrSearchQuery>({ ...EMPTY_QUERY });

export function useAdrSearch() {
  function setQuery(partial: Partial<AdrSearchQuery>) {
    query.value = { ...query.value, ...partial };
  }

  function clearQuery() {
    query.value = { ...EMPTY_QUERY };
  }

  function toggleStatus(status: string) {
    const current = query.value.statuses;
    setQuery({
      statuses: current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
    });
  }

  function toggleTagId(id: string) {
    const current = query.value.tagIds;
    setQuery({
      tagIds: current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    });
  }

  const active = computed(() => !isEmptyQuery(query.value));

  /** Build a SearchableAdr from an AdrFile's current markdown. */
  function toSearchable(file: AdrFile): SearchableAdr {
    const md = file.editedMd;
    return {
      title: extractAdrTitle(md),
      status: extractAdrStatus(md),
      tags: parseTagsFromMd(md)
    };
  }

  /**
   * Returns the filtered and sorted ADR list for a single repository.
   * When the query is empty the full sorted list is returned unchanged.
   */
  function filteredAdrs(repo: Repository): AdrFile[] {
    const all = sortedAdrs(repo);
    if (!active.value) return all;
    return all.filter((file) => matchesAdrSearch(toSearchable(file), query.value));
  }

  /**
   * Aggregates all unique tags across every ADR in the given repositories.
   * Used to populate the tag-filter chip list.
   */
  function availableTags(repos: Repository[]): Tag[] {
    const seen = new Map<string, Tag>();
    for (const repo of repos) {
      for (const file of repo.adrs) {
        for (const tag of parseTagsFromMd(file.editedMd)) {
          if (!seen.has(tag.id)) seen.set(tag.id, tag);
        }
      }
    }
    return [...seen.values()];
  }

  /**
   * Aggregates all unique statuses (non-empty, lowercase) across every ADR
   * in the given repositories. Used to populate the status-filter chip list.
   */
  function availableStatuses(repos: Repository[]): string[] {
    const seen = new Set<string>();
    for (const repo of repos) {
      for (const file of repo.adrs) {
        const s = extractAdrStatus(file.editedMd);
        if (s) seen.add(s);
      }
    }
    return [...seen];
  }

  return {
    query,
    active,
    setQuery,
    clearQuery,
    toggleStatus,
    toggleTagId,
    filteredAdrs,
    availableTags,
    availableStatuses
  };
}
