'use strict';

angular
    .module('app.core')
    .controller('SettingsController', function($scope, configService) {

        $scope.config = configService.loadConfigFile();
        $scope.save = function() {
            configService.saveConfigFile($scope.config);
        };
        $scope.undo = function() {
            $scope.config = configService.loadConfigFile();
        }

    });
