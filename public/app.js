'use strict';

angular.module('openDataApp', [
    'ui.router',
    'indexController',
    'visualisationsController',
    'dataService'
]).config(function ($stateProvider, $urlRouterProvider, $locationProvider){
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise('/home');

    // Now set up the states
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'views/visualisations.html',
            controller: 'visualisationsCtrl'
        })
        .state('about',{
            url: '/about',
            templateUrl: 'views/about.html'
        });

    $locationProvider.html5Mode(true);
});