var dataService = angular.module('dataService', []);

dataService.factory('openDataService', function($http) {
    var openData = {};
    var promise;

    openData.getData = function () {
        promise = $http.get('/api/data');

        return promise;
    };

    return openData;
});