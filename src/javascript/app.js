Ext.define("portfolio-aging", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'selector_box', layout: 'hbox', flex: 1, float: 'right', tpl: '<div class="no-data-container"><div class="secondary-message">{message}</div></div>'},
        {xtype:'container',itemId:'grid_box', flex: 1}
    ],

    integrationHeaders : {
        name : "portfolio-aging"
    },
    config: {
        defaultSettings: {
            portfolioItemType: null,
            portfolioItemStates: [],
            projectGroups: [],
            portfolioStates: [],
            query: null,
            lastUpdateDateAfter: null,
            creationDateAfter: null,
            orFilter: false
        }
    },


    portfolioItemTypes: null,
    portfolioItemStates: null,

    launch: function() {
        this.logger.log('launch Settings:', this.getSettings());
        // get any data model customizations ... then get the data and render the chart

        if (!this.validateApp()){
            return;
        }

        this.initializeApp();
        //Deft.Promise.all([
        //    CA.technicalservices.Toolbox.fetchPortfolioItemTypes(),
        //    CA.technicalservices.Toolbox.fetchPortfolioItemStates()
        //]).then({
        //    success: this.initializeApp,
        //    failure: this.showErrorNotification,
        //    scope: this
        //});
    },
    validateApp: function(){

        if (!this.getProjectGroups() || this.getProjectGroups().length === 0){
            this.getSelectorBox().update({message: "Please use the App Settings to configure at least 1 Program."});
            return false;
        }

        if (!this.getStates() || this.getStates().length === 0){
            this.getSelectorBox().update({message: "Please use the App Settings to configure at least 1 Portfolio State."});
            return false;
        }

        return true;
    },
    initializeApp: function(){
        this.logger.log('initializeApp');

        this.getSelectorBox().update("");
        this.getSelectorBox().add({
            xtype: 'container',
            flex: 1
        });
        this.getSelectorBox().add({
            xtype: 'rallybutton',
            iconCls: 'icon-export',
            cls: 'rly-small secondary',
            handler: this.exportData,
            scope: this
        });

        this.fetchData();
    },
    exportData: function(button){
        var menu = Ext.widget({
            xtype: 'rallymenu',
            items: [{
                    text: 'Export...',
                    handler: function(){
                        var grid = this.down('rallygrid');
                        if (!grid){
                            return;
                        }

                        var store = grid.getStore(),
                            columns = this.getColumnCfgs(),
                            headers = [];

                        Ext.Array.each(columns, function(c){
                            if (c.columns && c.columns.length > 0){
                                var txt = c.text;
                                Ext.Array.each(c.columns, function(subcol){
                                    headers.push(Ext.String.format(" {1} ({0})",txt, subcol.text));
                                });
                            } else {
                                headers.push(c.text);
                            }
                        });

                        var csv = [headers.join(',')];
                        Ext.Array.each(store.getRange(), function(r){
                            var row = [];
                            Ext.Array.each(columns, function(c){
                                if (c.columns && c.columns.length > 0){
                                    Ext.Array.each(c.columns, function(subcol){
                                        row.push(r.get(subcol.dataIndex));
                                    });
                                } else {
                                    row.push(r.get(c.dataIndex));
                                }
                            });
                            csv.push(row.join(','));
                        });
                        csv = csv.join('\r\n');
                        this.logger.log('exportData', csv);
                        var fileName = Ext.String.format("portfolio-aging-{0}.csv",Rally.util.DateTime.format(new Date(), 'Y-m-d-h-i-s'));
                        Rally.technicalservices.FileUtilities.saveCSVToFile(csv,fileName);
                    },
                    scope: this
                }]
        });
        menu.showBy(button.getEl());
        if(button.toolTip) {
            button.toolTip.hide();
        }
    },
    fetchData: function(){
        this.logger.log('fetchData');

        var promises = [];

        this.getGridBox().removeAll();
        this.setLoading(true);

        Ext.Array.each(this.getProjectGroups(), function(p){
            var ref = p.strategyProjectRef;
            promises.push(this.fetchWsapiData(ref));
        }, this);

        Deft.Promise.all(promises).then({
            success: this.processData,
            failure: this.showErrorNotification,
            scope: this
        }).always(function(){
            this.setLoading(false);
        }, this);

    },
    processData: function(results){
        var data = [],
            fields = ['name'],
            states = this.getStates(),
            ageBuckets = this.getAgeBuckets(),
            projectGroups = this.getProjectGroups();

        this.logger.log('processData', results);

        for (var i=0; i< projectGroups.length; i++){
            var row = {
                    name: projectGroups[i].groupName
                },
                snaps = results[i];

                var stateAges = CA.agile.technicalservices.AgeCalculator.getBucketedAgeCount(snaps, ageBuckets, 'State', states);
                Ext.Object.each(stateAges, function(state, ageBuckets){
                    for (var k=0; k < ageBuckets.length; k++){
                        var dataIndex = this.formatAgeColumnDataIndex(state,k);
                        fields.push(dataIndex);
                        row[dataIndex] = ageBuckets[k];
                    }
                }, this);

            data.push(row);
        }
        this.buildGrid(data, fields);
    },
    buildGrid: function(data, fields){
        this.logger.log('buildGrid', data, fields);

        this.getGridBox().add({
            xtype: 'rallygrid',
            showRowActionColumns: false,
            columnCfgs: this.getColumnCfgs(),
            store: Ext.create('Rally.data.custom.Store',{
                data: data,
                fields: fields,
                pageSize:  data.length
            }),
            showPagingToolbar: false,
            showRowActionsColumn: false,
            flex: 1
        });

    },
    getColumnCfgs: function(){
        var cols = [{
            dataIndex: 'name',
            text: 'Program',
            flex: 2
        }],
            ageBuckets = this.getAgeBuckets();

        Ext.Array.each(this.getStates(), function(state){
            var subColumns = [];
            for (var i=0; i< ageBuckets.length; i++){
                var subText = this.formatAgeColumnText(ageBuckets[i]),
                    subIndex = this.formatAgeColumnDataIndex(state, i);

                subColumns.push({
                    dataIndex: subIndex,
                    text: subText,
                    flex: 1
                });
            }
            cols.push({
                text: state,
                columns: subColumns
            });
        }, this);

        return cols;
    },
    formatAgeColumnText: function(ageBucket){
        if (ageBucket.min && ageBucket.max){
            return Ext.String.format('{0} - {1}', ageBucket.min, ageBucket.max);
        }

        if (ageBucket.min){
            return Ext.String.format('{0}+', ageBucket.min);
        }

        return Ext.String.format('<{0}', ageBucket.max);
    },
    formatAgeColumnDataIndex: function(state, idx){
        return Ext.String.format('{0}_{1}', state, idx);
    },
    fetchWsapiData: function(projectRef){
        var filters = this.getFilters();
        this.logger.log('fetchWsapiData', projectRef);
        return CA.agile.technicalservices.Toolbox.fetchWsapiRecords({
            model: this.getPortfolioItemType(),
            fetch: ['ObjectID','StateChangedDate','State','Name'],
            filters: filters,
            context: {project: projectRef, projectScopeDown: true}
        });

    },
    getFilters: function(){

        if (this.getSetting('query')){
            this.logger.log('getFilters queryString provided: ', this.getSetting('query'));
            return Rally.data.wsapi.Filter.fromQueryString(this.getSetting('query'));
        }

        var filters = [];

        if (this.getSetting('lastUpdateDateAfter')){
            this.logger.log('getFilters lastUpdateDateAfter provided: ', this.getSetting('lastUpdateDateAfter'));
            filters.push({
                property: 'LastUpdateDate',
                operator: '>=',
                value: Rally.util.DateTime.toIsoString(new Date(this.getSetting('lastUpdateDateAfter')))
            });
        }

        if (this.getSetting('creationDateAfter')){
            this.logger.log('getFilters creationDateAfter provided: ', this.getSetting('creationDateAfter'));
            filters.push({
                property: 'CreationDate',
                operator: '>=',
                value: Rally.util.DateTime.toIsoString(new Date(this.getSetting('creationDateAfter')))
            });
        }

        if (filters.length > 1){
            var orFilters = this.getSetting('orFilter');
            if (orFilters === "true" || orFilters === true){
                filters = Rally.data.wsapi.Filter.or(filters);
            } else {
                filters = Rally.data.wsapi.Filter.and(filters);
            }
        }

        if (filters.length === 1){
            filters = Ext.create('Rally.data.wsapi.Filter',filters[0]);
        }

        if (filters.length === 0){
            filters = null;
        }

        var stateFilters = Ext.Array.map(this.getStates(), function(state){ return {
            property: 'State.Name',
            value: state
            };
        });
        stateFilters = Rally.data.wsapi.Filter.or(stateFilters);

        if (filters){
            return stateFilters.and(filters);
        }
        return stateFilters;
    },
    fetchHistoricalData: function(projectOid){
        this.logger.log('fetchHistoricalData', records);

        var config = {
            find: {
                _TypeHierarchy: this.getPortfolioItemType(),
                State: {$in: this.getStates()},
                _ProjectHierarchy: projectOid
            },
            fetch: ['_ValidFrom','ObjectID','Project','_ValidTo','_SnapshotNumber'],
            hydrate: ['State'],
            //sort:  {_ValidFrom: 1}
        };

        return CA.agile.technicalservices.Toolbox.fetchSnapshots(config).then({
            success: this.buildGrid,
            failure: this.showErrorNotification,
            scope: this
        });

    },
    showErrorNotification: function(msg){
        Rally.ui.notify.Notifier.showError({message: msg});
    },
    getSelectorBox: function(){
        return this.down('#selector_box');
    },
    getGridBox: function(){
        return this.down('#grid_box');
    },
    getAgeBuckets: function(){
        return [{
            min: 1,
            max: 30
        },{
            min: 30,
            max: 60
        },{
            min: 60,
            max: 90
        },{
            min: 90,
            max: null
        }];
    },
    getPortfolioItemType: function(){
        return this.getSetting('portfolioItemType') || 'PortfolioItem/Feature';
    },
    getStates: function(){
        var states = [],
            stateSetting = this.getSetting('portfolioItemStates');
        if (!Ext.isArray(stateSetting)){
            states = stateSetting.split(','); //Ext.JSON.decode(stateSetting);
        } else {
            states = stateSetting;
        }
        return states;
    },
    getProjectGroups: function(){
        var groups = [],
            group_setting = this.getSetting('projectGroups');
        this.logger.log('getProjectGroups', group_setting);

        if (!Ext.isArray(group_setting)){
            groups = Ext.JSON.decode(group_setting);
        } else {
            groups = group_setting;
        }
        this.logger.log('getProjectGroups', groups);
        return groups;
    },
    getSettingsFields: function(){
        var labelWidth = 175,
            orFilter = this.getSetting('orFilter') === "true" || this.getSetting('orFilter') === true;

        return [{
            xtype: 'rallyportfolioitemtypecombobox',
            name: 'portfolioItemType',
            valueField: 'TypePath',
            fieldLabel: 'Portfolio Item Type',
            labelAlign: 'right',
            labelWidth: labelWidth,
            bubbleEvents: ['select','change','ready']
        },{
            xtype: 'rallyfieldvaluecombobox',
            name: 'portfolioItemStates',
            field: 'State',
            model: this.getPortfolioItemType(),
            fieldLabel: 'Portfolio Item States',
            labelAlign: 'right',
            labelWidth: labelWidth,
            multiSelect: true,
            allowNoEntry: false,
            valueField: 'Name',
            handlesEvents: {
                select: function(ptpicker){
                    var model = ptpicker.getRecord() && ptpicker.getRecord().get('TypePath');
                    if (model){
                        this.field = 'State';
                        this.refreshWithNewModel(model, 'State');
                    }
                },
                change: function(ptpicker){
                    var model = ptpicker.getRecord() && ptpicker.getRecord().get('TypePath');
                    if (model){
                        this.field = 'State';
                        this.refreshWithNewModel(model, 'State');
                    }
                },
                ready: function(ptpicker){
                    var model = ptpicker.getRecord() && ptpicker.getRecord().get('TypePath');
                    if (model){
                        this.field = 'State';
                        this.refreshWithNewModel(model, 'State');
                    }
                }
            }
        },{
            xtype: 'container',
            margin: '25 0 0 0',
            html: '<div class="rally-upper-bold">Programs</div>'
        },{
            name: 'projectGroups',
            xtype:'tsstrategyexecutiongroupsettingsfield',
            fieldLabel: ' '
        },{
            xtype: 'container',
            margin: '25 0 0 0',
            html: '<div class="rally-upper-bold">Filter by Date</div>',
        },{
            xtype: 'rallydatefield',
            fieldLabel: 'Items created after',
            labelAlign: 'right',
            labelWidth: labelWidth,
            name: 'creationDateAfter'
        },{
            xtype: 'radiogroup',
            fieldLabel: ' ',
            // Arrange radio buttons into two columns, distributed vertically
            columns: 2,
            vertical: true,
            width: 200,
            items: [
                { boxLabel: 'AND', name: 'orFilter', inputValue: false, checked: !orFilter },
                { boxLabel: 'OR', name: 'orFilter', inputValue: true, checked: orFilter }
            ],
        }, {
            xtype: 'rallydatefield',
            labelAlign: 'right',
            labelWidth: labelWidth,
            fieldLabel: 'Items updated after',
            name: 'lastUpdateDateAfter'
        }, {
            xtype: 'textarea',
            fieldLabel: '<div class="rally-upper-bold">Filter by Query</div><em>Query fields must apply to all item types.  This filter will override the date filters above for all item types.</em>',
            labelAlign: 'top',
            name: 'query',
            anchor: '100%',
            cls: 'query-field',
            margin: '25 70 0 0',
            plugins: [
                {
                    ptype: 'rallyhelpfield',
                    helpId: 194
                },
                'rallyfieldvalidationui'
            ],
            validateOnBlur: false,
            validateOnChange: false,
            validator: function(value) {
                try {
                    if (value) {
                        Rally.data.wsapi.Filter.fromQueryString(value);
                    }
                    return true;
                } catch (e) {
                    return e.message;
                }
            }
        }];
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
