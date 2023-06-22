import {LightningElement, track, api} from 'lwc';
import {cloneObject} from "c/utilComponent";

export default class PreviewModalWindow extends LightningElement {
    @api
    set inputDat(value) {
        console.log(JSON.stringify(value))
        this.dataForPreview = cloneObject(value);
    }

    get inputDat() {
        return this.dataForPreview;
    }

    @track
    dataForPreview = {};

    handleKeyUp(event) {
        if (event.keyCode === 27) {
            this.hidePreviewModal();
        }
    }

    hidePreviewModal() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }
}