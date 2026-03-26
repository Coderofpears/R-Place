import { mount, unmount } from "svelte";
import MenuUI from "./MenuUI.svelte";

let menuComponent: MenuUI | null = null;
export function showMenu(tab = "plugins", officialOpen = false) {
    if(menuComponent) {
        menuComponent.setTab(tab, officialOpen);
        return;
    }

    menuComponent = mount(MenuUI, {
        target: document.body,
        props: {
            tab,
            officialOpen,
            onClose: () => {
                menuComponent = null;
                unmount(menuComponent);
                (document.activeElement as HTMLElement)?.blur();
            }
        }
    }) as MenuUI;
}
