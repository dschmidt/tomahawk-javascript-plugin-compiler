'use strict';

module.exports = function(environment, appConfig) {
//     console.log('environment', environment);
//     console.log('appConfig', appConfig);

    appConfig.includeResolvers = [new RegExp(/youtube.js/)];
    appConfig.tomahawkGlobal = 'hatchet/utils/tomahawk';
};
