/**
 * Created by Igor Pekarskij on 19.06.2023.
 */

import {LightningElement} from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {cloneObject, getOneComponentDataBySelector, getValidDateString, checkRequiredFields} from "c/utilComponent";
import saveAppointment from '@salesforce/apex/DoctorAppointmentController.createRecord';
import LightningConfirm from 'lightning/confirm';

import DocLogo from '@salesforce/resourceUrl/DocLogo';

export default class NewAppointment extends LightningElement {
    data;
    appointmentObjectForPrint = {};
    patient = {};
    showPreviewModal = false;
    showConfirmWindow = false;
    savedAppointmentData;
    doctorData;
    currentTab = 'patient';

    labels = {
        'newAppointmentButtonLabel' : 'Новый прием',
        'logoTitle'                 : this.headerText,
        'changeDoctorButtonLabel'   : 'Изменить - Врач/Прием',
        'saveButtonLabel'           : 'Сохранить',
        'printButtonLabel'          : 'Печать',
        'patientTitle'              : 'Пациент',
        'patientFIO'                : 'ФИО',
        'mobileTitle'               : 'Телефон',
        'addressTitle'              : 'Домашний адрес',
        'phoneTitle'                : 'Домашний телефон',
        'birthdateTitle'            : 'Дата рождения',
        'complaintsTitle'           : 'Жалобы',
        'objectiveStatusTitle'      : 'Объективный статус',
        'eyegroundTitle'            : 'Глазное дно',
        'diagnosisTitle'            : 'Диагноз',
        'recommendationsTitle'      : 'Рекомендации',
        'paymentTitle'              : 'Оплата',
        'functionNotAllowMessage'   : 'Эта функция доступна только для контактов типа - "Пациент"',
        DocLogo
    };

    get disablePrintButton() {
        return !this.savedAppointmentData || !this.savedAppointmentData.appointmentId
    }

    get headerText() {
        return this.clinic ? `${this.clinic.title.toUpperCase()}` : '';
    }

    saveAppointmentHandler() {
        let appointment = this.prepareDateForSaving();

        if (this.savedAppointmentData && this.savedAppointmentData.appointmentId) {
            appointment.doctorAppointment.id = this.savedAppointmentData.appointmentId;
            appointment.objectiveStatus.id =  this.savedAppointmentData.objStatus;
            appointment.eyeground.id =  this.savedAppointmentData.eyeGround;
        }
        this.savedAppointmentData = appointment;
        console.log(this.savedAppointmentData)
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
        const hasError = checkRequiredFields(this, '.required-field');
        console.log('isValid', hasError)
        if(!hasError) {
            this.saveAppointmentHandler()
            //this.appointmentObjectForPrint.patient = {...this.patient};
            this.appointmentObjectForPrint.appointmentId = this.savedAppointmentData.appointmentId;
            this.showPreviewModal = true;
        } else {
            this.currentTab = 'patient';
        }

        console.log('this.currentTab', this.currentTab)
    }

    hidePreviewModal() {
        this.showPreviewModal = false;
    }

    prepareDateForSaving() {
        const today = getValidDateString();
        let complaintsData = getOneComponentDataBySelector(this.template, '[data-id="complaintsComponent"]');
        let diagnosisData = getOneComponentDataBySelector(this.template, '[data-id="diagnosisComponent"]');
        let recommendationsData = getOneComponentDataBySelector(this.template, '[data-id="recommendationsComponent"]');
        let objectiveInvestigation = getOneComponentDataBySelector(this.template, '[data-id="objectiveInvestigation"]');
        let eyeGroundInvestigation = getOneComponentDataBySelector(this.template, '[data-id="eyeGroundInvestigation"]');

        let dataObject = {
            doctorAppointment: {
                anamnesis__c: complaintsData ? complaintsData.anamnesis : null,
                //appointment_date__c: today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate(),
                appointment_date__c: today,
                complaints__c: complaintsData ? complaintsData.complaints : null,
                diagnosis__c: diagnosisData,
                doctor__c: '0032w000002anI5AAI', //TODO Change to selector
                objective_status__c: null,
                eyeground_investigation__c: null,
                recommendations__c: recommendationsData,
                patient_name__c: this.patient.patient_name__c,
                patient_address__c: this.patient.patient_address__c,
                patient_birthdate__c: this.patient.patient_birthdate__c ? this.patient.patient_birthdate__c : null,
                patient_phone__c: this.patient.patient_phone__c
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

    handlePatientDataChange(event) {
        const field = event.target.dataset.id;
        let value = event.target.value;
        if(field === 'patient_birthdate__c') {
            value = getValidDateString(new Date(value));
        }
        this.patient[field] = value;
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

    async handleNewAppointment() {
        const result = await LightningConfirm.open({
            message: 'Вы действительно хотите создать новый прием?',
            variant: 'headerless',
        });
        // confirm modal has been closed
        if(result) {
            location.reload();
        }
    }

    handleActiveTab(event) {
        this.currentTab = event.target;
    }
}