/**
* @module jquery-cache
*/

/**
* @author Manos Kounelakis <pkounelios@gmail.com>
* @file Cache jquery selectors to retrive them later without researching the DOM
*/

module.exports = (function($) {
    if(!$ || typeof $ != 'function'){
        throw new Error('Please pass an instance of jQuery');
    }
    const cache = {};

    return {
        /**
        * Retrieve a dom element from the cache if it has been cached
        * If not store it into the cache
        * @param {String} selector Any valid css selector
        * @throws Error Only string css selectors are allowed
        * @returns {Object} element A jQuery object representing the requested selector
        * @example 
        * let jcache = require('path/to/jquery-cache');
        * // Returns the $("body") jQuery object and and execute its css() method
        * jcache.get("body").css("background"); 
        */
        get:function(selector){
            if(typeof selector != 'string' || !selector){
                throw new Error('selector must be a string such as an ID or a class name or any valid css selector');
            }
            if(!cache[selector]){
                cache[selector] = $(selector);
            }
            const element = cache[selector]
            return element;
        },
        /**
        * Add a dom element to cache
        * @param {String} selector The css selector of the dom to cache
        */
        add:function(selector){
            cache[selector] = $(selector);
        },

        /**
        * Deletes a dom element from the cache
        * @param {String} selector The selector of the dom elementto remove from cache
        */
        delete:function(selector){
            delete cache[selector];
        }
    };
});