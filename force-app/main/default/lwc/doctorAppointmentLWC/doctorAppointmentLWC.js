import {LightningElement, track, api, wire} from 'lwc';

import DocLogo from '@salesforce/resourceUrl/DocLogo';

import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getRecord } from 'lightning/uiRecordApi';


import saveAppointment from '@salesforce/apex/DoctorAppointmentController.createRecord';
import {cloneObject, getOneComponentDataBySelector} from "c/utilComponent";

const FIELDS = [
    'Contact.Id',
    'Contact.FirstName',
    'Contact.LastName',
    'Contact.MiddleName',
    'Contact.Contact_Name__c',
    'Contact.Phone',
    'Contact.MobilePhone',
    'Contact.MailingStreet',
    'Contact.MailingCity',
    'Contact.MailingCountry',
    'Contact.Birthdate',
    'Contact.RecordType.Name'
];

const CONTACT_PATIENT_RECORD_TYPE_NAME = 'Patient';

export default class DoctorAppointmentLWC extends LightningElement {
    @api
    recordId;
    @track
    data;
    @track
    appointmentObjectForPrint = {};
    @track
    doctor;
    @track
    clinic;
    showPreviewModal = false;
    showStartButton = true;
    showUpdateDoctorDataWindow = false;
    showConfirmWindow = false;
    confirmationText = 'Вы действительно хотите создать новый прием?';

    savedAppointmentData;
    docLogo = DocLogo;
    doctorData;
    labels = {
        'newAppointmentButtonLabel' : 'Новый прием',
        'logoTitle'                 : this.headerText,
        'changeDoctorButtonLabel'   : 'Изменить - Врач/Прием',
        'saveButtonLabel'           : 'Сохранить',
        'printButtonLabel'          : 'Печать',
        'patientTitle'              : 'Пациент',
        'patientFIO'                : 'ФИО',
        'mobileTitle'               : 'Мобильный телефон',
        'addressTitle'              : 'Домашний адрес',
        'phoneTitle'                : 'Домашний телефон',
        'birthdateTitle'            : 'Домашний телефон',
        'complaintsTitle'           : 'Жалобы',
        'objectiveStatusTitle'      : 'Объективный статус',
        'eyegroundTitle'            : 'Глазное дно',
        'diagnosisTitle'            : 'Диагноз',
        'recommendationsTitle'      : 'Рекомендации',
        'paymentTitle'              : 'Оплата',
        'functionNotAllowMessage'   : 'Эта функция доступна только для контактов типа - "Пациент"'
    };

    connectedCallback() {
        console.log('recordId ' + JSON.stringify(this.recordId))
    }

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    patient;

    get isFeatureAllowed() {
        return this.patient && this.patient.data && this.patient.data.fields.RecordType.value.fields.Name.value === CONTACT_PATIENT_RECORD_TYPE_NAME
    }

    get disablePrintButton() {
        return !this.savedAppointmentData || !this.savedAppointmentData.appointmentId
    }

    get patientName() {
        return this.patient && this.patient.data ? this.patient.data.fields.Contact_Name__c.value : "";
    }

    get mobilePhone() {
        return this.patient && this.patient.data && this.patient.data.fields.MobilePhone ?
            this.patient.data.fields.MobilePhone.value : '';
    }

    get mailingStreet() {
        return this.patient && this.patient.data && this.patient.data.fields.MailingStreet ?
            this.patient.data.fields.MailingStreet.value : '';
    }

    get mailingCity() {
        return this.patient && this.patient.data && this.patient.data.fields.MailingCity ?
            this.patient.data.fields.MailingCity.value : '';
    }

    get mailingCountry() {
        return this.patient && this.patient.data && this.patient.data.fields.MailingCountry ?
            this.patient.data.fields.MailingCountry.value : '';
    }

    get homePhone() {
        return this.patient && this.patient.data && this.patient.data.fields.HomePhone ?
            this.patient.data.fields.HomePhone.value : '';
    }

    get birthdate() {
        return this.patient && this.patient.data && this.patient.data.fields.Birthdate ?
            this.patient.data.fields.Birthdate.value : '';
    }

    get showMainScreen() {
        return this.doctor && this.clinic
    }

    get headerText() {
        return this.clinic ? `${this.clinic.title.toUpperCase()} МИКРОХИРУРГИИ ГЛАЗА МАКАРЧУКА` : '';
    }

    startNewAppointment() {
        this.showUpdateDoctorDataWindow = true;
    }

