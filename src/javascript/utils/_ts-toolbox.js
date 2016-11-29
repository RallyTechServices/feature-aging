Ext.define('CA.agile.technicalservices.Toolbox', {
    singleton: true,

    fetchPortfolioItemTypes: function(){
        var deferred = Ext.create('Deft.Deferred');
        Ext.create('Rally.data.wsapi.Store',{
            model: 'typedefinition',
            fetch:['TypePath','Ordinal','Name'],
            filters: [{property:'TypePath',operator:'contains',value:'PortfolioItem/'}],
            sorters: [{property:'Ordinal',direction:'ASC'}]
        }).load({
            callback: function(records,operation){
                if (operation.wasSuccessful()){
                    var portfolioItemArray = [];
                    Ext.Array.each(records,function(rec){
                        portfolioItemArray.push(rec.getData());
                    });
                    deferred.resolve(portfolioItemArray);
                } else {
                    var message = 'failed to load Portfolio Item Types ' + (operation.error && operation.error.errors.join(','));
                    deferred.reject(message);
                }
            }
        });
        return deferred.promise;
    },
    fetchPortfolioItemStates: function(){
        var deferred = Ext.create('Deft.Deferred');
        console.log('fetchPortfolioItemStates');
        Ext.create('Rally.data.wsapi.Store',{
            model: 'State',
            fetch:['TypeDef','TypePath','OrderIndex','Name'],
            filters: [{property:'Enabled',value: true}],
            sorters: [{property:'OrderIndex',direction:'ASC'}]
        }).load({
            callback: function(records,operation){
                if (operation.wasSuccessful()){
                    console.log('states', records);
                    var stateHash = {};
                    Ext.Array.each(records, function(r){
                        if (/^PortfolioItem/.test(r.get('TypeDef') && r.get('TypeDef').TypePath)){
                            if (!stateHash[r.get('TypeDef').TypePath]){
                                stateHash[r.get('TypeDef').TypePath] = [];
                            }
                            stateHash[r.get('TypeDef').TypePath].push(r.get('Name'));
                        }
                    });
                    deferred.resolve(stateHash);
                } else {
                    var message = 'failed to load Portfolio Item Types ' + (operation.error && operation.error.errors.join(','));
                    deferred.reject(message);
                }
            }
        });

        return deferred.promise;
    },
    fetchScheduleStates: function(){
        var deferred = Ext.create('Deft.Deferred');

        Rally.data.ModelFactory.getModel({
            type: 'UserStory',
            success: function(model) {
                model.getField('ScheduleState').getAllowedValueStore().load({
                    callback: function(records, operation, success) {
                        var states = [];
                        Ext.Array.each(records, function(allowedValue) {
                            states.push(allowedValue.get('StringValue'));
                        });
                        deferred.resolve(states);
                    }
                });
            }
        });
        return deferred.promise;
    },
    fetchWsapiRecords: function(config){
        var deferred = Ext.create('Deft.Deferred');

        config.limit = config.limit || Infinity;
        config.pageSize = config.pageSize || 2000;

        Ext.create('Rally.data.wsapi.Store', config).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.reject('Fetch WSAPI records failed: ' + operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    },
    fetchSnapshots: function(config){
        var deferred = Ext.create('Deft.Deferred');

        config.limit = config.limit || Infinity;

        Ext.create('Rally.data.lookback.SnapshotStore', config).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.reject('Fetch LBAPI snapshots failed: ' + operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    }
});