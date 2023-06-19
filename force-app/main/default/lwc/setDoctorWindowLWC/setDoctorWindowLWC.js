import {api, LightningElement, track, wire} from 'lwc';
import { cloneObject, getFieldAttribute, fireCustomEvent} from 'c/utilComponent'
import {getObjectInfo} from "lightning/uiObjectInfoApi";
import CONTACT_OBJECT from '@salesforce/schema/Contact';

const doctorRTNames = ['Doctor', 'Доктор'];

export default class SetDoctorWindowLwc extends LightningElement {
    @api
    set doctorData(value) {
        if (value) {
            this.doctor = value.doctor;
            this.clinic = value.clinic;
        }
    }

    get doctorData() {
        return null;
    }

    @track
    doctor;
    @track
    clinic;
    @wire(getObjectInfo, { objectApiName: CONTACT_OBJECT })
    contactObjectInfo;
    labels = {
        title: 'Для продолжения работы выберите место приема и врача',
        doctorTitle: 'Врач',
        appointmentPlaceTitle: 'Место приема'
    }

    get recordTypeId() {
        // Returns a map of record type Ids
        if (this.contactObjectInfo && this.contactObjectInfo.data) {
            const rtis = this.contactObjectInfo.data.recordTypeInfos;
            return Object.keys(rtis).find(rti =>
                doctorRTNames.indexOf(rtis[rti].name) > -1
            );
        } else {
            return null;
        }

    }

    get doctorValue() {
        return this.doctor ? this.doctor.value : null;
    }

    get clinicValue() {
        return this.clinic ? this.clinic.value : null;
    }

    handleSelectValue(event) {
        const field = getFieldAttribute(event, 'data-id');
        this[field] = {...event.detail};
        if (this.doctor && this.clinic) {
            fireCustomEvent(this,'doctorchange', {doctor: cloneObject(this.doctor), clinic: cloneObject(this.clinic)})
        }
    }
}