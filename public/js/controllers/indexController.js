var indexController = angular.module('indexController', []);

indexController.controller('indexCtrl', function ($scope){
    $scope.welcomeMessage = "Hi, Index here";
});