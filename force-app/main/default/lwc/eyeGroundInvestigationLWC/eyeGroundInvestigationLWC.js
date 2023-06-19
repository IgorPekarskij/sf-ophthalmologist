import {LightningElement, api} from 'lwc';
import { createFieldId, getAllComponentDataBySelector } from 'c/utilComponent'

export default class EyeGroundInvestigationLwc extends LightningElement {
    @api
    isLeftEye;

    @api
    getData() {
        this.prepareData();
        return Object.keys(this.eyeInvestigation).length === 0 && this.eyeInvestigation.constructor === Object ? null :  {...this.eyeInvestigation};
    }

    eyeGroundsInvestigation = {};
    eyeInvestigation = {};
    labels = {
        headerTitleLeft: 'Левый глаз',
        headerTitleRight: 'Правый глаз'
    };

    prepareData() {
        getAllComponentDataBySelector(this.template, 'c-eye-ground-component-l-w-c', 'data-id', this.eyeGroundsInvestigation);
        this.eyeInvestigation = {...this.eyeGroundsInvestigation.rightEye, ...this.eyeGroundsInvestigation.leftEye};
    }
}