import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

/* import apex methods */
import search from '@salesforce/apex/LookupControllerLWC.search';
import getRecentItems from '@salesforce/apex/LookupControllerLWC.getRecentItems';
import getSelectedRecord from '@salesforce/apex/LookupControllerLWC.getSelectedRecord';

const MINIMAL_SEARCH_TERM_LENGTH = 2; // Min number of chars required to search
const SEARCH_DELAY = 300; // Wait 300 ms after user stops typing then, peform search

export default class LookupComponent extends LightningElement {
    @api
    name;
    @api
    label;
    @api
    value;
    @api
    object;
    @api
    placeholder;
    @api
    fieldLevelHelp;
    @api
    disabled;
    @api
    readonly;
    @api
    required;
    @api
    variant;
    @api
    recordTypeId;
    @api
    iconName;

    @track
    state = {};

    @api
    checkValidity() {
        let isValid = true;

        let inputField = this.template.querySelector('[data-id="combobox"]');

        if (inputField) {
            isValid = inputField.reportValidity();
        }

        return isValid;
    }

    @api
    reportValidity() {
        let inputField = this.template.querySelector('[data-id="combobox"]');

        if (inputField) {
            let validity = inputField.validity;
            let validationMessage = inputField.validationMessage;

            if (!validity.valid) {
                this.errorMessage = validationMessage;
            } else {
                this.errorMessage = '';
            }
        }
    }

    @api
    setCustomValidity(message) {
        let inputField = this.template.querySelector('[data-id="combobox"]');

        if (inputField) {
            inputField.setCustomValidity(message);
        }
    }

    @track
    searchResults = [];
    @track
    selectedOptions = [];
    hasFocus = false;
    searchTerm = '';
    highlightedOption = -1;
    errorMessage = '';
    cleanSearchTerm;

    searchThrottlingTimeout;
    labels = {
        searchIconTitle: 'Поиск',
        deleteIconTitle: 'Удалить'
    };

    get formElementClass() {
        let classes = ['slds-form-element label'];

        if (this.errorMessage) {
            classes.push('slds-has-error');
        }

        if (!this.variant || this.variant === 'standard') {
            classes.push('label-top')
        } else if (this.variant === 'standard') {
            classes.push('label-inline');
        }

        return classes.join(' ');
    }

    get labelClass() {
        let classes = ['slds-form-element__label label'];
        if (this.variant === 'label-hidden') {
            classes.push('hide-label');
        }

        return classes.join(' ');
    }

    get comboboxContainerClass() {
        let classes = ['slds-combobox_container'];

        if (this.hasSelection) {
            classes.push('slds-has-selection');
        }

        return classes.join(' ');
    }

    get comboboxClass() {
        let classes = ['slds-combobox', 'slds-dropdown-trigger', 'slds-dropdown-trigger_click'];

        if (this.open) {
            classes.push('slds-is-open');
        }

        return classes.join(' ');
    }

    get comboboxFormElementClass() {
        let classes = ['slds-combobox__form-element', 'slds-input-has-icon'];

        if (this.hasSelection) {
            classes.push('slds-input-has-icon_left-right');
        } else {
            classes.push('slds-input-has-icon_right');
        }

        return classes.join(' ');
    }

    get inputClass() {
        let classes = ['slds-input', 'slds-combobox__input'];

        if (this.hasFocus) {
            classes.push('slds-has-focus');
        }

        if (this.inputValue) {
            classes.push('slds-combobox__input-value');
        }

        return classes.join(' ');
    }

    get inputValue() {
        return this.hasSelection ? this.selectedOptions[0].title : this.searchTerm;
    }

    get inputReadonly() {
        return this.hasSelection;
    }

    get open() {
        return this.searchResults.length > 0 && this.hasFocus;
    }

    get hasSelection() {
        return this.selectedOptions.length > 0;
    }

    get isSelectionAllowed() {
        return !this.hasSelection;
    }

    renderedCallback() {
        if (this.state.value !== this.value) {
            this.state.value = this.value;

            this.getSelectedRecord();
        }
    }

    handleFocus() {
        this.hasFocus = true;

        if (!this.searchTerm && this.isSelectionAllowed) {
            this.getRecentItems();
        }
    }

    handleKeyup(event) {
        let code = event.keyCode ? event.keyCode : event.which;
        const ENTER = 13;
        const UP_ARROW = 38;
        const DOWN_ARROW = 40;
        const DELETE = 46;

        if (this.hasSelection) {
            if (code === DELETE) {
                this.selectedOptions = [];

                this.handleOptionChange();
            }
        } else {
            if (code === ENTER) {
                let highlightedOption = this.highlightedOption;
                let searchResults = this.searchResults;
                let option = searchResults[highlightedOption];

                this.selectedOptions.push(option);

                /* reset error message */
                this.errorMessage = '';

                /* Reset search */
                this.searchTerm = '';
                this.searchResults = [];

                this.handleOptionChange();
            }

            if (code === UP_ARROW) {
                let highlightedOption = this.highlightedOption;
                let searchResults = this.searchResults;

                if (highlightedOption !== -1) {
                    /* remove highlight from current option */
                    searchResults[highlightedOption].highlighted = false;
                } else {
                    highlightedOption = searchResults.length - 1;
                }

                if (--highlightedOption === -1) {
                    highlightedOption = searchResults.length - 1;
                    searchResults[highlightedOption].highlighted = true;
                } else {
                    searchResults[highlightedOption].highlighted = true;
                }
                this.highlightedOption = highlightedOption;
                this.searchResults = [...searchResults];

                /* scrol to option */
                this.scrollToOption();
            }

            if (code === DOWN_ARROW) {
                let highlightedOption = this.highlightedOption;
                let searchResults = this.searchResults;

                if (highlightedOption !== -1) {
                    /* remove highlight from current option */
                    searchResults[highlightedOption].highlighted = false;
                }

                if (++highlightedOption === searchResults.length) {
                    highlightedOption = 0;
                    searchResults[highlightedOption].highlighted = true;
                } else {
                    searchResults[highlightedOption].highlighted = true;
                }
                this.highlightedOption = highlightedOption;
                this.searchResults = [...searchResults];

                /* scrol to option */
                this.scrollToOption();
            }
        }
    }

