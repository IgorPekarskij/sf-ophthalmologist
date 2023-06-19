import {LightningElement, track, api} from 'lwc';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import { createRecord } from 'lightning/uiRecordApi';

export default class CreateNewRecordModal extends LightningElement {
    @api
    sobjectName;

    @track
    showSpinner = false;

    closeModal = false;
    labels = {
        closeIconTitle : 'Закрыть',
        headerTitleText: 'Создать запись',
        saveButtonTitle: 'Сохранить',
        saveAndNewButtonTitle: 'Сохранить & Создать ещё',
        cancelButtonTitle: 'Отмена'
    }

    newName;
    get showSearchSpinner() {
        return this.showSpinner ? 'slds-is-relative slds-m-bottom_medium':'slds-hide'
    };

    renderedCallback() {
        this.template.querySelector('.selectorForInput').focus();
    }

    hideCreateRecordModal() {
        this.dispatchEvent(new CustomEvent('cancelcreate'));
    }

    onNameChange(event) {
        this.newName = event.target.value
    }

    createNewRecord() {
        this.showSpinner = true;
        const fields = {};
        let field = this.template.querySelector('.selectorForInput');
        if (!this.newName) {
            console.log(JSON.stringify(field));
            if (field) {
                console.log('error');
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Ошибка создания',
                        message: 'Заполните обязательное поле',
                        variant: 'error',
                    }),
                );
                field.reportValidity();
            }
            return;
        }
        fields.Name__c = this.newName;
        const recordInput = { apiName: this.sobjectName, fields };
        createRecord(recordInput)
            .then(record => {
                this.showSpinner = false;
                this.dispatchEvent(new CustomEvent('recordcreated',
                    {detail: {
                        name: record.fields.Name__c.value,
                        closeModal: this.closeModal}
                    }
                ));
                field.reset();
            })
            .catch(error => {
                this.showSpinner = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Ошибка создания',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
    }

    handleSave() {
        this.closeModal = true;
        this.createNewRecord();
    }

    handleSaveAndNew() {
        this.closeModal = false;
        this.createNewRecord();
    }

    handleKeyUp(event) {
        if (event.keyCode === 27) {
            this.dispatchEvent(new CustomEvent('closemodal'));
        } else if (event.keyCode === 13) {
            this.createNewRecord();
        }
    }

    handleSubmit(event) {
        event.preventDefault();
    }
}