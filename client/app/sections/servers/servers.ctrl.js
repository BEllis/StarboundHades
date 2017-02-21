'use strict';

// var starbound=require('../../js/starbound.js');

angular
    .module('app.core')
    .controller('ServersController', function($scope, starboundControlService, starboundInfoService, notificationService) {

        $scope.servers = {};
        $scope.numberOfServers = function() {
            if ($scope.servers == null) {
                return -1;
            }

            return Object.keys($scope.servers).length;
        }
        $scope.selectedServer = null;
        $scope.selectServer = function(server) {
            $scope.selectedServer = server;
        }
        $scope.connect = function(server) {
            starboundControlService.connect(server);
        }

        $scope.refreshServerList = function() {
            $scope.servers = {};
            starboundInfoService.syncServers($scope.servers, function(errorType, errorReason) {
                notificationService.pushNotification(errorType + '\n\n' + errorReason);
                $scope.servers = null;
            });
        }

        $scope.refreshServerList();
    });
