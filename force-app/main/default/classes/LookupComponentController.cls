/**
 * Created by locadmin on 1/6/2020.
 */

public with sharing class LookupComponentController {
    /**
* Basic public API method for searching SObjects by criteria.
*
* @param searchData this is JSON string which will be mapped to SearchRequestDTO.class object.
* @return String, this is JSON string which will be mapped to SearchResponseDTO.class object.
* @throws Exceptions, handle all exceptions which will be thrown in private methods.
*/
    @AuraEnabled
    public static String search(String searchData) {
        try{
            if (String.isBlank(searchData)) {
                return JSON.serialize(new SearchResponseDTO(System.Label.Error_Status, System.Label.Empty_Payload, null));
            }
            SearchRequestDTO request = (SearchRequestDTO)JSON.deserialize(searchData, SearchRequestDTO.class);
            if (request != null) {
                List<SObject> result = searchData(request);
                if (result.isEmpty()) {
                    return JSON.serialize(new SearchResponseDTO(System.Label.Success_Status, System.Label.Empty_Result_Message, result));
                }
                if (request.additional != null) {
                    result = additionalValidation(request.additional, result);
                    if (result.isEmpty()) {
                        return JSON.serialize(new SearchResponseDTO(System.Label.Success_Status, System.Label.Empty_Result_Message, result));
                    }
                }
                return JSON.serialize(new SearchResponseDTO(System.Label.Success_Status, System.Label.Search_Valid_Result_Message, result));
            }
            return JSON.serialize(new SearchResponseDTO(System.Label.Error_Status, System.Label.Search_Invalid_Payload_Message, null));
        } catch (Exception e) {
            return JSON.serialize(new SearchResponseDTO(System.Label.Error_Status, e.getMessage(), null));
        }
    }

    /**
     * Private method which invoke additional methods for validation SObjects after basic search.
     * Functionality of this method check fields in data object and depending of this condtion will be invoke specific validation methods.
     *
     * @param data, type - instance of class AdditionalSearchFunctionalityData.class
     * @param sObjects, type - List&lt;SObject&lt; result after basic search functionlity
     * @return List&lt;SObject&lt;
     */
    private static List<SObject> additionalValidation(AdditionalSearchFunctionalityData data, List<SObject> sObjects) {
        if (data.removeIncorrectIdsData != null) {
            sObjects = removeObjById(data.removeIncorrectIdsData, sObjects);
        }
        return sObjects;
    }

    /**
     * Private method which removes ids from sObjects which contains data.objIds.
     *
     * @param data, type - instance of class RemoveIncorrectIdsData.class
     * @param sObjects, type - List&lt;SObject&lt; result after basic search functionlity or other validation methods.
     * @return List&lt;SObject&lt;
     */
    private static List<SObject> removeObjById(RemoveIncorrectIdsData data, List<SObject> sObjects){
        List<String> idsForRemove = data.objIds;
        if (idsForRemove.isEmpty()) {
            return sObjects;
        }
        List<SObject> result = new List<SObject>();
        for (SObject currentObject: sObjects) {
            if (!idsForRemove.contains(currentObject.Id)) {
                result.add(currentObject);
            }
        }
        return result;
    }

    /**
     * Basic Private method for searching SObjects by criteria in searchData.
     *
     * @param searchData, type - instance of class SearchRequestDTO.class
     * @return List&lt;SObject&lt;
     * @throws SearchDataException, throws if required fields (searchData.searchField || searchData.sObjectName) is empty or null
     */
    private static List<SObject> searchData (SearchRequestDTO searchData){
        if (String.isBlank(searchData.searchField) || String.isBlank(searchData.sObjectName) ||
                String.isBlank(searchData.searchValue) || String.isBlank(searchData.searchOperator)) {
            throw new SearchDataException(System.Label.Search_Required_Fields_Missing_Message);
        }
        String selectedFields = '';
        if (!searchData.resultFields.isEmpty()) {
            selectedFields = searchData.resultFields.size() > 1 ? ',' + String.join(searchData.resultFields, ',') : ',' + searchData.resultFields.get(0);
        }

        String searchValue = isFieldTypeString(searchData.searchValue) ? '  \'' + searchData.searchValue + '\'' : searchData.searchValue;

        String query = 'SELECT Id, Name ' + selectedFields + ' FROM ' + searchData.sObjectName + ' WHERE ' +
                searchData.searchField + ' ' + searchData.searchOperator + ' ' +
                isOperatorTypeLike(searchData.searchOperator, searchValue);

        if (!searchData.soqlCriteria.isEmpty()) {
            query += ' AND ';
            for (SOQLCriteria criteria: searchData.soqlCriteria) {
                if (String.isBlank(criteria.fieldName) || String.isBlank(criteria.fieldValue) ||
                        String.isBlank(criteria.operator)) {
                    throw new SearchDataException(System.Label.Search_Required_Fields_Missing_Message);
                }
                String currentFieldValue = isFieldTypeString(criteria.fieldValue) ? '\'' + criteria.fieldValue + '\'' : String.valueOf(criteria.fieldValue);
                query += criteria.fieldName + ' ' + criteria.operator + ' ' + isOperatorTypeLike(criteria.operator, currentFieldValue) + ' ' + criteria.logicalOperator;
            }
        }
        List<SObject> result = Database.query(query);
        return result;
    }


    /**
     * Method which check if fieldValue is String
     *
     * @param fieldValue, type - String, value of field which we want check
     * @return Boolean, true if fieldValue type string/ false if fieldValue type Boolean or Number
     * @throws TypeException, throws if can't cast to Integer
     */
    private static Boolean isFieldTypeString (String fieldValue){
        try{
            if (fieldValue.equalsIgnoreCase('true') || fieldValue.equalsIgnoreCase('false')) {
                return false;
            }
            Integer numberFieldType = Integer.valueOf(fieldValue);
            return false;
        } catch (TypeException e) {
            return true;
        }
    }

    /**
     * Method which check if operator equals 'LIKE'
     *
     * @param operator, type - String, operator for check
     * @param fieldValue, type - String, value which will be changed if operator equals 'LIKE'
     * @return String, result field value depending of operator value
     */
    private static String isOperatorTypeLike(String operator, String fieldValue){
        if (operator == 'LIKE') {
            if (fieldValue.contains('\'')) {
                fieldValue = fieldValue.replace('\'', '').deleteWhitespace();
            }
            return '\'%' + fieldValue + '%\'';
        }
        return fieldValue;
    }

    private class SearchDataException extends Exception {}

    /**
     * Сlass that will be mapped to search() method's @param - searchData
     * Requred fields: sObjectName, searchField, searchValue, searchOperator
     * JSON example:
         {
            sObjectName: 'Account',
            searchField: 'Phone',
            searchValue: '123',
            searchOperator: '=',
            additional: {...},
            resultFields: [...],
            soqlCriteria: [...]
        }
     */
    private class SearchRequestDTO {
        @AuraEnabled
        public String sObjectName {get; private set;}
        @AuraEnabled
        public String searchField {get; private set;}
        @AuraEnabled
        public String searchValue {get; private set;}
        @AuraEnabled
        public String searchOperator {get; private set;}
        @AuraEnabled
        public List<String> resultFields {get; private set;}
        @AuraEnabled
        public List<SOQLCriteria> soqlCriteria {get; private set;}
        @AuraEnabled
        public AdditionalSearchFunctionalityData additional {get; private set;}

        public SearchRequestDTO() {}
    }


    /**
     * Сlass that will be mapped to field additional in class SearchRequestDTO
     * JSON example:
         additional: {
            removeIncorrectIdsData: {}
        }
     */
    private class AdditionalSearchFunctionalityData {
        @AuraEnabled
        public RemoveIncorrectIdsData removeIncorrectIdsData {get; private set;}

        private AdditionalSearchFunctionalityData() {}
    }

    /**
     * Сlass that will be mapped to field removeIncorrectIdsData in class AdditionalSearchFunctionalityData
     * JSON example:
         additional: {
            removeIncorrectIdsData: {
                objIds: ['id1', ... 'idn']
            }
        }
     */
    private class RemoveIncorrectIdsData {
        @AuraEnabled
        public List<String> objIds {get; private set;}

        private RemoveIncorrectIdsData() {}
    }

    /**
     * Сlass that will be mapped to field object in array soqlCriteria (field in class SearchRequestDTO)
     * JSON example:
         soqlCriteria: [
            {
                fieldName: 'Custrom__c',
                fieldValue: 'test',
                operator: '=',
                logicalOperator: ' AND '
            },
            {
                fieldName: 'New_Custom__c',
                fieldValue: 'Active',
                operator: '=',
                logicalOperator: ''
            }
        ]

     * !!!!! IMPORTANT !!!!!!
     * THE LAST CRITERIA MUST BE WITH EMPTY logicalOperator VALUE
     */
    public class SOQLCriteria {
        @AuraEnabled
        public String fieldName {get; private set;}
        @AuraEnabled
        public String fieldValue {get; private set;}
        @AuraEnabled
        public String operator {get; private set;}
        @AuraEnabled
        public String logicalOperator {get; private set;}

        public SOQLCriteria() {}
    }

    /**
     * Сlass that will be serialize to JSON string and will be return in search() method.
     * JSON example:
        {
            status: "SUCCESS",
            message: "Service successfully found objects!",
            result [
                {Id: "xxxxxx", Name: "test", Custom__c: "test", Custom_New__c: "TEST", searchedValue: "tes"}
            ]
        }
     */
    private class SearchResponseDTO {
        @AuraEnabled
        public String status {get; private set;}
        @AuraEnabled
        public String message {get; private set;}
        @AuraEnabled
        public List<SObject> result {get; private set;}

        public SearchResponseDTO(String status, String message, List<SObject> result) {
            this.status = status;
            this.message = message;
            this.result = result;
        }
    }

}