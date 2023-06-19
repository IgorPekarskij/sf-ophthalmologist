import {LightningElement, api, track} from 'lwc';

import { objectiveStatusFields, visusFields, vgdFields, eyeGroundFields, createFieldId, cloneObject, getFieldAttribute, removeEmptyEntriesFromArray, fireCustomEvent} from 'c/utilComponent'

export default class PreviewTableLWC extends LightningElement {
    @api
    showVisus = false;
    @api
    fields;
    @api
    set inputData(value) {
        this.tableData = value ? cloneObject(value) : {};
    };
    get inputData() {
       return this.tableData;
    };
    

    @track
    tableData;
    @track
    fieldsData = [];
    @track
    visusMetaData = {};

    isRenderFirstTime = true;
    maxTextAreaLength = 5000;
    maxTextAreaLengthMessage = "Максимальное количество символов 5000";

    labels = {
        rightEye : 'Правый глаз',
        leftEye  : 'Левый глаз',
        visus    : 'Визус'
    }


    connectedCallback() {
        if(this.isRenderFirstTime) {
            this._fieldsVariableLinks = {
                'objectiveStatusFields': objectiveStatusFields,
                'eyeGroundFields': eyeGroundFields,
                'vgdFields': vgdFields,
                'visusFields': visusFields
            }
            console.log('this.showVisus ' + this.showVisus)
            console.log('this.showVisus type' + typeof this.showVisus)
            if (this.showVisus) {
                this.prepareVisusMetaData();
            }
            this.prepareFieldsData();
            this.isRenderFirstTime = false;
        }
    }

    handleChangeValue(event) {
        let fieldId = getFieldAttribute(event, 'data-id');
        let value = event.target.value;
        this.status[fieldId] = value;
    }

    prepareVisusMetaData () {
        let resultLeft = [];
        let resultRight = [];
        for (let item of visusFields) {
            let fieldIdLeft = createFieldId(item.id, 'true')
            let fieldIdRight = createFieldId(item.id, 'false')
            resultLeft.push({
                id: fieldIdLeft,
                label: item.label,
                isRight: false,
                value: this.tableData[fieldIdLeft],
                isArray : item.isArray
            });
            resultRight.push({
                id: fieldIdRight,
                label: item.label,
                isRight: true,
                value: this.tableData[fieldIdRight],
                isArray : item.isArray
            });
        };
        this.visusMetaData.leftEye = resultLeft;
        this.visusMetaData.rightEye = resultRight;
    }

    prepareFieldsData () {
        let allFields = [];
        this.fields.forEach(item => {
            allFields = allFields.concat([...this._fieldsVariableLinks[item]])
        });
        allFields.forEach(item => {
            let fieldIdLeft = createFieldId(item.id, 'true')
            let fieldIdRight = createFieldId(item.id, 'false')
            this.fieldsData.push(
                {
                    label : item.label,
                    values : [
                        {
                            id : fieldIdRight,
                            value : this.prepareValue(fieldIdRight),
                            isArray : item.isArray
                        },
                        {
                            id : fieldIdLeft,
                            value : this.prepareValue(fieldIdLeft),
                            isArray : item.isArray
                        }
                    ]

                }
            )
        });
    }

    prepareValue(field) {
        let result = '';
        if (this.tableData[field]) {
            let data = JSON.parse(this.tableData[field]);
            if (data instanceof Array) {
                result = data.join('; ');
            } else {
                result = data;
            }
        }
        return result;
    }

    handleChangeValue(event) {
        const field = event.target;
        let value = event.target.value;
        if (field.checkValidity()) {
            this.tableData[getFieldAttribute(event, 'data-id')] = value;
        } else {
            field.reportValidity();
        }
    }

    handleFocusBlur(event) {
        let value = event.target.value;
        const re = new RegExp(/\s*;\s*/);
        if (value && re.test(value)) {
            let newValues = value.trim().split(';');
            this.tableData[getFieldAttribute(event, 'data-id')] = JSON.stringify(removeEmptyEntriesFromArray(newValues));
        } else if (value) {
            let isArray = getFieldAttribute(event, 'data-array')
            console.log('isArray ' + isArray);
            this.tableData[getFieldAttribute(event, 'data-id')] = isArray == 'true' ? JSON.stringify([value]) : value;
        }
        if (value) {
            this.checkIfCorrectionDataChanged(getFieldAttribute(event, 'data-id'));
        }
        fireCustomEvent(this,'changevalue', cloneObject(this.tableData));
    }

    checkIfCorrectionDataChanged (field) {
        switch (field) {
            case 'sphere_left_cor__c' :
            case 'axys_left_cor__c' :
            case 'cylinder_left_cor__c' :
            case 'visus_left_cor__c' :
                this.tableData.show_visus_correction_left__c = 'true';
                break;
            case 'sphere_right_cor__c' :
            case 'axys_right_cor__c' :
            case 'cylinder_right_cor__c' :
            case 'visus_right_cor__c' :
                this.tableData.show_visus_correction_right__c = 'true';
                break;
        }
    }
}