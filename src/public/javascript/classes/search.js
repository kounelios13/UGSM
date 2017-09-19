/**
 * @class
 * This class is used to save an array of objects so that you can search for objects in this array
 * using their name attribute
 */
class Search {
    /**
     *@constructor
     * @param {Object[]} db This is where all searches will come from 
     */
    constructor(db = []) {
        this.db = db;
    }

    /**
     * Get all objects whuch their name matches a given term 
     * @example <caption> Search for foo without ignoreCase set to true</caption>
     * var x = new Search([{name:"foo"},{name:"foobar"},{name:"barno"},{name:"FOO"}]);
     * console.log(x.getMatches('foo'))
     * //Logs [{name:'foo'},{name:'fooBar'}]
     * @example <caption> Search for foo with ignoreCase set to true</caption>
     * var x = new Search([{name:"foo"},{name:"foobar"},{name:"barno"},{name:"FOO"}]);
     * console.log(x.getMatches('foo',true))
     * //Logs [{name:'foo'},{name:'fooBar'},{name:"FOO"}]
     * @param {String} term The term to test against each name
     * @param {Boolean} [ignoreCase] If true ignores cases when comparing names
     * @return {Object[]} matches The resuts of the search
     */
    getMatches(term, ignoreCase = false) {
        if(arguments.length == 0){
            throw new Error('Please provide a term to search for');
        }
        let matches = [];
        //If ignore case is true
        //then start working on a copy of the array to avoid messing with the original
        //Avoid using Array#slice() when the array contais objects
        //See this:https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
        let currentDb = ignoreCase ? this.db.map(item => Object.assign({}, item)) : this.db;
        matches = currentDb.filter(match => {
            if (ignoreCase) {
                match.name = match.name.toUpperCase();
                term = term.toUpperCase();
            }

            return match.name.startsWith(term) || match.name.endsWith(term) || match.name.includes(term);
        });
        return matches;
    }

    /**
     *Change the array associated with the current Search instance
     * @example <caption> Change the db of the current Search instance </caption>
     * var searcher = new Search([{name:"foo"}]);
     * console.log(searcher.getMatches('user'));
     * //Logs an empty array
     * searcher.setDB([{name:'user'},{name:'admin'}]);
     * console.log(searcher.getMatches('admin'));
     * //Logs [{name:'admin'}]
     * @param {Object[]} db The new array
     */
    setDB(db) {
        this.db = db;
    }
}

module.exports = {
    Search
};