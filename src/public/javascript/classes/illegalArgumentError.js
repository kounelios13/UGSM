/**
* This class  is used for throwing an error 
* when an argument is not a valid type (such as entering a string where a number was expected)
* @extends Error
*/
class IllegalArgumentError extends Error{
    /**
    * @constructor 
    * @param {String}message The message of the error
    */
    constructor(message){
        super(message);
        this.name = "IllegalArgumentError";
    }
}
module.exports = IllegalArgumentError;