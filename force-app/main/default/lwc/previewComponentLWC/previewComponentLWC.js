import {LightningElement, track, api, wire} from 'lwc';

import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import {cloneObject, getFieldAttribute} from "c/utilComponent";

export default class PreviewComponentLwc extends LightningElement {
    @api
    set appointmentData(value) {
        this.appData = cloneObject(value);
    };

    get appointmentData() {
        return this.appData;
    };

    @track
    showObjectiveStatus = true;
    @track
    showEyeground = true;
    @track
    appData = {};

    @wire(getObjectInfo, {objectApiName: CONTACT_OBJECT })
    objectInfo;

    objectiveStatusFields = ['vgdFields', 'objectiveStatusFields'];
    eyeGroundFields = ['eyeGroundFields'];

    labels = {
        printButtonLabel       : 'Распечатать',
        fio                    : 'ФИО',
        birthdate              : 'Дата рождеия',
        complaints             : 'Жалобы',
        anamnesis              : 'Анамнез',
        toLongTextErrorMessage : 'Максимальное количество символов 5000',
        objectiveStatus        : 'Объективный статус',
        addSectionToPrint      : 'Добавить секцию в документ для печати?',
        eyeground              : 'Глазное дно',
        show                   : 'показать',
        diagnosis              : 'Диагноз',
        recommendations        : 'Рекомендации',
        appointmentDate        : 'Дата:',
        doctor                 : 'Врач: '
    }

    get patientName() {
        let fullName = '';
        if (this.appData.patient) {
            fullName =
                this.appData.patient.data.fields.Contact_Name__c.value;
        }
        return fullName;
    }

    get birthdate() {
        let birthdate;
        if (this.appData.patient) {
            birthdate = this.appData.patient.data.fields.Birthdate.value;
        }
        return birthdate;
    }

    get recordTypeId() {
        // Returns a map of record type Ids
        if (this.objectInfo && this.objectInfo.data) {
            const rtis = this.objectInfo.data.recordTypeInfos;
            return Object.keys(rtis).find(rti => rtis[rti].name === 'Doctor');
        } else {
            return null;
        }
    }

    get diagnosis() {
        if (this.appData.doctorAppointment.diagnosis__c) {
            let diagnosis = JSON.parse(this.appData.doctorAppointment.diagnosis__c);
            return diagnosis instanceof Array ? diagnosis.join('; ') : diagnosis;
        }
        return '';
    }

    get anamnesis() {
        return this.appData.doctorAppointment.anamnesis__c;
    }

    get complaints() {
        return this.appData.doctorAppointment.complaints__c;
    }

    get recommendations() {
        if (this.appData.doctorAppointment.recommendations__c) {
            let recommendations = JSON.parse(this.appData.doctorAppointment.recommendations__c);
            return recommendations instanceof Array ? recommendations.join('; ') : recommendations;
        }
        return '';
    }

    get appointmentDate() {
        if (this.appData.doctorAppointment.appointment_date__c) {
            return this.appData.doctorAppointment.appointment_date__c;
        }
        const today = new Date();
        return today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    }

    handleSelectDoctor(event) {
        const detail = event.detail;
        this.appData.doctorAppointment.doctor__c = detail.value;
    }

    printDocument() {
        this.dispatchEvent(new CustomEvent(
            'print',
            {
                detail : cloneObject(this.appData),
                bubbles: true,
                composed: true
            })
        );

    }

    handleChangeValue(event) {
        let field = getFieldAttribute(event, 'data-id').split('.');
        let value = event.target.value;
        let newValue = null;
        const re = new RegExp(/\s*;\s*/);
        if (value && re.test(value)) {
            try {
                newValue = JSON.stringify(value.trim().split(re));
            } catch (e) {
                console.error(e)
            }
        } else {
            newValue = getFieldAttribute(event, 'data-array') == 'true' ?  JSON.stringify([value]) : value;
        }
        if (newValue) {
            this.appData[field[0]][field[1]] = newValue;
        }
    }

    handleDataChange(event) {
        const newValue = event.detail;
        const field = getFieldAttribute(event, 'data-id');
        this.appData[field] = newValue;
    }

    handleShowSection(event) {
        this.showObjectiveStatus = event.target.checked;
        this.appData.objectiveStatus.is_active__c = event.target.checked + '';
    }

}