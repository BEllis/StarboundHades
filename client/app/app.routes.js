'use strict';

angular
    .module('app.routes', ['ngRoute'])
    .config(function($routeProvider) {
        $routeProvider
        .when("/", {
          templateUrl: 'sections/servers/servers.tpl.html',
          controller: 'ServersController as serversCtrl'
        })
        .when("/about", {
          templateUrl: 'sections/about/about.tpl.html',
          controller: 'AboutController as aboutCtrl'
        })
        .when("/settings", {
          templateUrl: 'sections/settings/settings.tpl.html',
          controller: 'SettingsController as settingsCtrl'
        });
    });
