// Ambient shims for third-party modules that ship no type declarations.
// vue-easy-dnd's drag/drop components are exercised via the running app / E2E, not vue-tsc,
// so they are typed permissively here. The drag payload (`data`) is inherently untyped.
declare module "vue-easy-dnd" {
    export interface DnDEvent {
        data: any;
        index: number;
    }
    // Constructor-style shape so vue-tsc accepts any prop and any slot (e.g. #drag-image).
    type PermissiveComponent = new () => {
        $props: Record<string, any>;
        $slots: Record<string, (...args: any[]) => any>;
    };
    export const Drag: PermissiveComponent;
    export const Drop: PermissiveComponent;
    export const DropMask: PermissiveComponent;
}
