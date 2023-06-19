import {LightningElement, api, track, wire} from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import OBJECTIVE_STATUS_OBJECT from '@salesforce/schema/Objective_status__c';
import VISUS from '@salesforce/schema/Objective_status__c.Visus_Left_Eye__c';
import VISUS_COR from '@salesforce/schema/Objective_status__c.Visus_Left_Cor__c';

import {objectiveStatusFields, createFieldId, getFieldAttribute, validateInput, getAllComponentDataBySelector} from 'c/utilComponent'

export default class ObjectiveEyeInvestigationLwc extends LightningElement {
    @api
    isLeftEye;
    @api
    getData() {
        getAllComponentDataBySelector(this.template, '.selectorCombo', 'data-id', this.objectiveStatusData)
        this.objectiveStatusData[`show_visus_correction_${this.isLeftEye === 'true' ? 'left' : 'right'}__c`] = this.showCorrection + '';
        return Object.keys(this.objectiveStatusData).length === 0 && this.objectiveStatusData.constructor === Object ? null : {...this.objectiveStatusData};
    }

    @track
    selectedVisus='';
    @track
    selectedVisusCor='';
    @track
    defaultRtId;
    @track
    visusOpt = [];
    @track
    visusOptCor = [];
    @track
    showCorrection = true;

    objectiveStatusData = {};
    fieldsData = [];
    isRenderFirstTime = true;
    labels = {
        visusTitle : 'Visus',
        sphereTitle : 'SPH',
        cylinderTitle : 'CYL',
        axisTitle : 'AX',
        innerPressureTitle : 'ВГД',
        ctrTitle : 'ЦТР',
        pzoTitle : 'ПЗО',
        withCorrection : 'С коррекцией',
        withoutCorrection : 'Н К'
    }

    connectedCallback() {
        if(this.isRenderFirstTime) {
            objectiveStatusFields.forEach(field => {
               let currField = {...field};
               let fieldId = createFieldId(currField.id, this.isLeftEye);
                currField.id = fieldId;
               this.fieldsData.push(currField);
            });
            this.isRenderFirstTime = false;
        }
    }

    get visusId() {
        return createFieldId('visus_{@}_eye__c', this.isLeftEye);
    }
    get visusCorId() {
        return createFieldId('visus_{@}_cor__c', this.isLeftEye);
    }
    get sphereId() {
        return createFieldId('sphere_{@}_cor__c', this.isLeftEye);
    }
    get cylinderId() {
        return createFieldId('cylinder_{@}_cor__c', this.isLeftEye);
    }
    get axysId() {
        return createFieldId('axys_{@}_cor__c', this.isLeftEye);
    }

    get innerPressureId() {
        return createFieldId('inner_eye_pressure_{@}__c', this.isLeftEye);
    }
    get cornThinkId() {
        return createFieldId('central_corneal_thickness_{@}__c', this.isLeftEye);
    }
    get antPostAxId() {
        return createFieldId('anterior_posterior_axis_{@}__c', this.isLeftEye);
    }

    get defaultRecordTypeId () {
        return this.objectInfo && this.objectInfo.data ? this.objectInfo.data.defaultRecordTypeId: ''
    }

    @wire(getObjectInfo, { objectApiName: OBJECTIVE_STATUS_OBJECT })
    objectInfo(data, error) {

        if(data && data.data) {
            this.defaultRtId = data.data.defaultRecordTypeId;
        } else if (error) {
            this.error = error;
        }
    };

    @wire(getPicklistValues, { recordTypeId: '$defaultRtId', fieldApiName: VISUS })
    visusOptions(data, error) {
        if(this.defaultRtId && data && data.data) {
            let options = [];
            data.data.values.forEach(opt => {
                options.push({label: opt.label, value: opt.value})
            })
            this.visusOpt = data.data.values;
        }
    };

    @wire(getPicklistValues, { recordTypeId: '$defaultRtId', fieldApiName: VISUS_COR })
    visusCorOptions(data, error) {
        if(this.defaultRtId && data && data.data) {
            let options = [];
            data.data.values.forEach(opt => {
                options.push({label: opt.label, value: opt.value})
            })
            this.visusOptCor = data.data.values;
        }
    };

    validateInputData(event) {
        let value = validateInput(event);
        console.log('validateInputData ' + value)
        if (value) {
            this.objectiveStatusData[getFieldAttribute(event, 'data-id')] = value;
        }
    }

    handleInputChange(event) {
        const field = event.target;
        if (field.checkValidity()) {
            this.objectiveStatusData[getFieldAttribute(event, 'data-id')] = field.value;
        }
        if (field === 'visus_left_eye__c' || field === 'visus_right_eye__c') {
            this.checkShowCorrection(field.value);
        }
    }

    handleClickShowCorrection() {
        this.showCorrection = !this.showCorrection;
    }

    checkShowCorrection(value) {
        switch (true) {
            case value.indexOf('1,') === 0 :
                this.showCorrection = false;
                break;
            default :
                this.showCorrection = true;
                break;

        }
    }
}