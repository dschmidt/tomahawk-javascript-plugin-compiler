import Ember from 'ember';
import Resolver from 'dummy/tomahawk-javascript-plugin-compiler/resolvers/youtube';

export default Ember.Route.extend({
    model: function () {
        console.log(Resolver);
        return Resolver;
    }
});
