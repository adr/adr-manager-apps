import { reactive } from "vue";
import { mount } from "@vue/test-utils";
import MadrListEditor from "@/components/MadrListEditor.vue";

function mountList(list: string[]) {
    return mount(MadrListEditor, { props: { list, placeholder: "an item…" } });
}

test("renders one row per item plus an add row", () => {
    const wrapper = mountList(["first", "second"]);
    expect(wrapper.findAll("[data-cy=listItemInput]")).toHaveLength(2);
    expect(wrapper.findAll("[data-cy=listAddInput]")).toHaveLength(1);
});

test("typing in the add row appends an item and clears the draft", async () => {
    const list = ["first"];
    const wrapper = mountList(list);

    await wrapper.find("[data-cy=listAddInput]").setValue("second");

    expect(list).toEqual(["first", "second"]);
    expect((wrapper.find("[data-cy=listAddInput]").element as HTMLInputElement).value).toBe("");
    expect(wrapper.findAll("[data-cy=listItemInput]")).toHaveLength(2);
});

test("editing a row writes through to the bound list", async () => {
    const list = ["first", "second"];
    const wrapper = mountList(list);

    await wrapper.findAll("[data-cy=listItemInput]")[1]?.setValue("changed");

    expect(list).toEqual(["first", "changed"]);
});

test("the delete button removes the row", async () => {
    const list = ["first", "second"];
    const wrapper = mountList(list);

    await wrapper.findAll(".row-del")[0]?.trigger("click");

    expect(list).toEqual(["second"]);
    expect(wrapper.findAll("[data-cy=listItemInput]")).toHaveLength(1);
});

test("a row emptied and blurred is removed", async () => {
    const list = ["first", "second"];
    const wrapper = mountList(list);

    const row = wrapper.findAll("[data-cy=listItemInput]")[0];
    await row?.setValue("   ");
    await row?.trigger("blur");

    expect(list).toEqual(["second"]);
});

test("external list changes are reflected in the rows", async () => {
    // In the app the list always belongs to a reactive ADR record.
    const list = reactive(["first"]);
    const wrapper = mountList(list);

    list.push("second");
    await wrapper.vm.$nextTick();

    const rows = wrapper.findAll("[data-cy=listItemInput]");
    expect(rows).toHaveLength(2);
    expect((rows[1]?.element as HTMLInputElement).value).toBe("second");
});
