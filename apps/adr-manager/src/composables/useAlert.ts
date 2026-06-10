import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertResult } from "sweetalert2";

/**
 * Alert and confirm dialogs backed by sweetalert2. `confirm` rejects on cancel,
 * so callers can chain `.then(...)` for the confirmed path and `.catch(...)` for cancellation.
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
