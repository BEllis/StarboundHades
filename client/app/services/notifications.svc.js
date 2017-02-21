// let Rx = require('rx');

angular
    .module('app.services')
    .factory('notificationService', function() {
        let notificationCounter = 0;
        return {
            pushNotification: function(message) {
                // $('.notifications').append('<notification id="ABC">' + message + '</notification>');
                let id = notificationCounter++;
                $('.notifications').append('<div id="notification-' + id + '" class="container notification" style="margin: 5px; display: inline-block; background-color: black; color: white; width: 80%;">' +
            '<button type="button" class="btn btn-default btn-sm" style="float: right;">' +
              'x' +
            '</button>' +
            '<div style="margin-right: 50px;">' +
             message +
            '</div>' +
            '</div>' +
            '<script>' +
            '$(\'#notification-' + id + '\').click(function() {' +
            '   $(\'#notification-' + id + '\').fadeOut();' +
            '});' +
            '</script>');
            }
        }
    })
    .directive('notifications', function() {
        return {
            restrict: 'E',
            template: function(elem, attr) {
                return '<div class="notifications" style="position:absolute; top: 0px; width: 100%; z-index: 10000; text-align: center;"></div>';
            }
        }
    })
    .directive('notification', function() {
        return {
            restrict: 'E',
            template: function(elem, attr) {
                return '<div id="notification-' + attr.id + '" class="container notification" style="margin: 5px; display: inline-block; background-color: black; color: white; width: 80%;">' +
            '<button type="button" class="btn btn-default btn-sm" style="float: right;">' +
              'x' +
            '</button>' +
            '<div style="margin-right: 50px;">' +
             elem.get(0).innerText +
            '</div>' +
            '</div>' +
            '<script>' +
            '$(\'#notification-' + attr.id + '\').click(function() {' +
            '   $(\'#notification-' + attr.id + '\').fadeOut();' +
            '});' +
            '</script>';
            }
        };
    });