    saveAppointmentHandler() {
        let appointment = this.prepareDateForSaving();

        if (this.savedAppointmentData && this.savedAppointmentData.appointmentId) {
            appointment.doctorAppointment.id = this.savedAppointmentData.appointmentId;
            appointment.doctorAppointment.id = this.savedAppointmentData.appointmentId;
            appointment.doctorAppointment.id = this.savedAppointmentData.appointmentId;
            appointment.objectiveStatus.id =  this.savedAppointmentData.objStatus;
            appointment.eyeground.id =  this.savedAppointmentData.eyeGround;
        }
        this.saveAppointment(appointment);
    }

    saveAppointment(appointment, printPage = false) {
        saveAppointment({
            data : JSON.stringify(appointment)
        })
            .then((result) => {
                if (result.isSuccess) {
                    this.savedAppointmentData = result.body;
                    //objStatus eyeGround
                    if (printPage) {
                        let iframeUrl =  `https://${window.location.hostname}/apex/ResultOfDoctorExaminationPage?id=${this.savedAppointmentData.appointmentId}`;
                        window.open(iframeUrl, 'blank');
                    } else {
                        this.showToast('Сохраненено', 'Запись приема сохранена успешно', 'success')
                    }
                } else {
                    this.showToast('Ошибка', result.message, 'error');
                }
            })
            .catch((error) => {
                console.error(error)
                this.showToast('Ошибка', error.body.message, 'error');
            })
    }

    openPreviewTab() {
        this.appointmentObjectForPrint.patient = {...this.patient};
        this.appointmentObjectForPrint.appointmentId = this.savedAppointmentData.appointmentId;
        this.showPreviewModal = true;
    }

    hidePreviewModal() {
        this.showPreviewModal = false;
    }

    prepareDateForSaving() {
        const today = new Date();
        let complaintsData = getOneComponentDataBySelector(this.template, '[data-id="complaintsComponent"]');
        let diagnosisData = getOneComponentDataBySelector(this.template, '[data-id="diagnosisComponent"]');
        let recommendationsData = getOneComponentDataBySelector(this.template, '[data-id="recommendationsComponent"]');
        let objectiveInvestigation = getOneComponentDataBySelector(this.template, '[data-id="objectiveInvestigation"]');
        let eyeGroundInvestigation = getOneComponentDataBySelector(this.template, '[data-id="eyeGroundInvestigation"]');

        let dataObject = {
            doctorAppointment: {
                patient__c: this.patient.data.fields.Id.value,
                anamnesis__c: complaintsData ? complaintsData.anamnesis : null,
                appointment_date__c: today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate(),
                complaints__c: complaintsData ? complaintsData.complaints : null,
                diagnosis__c: diagnosisData,
                doctor__c: this.doctor.value,
                appointment_place__c: this.clinic.value,
                objective_status__c: null,
                eyeground_investigation__c: null,
                recommendations__c: recommendationsData
            },
            objectiveStatus: objectiveInvestigation || {is_active__c: 'true'},
            eyeground: eyeGroundInvestigation || {is_active__c: 'true'}
        };
        this.appointmentObjectForPrint = dataObject;
        console.log(JSON.stringify(dataObject));
        return dataObject;
    }

    showToast(title, message, type) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: type,
            })
        );
    }

    handlePrintDocument(event) {
        event.stopPropagation();
        let appData = cloneObject(event.detail);
        if (this.savedAppointmentData && this.savedAppointmentData.appointmentId) {
            appData.doctorAppointment.id = this.savedAppointmentData.appointmentId;
            appData.objectiveStatus.id =  this.savedAppointmentData.objStatus;
            appData.eyeground.id =  this.savedAppointmentData.eyeGround;
        }
        this.saveAppointment(appData, true);
    }

    handleDoctorUpdate(event) {
        console.log('handleDoctorUpdate ' + JSON.stringify(event.detail))
        this.doctor = event.detail.doctor;
        this.clinic = event.detail.clinic;
        this.showStartButton = false;
    }

    handleCancel() {
        this.showUpdateDoctorDataWindow = false;
        if (! this.doctor || !this.clinic) {
            this.showStartButton = true;
        }
    }

    handleCancelConfirm() {
        this.showConfirmWindow = false;
    }

    openChangeDoctorScreen() {
        this.doctorData = {doctor: this.doctor, clinic: this.clinic};
        this.showUpdateDoctorDataWindow = true;
    }

    handleConfirmNewAppointment() {
        console.log('handleConfirmNewAppointment');
        this.clinic = null;
        this.doctor = null;
        this.showStartButton = true;
        this.showConfirmWindow = false;
    }

    handleNewAppointment() {
        this.showConfirmWindow = true;
    }
}