/* jshint node: true */
'use strict';

var CachingWriter = require('broccoli-caching-writer');
var path = require('path');
var walkSync = require('walk-sync');
var fs = require('fs');
var mkdirp = require('mkdirp');
var funnel = require('broccoli-funnel');


Processor.prototype = Object.create(CachingWriter.prototype);
Processor.prototype.constructor = Processor;
function Processor(inputNodes, options){
    options = options || {};

    CachingWriter.call(this, inputNodes, {
        annotation: options.annotation
    });
}


Processor.prototype.build = function() {
//     console.log('updateCache:', this.inputPaths[0], this.outputPath);
    var paths = walkSync(this.inputPaths[0]);

    var first = true;
    for (var i = 0, l = paths.length; i < l; i++) {
        var filepath = paths[i];

        // Check that it's not a directory
        if (filepath[filepath.length-1] !== '/' && !filepath.match(new RegExp(/metadata/))) {
            var fileContents = fs.readFileSync(path.join(this.inputPaths[0], filepath)).toString();

            var match = fileContents.match(/Tomahawk\.resolver\.instance\s*=\s*(.*)\s*;/);
            if(match && match[1]) {

                var importString = "";
                importString += 'import Tomahawk from \'' + this.tomahawkGlobal + '\';';
                importString += 'import { TomahawkResolver, TomahawkResolverCapability } from \'' + this.tomahawkGlobal + '\';';

                fileContents = importString + fileContents.replace(match[0], 'export default ' + match[1]);

                var split = filepath.split('/');
                var filename = split[split.length-1];
                var destPath = path.join(this.outputPath, 'tomahawk-javascript-plugin-compiler', 'resolvers', filename);
                mkdirp.sync(path.dirname(destPath));
                fs.writeFileSync(destPath, fileContents);
            }
        }
    }
}




module.exports = {
    name: 'tomahawk-javascript-plugin-compiler',

    treeForApp: function (app) {
        if(!this.app) return;

        var processor = new Processor([funnel(this.resolverTree, {
            include: this.includeResolverRegExps
        })]);

        processor.tomahawkGlobal = this.tomahawkGlobal;

        return processor;
    },

    treeForPublic: function(app) {
        return funnel(this.resolverTree, {
            include: this.includeIconRegExps,
            exclude: [new RegExp(/metadata/)],
            getDestinationPath: function(relativePath) {
                var split = relativePath.split('/');
                var newPath = '/assets/icons/resolvers/' + split[split.length-1];

//                 console.log('relativePath:', newPath);

                return newPath;
            }
        });

    },

    included: function(app) {
        this._super.included.apply(this, arguments);
        this.app = app;

        this.includeResolverRegExps = [];
        this.includeIconRegExps = [];
        this.includeResolvers = this.app.project.config().includeResolvers || [];
        for(var resolver in this.includeResolvers) {
            this.includeResolverRegExps.push(new RegExp(resolver));
            this.includeIconRegExps.push(new RegExp(this.includeResolvers[resolver].icon+'$'));
        }

        this.tomahawkGlobal = this.app.project.config().tomahawkGlobal || 'tomahawk-javascript-plugin-compiler/tomahawk';
        this.resolverTree = this.app.project.config().resolverTree || path.join(this.app.bowerDirectory, 'tomahawk-resolvers');
    },

    isDevelopingAddon: function () {
        return true;
    }
};
