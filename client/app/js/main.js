/* var angular = require('angular');
var app = angular.module('hades', []);
app.controller('main', function($scope) {
    $scope.firstName= "John";
    $scope.lastName= "Doe";
}); */

var starbound=require('./js/starbound.js');
var $=require('jquery');

let userConsole = {
  log: function(v) {
    $('.console-output').append("<div>" + v + "</div>")
    var consoleOutputElement = $('.console-output').get(0);
    consoleOutputElement.scrollTop = consoleOutputElement.scrollHeight;
  },
  close: function() {
    $('.console-close').click();
  }
}

$('#connect').click(function() {
  starbound.connect();
});
