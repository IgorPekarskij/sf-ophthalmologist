public with sharing class LookupController {

    // returns SOSL result
    public class SearchResult {
        public String value{get;Set;}
        public String id{get;set;}
        public List<String> extraResultData = new List<String>();

        public SearchResult() {
            this.extraResultData = new List<String>();
        }
    }

    /*
     * Returns the "Name" field for a given SObject (e.g. Case has CaseNumber, Account has Name)
     */
    private static String getSobjectNameField(SobjectType sobjType){

        //describes lookup obj and gets its name field
        String nameField = 'Name';
        Schema.DescribeSObjectResult dfrLkp = sobjType.getDescribe();
        for(schema.SObjectField sotype : dfrLkp.fields.getMap().values()){
            Schema.DescribeFieldResult fieldDescObj = sotype.getDescribe();
            if(fieldDescObj.isNameField() ){
                nameField = fieldDescObj.getName();
                break;
            }
        }
        return nameField;
    }

    /*
     * Searches (using SOQL) for a given Sobject type
     */
    @AuraEnabled
    public static String searchSObject(String type, String searchString, List<String> extraResultFields, String whereField, Object whereValue, String fieldList, String lookupFilters, Boolean removeFilters, String externalLookup) {
        LookupUtils.SobjectLookupFilter sobjectLookupFilter;
        List<Field> fields = new List<Field>();
        if(String.isNotBlank(fieldList)) {
            fields = (List<Field>) JSON.deserialize(fieldList, List<Field>.class);
        }
        if(String.isNotBlank(lookupFilters)) {
            sobjectLookupFilter = (LookupUtils.SobjectLookupFilter)JSON.deserialize(lookupFilters, LookupUtils.SobjectLookupFilter.class);
        }
        
        List<SearchResult> output = new List<SearchResult>();
        
        // check if type is valid
        SObjectType objType = Schema.getGlobalDescribe().get(type);
        if (objType == null) {
            return null;
        }
        
        String nameField = getSobjectNameField(objType);
        
        String query = createLookupQuery(type,nameField,whereField,whereValue,searchString,extraResultFields,sobjectLookupFilter,fields,removeFilters);
        
        System.debug('LookupController.searchSObject - query: ' + query);
        List<SObject> results = new List<SObject>();
        
        //Handling exceptions occured by adding lookup filters
        try {
            results = Database.query(query);
        }catch(Exception e){
            String updatedQuery  = createLookupQuery(type,nameField,whereField,whereValue,searchString,extraResultFields,sobjectLookupFilter,fields,false);
            results = Database.query(updatedQuery);
        }
        
        for(SObject result: results) {
            SearchResult searchResult = new SearchResult();
            searchResult.id = (String) result.get('Id');
            searchResult.value = (String)result.get(nameField);
            
            /*// populate extra field values
            if(extraResultFields != null) {
                for (String extraString : extraResultFields) {
                    String extraStringResult = String.valueOf(cxsCoreUtil.getFieldValue(result, extraString));
                    if (String.isNotBlank(extraStringResult)) {
                        searchResult.extraResultData.add(extraStringResult);
                    }
                }
            }*/

            output.add(searchResult);
        }

        return JSON.serialize(output);
    }
    
    /**
    *  Method to create query for lookup. 
    */
    private static String createLookupQuery(String type,String nameField,String whereField, Object whereValue, String searchString, 
                                            List<String> extraResultFields, LookupUtils.SobjectLookupFilter sobjectLookupFilter, List<Field> fields, Boolean removeFilters) {
    	SoqlBuilder builder = SoqlBuilder.create()
            .addSelect(new String[]{
                'Id', nameField
                    })
            .addFrom(type)
            .setLimit(20)
            .addSortAsc(nameField);
        
        /*if(sobjectLookupFilter != null && (removeFilters == null || !removeFilters)) {
            LookupUtils.addLookupFilters(builder, sobjectLookupFilter, fields);
        }*/
        if (whereField != null) {
            builder.addWhere(SoqlBuilder.eq(whereField, whereValue));
        }
        // query extra fields to be displayed in dropdown
        if(extraResultFields !=null && !extraResultFields.isEmpty()) {
            builder.addSelect(extraResultFields);
        }
        if(String.isNotBlank(searchString)) {
            builder.addWhere(SoqlBuilder.valueLike(nameField, '%' + searchString + '%'));
        }
        return builder.toQuery();
    }

    @AuraEnabled
    public static String retrieveDisplayValues(List<String> ids,String objectName) {
        List<SearchResult> output = new List<SearchResult>();

        // check if type is valid
        SObjectType objType = Schema.getGlobalDescribe().get(objectName);
        if(objType == null){
            return null;
        }
        String nameField = getSobjectNameField(objType);

        String solQuery = 'SELECT ' +nameField+ ' FROM '+objectName+ ' WHERE id in :ids';
        list<sObject> objectList=  Database.query(String.escapeSingleQuotes(solQuery));
        for(sObject sObj : objectList) {
            SearchResult sr = new SearchResult();
            sr.id = (String) sobj.get('Id');
            sr.value = (String)sobj.get(nameField);
            if(String.isNotBlank(sr.id) && String.isNotBlank(sr.value)) {
                output.add(sr);
            }
        }

        return JSON.serialize(output);
    }

    /**
     * For the given fieldName, determine whether to use a SOSL function based on the derived field type.
     *
     * @param objType
     * @param fieldName
     *
     * @return
     */
    private static String getSoslExpression(SObjectType objType, String fieldName) {
        DescribeFieldResult fieldDescribe = objType.getDescribe().fields.getMap().get(fieldName).getDescribe();

        if(fieldDescribe.getType() == Schema.DisplayType.CURRENCY || fieldDescribe.getType() == Schema.DisplayType.DATE || fieldDescribe.getType() == Schema.DisplayType.DATETIME || fieldDescribe.getType() == Schema.DisplayType.TIME) {
            return String.format('format({0})', new String[] { fieldName });
        }
        else if(fieldDescribe.getType() == Schema.DisplayType.MULTIPICKLIST || fieldDescribe.getType() == Schema.DisplayType.PICKLIST) {
            return String.format('toLabel({0})', new String[] { fieldName });
        }
        else return fieldName;
    }

    /**
    *  Method to get all required data to add lookup filters. 
    *  @param  objectName lookup field's referenced object name.
    *  @param  sourceObjectName lookup field's object name.
    *  @param  sourceFieldName lookup field's API name.
    *  @param  fieldList JSON of List of Field.class instance, holding all fields detail on UI(fieldSet).up field .
    *  @param  recordId Id of sourceObjectName's current record on UI(in case of edit).
    *  @return LookupUtils.SobjectLookupFilter class instance in a Json format.
    */
    @AuraEnabled
    public static String getInitData(String objectName, String sourceObjectName, String sourceFieldName,String fieldList, String recordId) {
         
        String updatedFieldName = sourceFieldName;
        
        //Checking _override field
        if(String.isNotBlank(sourceFieldName) && !sourceFieldName.endsWithIgnoreCase('_override__c') && String.isNotBlank(sourceObjectName)) {
            String overrideFieldName = sourceFieldName.containsIgnoreCase('__c')?sourceFieldName.substringBefore('__c')+'_override__c':sourceFieldName+'_override__c';
            Map<String, Schema.SObjectField> objectFields = Schema.getGlobalDescribe().get(sourceObjectName.toLowerCase()).getDescribe().fields.getMap();
            if(objectFields.containsKey(overrideFieldName.toLowerCase())) {
                updatedFieldName = objectFields.get(overrideFieldName.toLowerCase()).getDescribe().getName();
            }
            else if(objectFields.containsKey(overrideFieldName.toLowerCase())) {
                updatedFieldName = objectFields.get(overrideFieldName.toLowerCase()).getDescribe().getName();
            }
        }
        
        List<Field> fields = new List<Field>();
        if(String.isNotBlank(fieldList)) {
            fields = (List<Field>) JSON.deserialize(fieldList, List<Field>.class);
        }
        /* LookupUtils.LookupFilter lookupJson;
         List<cxsApplication_Setting__c> applicationSettings =(List<cxsApplication_Setting__c>) Securedatabase.applyFLS([Select Id, Text_area_value__c From cxsApplication_Setting__c Where Name = 'Lookup_Filter_Json' LIMIT 1]);
         if (applicationSettings != null && applicationSettings.size() == 1) {
             lookupJson = (LookupUtils.LookupFilter) JSON.deserialize(applicationSettings[0].Text_area_value__c, LookupUtils.LookupFilter.class);
         }
         if(lookupJson != null && lookupJson.records != null && lookupJson.records.size() > 0 && String.isNotBlank(objectName) && String.isNotBlank(sourceObjectName) && String.isNotBlank(updatedFieldName)) {
             return LookupUtils.getLookupFilterForField(lookupJson,objectName,sourceObjectName,updatedFieldName,fields,recordId);
         }
         else {*/
            return null;
        //}
    }
}