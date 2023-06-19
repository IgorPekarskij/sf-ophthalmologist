public with sharing class LookupUtils {

    public class SobjectLookupFilter {
        public String sourceObjectName;
        public String sourceFieldName;
        public String targetObjectName;
        public Set<String> currentFieldOnUI;
        public Set<String> currentFieldNotOnUI;
        public Metadata filterMetadata;
        public Map<String,String> userFieldsData;
        public List<sObject> currentFieldNotOnUIData;
        public Map<String, Schema.DisplayType> fieldsDataType;
        public SobjectLookupFilter() {
            this.currentFieldOnUI = new Set<String>();
            this.userFieldsData = new Map<String,String>();
            this.currentFieldNotOnUI = new Set<String>();
            this.currentFieldNotOnUIData = new List<sObject>();
            this.fieldsDataType = new Map<String, Schema.DisplayType>();
        }
        public void addCurrentFieldOnUI(String fieldName) {
            this.currentFieldOnUI.add(fieldName);
        }
        public void addFilterMetadata(Metadata filterMetadata) {
            this.filterMetadata = filterMetadata;
        }
        public void addCurrentFieldNotOnUI(String fieldName) {
            this.currentFieldNotOnUI.add(fieldName);
        }

    }
    public class Metadata {
        public Boolean active;
        public String description;
        public String errorMessage;
        public FilterItem[] filterItems;
        public String infoMessage;
        public Boolean isOptional;
    }

    public class FilterItem {
        public String field;
        public String operation;
        public String value;
        public String valueField;
    }
}