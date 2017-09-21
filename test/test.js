const assert = require('assert');
const {
    rgb2hex,
    success,
    info,
    error,
    warning
} = require('../src/public/javascript/custom_modules/utils.js');
const {
    Search
} = require('../src/public/javascript/classes/search.js');
const chalk = require('chalk');
before(function() {
    //Clear console before running any tests
    console.clear();
});
beforeEach(function() {
    console.log(chalk.green('='.repeat(150)));
});
describe('utils', function() {
    describe('#rgb2hex()', function() {
        it(chalk.blue('should  throw an Error when called with no arguments'), function() {
            //assert.equal(rgb2hex(),'#000000');
            assert.throws(function() {
                rgb2hex();
            }, Error, 'Please pass a valid rgb color');
        });
        it(chalk.blue('should throw an Error when called with an rgba color'), function() {
            assert.throws(function() {
                rgb2hex('rgba(100,100,100,.8)');
            }, Error, 'Please pass a valid rgb color');
        });
        it(chalk.blue('should return #ffffff when the color passed is rgb(255,255,255)'), function() {
            assert.equal(rgb2hex('rgb(255,255,255)'), '#ffffff');
        });
    });
    describe(chalk.blue('#info()'), function() {
        it(chalk.blue('should throw an Error when no message is passed'), function() {
            assert.throws(function() {
                info();
            }, Error, 'Please specify a message');
        });
    });
    describe(chalk.green('#success()'), function() {
        it(chalk.green('should throw an Error when no message is passed'), function() {
            assert.throws(function() {
                success();
            }, 'Error', 'Please specify a message');
        });
        it(chalk.green('should throw an Error when  message has a falsy value(null,false,"",undefined)'), function() {
            assert.throws(function() {
                success(null);
            }, 'Error', 'Please specify a message');
        });
    });
    describe(chalk.keyword('orange')('#warning()'), function() {
        const warnColor = chalk.keyword('orange');
        it(warnColor('should throw an Error when called without a message'),function(){
            assert.throws(function(){
                warning();
            },Error,'Please specify a message');
        });
        it(warnColor('should throw an Error when  message has a falsy value(null,false,"",undefined)'), function() {
            assert.throws(function() {
                warning(null);
            }, 'Error', 'Please specify a message');
        });
    });
    describe(chalk.red('#error()'),function(){
        it(chalk.red('should throw an Error when called without a message'),function(){
            assert.throws(function(){
                error();
            },Error);
        });
    });
});
describe('Search', function() {
    describe('#getMatches()', function() {
        const db = [{
            name: 'fooLand',
            toString: function() {
                return this.name;
            }
        }, {
            name: 'aLand',
            toString: function() {
                return this.name;
            }
        }, {
            name: 'alslFoo',
            toString: function() {
                return this.name;
            }
        }];

        const dbSearcher = new Search(db);
        it('should throw an Error when no term is given', function() {
            assert.throws(function() {
                dbSearcher.getMatches();
            }, Error, 'Please provide a term to search for');
        });
        it('should throw an Error when term is null', function() {
            assert.throws(function() {
                dbSearcher.getMatches(null);
            }, Error, 'Please provide a term to search for');
        });
        it('should return an array with exactly 1 object when term is foo', function() {
            assert.equal(dbSearcher.getMatches('foo').length, 1);
        });
        it('should return an array with 2 objects when term is foo and ignoreCase is true', function() {
            assert.equal(dbSearcher.getMatches('foo', true).length, 2);
        });
        it('should return an emty array when term is "lol"', function() {
            assert.equal(dbSearcher.getMatches('lol').length, 0);
        });
        it('should return an array containing an object with name aLand when term is aLa and ignore is false', function() {
            const expected = [{
                name: 'aLand'
            }];
            let matches = dbSearcher.getMatches('aLa');
            const resultsAreTheSame = (matches.length == expected.length) && matches.every((match, index) => match.name == expected[index].name);
            assert.equal(resultsAreTheSame, true);
        });
        it('should return an array containing 2 objects with name aLand and alslFoo when term is aL and ignore case is true', function() {
            const expected = [{
                name: 'aLand'
            }, {
                name: 'alslFoo'
            }];
            const matches = dbSearcher.getMatches('aL', true);
            //Make sure to convert each name of the expected array to uppercase in order to compare it with the results from getMatches()
            const resultsAreTheSame = (matches.length == expected.length) && matches.every((match, index) => match.name == expected[index].name.toUpperCase());

            assert.equal(resultsAreTheSame, true);
        });
        it('should return an empty array when a Search instance has been initiated with an empty array or with the default array', function() {
            const emptySearcher = new Search();
            assert.equal(emptySearcher.getMatches('a').length, 0);
        });
    });
});