const objectiveStatusFields = [
        {sobject: 'Eye_position__c'          , label: 'Орбита, положение глаза', id:'eye_position_{@}__c'          , isArray: true},
        {sobject: 'Eyelid__c'                , label: 'Веки, слёзные органы'   , id:'eyelid_{@}__c'                , isArray: true},
        {sobject: 'Conjunctiva__c'           , label: 'Конъюнктива'            , id:'conjunctiva_{@}__c'           , isArray: true},
        {sobject: 'Cornea__c'                , label: 'Роговица'               , id:'cornea_{@}__c'                , isArray: true},
        {sobject: 'Anterior_chamber__c'      , label: 'Передгяя камера'        , id:'anterior_chamber_{@}__c'      , isArray: true},
        {sobject: 'Anterior_Chamber_Angle__c', label: 'Угол передней камеры'   , id:'anterior_chamber_angle_{@}__c', isArray: true},
        {sobject: 'Iris__c'                  , label: 'Радужка, зрачок'        , id:'iris_{@}__c'                  , isArray: true},
        {sobject: 'Eye_Lens__c'              , label: 'Хрусталик'              , id:'eye_lens_{@}__c'              , isArray: true},
        {sobject: 'Vitreous__c'              , label: 'Стекловидное тело'      , id:'vitreous_{@}__c'              , isArray: true}
    ];
    const visusFields = [
        {label: ''   , id:'visus_{@}_eye__c'    , isArray: false},
        {label: 'SPH', id:'sphere_{@}_cor__c'   , isArray: false},
        {label: 'CYL', id:'cylinder_{@}_cor__c' , isArray: false},
        {label: 'AX' , id:'axys_{@}_cor__c'     , isArray: false},
        {label: '='  , id:'visus_{@}_cor__c'    , isArray: false},
    ];
    const vgdFields = [
        {label: 'ВГД'   , id:'inner_eye_pressure_{@}__c'        , isArray: false},
        {label: 'ЦТР'   , id:'central_corneal_thickness_{@}__c' , isArray: false},
        {label: 'ПЗО'   , id:'anterior_posterior_axis_{@}__c'   , isArray: false}
    ];
    const eyeGroundFields = [
        {label: 'ДЗН'         , id:'optic_disk_{@}__c'   , isArray: true},
        {label: 'Артерии'     , id:'arteries_{@}__c'     , isArray: true},
        {label: 'Вены'        , id:'viennas_{@}__c'      , isArray: true},
        {label: 'MZ'          , id:'mz_{@}__c'           , isArray: true},
        {label: 'На переферии', id:'on_periphery_{@}__c' , isArray: true}
    ];

    let createFieldId = (fieldPlaceholder, isLeftEye) => {
        const stringToReplace = isLeftEye === 'true' ? 'left' : 'right';
        return fieldPlaceholder.replace('{@}', stringToReplace)
    };

    let getFieldAttribute = (event, attribute) => {
        return event.target.getAttribute(attribute);
    }

    let getOneComponentDataBySelector = (template, selector) => {
        const component = template.querySelector(selector);
        let componentData = null;

        if (component) {
            componentData = component.getData();
        }
        return componentData;
    };

    let getAllComponentDataBySelector = (template, selector, attribute, data) => {
        const components = template.querySelectorAll(selector);
        if (components && components.length > 0) {
            let componentsArr = [...components];
            componentsArr.forEach(item => {
                let value = item.getData();
                if (value) {
                    if (Array.isArray(data)) {
                        if (attribute) {
                            data.push({[item.getAttribute(attribute)] : value})
                        } else {
                            data.push(value);
                        }
                    } else if (data instanceof Object) {
                        data[item.getAttribute(attribute)] = value;
                    }
                }
            })
        }
        return data;
    };

    let replacePeriodWithComma = (value, event) => {
        let result = value.replace('.', ',');
        return result;
    };

    let validateInput = (event) => {
        const field = event.target;
        const patternFull = '^[+|-]{1}[0-9]{1}[,|.][0-9]{0,2}$';
        const patternNoSign = '^[0-9]{1},[0-9]{0,2}$';
        const value = field.value;
        if (value) {
            const reExpFull = new RegExp(patternFull);
            const reExpNoSign = new RegExp(patternNoSign);
            let preparedValue = replacePeriodWithComma(value);
            if (reExpNoSign.test(preparedValue)) {
                preparedValue = '+' + preparedValue;
            }
            let result = reExpFull.test(preparedValue);
            let resultValue;
            if(!result) {
                field.setCustomValidity('Не корректное значение. Пример: -1,25');
            } else {
                field.setCustomValidity('');
                resultValue = preparedValue;
                field.value = resultValue;
            }
            field.reportValidity();
            return resultValue;
        }
    };

    let cloneObject = (inObject) => {
        let outObject, value, key

        if(typeof inObject !== "object" || inObject === null) {
            return inObject
        }
        outObject = Array.isArray(inObject) ? [] : {}
        for (key in inObject) {
            value = inObject[key]

            outObject[key] = (typeof value === "object" && value !== null) ? cloneObject(value) : value
        }
        return outObject
    };

    let removeEmptyEntriesFromArray = (inputArray) => {
        return inputArray.filter(el => {
            return el != null &&
                el != undefined &&
                el.length > 0
        })
    };

    let fireCustomEvent = (component, name, data) => {
        component.dispatchEvent(
            new CustomEvent(name, {
                detail : data
            })
        )
    };

export {
    vgdFields,
    visusFields,
    objectiveStatusFields,
    eyeGroundFields,
    createFieldId,
    getFieldAttribute,
    getOneComponentDataBySelector,
    validateInput,
    cloneObject,
    getAllComponentDataBySelector,
    removeEmptyEntriesFromArray,
    fireCustomEvent
}