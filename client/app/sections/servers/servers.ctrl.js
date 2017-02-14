'use strict';

// var starbound=require('../../js/starbound.js');

angular
    .module('app.core')
    .controller('ServersController', function($scope, $http, starbound) {

        $scope.servers = {};
        $scope.numberOfServers = function() {
            return Object.keys($scope.servers).length;
        }
        $scope.selectedServer = null;
        $scope.selectServer = function(server) {
            $scope.selectedServer = server;
        }
        $scope.connect = function(server) {
            starbound.connect(server);
        }

        starbound.syncServers($scope.servers);

    });
