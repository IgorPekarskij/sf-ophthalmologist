/**
 * Created by ipekarskiy on 2/26/2020.
 */

import {LightningElement, api} from 'lwc';

export default class PreviewTableHeader extends LightningElement {
    @api
    columnsData;

    labels = {
        rightEye : 'Правый глаз',
        leftEye  : 'Левый глаз',
    }

}