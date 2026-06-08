<template>
    <v-dialog v-model="show" width="600">
        <template #activator="{ props }">
            <slot name="activator" :props="props" />
        </template>
        <v-card>
            <v-card-title>
                <div>
                    <v-avatar color="primary" size="35"> <v-icon color="white">mdi-folder-remove</v-icon></v-avatar>
                    <span class="dialogTitle"> Remove Repository</span>
                </div>
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text>
                <div>Are you sure you want to remove '{{ repo?.name }}'? Your changes will be deleted!</div>
                You can always add it again using the 'Add Repository' button.
            </v-card-text>
            <v-divider></v-divider>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn data-cy="removeRepoBtn" variant="text" color="success" @click="removeRepo"> Remove </v-btn>
                <v-btn variant="text" color="error" @click="show = false"> Cancel </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
const show = defineModel<boolean>({ default: false });

defineProps<{ repo?: { name: string } }>();
const emit = defineEmits<{ "remove-repo": [] }>();

function removeRepo(): void {
    emit("remove-repo");
    show.value = false;
}
</script>

<style scoped></style>
