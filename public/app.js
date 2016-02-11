'use strict';

angular.module('openDataApp', ['angular',
    'angular-ui-route',
    'angular-bootstrap',
    'indexController',
    'visualisationsController'
]).config(function ($stateProvider, $urlRouterProvider, $locationProvider){
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise('/home');

    // Now set up the states
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'views/visualisations.html',
            controller: 'visualisationsCtrl'
        });

    $locationProvider.html5Mode(true);
});