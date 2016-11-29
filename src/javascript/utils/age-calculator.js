Ext.define('CA.agile.technicalservices.AgeCalculator',{
    singleton: true,

    getBucketedAgeCount: function(records, ageBuckets, fieldName, fieldValues){
        var ageBucketsInSeconds = Ext.Array.map(ageBuckets, function(a){
                if (a && a.max) {
                    return a.max * 86400;
                }
                return 0;
            }),
            bucketedAgeCount = {};

        Ext.Array.each(fieldValues, function(v){
            bucketedAgeCount[v] = Ext.Array.map(ageBuckets, function(){ return 0; });
        });

        Ext.Array.each(records, function(record){
            var val = record.get(fieldName),
                stateChangedDate = record.get('StateChangedDate');
           
            if (Ext.isObject(val)){
                val = val._refObjectName;
            }

            if (Ext.Array.contains(fieldValues, val)){
                var seconds = Rally.util.DateTime.getDifference(
                        new Date(), stateChangedDate, 'second');

                for (var i=0; i<ageBucketsInSeconds.length; i++){
                    if (!ageBucketsInSeconds[i] || seconds < ageBucketsInSeconds[i]){
                        bucketedAgeCount[val][i]++;
                        i = ageBuckets.length;
                    }
                }
            }
        });
        return bucketedAgeCount;
    }
});