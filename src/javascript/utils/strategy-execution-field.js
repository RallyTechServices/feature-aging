Ext.define('CA.agile.technicalservices.StrategyExecutionGroupSettingsField',{
    extend: 'Ext.form.field.Base',
    alias: 'widget.tsstrategyexecutiongroupsettingsfield',
    fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',

    cls: 'column-settings',

    config: {
        height: 150,
        width: 700,

        /*
         * Name to display at the top of the grid column that shows the execution project
         * (E.g., might want to display this as "Delivery" or "Delivery Teams")
         */
        executionColumnDisplayName: 'Delivery Team',
        /*
         * Name to display at the top of the grid column that shows the strategy project
         */
        strategyColumnDisplayName: 'Portfolio Team',
        /*
         * Name to display at the top of the grid column that shows the user's choice for group name
         */
        groupColumnDisplayName: 'Program Name',

        emptyText: 'No Selections'

    },

    labelAlign: 'top',

    onRender: function() {
        this.callParent(arguments);

        var decoded_value = [],
            data = [];

        if (this.initialConfig && this.initialConfig.value && !_.isEmpty(this.initialConfig.value)){
            if (!Ext.isObject(this.initialConfig.value)){
                decoded_value = Ext.JSON.decode(this.initialConfig.value);
            } else {
                decoded_value = this.initialConfig.value;
            }
        }
        if ( Ext.isArray(decoded_value) ) { data = decoded_value; }

        this._store = Ext.create('Ext.data.Store', {
            fields: ['groupName','strategyProjectName','strategyProjectRef',
                'executionProjectName','executionProjectRef'],
            data: data
        });

        var container_width = this.config.width || 500;
        if ( container_width < 400 ) { container_width = 400; }
        var container_height = this.config.height || 150;
        if ( container_height < 150 ) { container_height = 150; }

        var container = Ext.create('Ext.container.Container',{
            layout: { type:'hbox' },
            renderTo: this.inputEl,
            width: container_width,
            height: container_height,
            margin: 5
        });

        this._createGrid(container);
        this._createButton(container);
        this.fireEvent('ready', true);
    },

    setValue: function(value) {
        this.callParent(arguments);
        this._value = value;
    },
    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and an array of objects representing the groups.
     *
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {};
        data[this.name] = Ext.JSON.encode(this._buildSettingValue());
        return data;
    },

    _createGrid: function(container) {
        var gridWidth = Math.max(container.getWidth(true)-125,400);

        this._grid = container.add({
            xtype:'rallygrid',
            width: gridWidth,
            columnCfgs: this._getColumnCfgs(),
            showPagingToolbar: false,
            showRowActionsColumn: false,
            enableRanking: false,
            store: this._store,
            emptyText: this.emptyText || 'No Selections',
            editingConfig: {
                publishMessages: false
            }
        });
    },

    _createButton: function(container) {

        container.add({
            xtype: 'rallybutton',
            text: 'Add Program',
            margin: '0 0 0 10',
            listeners: {
                scope: this,
                click: function(){
                    var store = this._grid.getStore();
                    Ext.create('CA.agile.technicalservices.StrategyExecutionPickerDialog',{
                        strategyLabel: 'Portfolio Team Root',
                        executionLabel: 'Delivery Team Root',
                        groupLabel: 'Program Name',

                        listeners: {
                            scope: this,
                            select: function(dialog,value) {
                                if ( Ext.isEmpty(value) ) { return; }

                                var group_name = value.groupName;
                                var strategy_project = value.strategyProject;

                                store.add({
                                    groupName: group_name,
                                    strategyProjectName: strategy_project.get('_refObjectName'),
                                    strategyProjectRef: strategy_project.get('_ref'),
                                    executionProjectName: null,
                                    executionProjectRef: null
                                });
                            }
                        }
                    });


                }
            }
        });
    },

    _buildSettingValue: function() {
        var mappings = [];
        var store = this._grid.getStore();

        store.each(function(record){
            if ( record.get('strategyProjectRef') ) {
                mappings.push(record.getData());
            }
        });

        return mappings;
    },

    _removeProject: function(){
        this.grid.getStore().remove(this.record);
    },

    _getColumnCfgs: function() {
        var me = this;
        return [{
            xtype: 'rallyrowactioncolumn',
            scope: this,
            rowActionsFn: function(record){
                return  [
                    {text: 'Remove', record: record, handler: me._removeProject, grid: me._grid }
                ];
            }
        },
            {
                dataIndex: 'groupName',
                text: this.groupColumnDisplayName,
                flex: 1
            },
            {
                dataIndex: 'strategyProjectName',
                text: this.strategyColumnDisplayName,
                flex: 1
            //},
            //{
            //    dataIndex: 'executionProjectName',
            //    text: this.executionColumnDisplayName,
            //    flex: 1
            }];
    },

    onDestroy: function() {
        if (this._grid) {
            this._grid.destroy();
            delete this._grid;
        }
        this.callParent(arguments);
    }
});