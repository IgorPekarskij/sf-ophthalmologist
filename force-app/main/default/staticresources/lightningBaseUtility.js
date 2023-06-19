
(function (OPTHALM) {

	OPTHALM.baseUtils = {
	    prepareObjectDataForPrint: function(component, helper, objectData, attributeName) {
	        function transformArrayToString (v) {
	            let result = '';
	            if ($A.util.isArray(v)) {
	                result = v.join(', ');
                } else {
	                result = v;
                }
	            return result;
            }
	        if (objectData) {
                let objectForPrint = {
                    patientName: (objectData.patient.LastName + ' ' + objectData.patient.FirstName + ' ' + objectData.patient.MiddleName),
                    birthdate: new Date(objectData.patient.Birthdate).getTime(),
                    complaints: objectData.complaints ? transformArrayToString(objectData.complaints.Complaints__c) : '',
                    anamnesis: objectData.complaints ? objectData.complaints.Anamnesis__c : '',
                    diagnosis: objectData.complaints ? transformArrayToString(objectData.complaints.Anamnesis__c) : '',
                    recommendations: objectData.recommendations ? transformArrayToString(objectData.recommendations) : ''
                };
                component.set('v.' + attributeName, objectForPrint);
            }
        },


	    /**
	    * Note: compared to the old BaseHelper.execute action, the errorCallback parameter got added.
	    */

    	executeAction: function(component, helper, action, parameters, successCallback, extraOptions) {
            //TODO: This is a modified copy of BaseHelper function, maintain one copy...
            // Accepted extraOptions:
            // scope(Object)               = jsonObject to passthrough to error- and successCallback
            // delayEnqueueAction(Boolean) = use the delays the enqeueAction for 10 ms
            // toastError(Boolean)         = show the error in a toast
            // errorFunction (Function) = execute this function for errorFunction callback
            // afterFunction (Function)    = execute this function after the successCallback and errorCallback functions

            var actionName = action+'';
            var action = component.get(action);
            if(action) {
                action.setParams(parameters);
                if(extraOptions && extraOptions.isStorable) {
                     action.setStorable();
                }

                 //set extraOptions.toastError to true by default. You can override it to false if needed
                if(!extraOptions){
                    extraOptions = {};
                }
                if(extraOptions.toastError == null || extraOptions.toastError == undefined){
                    extraOptions.toastError = true;
                }
                action.setCallback(this, function(response) {
                    var scope = {};
                    if(extraOptions && extraOptions.scope) {
                        scope = extraOptions.scope;
                    }

                    if (response.getState() === "SUCCESS") {
                        var result = response.getReturnValue();
                        if(successCallback) {
                            successCallback(component, helper, result, scope);
                        }
                    }
                    else if (response.getState() === "ERROR") {
                        var errorMessages = response.getError();

                        if(typeof errorMessages === "string") {
                            errorMessages = [{message: errorMessages}];
                        }

                        for(var c = 0; c < errorMessages.length; c++) {
                            var errorMessage = errorMessages[c].message;
                             if(errorMessage == this.getLabel(component,'HitDailyLimitError') ){
                                this.sendDailyLimitError(component, helper, errorMessages ,scope);
                             }else{
                                 if(extraOptions && extraOptions.toastError) {
                                     this.showToast(errorMessage,"error")
                                 }
                             }
                        }
                        if(extraOptions && extraOptions.errorFunction) {
                            extraOptions.errorFunction(component, helper, errorMessages, scope);
                        }
                    }

                    if(extraOptions && extraOptions.afterFunction) {
                        extraOptions.afterFunction(component, helper, scope);
                    }
                });

                if(extraOptions && extraOptions.delayEnqueueAction) {// was forceUpload
                    setTimeout(
                        $A.getCallback(function() {
                            $A.enqueueAction(action);
                        })
                    ,10)
                }
                else {
                    $A.enqueueAction(action);
                }
            }
            else {
                console.log('No action found',action,component, helper, actionName, parameters, successCallback, extraOptions);
            }
		},

        /*
        	Method to fire show toast message system event
    	*/
		showToast: function(message, toastType, toastMode) {

            // toastTypes : error, warning, success, or info (default is other);
            if(!toastType) {
                toastType = "other";
            }

            // toastMode : dismissible(default), pester or sticky;
            if(!toastMode) {
                toastMode = "dismissible";
            }

            //showToast System Event
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                "message": message,
                "type": toastType,
                "mode": toastMode
            });
            toastEvent.fire();
        },


        /*
        	Method to invoke force:createRecord system event
    	*/
        createRecord: function(sObjectName, defaultValueParam, recordTypeId) {

            //force:createRecord system event
            var createRecordEvent = $A.get("e.force:createRecord");

            if(sObjectName && sObjectName.includes("__c")) {
                sObjectName = sObjectName;
            }

            //Paramaters
            var params = {
                "entityApiName": sObjectName,
                "defaultFieldValues": defaultValueParam/*,
                "recordTypeId": recordTypeId*/
            };

            //Setting params and firing events
            createRecordEvent.setParams(params);
            createRecordEvent.fire();
    	},

        /*
        	Method to invoke force:editRecord system event
    	*/
        editRecord: function(recordId) {

            //force:editRecord system event for updating the current talent pool record
            var editRecordEvent = $A.get("e.force:editRecord");
            editRecordEvent.setParams({
                "recordId": recordId
            });
            editRecordEvent.fire();
        },

        /*
        	Method to create dynamic confirmation dialog
    	*/
		showConfirmationDialog: function(component, helper, data) {

            // here data accepts attributes defined in dialog.cmp, headerText and bodyText are required
            $A.createComponent(
                OPTHALM.baseUtils.getPackagePrefix(component) + ":Dialog",
                data,
                function(msgBox){
                    if (component.isValid()) {
                        var targetCmp = [].concat(component.find("ModalDialogPlaceholder"))[0];
                        var body = targetCmp.get("v.body");
                        body.push(msgBox);
                        targetCmp.set("v.body", body);
                    }
            });
        },

        createComponents:function(component, helper, components, successCallback, scope) {
            var self = this;
            $A.createComponents(components,
                function(components, status, errorMessage){
                    if (status === "SUCCESS") {
                        successCallback(component, helper, components, scope);
                    }
                    else if (status === "INCOMPLETE") {
                        self.showToast("No response from server or client is offline.", "error");
                    }
                    else if (status === "ERROR") {
                        if(Array.isArray(errorMessage)) {
                            errorMessage = errorMessage[0];
                        }
                        self.showToast("Error: "+errorMessage.message, "error");
                    }
                }
            );
        },

        navigateToURL:function(redirectURL) {
            var urlEvent = $A.get("e.force:navigateToURL");
            urlEvent.setParams({
                "url": redirectURL
            });
            urlEvent.fire();
        },

        /**
         * Sometimes context is needed from an (onclick) event. The thing is that the event is generated from the element
         * click on and not the element holding the event handler, so we might need to search up through the dom to get the
         * id.
         * @param event The event trigged by the user.
         * @returns either the value of the id attribute closest in the dom, when searching up. Or null when nothing is found.
         */
        getIdFromEvent: function(event) {
            var target = event.currentTarget;

            while(target != null) {
                if(target.id != '' && target.id != undefined) {
                    return target.id;
                }
                else {
                    target = target.parentNode;
                }
            }
            return null;
        },

        
        /*
            Return a deep copy of a given object
        */
        cloneObject : function(component, event, helper, myObject) {
            if(myObject) {
                try {
                    return JSON.parse(JSON.stringify(myObject));
                }
                catch(e) {
                    console.log('cloneObject failed',e);
                    return myObject;
                }
            }
            else {
                return myObject;
            }
        },

        /**
         * Sometimes context is needed from an (onclick) event. The thing is that the event is generated from the element
         * click on and not the element holding the event handler, so we might need to search up through the dom to get the
         * id.
         * @param event The event trigged by the user.
         * @returns either the value of the id attribute closest in the dom of component with event listener. Or null when nothing is found.
         */
        getIdOfCurrentTargetFromEvent: function(event) {
            var target = event.currentTarget;

            while(target != null) {
                if(target.id != '') {
                    return target.id;
                }
                else {
                    target = target.parentNode;
                }
            }
            return null;
        },

        componentScrollToClass: function(component, helper, className, offset) {
             offset = offset || -160;
             var parentContainer = component.get('v.parentContainer');
             if(parentContainer){
                 // _panelInstance is a standard property of lightning:overlayLibrary object. This hack was done because of modal window.
                 if(parentContainer._panelInstance && parentContainer._panelInstance.elements && parentContainer._panelInstance.elements[0]  ){
                    this.scrollToClass(className, offset,parentContainer._panelInstance.elements[0].querySelector('.scrollable'));
                 }else{
                    this.scrollToClass(className, offset,parentContainer);
                 }
             }
             else{
                 this.scrollToClass(className, offset);
             }
        },

        scrollToClass:function(className, extraOffset, containerElement) {
            function scrollStepToClass(containerElement, scrollIteration, scrollTarget) {
                setTimeout(function() {
                    if (!containerElement) {
                        window.scrollBy(0, scrollTarget/50);
                    }
                    else {
                         containerElement.scrollTop += scrollTarget/50;
                    }
                    var newScrollIteratie = scrollIteration++;
                    if(scrollIteration < 50) {
                        scrollStepToClass(containerElement, scrollIteration, scrollTarget);
                    }
                }, 10);
            }

            setTimeout(function() {
                var elements = document.getElementsByClassName(className);
                if(containerElement) {
                    elements = containerElement.getElementsByClassName(className);
                }
                if(elements.length > 0){
                    if (!containerElement) {
                        scrollStepToClass(null, 0, elements[0].getBoundingClientRect().top + extraOffset);
                    }
                    else {
                        scrollStepToClass(containerElement, 0, elements[0].getBoundingClientRect().top + extraOffset);
                    }
                }
            }, 10);
        },

        scrollClassIntoView : function(className) {
            setTimeout(function(){
                var elems = document.getElementsByClassName(className);
                if(elems.length > 0) {
                    elems[0].scrollIntoView({behavior: "smooth"});
                }
            },100);
        },

        /*
            Transforms a Map to an Array so we can iterate over it with an <aura:iteration /> component:

            {
                someKey: "someValue",
                anotherKey: ['some', 'values']
            }

            is transformed to:

            [{
               key: "someKey",
               value: "someValue"
            },{
               key: "anotherKey",
               value: ['some', 'values']
            }];

        */
        transformMapToArray: function(map) {
            if(!map) {
                return;
            }

            var arr = [];

            for(var key in map) {
                if(map.hasOwnProperty(key)) {
                    arr.push({
                        key: key,
                        value: map[key]
                    });
                }
            }
            return arr;
        },


        /*
         	Method to navigate to sObject
        */
        navigateToSObject:function(recordId) {
            var navigationSObject = $A.get("e.force:navigateToSObject");
            navigationSObject.setParams({
                "recordId": recordId
            });
            navigationSObject.fire();
        },

        /*
         	Method to navigate to Component
        */
        navigateToComponent: function(componentDef, componentAttributes) {
            var evt = $A.get("e.force:navigateToComponent");
            evt.setParams({
                componentDef : componentDef,
                componentAttributes: componentAttributes
            });
            evt.fire();
        },


        /*
            Add an eventListener to the page that runs the callback when someone clicks outside of the area defined by the array of auraIds.
            Note: all auraIds must refer to html elements, not lightning elements.
        */
        addClickoutsideListener: function(component, event, helper, auraIds, callback) {
            var self = this;
            setTimeout($A.getCallback(function() {
                window.addEventListener('click', $A.getCallback(function(e) {
                    let inside = false;
                    if(!Array.isArray(auraIds)) {
                        auraIds = [auraIds];
                    }

                    for(let auraId of auraIds) {
                        let clickArea = component.find(auraId);
                        if (clickArea) {
                            let clickAreaElement = clickArea.getElement();
                            if(clickAreaElement != null){
                                let rect = clickAreaElement.getBoundingClientRect();
                                if(e.clientX > rect.left && e.clientX < rect.left + rect.width && e.clientY > rect.top && e.clientY < rect.top + rect.height) {
                                    inside = true;
                                    break;
                                }

                            }
                        }
                    }
                    if(inside) {
                        self.addClickoutsideListener(component, event, helper, auraIds, callback);
                    }
                    else {
                        callback.call();
                    }
                }), {
                    once: true
                });

            }), 1);
        },

        
        /*
            1- left mouse button
            2- middle mouse button
            3- right mouse button
            3- ctrl+left mouse button
        */
        getMouseButtonCode : function(event) {
           var mouseButtonCode;
           if ("which" in event){ // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                mouseButtonCode = event.which ;
           }
           else if ("button" in event) { // IE, Opera
                mouseButtonCode = event.button +1;
           }
           if(event.ctrlKey == true){
               mouseButtonCode = 3;
           }
           return mouseButtonCode;
        },

    },

    OPTHALM.componentEventUtils = {

        GENERIC_EVENT_CHANGED: 'CHANGED',
        GENERIC_EVENT_CANCELLED: 'CANCELLED',
        GENERIC_EVENT_SAVED: 'SAVED',
        GENERIC_EVENT_LOADED: 'LOADED',
        GENERIC_EVENT_DONE: 'DONE',
        GENERIC_EVENT_WORKING: 'WORKING',
        GENERIC_EVENT_WORKING_DONE: 'WORKING_DONE',
        GENERIC_EVENT_ERROR: 'ERROR',
        GENERIC_EVENT_LOOKUP_CHANGED: 'LOOKUP_CHANGED',
        GENERIC_EVENT_FILE_UPLOAD_SUCCESS: 'FILE_UPLOAD_SUCCESS',
        GENERIC_EVENT_FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
        GENERIC_EVENT_FILE_DELETE: 'FILE_DELETE',
        GENERIC_EVENT_FIELD_CHANGE: 'FIELD_CHANGE',
        GENERIC_EVENT_FIELD_KEYUP: 'FIELD_KEYUP',
        GENERIC_EVENT_PERSON_CHANGED: 'PERSON CHANGE',
        GENERIC_EVENT_STEP_COMPLETE: 'STEP COMPLETE',
        GENERIC_EVENT_NEXT: 'NEXT',
        GENERIC_EVENT_PREV: 'PREVIOUS',
        GENERIC_EVENT_FINISH: 'FINISH',
        GENERIC_EVENT_ROW_SELECTED: 'ROW_SELECTED',
        GENERIC_EVENT_ROW_DESELECTED: 'ROW_DESELECTED',
        GENERIC_USER_SETTINGS_CHANGED: 'USER_SETTINGS_CHANGED',
        GENERIC_EVENT_RECORDS_SELECTED: 'RECORDS_SELECTED',
        GENERIC_EVENT_REQUEST_SELECTED_RECORD_CHANGE: 'REQUEST_RECORD_CHANGED',
        GENERIC_EVENT_SET_STEP: 'SET_STEP',
        GENERIC_EVENT_FILTER_CHANGED: 'FILTER_CHANGED',
        GENERIC_EVENT_FILTER_OPENED: 'FILTER_OPENED',
        GENERIC_EVENT_LISTVIEW_BUTTON_CLICKED: 'LISTVIEW_BUTTON_CLICKED',
        GENERIC_EVENT_RENDERED: 'RENDERED',
        GENERIC_EVENT_NO_ERROR: 'NO ERROR',
        GENERIC_EVENT_DELETE_RECORD : 'RECORD_DELETE',
        GENERIC_EVENT_UPDATE_RECORD : 'RECORD_UPDATE',
      	GENERIC_EVENT_REFRESH_VIEW  : 'REFRESH_VIEW',
      	GENERIC_EVENT_OPEN_MODAL_POPUP : 'OPEN_MODAL_POPUP',
      	GENERIC_EVENT_RATING_UPDATED : 'RATING_UPDATED',
        GENERIC_EVENT_TABLE_CELL_RATING_UPDATED : 'TABLE_CELL_RATING_UPDATED',
        GENERIC_EVENT_EMAIL_VISIBILITY_CHANGE : 'EMAIL_VISIBILITY_CHANGE',
        GENERIC_EVENT_METADATA_ERROR: 'METADATA ERROR',
        GENERIC_EVENT_REFRESH_PREVIEW: 'REFRESH_PREVIEW',
        GENERIC_EVENT_PARSE_CV_RESPONSE: 'PARSE_CV_RESPONSE',
        GENERIC_EVEN_STEP_BROWSE_MODE_SAVE: 'STEP_BROWSE_MODE_SAVE',
        GENERIC_EVEN_STEP_BROWSE_MODE_SAVE_NEXT: 'STEP_BROWSE_MODE_SAVE_NEXT',
        GENERIC_EVENT_RESET_TALENTPOOL_ACTIVITY: 'RESET_TALENTPOOL_ACTIVITY',
        GENERIC_STEP_ACTIVITY_TIMELINE_CHANGED: 'STEP_ACTIVITY_TIMELINE_CHANGED',
        GENERIC_EVENT_HAS_PICTURE_CHANGED: 'HAS_PICTURE_CHANGED',
        GENERIC_EVENT_STATE_CHANGED: 'STATE_CHANGED',
        GENERIC_EVENT_SHOW_ACTIVITY_HISTORY: 'SHOW_ACTIVITY_HISTORY',
        GENERIC_EVENT_FIELD_CLICKED: 'FIELD_CLICKED',
        GENERIC_EVENT_TOGGLE_NAVIGATION_BUTTONS: 'TOGGLE_NAVIGATION_BUTTONS',

        fireGenericComponentEvent: function(component, state, data, eventName) {
            var componentName = component.getType().split(":")[1];
            eventName = eventName || 'genericComponentEvent';
            var event = component.getEvent(eventName);

            if(!event) {
                console.error("Event not found: %s. Not registered on component?", eventName);
                return;
            }

            event.setParams({
                "sourceLocalId": component.getLocalId(),
                "sourceGlobalId": component.getGlobalId(),
                "source": componentName,
                "state": state,
                "data": data
            })
            .fire();
        },

        getGenericComponentEvent: function(event, debug) {
            return (function(event, debug) {

                if(!event) {
                throw new Error("event can not be null");
                return null;
                }

                var _event = event;
                var _source = event.getParam("source");
                var _sourceLocalId = event.getParam("sourceLocalId");
                var _sourceGlobalId = event.getParam("sourceGlobalId");
                var _state = event.getParam("state");
                var _data = event.getParam("data");

                function getEvent() {
                    return _event;
                }
                function getSource() {
                    return _source;
                }
                function getSourceGlobalId() {
                    return _sourceGlobalId;
                }
                function getSourceLocalId() {
                    return _sourceLocalId;
                }
                function isSource(componentName) {
                    return componentName && _source.toLowerCase() == componentName.toLowerCase();
                }
                function getState() {
                    return _state;
                }
                function getData() {
                    return _data || {};
                }

                if(debug) {
                    console.log("genericComponentEvent: ", {
                        sourceLocalId: _sourceLocalId,
                        sourceGlobalId: _sourceGlobalId,
                        source: _source,
                        state: _state,
                        data: _data
                    });
                }

                return {
                    getEvent: getEvent,
                    getSourceLocalId: getSourceLocalId,
                    getSourceGlobalId: getSourceGlobalId,
                    getSource: getSource,
                    isSource: isSource,
                    getState: getState,
                    getData: getData
                }
            })(event, debug);
        }
    },

        /**
         * Utility for creating modal dialogs with using of lightning:overlayLibrary.
         * It is required <lightning:overlayLibrary /> on component's markup.
         * Typical usage inside lightning component js helper:
         *
           openModalDialog: function(component, modalBodyComponent, modalHeaderComponent) {

               OPTHALM.dialogBuilder
                .getInstance(modalBodyComponent, component.find('overlayLibraryLocalId')) // instantiate builder
                .cssClass('slds-modal_large my-custom-class') // provide extra css for modal
                .submitAction('Proceed', component.getReference('c.onSubmit')) // provide reference for submit action (by default appear as lightning brand button in the footer's right conner)
                .rejectAction('Close', component.getReference('c.onReject')) // provide reference for reject action (by default appear as lightning neutral button in the footer's right conner before the submit button)
                .extraAction('back', 'Back', component.getReference('c.onBack'), 'slds-float_left', 'brand', 'utility:back') // extra actions for better interactivity
                .extraAction('forward', 'Forward', component.getReference('c.onForward'), 'slds-float_left', 'brand', 'utility:forward', 'right')
                .extraAction('help', 'Help', component.getReference('c.onHelp'), '', 'success', 'utility:info', 'right')
                .header(modalHeaderComponent) // Aura.Component or plain text
                .body(modalBodyComponent) // Aura.Component or plain text
                .onClose(function() {  // do something on modal close, by default rejectAction is used })
                .build() // build dialog but not yet show in modal
                .showModal(); // open modal overlay panel with embedded dialog
           },

            closeModal: function(component, avoidCloseCallbackBehavior) {
                // avoidCloseCallbackBehavior - (optional) provide ability to avoid running of custom closeCallback on modal close
                OPTHALM.dialogBuilder.closePopup(avoidCloseCallbackBehavior);
            }
         */

    OPTHALM.dialogBuilder = {

        _overlayLibrary: {},
        _overlayPanel: {},
        _actionsStorage: {},

	    _DialogBuilder: class DialogBuilder {
            constructor(component, overlayLibrary) {
                this.component = component;
                OPTHALM.dialogBuilder._overlayLibrary = overlayLibrary;
                this._defaultActions = {
                    'reject' : [],
                    'submit' : []
                };
                this._extraActions = [];
                OPTHALM.dialogBuilder._actionsStorage = Object.defineProperty({}, '__default__', {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: 'static'
                });

            }
            submitAction(label, callback, properties) {
                this._defaultActions.submit = [['lightning:button', {
                    'name' : 'submit',
                    'label' : label || OPTHALM.baseUtils.getLabel(this.component, 'Apply'),
                    'variant' : 'brand',
                    'disabled' : properties && properties.disabled,
                    'onclick' : this._getCallbackReference('submit', callback)
                }]];
                return this;
            }
            rejectAction(label, callback) {
                this._closeCallback = callback;
                this._defaultActions.reject = [['lightning:button', {
                    'name' : 'reject',
                    'label' : label || OPTHALM.baseUtils.getLabel(this.component, 'Cancel'),
                    'onclick' : this._getCallbackReference('reject', callback)
                }]];
                return this;
            }
            extraAction(name, label, callback, cssClass, variant, iconName, iconPosition) {
                this._extraActions.push(
                    ['lightning:button', {
                        'name' : name,
                        'label' : label,
                        'variant' : variant || 'neutral',
                        'class' : cssClass,
                        'onclick' : this._getCallbackReference(name, callback),
                        'iconName' : iconName,
                        'iconPosition' : iconPosition || 'left'
                    }]
                );
                return this;
            }
            onClose(callback) {
                this._closeCallback = callback;
                return this;
            }
            header(content) {
                this._headerContent = content;
                return this;
            }
            body(content) {
                this._bodyContent = content;
                return this;
            }
            cssClass(cssClass) {
                this._cssClass = cssClass;
                return this;
            }
            build() {
                const _self = this;
                this.showModal = function () {

                    let showCustomModal = function (component, actions) {
                        OPTHALM.dialogBuilder._overlayLibrary.showCustomModal({
                            'header' : _self._headerContent,
                            'body' : _self._bodyContent,
                            'footer' : actions,
                            'showCloseButton' : true,
                            'cssClass' : _self._cssClass,
                            'closeCallback' : function(){
                                if (_self._closeCallback && !OPTHALM.dialogBuilder._dialogActionContext) {
                                    _self._closeCallback()
                                    OPTHALM.dialogBuilder._overlayPanel = null;
                                } else {
                                    OPTHALM.dialogBuilder._dialogActionContext = '';
                                }
                            }
                        }).then(overlay => {
                            overlay['content'] = _self._bodyContent;
                            OPTHALM.dialogBuilder._overlayPanel = overlay;
                        }).catch(overlayError => {
                            console.error('Error on show modal dialog:', overlayError);
                        });
                    }

                    let actionButtons = this._extraActions
                        .concat(_self._defaultActions.reject)
                        .concat(_self._defaultActions.submit);

                    if (!$A.util.isEmpty(actionButtons)) {
                        OPTHALM.baseUtils.PromiseCall.createComponents(_self.component, actionButtons)
                            .then(result => {
                                showCustomModal(_self.component, result)
                            })
                            .catch(errors => {
                                console.log('Error on create action buttons for dialog:', errors)
                            });
                    } else {
                        showCustomModal(_self.component);
                    }

                }
                return this;
            }

            _getCallbackReference(name, callback) {
                if (typeof callback === 'function') {
                    OPTHALM.dialogBuilder._actionsStorage[name] = callback;
                    return function (component, event) {
                        let actionName = event.getSource().get('v.name');
                        OPTHALM.dialogBuilder._actionsStorage[actionName || '__default__']();
                        if (actionName === 'submit' || actionName === 'reject') {
                            this.closePopup(actionName);
                        }
                    }
                }
                return callback;
            }


        },

        getInstance : function(component, overlayLibrary) {
            return new this._DialogBuilder(component, overlayLibrary);
        },

        /**
         * Close modal dialog
         *
         * @param context - provide any significant value (on cast to Boolean it must be "true") to avoid running custom closeCallback
         */
        closePopup : function (context) {
            this._dialogActionContext = context;
            const panel = this._overlayPanel;
            if (panel && panel.isVisible) {
                this._overlayPanel = null;
                panel.close();
            }
        },


    }

})(window.OPTHALM = window.OPTHALM || {});
