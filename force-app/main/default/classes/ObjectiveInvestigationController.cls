/**
 * Created by IgorPekarskij on 05.01.2020.
 */

public with sharing class ObjectiveInvestigationController {

    @AuraEnabled
    public static LightningResponse getInitData(String objectiveStatusId) {
        LightningResponse response = new LightningResponse();
        Map<String, Object> responseMap = new Map<String, Object>();
        try{
            List<Objective_status__c> objectiveStatuses = [
                    SELECT
                            Anterior_Chamber_Angle_Left__c,
                            Anterior_Chamber_Angle_Right__c,
                            Anterior_Chamber_Left__c,
                            Anterior_Chamber_Right__c,
                            Anterior_Posterior_Axis_Left__c,
                            Anterior_Posterior_Axis_Right__c,
                            Axys_Left_Cor__c,
                            Axys_Right_Cor__c,
                            Central_Corneal_Thickness_Left__c,
                            Central_Corneal_Thickness_Right__c,
                            Conjunctiva_Left__c,
                            Conjunctiva_Right__c,
                            Cornea_Left__c,
                            Cornea_Right__c,
                            Cylinder_Left_Cor__c,
                            Cylinder_Right_Cor__c,
                            Eye_Lens_Left__c,
                            Eye_Lens_Right__c,
                            Eye_Position_Left__c,
                            Eye_Position_Right__c,
                            Eyeground_Left__c,
                            Eyeground_Right__c,
                            Eyelid_Left__c,
                            Eyelid_Right__c,
                            Inner_Eye_Pressure_Left__c,
                            Inner_Eye_Pressure_Right__c,
                            Iris_Left__c,
                            Iris_Right__c,
                            Sphere_Left_Cor__c,
                            Sphere_Right_Cor__c,
                            Visus_Left_Cor__c,
                            Visus_Left_Eye__c,
                            Visus_Right_Cor__c,
                            Visus_Right_Eye__c,
                            Vitreous_Left__c,
                            Vitreous_Right__c
                    FROM Objective_status__c WHERE Id =: objectiveStatusId
            ];
            responseMap.put('visus_left_eye__c', getPicklistOptions('Objective_status__c', 'Visus_Left_Eye__c'));
            responseMap.put('visus_left_cor__c', getPicklistOptions('Objective_status__c', 'Visus_Left_Cor__c'));
            if (objectiveStatuses.size() > 0) {
                responseMap.put('record', cloneExistingRecord(objectiveStatuses[0]));
            }
            response.setBody(responseMap);
        } catch (Exception e) {
            response.setError('Ошибка инициализации: ' + e.getMessage());
            System.debug('Ошибка инициализации \n ' + e.getMessage() + '\n' + e.getStackTraceString());
        }
        return response;
    }

    private static Objective_status__c cloneExistingRecord(Objective_status__c record) {
        Objective_status__c newRecord = record.clone(false, true);
        return newRecord;
    }


    private static List<Option> getPicklistOptions (String sObjectAPIName, String fieldAPIName) {
        List<Option> options = new List<Option>();
        if (Utility.GLOBAL_DESCRIBE_MAP.containsKey(sObjectAPIName)) {
            Map<String, SObjectField> fields = Utility.GLOBAL_DESCRIBE_MAP.get(sObjectAPIName).getDescribe().fields.getMap();
            if (fields.containsKey(fieldAPIName) && fields.get(fieldAPIName).getDescribe().getType() == DisplayType.PICKLIST) {
                for (Schema.PicklistEntry entry: fields.get(fieldAPIName).getDescribe().getPicklistValues()) {
                    options.add(new Option(entry.value, entry.label));
                }
            }
        }
        return options;
    }

    public class Option {
        @AuraEnabled public String value;
        @AuraEnabled public String label;

        public Option(String value, String label){
            this.value = value;
            this.label = label;
        }
    }
}