    handleInput(event) {
        if (this.isSelectionAllowed) {
            this.updateSearchTerm(event.target.value);
        }
    }

    handleBlur() {
        this.hasFocus = false;

        this.resetHighlightedOptions();
    }

    handleOptionMousedown(event) {
        this.selectedOptions.push(event.detail.option);

        /* reset error message */
        this.errorMessage = '';

        /* Reset search */
        this.searchTerm = '';
        this.searchResults = [];

        this.handleOptionChange();
    }

    handleRemoveSelectedOption(event) {
        event.preventDefault();

        this.selectedOptions = [];

        this.handleOptionChange();
    }

    handleOptionChange() {
        let selectedOptions = this.selectedOptions;
        let value = this.hasSelection ? selectedOptions[0].id : null;
        let title = this.hasSelection ? selectedOptions[0].title : null;
        const optionChangeEvent = new CustomEvent('change', {
            detail: {
                name: this.name,
                value: value,
                title: title
            }
        });
        this.dispatchEvent(optionChangeEvent);
    }

    updateSearchTerm(newSearchTerm) {
        this.searchTerm = newSearchTerm;

        /* Compare clean new search term with current one and abort if identical */
        const newCleanSearchTerm = newSearchTerm.trim().replace(/\*/g, '').toLowerCase();
        if (this.cleanSearchTerm === newCleanSearchTerm) {
            return;
        }

        /* Save clean search term */
        this.cleanSearchTerm = newCleanSearchTerm;

        /* Ignore search terms that are too small */
        if (newCleanSearchTerm.length < MINIMAL_SEARCH_TERM_LENGTH) {
            this.searchResults = [];
            return;
        }

        /* Apply search throttling (prevents search if user is still typing) */
        if (this.searchThrottlingTimeout) {
            clearTimeout(this.searchThrottlingTimeout);
        }

        this.searchThrottlingTimeout = setTimeout(() => {
                /* Send search event if search term is long enougth */
                if (this.cleanSearchTerm.length >= MINIMAL_SEARCH_TERM_LENGTH) {
                    this.search();
                }
                this.searchThrottlingTimeout = null;
            },
            SEARCH_DELAY
        );
    }

    search() {
        let searchFilter = {
            object: this.object,
            searchTerm: this.cleanSearchTerm
        }

        if (this.recordTypeId) {
            searchFilter.recordTypeId = this.recordTypeId;
        }

        if (this.iconName) {
            searchFilter.iconName = this.iconName;
        }

        search({searchFilterJSON: JSON.stringify(searchFilter)})
                .then(response => {
                    console.log(response);
                    if (response.status === "success") {
                        this.searchResults = response.body.searchResults;
                    } else if (response.status === "warning") {
                        this.showToast('Warning', response.message, response.status);
                    } else if (response.status === "error") {
                        this.showToast('Error', response.message, response.status);
                    }
                })
                .catch(error => {
                    /* show toast */
                    this.showToast(error.statusText, error.body.message, 'error');
                });
    }

    getRecentItems() {
        let searchFilter = {
            object: this.object
        };

        if (this.recordTypeId) {
            searchFilter.recordTypeId = this.recordTypeId;
        }

        if (this.iconName) {
            searchFilter.iconName = this.iconName;
        }

        getRecentItems({searchFilterJSON: JSON.stringify(searchFilter)})
                .then(response => {
                    console.log('responseJSON ' + JSON.stringify(response));
                    if (response.status === "success") {
                        this.searchResults = response.body.recentItems;
                    } else if (response.status === "warning") {
                        this.showToast('Warning', response.message, response.status);
                    } else if (response.status === "error") {
                        this.showToast('Error', response.message, response.status);
                    }
                })
                .catch(error => {
                    /* show toast */
                    console.log(error)
                    this.showToast(error.statusText, error.body.message, 'error');
                });
    }

    getSelectedRecord() {
        if (this.object && this.state.value) {
            let searchFilter = {
                object: this.object,
                recordId: this.state.value
            }

            if (this.iconName) {
                searchFilter.iconName = this.iconName;
            }
            getSelectedRecord({searchFilterJSON: JSON.stringify(searchFilter)})
                    .then(response => {
                        if (response.status === "success") {
                            this.selectedOptions = response.body.selectedOptions;
                        } else if (response.status === "warning") {
                            this.showToast('Warning', response.message, response.status);
                        } else if (response.status === "error") {
                            this.showToast('Error', response.message, response.status);
                        }
                    })
                    .catch(error => {
                        /* show toast */
                        this.showToast(error.statusText, error.body.message, 'error');
                    });
        }
    }

    scrollToOption() {
        let option = this.template.querySelector('[data-id="option"][data-index="' + this.highlightedOption + '"]');

        if (option) {
            option.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    resetHighlightedOptions() {
        let highlightedOption = this.highlightedOption;

        let searchResults = this.searchResults;
        if (searchResults[highlightedOption]) {
            searchResults[highlightedOption].highlighted = false;
            this.searchResults = [...searchResults];
        }

        this.highlightedOption = -1;
    }

    showToast(title, message, variant) {
        const showToastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(showToastEvent);
    }
}