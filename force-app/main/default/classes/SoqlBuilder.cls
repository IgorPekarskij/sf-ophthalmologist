/**
 * Created by locadmin on 1/6/2020.
 */

public with sharing class SoqlBuilder {
    private static Set<String> DATE_FUNCTIONS_AND_LITERALS = new Set<String> {
            'YESTERDAY',
            'TODAY',
            'TOMORROW',
            'LAST_WEEK',
            'THIS_WEEK',
            'NEXT_WEEK',
            'LAST_MONTH',
            'THIS_MONTH',
            'NEXT_MONTH',
            'LAST_90_DAYS',
            'NEXT_90_DAYS',
            'LAST_N_DAYS',
            'NEXT_N_DAYS',
            'NEXT_N_WEEKS',
            'LAST_N_WEEKS',
            'NEXT_N_MONTHS',
            'LAST_N_MONTHS',
            'THIS_QUARTER',
            'LAST_QUARTER',
            'NEXT_QUARTER',
            'NEXT_N_QUARTERS',
            'LAST_N_QUARTERS',
            'THIS_YEAR',
            'LAST_YEAR',
            'NEXT_YEAR',
            'NEXT_N_YEARS',
            'LAST_N_YEARS',
            'THIS_FISCAL_QUARTER',
            'LAST_FISCAL_QUARTER',
            'NEXT_FISCAL_QUARTER',
            'NEXT_N_FISCAL_QUARTERS',
            'LAST_N_FISCAL_QUARTERS',
            'THIS_FISCAL_YEAR',
            'LAST_FISCAL_YEAR',
            'NEXT_FISCAL_YEAR',
            'NEXT_N_FISCAL_YEARS',
            'LAST_N_FISCAL_YEARS',
            'CALENDAR_MONTH',
            'CALENDAR_QUARTER',
            'CALENDAR_YEAR',
            'DAY_IN_MONTH',
            'DAY_IN_WEEK',
            'DAY_IN_YEAR',
            'DAY_ONLY',
            'FISCAL_MONTH',
            'FISCAL_QUARTER',
            'FISCAL_YEAR',
            'HOUR_IN_DAY',
            'WEEK_IN_MONTH',
            'WEEK_IN_YEAR'
    };

    private static Pattern datePattern = Pattern.compile('\\d{4}-\\d{2}-\\d{2}');
    private static Pattern dateTimePattern = Pattern.compile('\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\+|\\-)\\d{2}:\\d{2}');
    private static Pattern dateTimeZonePattern = Pattern.compile('\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z');

    public static Integer DEFAULT_PAGE_SIZE = 25;

    private static String substitutionCharacter;

    public Enum NatureEnum {
        OPERATOR_AND, OPERATOR_OR
    }

    public Enum RestrictionEnum {
        EQ, NE, GT, GE, LT, LE, ISNULL, NOTNULL, VALUEIN, VALUENOTIN, VALUELIKE, VALUENOTLIKE, DISTANCE
    }
    private Enum SortEnum {
        SORT_ASC, SORT_DESC
    }

    public Enum RemoveWhereNestedStrategyEnum {
        ALL, ROOT_ONLY, NESTED_ONLY
    }

    public virtual interface Criterion {
        String toSql();
        String toConditionLogicString();
        Criterion add(Criterion condition);
    }

    public virtual class Junction implements Criterion {
        private NatureEnum nature;
        private List<Criterion> conditions;

        public Junction(NatureEnum nature) {
            this.nature = nature;
        }
        public Criterion add(Criterion condition) {
            if(this.conditions == null) {
                conditions = new List<Criterion>();
            }
            conditions.add(condition);
            return this;
        }

        public String toSql() {
            List<String> conditionStrings = new List<String>();

            if(conditions != null && conditions.size() > 0) {
                for(Criterion criterion: conditions) {
                    String sql = criterion.toSql();
                    if(String.isNotEmpty(sql)) {
                        conditionStrings.add(sql);
                    }
                }
            }
            return conditionStrings.size() > 0 ? ('(' + String.join(conditionStrings, nature == NatureEnum.OPERATOR_AND ? ' AND ' : ' OR ') + ')'  + '\n') : null;
        }

        public String toConditionLogicString() {
            List<String> conditionLogicStrings = new List<String>();
            for(Criterion criterion: conditions) {
                conditionLogicStrings.add(criterion.toConditionLogicString());
            }
            return '(' + String.join(conditionLogicStrings, nature == NatureEnum.OPERATOR_AND ? ' AND ' : ' OR ') + ')';
        }

        public List<Criterion> getConditions() {
            return conditions;
        }
        public NatureEnum getNature() {
            return nature;
        }
    }
    public class Disjunction extends Junction {
        public Disjunction() {
            super(NatureEnum.OPERATOR_OR);
        }
    }
    public class Conjunction extends Junction {
        public Conjunction() {
            super(NatureEnum.OPERATOR_AND);
        }
    }

    public class SortCondition implements Criterion {
        private SortEnum sortDirection;
        private String column;
        private Boolean defaultNullBehavior = true;

        public SortCondition(String column, SortEnum sortDirection) {
            this.column = column;
            this.sortDirection = sortDirection;
        }

        public String toSql() {
            String sql = column + ' ';

            if(sortDirection == SortEnum.SORT_ASC) {
                sql += 'ASC ' + (defaultNullBehavior ? 'NULLS LAST' : 'NULLS FIRST');
            }
            else if (sortDirection == SortEnum.SORT_DESC) {
                sql += 'DESC ' + (defaultNullBehavior ? 'NULLS FIRST' : 'NULLS LAST');
            }

            return sql;
        }

        public Criterion add(Criterion condition) {
            return null;
        }

        public String toConditionLogicString() {
            return null;
        }

        public SortCondition setDefaultNullBehavior(Boolean defaultNullBehavior) {
            this.defaultNullBehavior = defaultNullBehavior;
            return this;
        }
    }

    public class Restriction implements Criterion {
        private RestrictionEnum restriction;
        private String column;
        private Object value;

        public RestrictionEnum getRestriction() {
            return restriction;
        }
        public String getColumn() {
            return column;
        }
        public Object getValue() {
            return value;
        }

        public Restriction(RestrictionEnum restriction, String column, Object value) {
            this.restriction = restriction;
            this.column = column;
            this.value = value;
        }

        public Criterion add(Criterion condition) {
            return this;
        }

        public String toSql() {
            if(restriction == RestrictionEnum.VALUENOTLIKE) {
                return '(NOT '+column + ' ' + getRestrictionOperator() + ' ' + getSanitizedValue() + ')';
            }
            if(restriction == RestrictionEnum.VALUEIN || restriction == RestrictionEnum.VALUENOTIN) {
                return column + ' ' + getRestrictionOperator() + ' ' + getSanitizedValue();
            }
            if(restriction == RestrictionEnum.DISTANCE) {

                return getDistanceExpression('<');
            }
            return column + ' ' + getRestrictionOperator() + ' ' + getSanitizedValue();
        }

        public String toConditionLogicString() {
            return '{' + SoqlBuilder.getNextSubstitutionCharacter() + '}';
        }

        private String getRestrictionOperator() {
            if(restriction == RestrictionEnum.EQ || restriction == RestrictionEnum.ISNULL) {
                return '=';
            }
            else if(restriction == RestrictionEnum.NOTNULL || restriction == RestrictionEnum.NE) {
                return '!=';
            }
            else if(restriction == RestrictionEnum.GT) {
                return '>';
            }
            else if(restriction == RestrictionEnum.GE) {
                return '>=';
            }
            else if(restriction == RestrictionEnum.LT) {
                return '<';
            }
            else if(restriction == RestrictionEnum.LE) {
                return '<=';
            }
            else if(restriction == RestrictionEnum.VALUEIN) {
                return 'in';
            }
            else if(restriction == RestrictionEnum.VALUENOTIN) {
                return 'not in';
            }
            else if(restriction == RestrictionEnum.VALUELIKE || restriction == RestrictionEnum.VALUENOTLIKE) {
                return 'like';
            }
            else {
                return ' UNKNOWN OPERATOR ';
            }
        }
        private Object getSanitizedValue() {
            if(value == null) {
                return 'null';
            }

            // if bindvariable or date function/literal, just return it
            else if(isBindVar() || isDateFunctionOrLiteral() || isDateFormat()) {
                return value;
            }

            else if(value instanceof List<Object> || value instanceof Set<Object>) {
                List<Object> listValues = new List<Object>();
                List<Object> sanitizedValues = new List<Object>();


                if(value instanceof Set<Object>) {
                    listValues.addAll((Set<Object>)value);
                }
                if(value instanceof List<Object>) {
                    listValues = (List<Object>)value;
                }

                for(Object listValue: listValues) {
                    if(listValue == null) {
                        sanitizedValues.add('null');
                    }
                    else if(listValue instanceof String) {
                        sanitizedValues.add('\'' + String.escapeSingleQuotes(String.valueOf(listValue)) + '\'');
                    }
                    else {
                        sanitizedValues.add(listValue);
                    }
                }
                return '(' + String.join(sanitizedValues, ',') + ')';
            }

            else if(value instanceof String || value instanceof Id){
                //list of object without bind variable
                if(((String)value).startsWith('{') && ((String)value).endsWith('}')){
                    return getArrayStringForQuery((String)value);
                }
                // double escape the singlequotes here. See: https://developer.salesforce.com/forums/?id=906F00000008yzsIAA
                return String.format('\'\'{0}\'\'', new String[] { String.escapeSingleQuotes(String.valueOf(value)) });
            }

            else if(value instanceof Long || value instanceof Integer || value instanceof Boolean || value instanceof Double) {
                return value;
            }
            return null;
        }
        private boolean isBindVar() {
            return value instanceof String && ((String)value).startsWith(':');
        }
        private boolean isDateFunctionOrLiteral() {
            if(!(value instanceof String)) {
                return false;
            }
            return DATE_FUNCTIONS_AND_LITERALS.contains(((String)value).substringBefore(':').substringBefore('('));
        }
        private boolean isDateFormat() {
            if(!(value instanceof String)) {
                return isDateTimeConverted();
            }
            return datePattern.matcher((String)value).matches() || dateTimePattern.matcher((String)value).matches() || dateTimeZonePattern.matcher((String)value).matches();
        }
        private boolean isDateTimeConverted() {
            if(value instanceof Date && String.valueOf(value).contains(':')) {
                String val = String.valueOf(value).trim().substringBefore(' ');
                value = val;
                return true;
            }
            else if(value instanceof DateTime && !String.valueOf(value).contains('Z')) {
                String val = String.valueOf(value).trim().replace(' ','T')+'Z';
                value = val;
                return true;
            }
            else {
                return false;
            }
        }

        private String getDistanceExpression(GeolocationValue val, String op) {
            if (val == null || val.latitude == null || val.longitude == null || val.radius == null) {
                return '';
            }
            return 'DISTANCE(' + column + ', GEOLOCATION(' + val.latitude + ',' + val.longitude + '), \'km\') ' + op + ' ' + val.radius;
        }

        private String getDistanceExpression(String op) {
            List<String> expList = new List<String>();
            if (this.value instanceof List<GeolocationValue>) {
                for (GeolocationValue val : (List<GeolocationValue>) this.value) {
                    if (!val.isEmpty())
                        expList.add(getDistanceExpression(val, op));
                }
            }
            return expList.isEmpty()
                    ? null
                    : '(' + String.join(expList, ' OR ') + ')';
        }
    }


    public class GeolocationValue {
        public Decimal latitude;
        public Decimal longitude;
        public Decimal radius;

        public GeolocationValue(Decimal latitude, Decimal longitude, Decimal radius) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.radius = radius;
        }

        public Boolean isEmpty() {
            return this.latitude == null
                    || this.longitude == null
                    || this.radius == null;
        }
    }

    public class RemoveWhereOptions {

        private String field;
        private RemoveWhereNestedStrategyEnum nestedStrategy;
        private List<RestrictionEnum> ignoredRestrictions;

        public RemoveWhereOptions() {
            this.nestedStrategy = RemoveWhereNestedStrategyEnum.ALL;
            this.ignoredRestrictions = new List<RestrictionEnum>();
        }

        public RemoveWhereOptions(String field) {
            this();
            this.field = field;
        }

        public RemoveWhereOptions setNestedStrategy(RemoveWhereNestedStrategyEnum nestedStrategy) {
            this.nestedStrategy = nestedStrategy;
            return this;
        }

        public RemoveWhereOptions ignoreRestrictions(List<RestrictionEnum> ignoredRestrictions) {
            this.ignoredRestrictions = ignoredRestrictions;
            return this;
        }
    }

    private Set<String> selects;
    private Set<String> froms;
    private List<Criterion> conditions;
    private List<SortCondition> sorts;
    private Set<String> groups;
    private Integer queryLimit;
    private Integer queryOffset;
    private String conditionLogic;
    private Boolean useLinebreaks = true;
    private Boolean willReturnResults = true;

    static Map<String, sObjectType> globalDescribeMap;
    static Map<String, sObjectType> getGlobalDescribeMap() {
        if(globalDescribeMap == null) {
            globalDescribeMap = Schema.getGlobalDescribe();
        }
        return globalDescribeMap;
    }

    public SoqlBuilder() {
        this.selects = new Set<String>();
        this.froms = new Set<String>();
        this.conditions = new List<Criterion>();
        this.sorts = new List<SortCondition>();
        this.groups = new Set<String>();
    }

    public static SoqlBuilder create() {
        return new SoqlBuilder();
    }

    public SoqlBuilder addSelect(String column) {
        Boolean alreadySelected = false;

        // case insensitive check to see if the column is already in the selected columns list
        for(String selectedColumn: this.selects) {
            if(selectedColumn.toLowerCase() == column.toLowerCase()) {
                alreadySelected = true;
                break;
            }
        }

        if(!alreadySelected) {
            this.selects.add(column);
        }
        return this;
    }
    public SoqlBuilder addSelect(String[] columns) {
        for(String column: columns) {
            this.addSelect(column);
        }
        return this;
    }

    public SoqlBuilder clearSelects() {
        this.selects = new Set<String>();
        return this;
    }

    /**
     * Removes ALL Criteria from the conditions that match the given column name
     *
     * @param field
     *
     * @return
     */
    public SoqlBuilder removeWhereCondition(String column) {
        return removeWhereCondition(new RemoveWhereOptions(column), this.conditions, true);
    }

    public SoqlBuilder removeWhereCondition(RemoveWhereOptions options) {
        return removeWhereCondition(options, this.conditions, true);
    }

    private SoqlBuilder removeWhereCondition(RemoveWhereOptions options, List<Criterion> conditions, Boolean isRoot) {
        for(Integer i = conditions.size() - 1; i >= 0; i--) {
            Criterion condition = conditions.get(i);
            if(condition instanceof Junction) {
                if(options.nestedStrategy == RemoveWhereNestedStrategyEnum.ALL || options.nestedStrategy == RemoveWhereNestedStrategyEnum.NESTED_ONLY) {
                    Junction junction = (Junction)condition;
                    removeWhereCondition(options, junction.conditions, false);

                    // remove empty junctions
                    if(junction.conditions == null || junction.conditions.size() == 0) {
                        conditions.remove(i);
                    }
                }

            }
            else if(condition instanceof Restriction) {
                if(options.nestedStrategy == RemoveWhereNestedStrategyEnum.ALL || options.nestedStrategy == RemoveWhereNestedStrategyEnum.ROOT_ONLY) {
                    Restriction restriction = (Restriction)condition;
                    if(restriction.column.toLowerCase() == options.field.toLowerCase()) {
                        if((options.ignoredRestrictions == null) || !options.ignoredRestrictions.contains(restriction.restriction)) {
                            conditions.remove(i);
                        }
                    }
                }
            }
        }
        return this;
    }

    /*
        Adds fields for a specific FieldSet on the given sObject to the SELECT list, and adds the sObject to the FROM
     */
    public SoqlBuilder forFieldSet(String sObjectName, String fieldsetName) {
        Schema.SObjectType sObjectType = getGlobalDescribeMap().get(sObjectName);

        if(sObjectType == null) {
            sObjectType = getGlobalDescribeMap().get(sObjectName);
        }
        if(sObjectType == null) {
            throw new NoSuchElementException('No sObject found with name ' + sObjectName);
        }

        Schema.FieldSet schemaFieldset = sObjectType.getDescribe().fieldSets.getMap().get(fieldsetName);
        if(schemaFieldset == null) {
            schemaFieldset = sObjectType.getDescribe().fieldSets.getMap().get(fieldsetName);
        }
        if(schemaFieldset == null) {
            throw new NoSuchElementException('Fieldset not found with name: '+fieldsetName + ' on sObject ' + sObjectName);
        }

        Schema.FieldSetMember[] fieldsetMembers = schemaFieldset.getFields();

        for(FieldSetMember fieldsetMember: fieldsetMembers) {
            this.addSelect(getConvertedFieldPath(fieldsetMember));
        }

        this.addFrom(sObjectName);

        return this;
    }

    public SoqlBuilder forFieldSets(String sObjectName, String[] fieldsetNames) {
        for(String fieldsetName: fieldsetNames) {
            this.forFieldSet(sObjectName, fieldsetName);
        }
        return this;
    }

    public SoqlBuilder addFrom(String fromObject) {
        this.froms.add(fromObject);
        return this;
    }
    public SoqlBuilder addFrom(String[] fromObjects) {
        for(String fromObject: fromObjects) {
            this.addFrom(fromObject);
        }
        return this;
    }

    public SoqlBuilder addWhere(Criterion condition) {
        this.conditions.add(condition);
        return this;
    }

    public List<Criterion> getWhere() {
        return this.conditions;
    }

    public SoqlBuilder addSortAsc(String column) {
        this.sorts.add(new SortCondition(column, SortEnum.SORT_ASC));
        return this;
    }
    public SoqlBuilder addSortDesc(String column) {
        this.sorts.add(new SortCondition(column, SortEnum.SORT_DESC));
        return this;
    }

    public SoqlBuilder addSortAscNullsFirst(String column) {
        this.sorts.add(new SortCondition(column, SortEnum.SORT_ASC).setDefaultNullBehavior(false));
        return this;
    }
    public SoqlBuilder addSortDescNullsLast(String column) {
        this.sorts.add(new SortCondition(column, SortEnum.SORT_DESC).setDefaultNullBehavior(false));
        return this;
    }

    public SoqlBuilder clearSorts() {
        this.sorts = new List<SortCondition>();
        return this;
    }

    public SoqlBuilder setLimit(Integer queryLimit) {
        this.queryLimit = queryLimit;
        return this;
    }

    public SoqlBuilder setOffset(Integer queryOffset) {
        this.queryOffset = queryOffset;
        return this;
    }

    public SoqlBuilder setPage(Integer page) {
        return setPage(page, DEFAULT_PAGE_SIZE);
    }

    public SoqlBuilder setPage(Integer page, Integer pageSize) {
        return this.setOffset((page - 1) * pageSize).setLimit(pageSize);
    }

    public SoqlBuilder setConditionLogic(String conditionLogic) {
        this.conditionLogic = conditionLogic;
        return this;
    }

    public SoqlBuilder addGroup(String groupField) {
        this.groups.add(groupField);
        return this;
    }

    public SoqlBuilder addGroup(List<String> groupFields) {
        for(String groupField: groupFields) {
            this.addGroup(groupField);
        }
        return this;
    }

    public SoqlBuilder setLinebreaks(Boolean useLinebreaks) {
        this.useLinebreaks = useLinebreaks;
        return this;
    }

    /**
     *  Set this to false if you know beforehand that the query will not return any results so we resulting query doesn't have to be executed
     */
    public SoqlBuilder setWillReturnResults(Boolean willReturnResults) {
        this.willReturnResults = willReturnResults;
        return this;
    }

    public Boolean getWillReturnResults() {
        return this.willReturnResults;
    }

    /*

     */
    public static Criterion conjunction() {
        return new Conjunction();
    }

    public static Criterion disjunction() {
        return new Disjunction();
    }

    public static Criterion eq(String column, Object value) {
        return new Restriction(RestrictionEnum.EQ, column, value);
    }
    public static Criterion ne(String column, Object value) {
        return new Restriction(RestrictionEnum.NE, column, value);
    }
    public static Criterion gt(String column, Object value) {
        return new Restriction(RestrictionEnum.GT, column, value);
    }
    public static Criterion ge(String column, Object value) {
        return new Restriction(RestrictionEnum.GE, column, value);
    }
    public static Criterion lt(String column, Object value) {
        return new Restriction(RestrictionEnum.LT, column, value);
    }
    public static Criterion le(String column, Object value) {
        return new Restriction(RestrictionEnum.LE, column, value);
    }
    public static Criterion isNull(String column) {
        return new Restriction(RestrictionEnum.ISNULL, column, null);
    }
    public static Criterion notNull(String column) {
        return new Restriction(RestrictionEnum.NOTNULL, column, null);
    }
    public static Criterion valueIn(String column, Object value) {
        if (value instanceof List<GeolocationValue>) {
            return new Restriction(RestrictionEnum.DISTANCE, column, (List<GeolocationValue>) value);
        }
        if (value instanceof GeolocationValue) {
            return new Restriction(RestrictionEnum.DISTANCE, column, new List<GeolocationValue>{ (GeolocationValue) value });
        }
        return new Restriction(RestrictionEnum.VALUEIN, column, value);
    }
    public static Criterion valueNotIn(String column, Object value) {
        return new Restriction(RestrictionEnum.VALUENOTIN, column, value);
    }
    public static Criterion valueLike(String column, Object value) {
        return new Restriction(RestrictionEnum.VALUELIKE, column, value);
    }
    public static Criterion valueNotLike(String column, Object value) {
        return new Restriction(RestrictionEnum.VALUENOTLIKE, column, value);
    }
    public static Criterion distance(String column, Decimal latitude, Decimal longitude, Decimal radius) {
        return new Restriction(RestrictionEnum.DISTANCE, column, new List<GeolocationValue>{new GeolocationValue(latitude, longitude, radius)});
    }

    public String toQuery() {
        return this.toQuery(false);
    }

    public String toCountQuery() {
        return this.toCountQuery(null);
    }

    public String toCountQuery(Integer countLimit) {
        Integer oldLimit = this.queryLimit;

        // temporarily change the query limit to the count limit if set
        if(countLimit != null) {
            this.setLimit(countLimit);
        }
        String query = this.toQuery(true);

        this.setLimit(oldLimit);

        return query;
    }

    private String toQuery(Boolean isCountQuery) {
        String query = 'SELECT ';

        if(isCountQuery) {
            query += 'COUNT()';
        }
        else {
            // Add the `Id` field if no selects are defined
            if(this.selects == null || this.selects.size() == 0) {
                query += 'Id';
            }
            else {
                query += String.join(new List<String>(this.selects), ', ') + '\n';
            }
        }

        query += (' FROM ' + String.join(new List<String>(this.froms), ', ')) + '\n';
        if(conditions != null && conditions.size() > 0) {

            if(String.isNotEmpty(this.conditionLogic)) {
                // create a Map of soql statements for the conditions
                Map<String, String> conditionStatements = new Map<String, String>();
                List<String> conditionsMissingInLogic = new List<String>();
                String whereClause = '(' + this.conditionLogic + ')';
                Integer i = 0;

                for(Criterion condition: conditions) {
                    String key = '{' + String.fromCharArray(new List<Integer>{i + 65}) + '}';
                    conditionStatements.put(key, condition.toSql());
                    i++;
                }

                for(String key: conditionStatements.keySet()) {
                    if(this.conditionLogic.indexOf(key) == -1) {
                        conditionsMissingInLogic.add(conditionStatements.get(key));
                    }
                    else {
                        whereClause = whereClause.replace(key, conditionStatements.get(key));
                    }
                }

                if(conditionsMissingInLogic.size() > 0) {
                    whereClause += ' AND (' + String.join(conditionsMissingInLogic, ' AND ') + ')';
                }

                if(String.isNotEmpty(whereClause)) {
                    query += ' WHERE ' + whereClause + '\n';
                }

                //Temporary fix to remove unused elements from filter logic
                query = query.replaceAll('((AND |OR |AND \\(|OR \\()\\{[^}]*\\})(?![^\']*\')', '');

            }
            else {
                List<String> conditionsStrings = new List<String>();
                for(Criterion condition: conditions) {
                    String sql = condition.toSql();
                    if(String.isNotEmpty(sql)) {
                        conditionsStrings.add(sql);
                    }
                }

                if(conditionsStrings.size() > 0) {
                    query += ' WHERE ' + String.join(conditionsStrings, ' AND ') + '\n';
                }
            }
        }

        if(groups != null && groups.size() > 0) {
            List<String> groupsList = new List<String>();
            groupsList.addAll(groups);
            query += ' GROUP BY ' + String.join(groupsList, ', ') + '\n';
        }

        if(sorts != null && sorts.size() > 0 && !isCountQuery) {
            List<String> sortConditionsStrings = new List<String>();
            for(SortCondition sortCondition: sorts) {
                sortConditionsStrings.add(sortCondition.toSql());
            }
            query += ' ORDER BY ' + String.join(sortConditionsStrings, ', ') + '\n';
        }

        if(queryLimit != null && queryLimit > 0) {
            query += ' LIMIT ' + queryLimit + '\n';
        }

        if(queryOffset != null && queryOffset > 0 && !isCountQuery) {
            query += ' OFFSET ' + queryOffset;
        }

        if(!useLinebreaks) {
            query = query.replaceAll('\\n', '');
        }

        return query;
    }

    private static String getNextSubstitutionCharacter() {
        if(String.isEmpty(SoqlBuilder.substitutionCharacter)) {
            SoqlBuilder.substitutionCharacter = 'A';
        }
        else {
            SoqlBuilder.substitutionCharacter = String.fromCharArray(new List<Integer> {SoqlBuilder.substitutionCharacter.getChars()[0] + 1});
        }
        return SoqlBuilder.substitutionCharacter;
    }

    public String toConditionLogicString() {
        if(String.isNotEmpty(this.conditionLogic)) {
            return this.conditionLogic;
        }

        String conditionLogic = '';
        SoqlBuilder.substitutionCharacter = null;

        if(conditions != null && conditions.size() > 0) {
            List<String> conditionLogicStrings = new List<String>();

            for(Criterion condition: conditions) {
                conditionLogicStrings.add(condition.toConditionLogicString());
            }
            conditionLogic = String.join(conditionLogicStrings, ' AND ');
        }

        return conditionLogic;
    }

    /**
      *  Method to return good formated string for SOQL query based on Array values.
      *  Use in SoqlBuilder for field in: array where condition , without passing bound attribute.
      *  @param  objectListString string Array.
      *  @return - good formated string for SOQL query. Format : ('a1H0Y000001hXtVUAU','a1H0Y000001hdfyUAA','a1H0Y000001hdg3UAA')
     */
    public static String getArrayStringForQuery(String objectListString){
        String soqlFormatArrayString = '';
        Pattern p = Pattern.compile('[^,{\\s][^\\,]*[^,]*[^,}\\s]');
        Matcher m = p.matcher(String.escapeSingleQuotes(objectListString));
        List<String> listValues = new List<String>();
        while (m.find() == true) {
            listValues.add('\'' + m.group(0) + '\'');
        }
        if(!listValues.isEmpty()){
            soqlFormatArrayString +=  '(' + String.join(listValues, ',') + ')';
        }else{
            soqlFormatArrayString = '(\'\')';
        }
        return soqlFormatArrayString;
    }

    public static String getConvertedFieldPath(Schema.FieldSetMember fsMember) {
        return getConvertedFieldPath(fsMember.getFieldPath(), String.valueOf(fsMember.getType()));
    }

    public static String getConvertedFieldPath(String fieldPath , String fieldType) {
        String fieldName = fieldPath;

        if (fieldName == 'Id') {
            fieldName = 'Id';
        }
        else if (fieldName.endsWithIgnoreCase('.Id')) {
            fieldName = fieldPath.left(fieldPath.length()-2) + 'Name';
        }
        else if (fieldPath.endsWithIgnoreCase('Id')) {
            fieldName = fieldPath.left(fieldPath.length()-2) + '.Name';
        }
        else if(fieldType  == 'REFERENCE') {
            if (fieldName.endsWithIgnoreCase('__c')) {
                fieldName = fieldName.removeEndIgnoreCase('__c') + '__r.Name';
            } else {
                fieldName += '.Name';
            }
        }

        return fieldName;
    }
}