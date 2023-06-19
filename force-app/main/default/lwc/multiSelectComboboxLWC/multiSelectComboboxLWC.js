import {LightningElement, wire, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getData from '@salesforce/apex/MultiSelectComboboxController.getData';

export default class MultiSelectComboboxLwc extends LightningElement {
    @api
    sobjectName;
    @api
    updateSelection(deletedPills) {
        if (deletedPills) {
            let updatedPills = this.selectedValues.filter(pill => {
                return deletedPills.indexOf(pill) === -1;
            });
            this.selectedOptions = updatedPills;
        }
    }

    @track
    showOptions = false;
    @track
    showSpinner = false;
    @track
    showCreateRecordModal = false;
    @track
    options = [];

    newName;
    selectedValues = [];
    oldStateSelectedValues;
    searchString;
    labels = {
        checkboxGroupTitle: 'Выберите или создайте новое значение',
        closeButtonTitle : 'Отмена',
        newRecordButtonTitle: 'Создать запись',
        saveButtonTitle: 'Выбрать',
    }

    getRecords() {
        getData({ sObjectApiName: this.sobjectName})
            .then(result => {
                if (result.isSuccess) {
                    if (result.body && result.body.length > 0) {
                        this.prepareComboboxOptions(result.body);
                    } else {
                        this.showOptions = true;
                        this.showSpinner = false;
                    }
                    this.oldStateSelectedValues = [...this.selectedValues];
                } else {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Ошибка загрузки',
                            message: 'Ошибка загрузки',
                            variant: 'error',
                        }),
                    );
                }
            })
            .catch(error => {
                console.error(error)
                this.template.querySelector('.searchInputSelector').blur();
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Ошибка загрузки',
                        message: 'Ошибка загрузки!!!',
                        variant: 'error',
                    }),
                );
            })

    };

    get showSearchSpinner() {
        return this.showSpinner ? 'slds-is-relative slds-m-bottom_medium':'slds-hide'
    };

    set searchInput(value) {
        this.searchString = value;
    }

    get selectedOptions() {
        return this.selectedValues;
    }

    set selectedOptions(value) {
        this.selectedValues = value;
    }

    onNameChange(event) {
        this.newName = event.target.value
    }

    cancelSelection() {
        this.showOptions = false;
        this.selectedValues = [...this.oldStateSelectedValues];
        this.template.querySelector('.searchInputSelector').blur();
    }

    selectOptions() {
        this.showOptions = false;
        this.oldStateSelectedValues = [...this.selectedValues];
        let resultList = [];
        if (this.selectedValues.length > 0) {
            this.selectedValues.forEach(id => {
                let result = this.options.find(obj => obj.value === id);
                resultList.push(result);
            })
        }
        this.dispatchEvent(new CustomEvent('itemselected', {detail: resultList}))
    }

    openCreateModal(event) {
        event.target.blur();
        this.showCreateRecordModal = true;
    }

    hideCreateRecordModal() {
        this.showCreateRecordModal = false;
        this.template.querySelector('.searchInputSelector').focus();
    }

    handleRecordCreated(event) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Запись создана успешно',
                message: `Создана запись: ${event.detail.name}`,
                variant: 'success',
            }),
        );
        this.showSpinner = true;
        this.getRecords();
        if (event.detail.closeModal) {
            this.hideCreateRecordModal();
        }
    }

    handleKeyUp(event) {
        if (event.keyCode === 27) {
            this.cancelSelection();
        } else if (event.keyCode === 13) {
            this.selectOptions();
        }
    }

    showDropdown() {
        if (!this.options || this.options.length == 0) {
            this.getRecords();
        } else {
            this.showOptions = true;
            this.oldStateSelectedValues = [...this.selectedValues];
            this.scrollToOption();
        }
    }

    scrollToOption() {
        setTimeout(() => {
            let elem = this.template.querySelector('.slds-popover__footer_form');
            if (elem) {
                elem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);
    }

    prepareComboboxOptions (records) {
        try {
            let options = [];
            records.forEach(function (option) {
                options.push({'label': option.Name__c, 'value': option.Id})
            });
            this.showOptions = true;
            this.showSpinner = false;
            this.options = options;
            this.scrollToOption();
        } catch (e) {
            console.error(e)
        }
    }

    handleChange(event) {
        this.selectedOptions = event.detail.value;
    }

}