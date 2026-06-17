import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import MarkdownPreview from "../src/components/MarkdownPreview.vue";

function render(markdown: string): HTMLElement {
    const wrapper = mount(MarkdownPreview, { props: { value: markdown } });
    return wrapper.get("[data-cy='markdownPreview']").element as HTMLElement;
}

describe("MarkdownPreview sanitization", () => {
    test("removes script-capable elements but keeps safe content", () => {
        const element = render("<script>alert(1)</script><style>p{color:red}</style>\n\nSafe text");

        expect(element.querySelector("script")).toBeNull();
        expect(element.querySelector("style")).toBeNull();
        expect(element.textContent).toContain("Safe text");
    });

    test("removes inline event handlers and style attributes from raw HTML", () => {
        const element = render('<a href="https://example.com" onclick="alert(1)" style="color:red">docs</a>');
        const link = element.querySelector("a");

        expect(link?.getAttribute("href")).toBe("https://example.com");
        expect(link?.hasAttribute("onclick")).toBe(false);
        expect(link?.hasAttribute("style")).toBe(false);
    });

    test("removes unsafe URLs while preserving safe markdown links", () => {
        const element = render(`
[safe](https://example.com/docs)

<a href="javascript:alert(1)">bad link</a>
<img src="data:text/html;base64,PHNjcmlwdD4=" alt="bad image">
`);
        const links = Array.from(element.querySelectorAll("a"));
        const image = element.querySelector("img");

        expect(links[0]?.getAttribute("href")).toBe("https://example.com/docs");
        expect(links[1]?.hasAttribute("href")).toBe(false);
        expect(image?.hasAttribute("src")).toBe(false);
        expect(image?.getAttribute("alt")).toBe("bad image");
    });
});
