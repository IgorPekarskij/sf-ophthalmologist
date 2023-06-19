import {api, track, LightningElement} from 'lwc';
import { createFieldId, getAllComponentDataBySelector } from 'c/utilComponent'

export default class EyeGroundComponentLwc extends LightningElement {
    @api
    isLeftEye;
    @api
    getData() {
        getAllComponentDataBySelector(this.template, 'c-multiselect-component-l-w-c', 'data-id', this.eyegroundObject);
        this.isLeftEye === 'true' ?
            this.eyegroundObject.is_ophthalmoscopically_left__c = this.notOphthalmoscopically :
            this.eyegroundObject.is_ophthalmoscopically_right__c = this.notOphthalmoscopically;
        return Object.keys(this.eyegroundObject).length === 0 && this.eyegroundObject.constructor === Object ? null :  {...this.eyegroundObject};
    }

    @track
    eyegroundObject = {};

    labels = {
        opticDisk : 'ДЗН',
        arteries : 'Артерии',
        viennas : 'Вены',
        mz : 'MZ',
        periphery : 'На переферии',
        notOphthalmoscopically: 'Не офтальмоскопируется',
        ophthalmoscopically: 'Офтальмоскопируется'
    };


    @track
    notOphthalmoscopically = false

    get opticDisk() {
        return createFieldId('optic_disk_{@}__c', this.isLeftEye);
    }
    get arteries() {
        return createFieldId('arteries_{@}__c', this.isLeftEye);
    }
    get viennas() {
        return createFieldId('viennas_{@}__c', this.isLeftEye);
    }
    get mz() {
        return createFieldId('mz_{@}__c', this.isLeftEye);
    }
    get periphery() {
        return createFieldId('on_periphery_{@}__c', this.isLeftEye);
    }

    handleClick() {
        this.notOphthalmoscopically = !this.notOphthalmoscopically;
    }
}