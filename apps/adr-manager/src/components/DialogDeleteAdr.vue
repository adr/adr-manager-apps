<template>
    <v-dialog v-model="show" width="600">
        <template #activator="{ props }">
            <slot name="activator" :props="props" />
        </template>
        <v-card>
            <v-card-title>
                <div>
                    <v-avatar color="primary" size="35"> <v-icon color="white">mdi-delete</v-icon></v-avatar>
                    <span class="dialogTitle"> Delete ADR</span>
                </div>
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text> Are you sure you want to delete '{{ adr?.path }}'? </v-card-text>
            <v-divider></v-divider>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn data-cy="dialogDeleteAdrBtn" variant="text" color="success" @click="deleteAdr"> Delete </v-btn>
                <v-btn variant="text" color="error" @click="show = false"> Cancel </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { store } from "@/plugins/store";
import type { Repository } from "@/plugins/classes";
import type { AdrFile } from "@/types/adr";

const show = defineModel<boolean>({ default: false });
const props = defineProps<{ repo?: Repository | undefined; adr?: AdrFile | undefined }>();

function deleteAdr(): void {
    if (props.adr && props.repo) {
        store.deleteAdr(props.adr, props.repo);
    }
    show.value = false;
}
</script>

<style scoped></style>
