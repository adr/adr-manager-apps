import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertResult } from "sweetalert2";

/**
 * Replacement for the Vue-2-only `vue-simple-alert` plugin (`this.$alert` / `this.$confirm`),
 * backed directly by sweetalert2. `confirm` rejects on cancel, matching the old semantics so
 * existing `.then(...).catch(...)` chains keep working.
 */
export function useAlert() {
    const alert = (text: string, title = "", icon: SweetAlertIcon = "info"): Promise<SweetAlertResult> =>
        Swal.fire({ title, text, icon });

    const confirm = (text: string, title = "Are you sure?"): Promise<void> =>
        Swal.fire({ title, text, icon: "question", showCancelButton: true, confirmButtonText: "Yes" }).then(
            (result) => {
                if (!result.isConfirmed) {
                    throw new Error("cancelled");
                }
            }
        );

    return { alert, confirm };
}
