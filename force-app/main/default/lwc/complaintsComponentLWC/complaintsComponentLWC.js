import {LightningElement, track, api} from 'lwc';
import {getFieldAttribute, cloneObject} from 'c/utilComponent';

export default class ComplaintsComponentLwc extends LightningElement {
    @api
    getData() {
        return cloneObject(this.complaintsObject);
    }

    /*For future use*/
    @api
    set complaintsData(value) {
        this.complaintsObject = cloneObject(value);
    }

    get complaintsData() {
        return cloneObject(this.complaintsObject);
    }
    /***/

    @track
    complaintsObject={};

    labels = {
        anamnesis             : 'Анамнез',
        complaints            : 'Жалобы',
        maxLengthErrorMessage : 'Максимальное количество символов 5000'
    }

    get complaints() {
        return this.complaintsObject.complaints || ''
    }

    get anamnesis() {
        return this.complaintsObject.anamnesis || ''
    }

    handleChange(event) {
        let field= getFieldAttribute(event, 'data-id');
        this.complaintsObject[field] = event.target.value || '';
    }


}