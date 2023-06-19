public with sharing class MultiSelectComboboxController {

    @AuraEnabled
    public static LightningResponse getData(String sObjectApiName) {
        LightningResponse response = new LightningResponse();
        String soql = 'SELECT Id, Name__c FROM ' + sObjectApiName + ' ORDER BY Name ASC LIMIT 2000';
        List<SObject> result = Database.query(soql);
        response.setBody(result);
        return response;
    }

    @AuraEnabled
    public static LightningResponse createNewRecord(String sObjectApiName, String newValue) {
        LightningResponse response = new LightningResponse();
        System.debug('sObjectName ' + sObjectApiName);
        try {
            SObject sObj = Utility.GLOBAL_DESCRIBE_MAP.get(sObjectApiName).newSObject();
            sObj.put('Name__c', newValue);
            System.debug(sObj);
            insert sObj;
            response.setSuccess(true);
        } catch (Exception e) {
            System.debug(e.getStackTraceString());
            response.setError(e.getMessage());
        }
        return response;
    }


}