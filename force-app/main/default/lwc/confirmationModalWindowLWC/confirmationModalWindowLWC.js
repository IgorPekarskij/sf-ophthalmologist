import {LightningElement, api} from 'lwc';

export default class ConfirmationModalWindowLwc extends LightningElement {
    @api
    confirmationText;

    labels = {
        'confirmButtonTitle' : 'Да',
        'cancelButtonTitle'  : 'Отмена'
    }

    handleKeyUp(event) {
        if (event.keyCode === 27) {
            this.hidePreviewModal();
        }
    }

    hidePreviewModal() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }

    confirm() {
        this.dispatchEvent(new CustomEvent('confirm'));
    }
}