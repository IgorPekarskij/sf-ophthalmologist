import {LightningElement, api, track } from 'lwc';

export default class MultiselectComponentLwc extends LightningElement {
    @api
    label;
    @api
    sobjectName;
    @api
    getData() {
        let jsonObjArray = [];
        if (this.pills.length > 0) {
            for (let item of this.pills) {
                /*if (!isPreview) {
                    jsonObjArray.push({...item});
                } else {*/
                    jsonObjArray.push(item.label);
                //}
            }
        }
        return jsonObjArray.length > 0 ? JSON.stringify(jsonObjArray) : '';
    }

    @track
    pills = [];

    removePill(event) {
        const pillId = event.target.name;
        let newPills = this.pills.filter(pill => {
            return pill.value !== pillId;
        });
        this.pills = newPills;
        let components = this.template.querySelector('[data-id="comboComponentSelector"');
        if (components && Array.isArray(components)) {
            components[0].updateSelection([pillId]);
        } else {
            components.updateSelection([pillId]);
        }
    }

    handleSelectedItems(event) {
        let selectedoptions = event.detail;
        this.pills = selectedoptions;
    }
}