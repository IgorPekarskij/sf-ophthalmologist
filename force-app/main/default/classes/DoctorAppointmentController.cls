public with sharing class DoctorAppointmentController {
    private static final Map<String, SObjectType> SOBJECT_TYPE_MAP = Schema.getGlobalDescribe();

    @AuraEnabled
    public static LightningResponse createRecord(String data) {
        LightningResponse response = new LightningResponse();
        Map<String, String> resultMap = new Map<String, String>();
        try {
            Map<String, Object> inputData = (Map<String, Object>) JSON.deserializeUntyped(data);
            SObject objStatus;
            SObject eyeGround;
            if (inputData.get('objectiveStatus') != null) {
                objStatus = createSObject((Map<String, Object>) inputData.get('objectiveStatus'), 'Objective_status__c');
            }
            if (objStatus == null) objStatus = new Objective_status__c();
            upsert objStatus;
            resultMap.put('objStatus', objStatus.Id);

            if (inputData.get('eyeground') != null) {
                eyeGround = createSObject((Map<String, Object>) inputData.get('eyeground'), 'Eyeground_Investigation__c');
            }
            if (eyeGround == null) eyeGround = new Eyeground_Investigation__c();
            upsert eyeGround;
            resultMap.put('eyeGround', eyeGround.Id);
            System.debug('appointment >>>>>>>>>>>>>>>>> ');
            SObject doctorApp = createSObject((Map<String, Object>) inputData.get('doctorAppointment'), 'Doctor_Appointment__c');
            if (doctorApp.Id == null) {
                doctorApp.put('Objective_status__c', objStatus.get('id'));
                doctorApp.put('Eyeground_Investigation__c', eyeGround.get('id'));
            }
            System.debug(JSON.serializePretty(doctorApp));
            upsert doctorApp;
            resultMap.put('appointmentId', doctorApp.Id);
            response.setBody(resultMap).setSuccess(true);
        } catch (Exception e) {
            System.debug(e.getStackTraceString());
            response.setError(e.getMessage());
        }
        return response;
    }

    private static SObject createSObject(Map<String, Object> od, String sobjectApiName) {
        System.debug('od ' + od);
        SObject newSObject;
        if (SOBJECT_TYPE_MAP.get(sobjectApiName) != null) {
            newSObject = SOBJECT_TYPE_MAP.get(sobjectApiName).newSObject();
            if (od != null && od.size() > 0) {
                Map<String, SObjectField> fieldsMap = SOBJECT_TYPE_MAP.get(sobjectApiName).getDescribe().fields.getMap();
                for (String field : fieldsMap.keySet()) {
                    if (field == 'objective_status__c' || field == 'eyeground_investigation__c') {
                        continue;
                    }
                    Object value = od.get(field);
                    System.debug('field ' + field);
                    System.debug('value ' + value);
                    if (value != null) {
                        try {
                            switch on fieldsMap.get(field).getDescribe().getType() {
                                when DATE {
                                    value = Date.parse((String) value);
                                }
                                when DOUBLE {
                                    value = Double.valueOf(value);
                                }
                                when INTEGER {
                                    value = Integer.valueOf(value);
                                }
                                when BOOLEAN {
                                    value = Boolean.valueOf(value);
                                }
                            }
                            newSObject.put(field, value);
                        } catch (Exception exc) {
                            System.debug('Casting data exception : ' + exc.getMessage() + '\n' + exc.getStackTraceString());
                        }
                    }
                }
            }
            return newSObject;
        } else {
            throw new DoctorAppointmentException('No such Sobject or it doesn\'t accessible - Objective_status__c ');
        }
    }

    private class DoctorAppointmentException extends Exception{}

}