// Ambient shims for third-party modules that ship no type declarations.
// vue-easy-dnd's drag/drop components are exercised via the running app / E2E, not vue-tsc,
// so they are typed permissively here. The drag payload (`data`) is inherently untyped.
declare module "vue-easy-dnd" {
    import type { DefineComponent } from "vue";
    export interface DnDEvent {
        data: any;
        index: number;
    }
    export const Drag: DefineComponent<any, any, any>;
    export const Drop: DefineComponent<any, any, any>;
    export const DropMask: DefineComponent<any, any, any>;
}
