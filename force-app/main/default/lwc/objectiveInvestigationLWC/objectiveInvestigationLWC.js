import {LightningElement, track, api} from 'lwc';
import {getAllComponentDataBySelector} from 'c/utilComponent';


export default class ObjectiveInvestigationLwc extends LightningElement {
    @api
    getData() {
        let result = [];
        getAllComponentDataBySelector(this.template, 'c-objective-eye-investigation-l-w-c', null, result);
        return result.length > 0 ? result.reduce((acc, curr) => {
            return {...acc, ...curr};
        }) : null;
    }

    @track
    isInitDone = true;

    labels = {
        headerTitleLeft: 'Левый глаз',
        headerTitleRight: 'Правый глаз'
    }

}