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
    constructor(db) {
        this.db = db;
    }

    /**
    * Get all objects whuch their name matches a term given
    * @param {String} term The term to test against each name
    * @param {Boolean} [ignoreCase] If true ignores cases when comparing names
    * @return {Object[]} matches The resuts of the search
    */
    getMatches(term, ignoreCase) {
        let matches = [];
        //If ignore case is true
        //then start working on a copy of the array to avoid messing with the original
        //Avoid using Array#slice() when the array contais objects
        //See this:https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
        let currentDb = ignoreCase ?this.db.map(item => Object.assign({},item)):this.db;
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
    * @param {Object[]} db The new array
    */
    setDB(db) {
        this.db = db;
    }
}

module.exports = {
    Search
};