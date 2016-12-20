Ext.define('CA.agile.technicalservices.StrategyExecutionPickerDialog',{
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.tsstrategyexecutiondialog',

    config: {
        autoShow: true,
        width: 200,
        height: 200,
        closable: false,
        draggable: true,

        title: 'Choose Projects',

        selectionButtonText: 'Done',
        strategyLabel: 'Strategy',
        executionLabel: 'Execution',
        groupLabel: 'Group Name'
    },

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },


    initComponent: function() {
        this.callParent(arguments);

        this.addEvents(
            /**
             * @event select
             * Fires when user clicks the done button after choosing the projects
             * @param {CA.agile.technicalservices.StrategyExecutionPickerDialog} source the dialog
             * @param {Object} the name, strategy project and execution project chosen.  Looks like:
             *   { groupName: {String}, strategyProject: {Rally.data.wsapi.Model}, executionProject: {Rally.data.wsapi.Model} }
             */
            'select'
        );

        this.addCls(['chooserDialog', 'chooser-dialog']);
    },

    beforeRender: function() {
        this.callParent(arguments);

        this.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            ui: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    itemId: 'doneButton',
                    text: this.selectionButtonText,
                    cls: 'primary rly-small',
                    scope: this,
                    disabled: true,
                    userAction: 'clicked done in dialog',
                    handler: function() {
                        this.fireEvent('select', this, this.getSelectedValues());
                        this.close();
                    }
                },
                {
                    xtype: 'rallybutton',
                    text: 'Cancel',
                    cls: 'secondary rly-small',
                    handler: this.close,
                    scope: this,
                    ui: 'link'
                }
            ]
        });

        if (this.introText) {
            this.addDocked({
                xtype: 'component',
                componentCls: 'intro-panel',
                html: this.introText
            });
        }

        var container = this.add({
            xtype: 'container',
            itemId: 'selector_box'
        });

        this.addSelectors(container);
    },

    addSelectors: function(container) {
        container.removeAll();

        this.group_name_field = container.add({
            xtype: 'rallytextfield',
            fieldLabel: this.groupLabel,
            labelAlign: 'top',
            margin: 5,
            listeners: {
                scope: this,
                change: this._enableDisableDoneButton
            }
        });

        this.strategy_selector = container.add({
            xtype: 'rallyprojectpicker',
            showMostRecentlyUsedProjects: false,
            workspace: Rally.getApp().getContext().getWorkspaceRef(),
            fieldLabel: this.strategyLabel,
            labelAlign: 'top',
            margin: 5,
            listeners: {
                scope: this,
                change: this._enableDisableDoneButton
            }
        });

    },

    _enableDisableDoneButton: function() {
        var strategy_project = this.strategy_selector && this.strategy_selector.getValue();
        var group_name = this.group_name_field && this.group_name_field.getValue();

        if (! strategy_project || Ext.isEmpty(group_name)) {
                this._disableDoneButton();
        } else {
            this._enableDoneButton();
        }
    },

    _enableDoneButton: function() {
        this.down('#doneButton').setDisabled(false);
    },

    _disableDoneButton: function() {
        this.down('#doneButton').setDisabled(true);
    },

    getSelectedValues: function() {
        var strategy_project = this.strategy_selector && this.strategy_selector.getSelectedRecord();
        var group_name = this.group_name_field && this.group_name_field.getValue();
        if ( ! strategy_project || Ext.isEmpty(group_name)) {
            return;
        }

        return {
            groupName: group_name,
            strategyProject: strategy_project
        }
    }
});