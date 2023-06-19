import { LightningElement, api } from 'lwc';

export default class LookupOption extends LightningElement {
    @api
    option;

    get optionClass() {
        let classes = ['slds-media', 'slds-listbox__option', 'slds-listbox__option_entity'];

        if (this.option.subtitle) {
            classes.push('slds-listbox__option_has-meta');
        }

        if (this.option.highlighted) {
            classes.push('slds-has-focus');
        }

        return classes.join(' ');
    }

    handleMousedown(event) {
        event.preventDefault();

        const optionMousedownEvent = new CustomEvent('optionmousedown', {
            detail: {
                option: this.option
            }
        });
        this.dispatchEvent(optionMousedownEvent);
    }
}