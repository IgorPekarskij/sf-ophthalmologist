public with sharing class LookupControllerLWC {

    private static final String CLASS_NAME = LookupControllerLWC.class.getName();

    private static final String STATUS_SUCCESS = 'success';
    private static final String STATUS_WARNING = 'warning';
    private static final String STATUS_ERROR = 'error';
    private static final String ROW_ICON_DEFAULT = 'standard:default';


    @AuraEnabled(cacheable=true)
    public static LightningResponse search(String searchFilterJSON) {
        LightningResponse response = new LightningResponse();

        try {
            if (String.isNotBlank(searchFilterJSON)) {
                Map<String, Object> searchFilter = (Map<String, Object>) JSON.deserializeUntyped(searchFilterJSON);
                Map<String, Object> responseData = new Map<String, Object>();
                List<Map<String, Object>> searchResults = getSearchResults(searchFilter);
                responseData.put('searchResults', searchResults);

                response.setBody(responseData).setSuccess(true);

            } else {
               response.setError('One or more parameter values are not valid: ' + searchFilterJSON);
            }
        } catch (Exception e) {
            response.setError(CLASS_NAME + ': ' + e.getMessage());
        }

        return response;
    }

    /**
     * Returns recent items.
     *
     * @return recent items
     */
    @AuraEnabled(cacheable=true)
    public static LightningResponse getRecentItems(String searchFilterJSON) {
        LightningResponse response = new LightningResponse();

        try {
            if (String.isNotBlank(searchFilterJSON)) {
                Map<String, Object> searchFilter = (Map<String, Object>) JSON.deserializeUntyped(searchFilterJSON);
                Map<String, Object> responseData = new Map<String, Object>();
                List<Map<String, Object>> recentItems = getRecentItemRecords(searchFilter);
                responseData.put('recentItems', recentItems);
                System.debug('recentItems ' + recentItems);
                response.setBody(responseData).setSuccess(true);

            } else {
                response.setError('One or more parameter values are not valid: ' + searchFilterJSON);
            }
        } catch (Exception e) {
            response.setError(CLASS_NAME + ': ' + e.getMessage());
        }

        return response;
    }

    /**
     * Returns recent items.
     *
     * @return recent items
     */
    @AuraEnabled(cacheable=true)
    public static LightningResponse getSelectedRecord(String searchFilterJSON) {
        LightningResponse response = new LightningResponse();

        try {
            if (String.isNotBlank(searchFilterJSON)) {
                Map<String, Object> searchFilter = (Map<String, Object>) JSON.deserializeUntyped(searchFilterJSON);
                Map<String, Object> responseData = new Map<String, Object>();
                List<Map<String, Object>> selectedOptions = getSelectedRecords(searchFilter);

                responseData.put('selectedOptions', selectedOptions);

                response.setBody(responseData).setSuccess(true);
            } else {
                response.setError('One or more parameter values are not valid: ' + searchFilterJSON);
            }
        } catch (Exception e) {
            response.setError(CLASS_NAME + ': ' + e.getMessage());
        }

        return response;
    }

    /**
     * Returns search results.
     *
     * @param searchFilter search filter
     *
     * @return search results
     */
    private static List<Map<String, Object>> getSearchResults(Map<String, Object> searchFilter) {
        List<Map<String, Object>> searchResults = new List<Map<String, Object>>();

        if (searchFilter != null && !searchFilter.isEmpty()) {
            /* get search term */
            String searchTerm = (String) searchFilter.get('searchTerm');
            searchTerm += '*';

            /* get object name */
            String objectName = (String) searchFilter.get('object');

            String recordTypeID;
            if (searchFilter.containsKey('recordTypeId')) {
                recordTypeID = (String) searchFilter.get('recordTypeId');
            }

            String iconName;
            if (searchFilter.containsKey('iconName')) {
                iconName = (String) searchFilter.get('iconName');
            }

            /* set query string */
            String recordsQueryString = 'FIND :searchTerm IN NAME FIELDS RETURNING ' + objectName + '(Id, ';
            recordsQueryString += objectName == 'Contact' ? 'Contact_Name__c' : 'Name';
            recordsQueryString += (recordTypeID != null ? ' WHERE RecordTypeId = \'' + String.escapeSingleQuotes(recordTypeID) + '\'' : '')  + ') LIMIT 10';
            /* prepare search results */
            List<sObject> records = Search.query(recordsQueryString).get(0);

            for (sObject record : records) {
                Map<String, Object> searchResult = new Map<String, Object>{
                    'id' => record.Id,
                    'sObjectType' => objectName,
                    'icon' => iconName == null ? ROW_ICON_DEFAULT : iconName,
                    'title' => objectName == 'Contact' ?  record.get('Contact_Name__c') : record.get('Name') ,
                    'subtitle' => ''
                };
                searchResults.add(searchResult);
            }
        }

        return searchResults;
    }

    /**
     * Returns recent items.
     *
     * @param searchFilter search filter
     *
     * @return recent items
     */
    private static List<Map<String, Object>> getRecentItemRecords(Map<String, Object> searchFilter) {
        List<Map<String, Object>> recentItems = new List<Map<String, Object>>();

        if (searchFilter != null && !searchFilter.isEmpty()) {

            String objectName = (String) searchFilter.get('object');
            String recordTypeId = searchFilter.containsKey('recordTypeId') ? (String) searchFilter.get('recordTypeId') : null;
            String soql = 'SELECT Id, Name, FirstName, LastName, MiddleName FROM RecentlyViewed WHERE Type =: objectName';
            if (recordTypeId != null) {
                soql += ' AND RecordTypeId =: recordTypeId';
            }

            soql += ' ORDER BY LastViewedDate DESC  LIMIT 5';
            List<RecentlyViewed> recentlyViewedRecords = Database.query(soql);

            String iconName;
            if (searchFilter.containsKey('iconName')) {
                iconName = (String) searchFilter.get('iconName');
            }
            System.debug(recentlyViewedRecords);
            for (RecentlyViewed recentlyViewedRecord : recentlyViewedRecords) {
                Map<String, Object> recentItem = new Map<String, Object>{
                    'id' => recentlyViewedRecord.Id,
                    'sObjectType' => objectName,
                    'icon' => iconName == null ? ROW_ICON_DEFAULT : iconName,
                    'title' => objectName == 'Contact' ? (recentlyViewedRecord.LastName + ' ' + recentlyViewedRecord.FirstName + ' ' + recentlyViewedRecord.MiddleName) : recentlyViewedRecord.Name,
                    'subtitle' => ''
                };
                recentItems.add(recentItem);
            }
        }

        return recentItems;
    }

    /**
     * Returns selected records.
     *
     * @param searchFilter search filter
     *
     * @return selected records
     */
    private static List<Map<String, Object>> getSelectedRecords(Map<String, Object> searchFilter) {
        List<Map<String, Object>> selectedRecords = new List<Map<String, Object>>();

        if (searchFilter != null && !searchFilter.isEmpty()) {
            /*set query fields */
            Set<String> queryFields = new Set<String>{
                    'Id', 'Name'
            };

            /* create where conditions list */
            List<String> conditions = new List<String>();

            /* get record id */
            String recordId = (String) searchFilter.get('recordId');

            /* filter by record id */
            conditions.add(getCondition(
                    'Id',
                    '=',
                    recordId,
                    true
            ));

            /* get object name */
            String objectName = (String) searchFilter.get('object');

            String iconName;
            if (objectName == 'Contact') {
                queryFields.add('Contact_Name__c');
            }
            if (searchFilter.containsKey('iconName')) {
                iconName = (String) searchFilter.get('iconName');
            }

            /* set parameters */
            List<Object> parameters = new List<Object>{
                    String.join(new List<String>(queryFields), ', '),
                    objectName,
                    String.join(conditions, ' AND ')
            };

            /* set query string */
            String queryString = 'SELECT {0} FROM {1} WHERE {2}';

            /* get event records */
            List<sObject> records = Database.query(String.format(queryString, parameters));

            for (sObject record : records) {
                Map<String, Object> selectedRecord = new Map<String, Object>{
                        'id' => record.Id,
                        'sObjectType' => objectName,
                        'icon' => iconName == null ? ROW_ICON_DEFAULT : iconName,
                        'title' => objectName == 'Contact' ?  record.get('Contact_Name__c') : record.get('Name'),
                        'subtitle' => ''
                };
                selectedRecords.add(selectedRecord);
            }
        }

        return selectedRecords;
    }

    private static String getCondition(String fieldName, String sign, String fieldValue, Boolean isString) {
        String condition = '';

        if (String.isNotBlank(fieldName) && String.isNotBlank(sign) && isString != null) {
            if (isString) {
                condition = String.format('{0} {1} \'\'{2}\'\'', new List<String>{fieldName, sign, fieldValue});
            } else {
                condition = String.format('{0} {1} ' + fieldValue, new List<String>{fieldName, sign});
            }
        }

        return condition;
    }

}