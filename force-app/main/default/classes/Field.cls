/**
 * Created by locadmin on 1/6/2020.
 */

public with sharing class Field {
    @AuraEnabled public String name;
    @AuraEnabled public String fieldName;
    @AuraEnabled public String fieldPath;
    @AuraEnabled public String label;
    @AuraEnabled public String help;
    @AuraEnabled public String type;
    @AuraEnabled public String schemaType;
    @AuraEnabled public ExtraDisplayOption extraDisplayOption;
    @AuraEnabled public Boolean required;
    @AuraEnabled public Boolean viewable;
    @AuraEnabled public Boolean readOnly;
    @AuraEnabled public Boolean isGroupable;
    @AuraEnabled public String value;
    @AuraEnabled public String displayValue;
    @AuraEnabled public List<Option> options;
    @AuraEnabled public String error;
    @AuraEnabled public Integer maxLength;
    @AuraEnabled public String format;
    @AuraEnabled public String styleClass;
    @AuraEnabled public String placeholder;
    @AuraEnabled public String referencedObjectName;
    @AuraEnabled public String referencedObjectLabel;
    @AuraEnabled public List<NamePoint> namePointingList;   // NamePointing is the salesforce way of saying that a reference can point to more than 1 object
    @AuraEnabled public List<String> extraResultFields;     // List of fieldnames, used in a lookup field to show more info about a record.
    @AuraEnabled public String sObjectName;
    @AuraEnabled public String recordId;
    @AuraEnabled public Boolean fireFieldChangeEvent = false; //Can be set to true to fire a change event when the value changes
    @AuraEnabled public Boolean fireFieldKeyupEvent = false; //Can be set to true to fire a keyup event when the value changes on keyup
    @AuraEnabled public Boolean isSortable;
    @AuraEnabled public Boolean isCalculated;
    @AuraEnabled public Boolean customClickBehaviour ; //Used for AbstractCellRenderer.cmp to define that click on this field will implement custom behaviour
    @AuraEnabled public Date dateValue;
    @AuraEnabled public Boolean isHiddenField; // needed for dataService to get a field value but do no display this field on UI
    @AuraEnabled public Boolean hasGeolocationSearch = false; // needed for DataServiceFilter to handle geolocation search in dropdown filters
    @AuraEnabled public GeoSettings geoSettings; // contains default values for Geolocation Filter
    @AuraEnabled public String controllingField; // if field is dependent picklist then contains API name of controlling field, otherwise - null
    @AuraEnabled public Map<String, List<String>> dependentValuesByControllerValue; // if field is dependent picklist then contains mapping of available values for each of controlling picklist value, otherwise - null
    @AuraEnabled public String externalLookup;

    public Schema.FieldSetMember fsMember;

    public static Decimal MAX_DISTANCE = 250;
    public static Decimal DEFAULT_DISTANCE = 50;

    public Field() {

    }

    public Field(String name, String label, String help, String type, Boolean required, Boolean viewable, Boolean readOnly, String value, String displayValue) {
        this.hasGeolocationSearch = isGeolocationField(name);
        this.name = name;
        this.fieldName = name;
        this.label = label;
        this.help = help;
        this.type = type;
        this.required = (name == 'Name')? true: required;
        this.viewable = viewable;
        this.readOnly = readOnly;
        this.value = value;
        this.displayValue = displayValue;
        if (this.hasGeolocationSearch) {
            this.geoSettings = new GeoSettings(MAX_DISTANCE, DEFAULT_DISTANCE);
        }
    }

    public Field(String name, String label, String type, Boolean viewable, Schema.FieldSetMember fsMember) {
        this.name = name;
        this.fieldName = name;
        this.label = label;
        this.type = type;
        this.viewable = viewable;
        this.fsMember = fsMember;
        this.required = ((name == 'Name')? true: fsMember.getRequired());
    }

    public Field(String label, String value, String type, Boolean viewable) {
        this.label = label;
        this.value = value;
        this.type = type;
        this.viewable = viewable;
    }
    public Field(Field field) {
        this.name = field.name;
        this.fieldName = field.name;
        this.fieldPath = field.fieldPath;
        this.label = field.label;
        this.help = field.help;
        this.type = field.type;
        this.viewable = field.viewable;
        this.readOnly = field.readOnly;
        this.value = field.value;
        this.displayValue = field.displayValue;
        this.required = (field.name == 'Name')? true: field.required;
    }

    public Field setOptions(List<Option> options) {
        this.options = options;
        return this;
    }

    public Field setMaxLength(Integer maxLength) {
        this.maxLength = maxLength;
        return this;
    }

    public Field setReferencedObjectname(String referencedObjectName) {
        this.referencedObjectName = referencedObjectName;
        return this;
    }

    public Field setReferencedObjectLabel(String referencedObjectLabel) {
        this.referencedObjectLabel = referencedObjectLabel;
        return this;
    }

    public Field setFormat(String format) {
        this.format = format;
        return this;
    }

    public Field setStyleClass(String styleClass) {
        this.styleClass = styleClass;
        return this;
    }

    public Field setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
        return this;
    }

    public Field setValue(String value) {
        this.value = value;
        return this;
    }

    public Field setType(String type) {
        this.type = type;
        return this;
    }

    public Field setNamePointingList(List<NamePoint> namePointingList) {
        this.namePointingList = namePointingList;
        return this;
    }

    public Field setExtraResultFields(List<String> extraResultFields) {
        this.extraResultFields = extraResultFields;
        return this;
    }

    public Field setIsSortable(Boolean isSortable) {
        this.isSortable = isSortable;
        return this;
    }

    public Field setSchemaType(DisplayType schemaType) {
        this.schemaType = String.valueOf(schemaType);
        return this;
    }

    public Field setFieldPath(String fieldPath) {
        this.fieldPath = fieldPath;
        return this;
    }

    public Field setIsCalculated(Boolean isCalculated) {
        this.isCalculated = isCalculated;
        return this;
    }

    public Field setIsGroupable(Boolean isGroupable) {
        this.isGroupable = isGroupable;
        return this;
    }

    public Field setControllingField(String controllingField) {
        this.controllingField = controllingField;
        return this;
    }

    public Field setDependentValuesByControllerValue(Map<String, List<String>> dependentValuesByControllerValue) {
        this.dependentValuesByControllerValue = dependentValuesByControllerValue;
        return this;
    }

    public Field setIsHiddenField(Boolean isHiddenField) {
        this.isHiddenField = isHiddenField;
        return this;
    }

    public Field setExternalLookup(String externalLookupName) {
        this.externalLookup = externalLookupName;
        return this;
    }

    private Boolean isGeolocationField(String name) {
        return String.isNotEmpty(name) && name.endsWithIgnoreCase('__s');
    }

    public class Option {
        @AuraEnabled public String value;
        @AuraEnabled public String label;
        @AuraEnabled public Boolean disabled;

        public Option(String value, String label){
            this.value = value;
            this.label = label;
            this.disabled = false;
        }

        public Option(String value, String label,Boolean disabled){
            this.value = value;
            this.label = label;
            this.disabled = disabled;
        }
    }

    public class NamePoint {
        @AuraEnabled public String objectName;
        @AuraEnabled public String objectLabel;

        public NamePoint(String objectName, String objectLabel){
            this.objectName = objectName;
            this.objectLabel = objectLabel;
        }
    }

    public class GeoSettings {
        @AuraEnabled public Decimal maxDistance;
        @AuraEnabled public Decimal defaultDistance;

        public GeoSettings(Decimal maxDistance, Decimal defaultDistance) {
            this.maxDistance = maxDistance;
            this.defaultDistance = defaultDistance;
        }
    }

    public class ExtraDisplayOption {
        @AuraEnabled public String showAs;
        @AuraEnabled public String iconPath;
        @AuraEnabled public Boolean htmlEncode;

        public ExtraDisplayOption(String showAs, String iconPath,Boolean htmlEncode) {
            this.showAs = showAs;
            this.iconPath = iconPath;
            this.htmlEncode = htmlEncode;
        }
    }
}