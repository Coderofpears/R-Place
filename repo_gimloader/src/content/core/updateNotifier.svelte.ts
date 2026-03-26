import Port from "$shared/net/port.svelte";
import { englishList } from "$shared/utils";
import { createConfirmToast } from "$shared/toast/create";

export default class UpdateNotifier {
    static init(availableUpdates: string[]) {
        if(availableUpdates.length > 0) {
            this.showToast(availableUpdates);
        }

        Port.on("availableUpdates", this.onUpdate.bind(this));
    }

    static onUpdate(availableUpdates: string[]) {
        if(availableUpdates.length > 0) this.showToast(availableUpdates);
    }

    static showToast(availableUpdates: string[]) {
        const names = englishList(availableUpdates);
        const descriptor = availableUpdates.length === 1 ? "has an update" : "have updates";
        const plural = availableUpdates.length === 1 ? "it" : "them";
        const message = `${names} ${descriptor} available. Would you like to download ${plural}?`;

        createConfirmToast(message, (apply) => {
            Port.sendAndRecieve("applyUpdates", { apply });
        });
    }
}
