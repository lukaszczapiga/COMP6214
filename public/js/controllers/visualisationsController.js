var visualisationsController = angular.module('visualisationsController', []);

indexController.controller('visualisationsCtrl', function ($scope, openDataService){
    $scope.welcomeMessage = "Hi, visualisation here";
    $scope.data = {};
    $scope.agencyData = [];

    openDataService.getData().then(function(response){
        $scope.data = response.data;
        var prev =  $scope.data[1]['Agency Name'];
        var lifecycleTotalCosts = 0;
        var agencyTotalCosts = 0;
        var count = 0;

        for(i=0;i<$scope.data.length; i++){
            count++;
            var agency = {};
            var agencyName = $scope.data[i]['Agency Name'];
            var temp;
            var first;

            if(agencyName === $scope.data[1]['Agency Name']){
                temp = agencyName;
            }

            lifecycleTotalCosts = lifecycleTotalCosts + $scope.data[i]['Lifecycle Cost'];
            agencyTotalCosts = agencyTotalCosts +  $scope.data[i]['Projected/Actual Cost ($ M)'];


            if(agencyName !== prev ){
                agency.name = prev;
                agency.totalCosts = agencyTotalCosts;
                agency.lifecycleCosts = lifecycleTotalCosts;
                agency.projectCount = count;
                $scope.agencyData.push(agency);
                count = 0;
                lifecycleTotalCosts = 0;
                agencyTotalCosts = 0;
            }
            prev = agencyName;
        }
        console.log("ok");
    });

});