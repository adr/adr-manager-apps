import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";

// Ported from the Vuetify 2 defaults / inline colors used across the app.
const palette = {
    primary: "#1976D2",
    secondary: "#424242",
    accent: "#82B1FF",
    success: "#4CAF50",
    error: "#FF5252",
    warning: "#FB8C00",
    info: "#2196F3",
    // The original "New ADR" button used Vuetify 2's near-black `dark` button colour.
    "btn-dark": "#272727"
};

export default createVuetify({
    icons: {
        defaultSet: "mdi",
        aliases,
        sets: { mdi }
    },
    theme: {
        defaultTheme: "light",
        themes: {
            // Both themes share the original Vuetify 2 palette so that `theme="dark"` surfaces
            // (e.g. the primary toolbar) keep the same primary colour, only flipping text to light.
            light: {
                dark: false,
                colors: palette
            },
            dark: {
                dark: true,
                colors: palette
            }
        }
    }
});
