'use strict';

// let angular = require('angular');
require('angular-route');

/* Modules */
require('./app.core.js');
require('./app.routes.js');
require('./app.services.js');

/* Controllers */
require('./sections/about/about.ctrl.js');
require('./sections/servers/servers.ctrl.js');
require('./sections/settings/settings.ctrl.js');

/* Services */
require('./services/starbound.svc.js');

var app = angular.module('hades', ['ngRoute', 'app.core', 'app.routes', 'app.services']);
