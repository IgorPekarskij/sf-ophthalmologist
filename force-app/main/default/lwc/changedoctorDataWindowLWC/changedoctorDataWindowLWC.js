import {LightningElement, track, api} from 'lwc';
import { cloneObject, getFieldAttribute, fireCustomEvent} from 'c/utilComponent'

export default class ChangedoctorDataWindowLwc extends LightningElement {
    @api
    set doctorData(value) {
        if (value) {
            this.appointmentGenData = cloneObject(value);

        }
    };
    get doctorData() {
        return this.appointmentGenData;
    };

    @track
    appointmentGenData;
    @track
    doctor;
    @track
    clinic;

    localstorageKey = 'doctorDataValue#@@#';
    labels = {
        closeIconTitle : 'Закрыть',
        headerTitleText: 'Выберите доктора и место приема',
        saveButtonTitle: 'Сохранить',
        cancelButtonTitle: 'Отмена'
    };

    connectedCallback() {
        this.getDataFromLocalstorage();
    }

    get disableSaveButton() {
        return !this.doctor || !this.clinic;
    }

    hideModal() {
        fireCustomEvent(this,'cancelchange');
    }

    updateData() {
        fireCustomEvent(this,'doctordatachange', {doctor: cloneObject(this.doctor), clinic: cloneObject(this.clinic)});
        this.setLocalStorageData();
        this.hideModal();
    }

    handleDoctorUpdate(event) {
        this.clinic = event.detail.clinic;
        this.doctor = event.detail.doctor;
    }

    getDataFromLocalstorage() {
        let storedData = localStorage.getItem(this.localstorageKey);
        if (!this.appointmentGenData && storedData) {
            let restoredData = JSON.parse(storedData);
            let todayDate = restoredData.date;
            if (todayDate == new Date().toLocaleDateString()) {
                this.appointmentGenData = restoredData.value;
                this.clinic = restoredData.value.clinic;
                this.doctor = restoredData.value.doctor;
            }
        }
    }

    setLocalStorageData() {
        let storedData = {
            date: new Date().toLocaleDateString(),
            value: {
                doctor: this.doctor,
                clinic: this.clinic
            }
        };
        localStorage.setItem(this.localstorageKey, JSON.stringify(storedData));
    }

    handleKeyUp(event) {
        if (event.keyCode === 27) {
            this.hideModal()
        }
    }
}