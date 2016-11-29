Ext.override(Rally.ui.combobox.FieldValueComboBox, {
    refreshWithNewModel: function(modelName, fieldName){
        this.model = modelName;
        this.field = fieldName;
        this._fetchModel();
    },
    _onModelRetrieved: function(model) {
        this.model = model;
        if (Ext.isString(this.field)){
            this.field = this.model.getField(this.field);
        }
        if (this.storeConfig && this.storeConfig.autoLoad) {
            this._populateStore();
        } else {
            this.onReady();
        }
    },
    _loadStoreValues: function() {
        this.field.getAllowedValueStore({context: this.context && _.isFunction(this.context.getDataContext) ? this.context.getDataContext() : this.context}).load({
            requester: this,
            callback: function(records, operation, success) {
                var store = this.store;
                if (!store) {
                    return;
                }
                var values = [],
                    labelValues = _.map(
                        _.filter(records, this._hasStringValue),
                        this._convertAllowedValueToLabelValuePair,
                        this
                    );

                if(this.field.getType() === 'boolean') {
                    labelValues = labelValues.concat([
                        this._convertToLabelValuePair('Yes', true),
                        this._convertToLabelValuePair('No', false)
                    ]);
                    //override to not add the No Entry option
                } else if (this.allowNoEntry && this.field.required === false) {
                    var name = "-- No Entry --",
                        value = this.noEntryValue;
                    if (this.getUseNullForNoEntryValue()) {
                        this.noEntryValue = value = null;
                    }
                    if (this.field.attributeDefinition.AttributeType.toLowerCase() === 'rating') {
                        name = this.getRatingNoEntryString();
                        value = "None";
                    }
                    values.push(this._convertToLabelValuePair(name, value));
                }

                if (this.getAllowInitialValue() && this.config.value) {
                    var initialValue = this.transformOriginalValue(this.config.value);
                    if (this._valueNotInAllowedValues(initialValue, labelValues)) {
                        var label = this.config.value._refObjectName || initialValue;
                        values.push(this._convertToLabelValuePair(label, initialValue));
                    }
                }

                store.loadRawData(values.concat(labelValues));
                store.fireEvent('load', store, store.getRange(), success);
            },
            scope: this
        });
    },
    _convertToLabelValuePair: function(label, value) {
        var allowedValue = {};
        allowedValue[this.valueField] = label; //value;
        allowedValue[this.displayField] = label;
        return allowedValue;
    },
});