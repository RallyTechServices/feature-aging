describe("Using the Age Calculator",function() {
    var date1 = new Date(2016,08,07,0,0,0);
    var date2 = new Date(2016,08,08,14,0,0);
    var date3 = new Date(2016,08,08,23,59,0);
    var date4 = new Date(2016,08,09,7,7,0);
    var date5 = new Date(2016,08,09,23,59,0);
    var date6 = new Date(2016,08,10,0,0,0);
    var date7 = new Date(2016,08,10,23,59,0);
    var date8 = new Date(2016,08,15,0,0,0);
    var date9 = new Date(2016,08,16,0,0,0);
    var date10 = new Date(2016,08,23,0,0,0);
    var date11 = new Date(2016,10,25,0,0,0);
    var date12 = new Date(2016,10,27,0,0,0);

    describe("When getting age data", function() {
        it('should calculate the cycle time start and end dates correctly', function () {
            //var precedence = ["", 'Intake', 'Analysis', 'Refinement', 'Build', 'Test', 'Demo', 'Done', 'Archive'],
            //    snaps = [
            //        {ThisState: '', _ValidFrom: date1},
            //        {ThisState: 'Done', _ValidFrom: date2},
            //        {ThisState: 'Intake', _ValidFrom: date3},
            //        {ThisState: 'Analysis', _ValidFrom: date4},
            //        {ThisState: 'Demo', _ValidFrom: date5},
            //        {ThisState: 'Done', _ValidFrom: date6}
            //    ];
            //CArABU.technicalservices.CycleTimeCalculator.precision = 2;
            //CArABU.technicalservices.CycleTimeCalculator.granularity = 'day';
            //
            //var cycleTime = CArABU.technicalservices.CycleTimeCalculator.getCycleTimeData(snaps, "ThisState", "Refinement", "Done", precedence);
            //expect(cycleTime.startDate).toEqual(date2);
            //expect(cycleTime.endDate).toEqual(date6);
            //
            //var diff = (Rally.util.DateTime.getDifference(date6, date2, 'second') / 86400).toFixed(2);
            expect(false).toEqual(true);

        });
    });

    // describe("When getting last end date",function(){
    //    it ('it should return the last time that the object enters the end state', function() {
    //        var timeInStateData = {
    //            stateName1: {
    //                stateA: [[date1, date2], [date5, date6]],
    //                stateB: [[date3, date4]],
    //                stateC: [[date7, date8], [date11]]
    //            }
    //        };
    //
    //        expect(CArABU.technicalservices.CycleTimeCalculator.getFirstStartDate(timeInStateData, 'stateName1', 'stateA')).toEqual(date1);
    //        expect(CArABU.technicalservices.CycleTimeCalculator.getFirstStartDate(timeInStateData, 'stateName1', 'stateB')).toEqual(date3);
    //        expect(CArABU.technicalservices.CycleTimeCalculator.getFirstStartDate(timeInStateData, 'stateName1', 'stateC')).toEqual(date7);
    //    });
    //});


});