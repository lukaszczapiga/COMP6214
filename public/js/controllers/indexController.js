var indexController = angular.module('indexController', []);

indexController.controller('indexCtrl', function ($scope, $location){
    $scope.isActive = function (viewLocation) {
        return $location.path().indexOf(viewLocation) == 0;
    };
});