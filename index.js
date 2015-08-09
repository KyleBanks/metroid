/**
 * index.js
 *
 * Main entry-point for the Metroid Library.
 *
 * Created by KyleBanks 2015-08-08
 */

/**
 * @imports
 */
var Metroid = require('./model/metroid');

var DynamoHelper = require('./service/DynamoHelper'),
    Tracker = require('./service/Tracker'),
    Retriever = require('./service/Retriever');

var Interface = require('./util/Interface');

/**
 * @public
 */
module.exports = {

    /**
     * Initializes the Metroid system with the specified AWS credentials.
     *
     * @param awsAccessKey {String}
     * @param awsSecretKey {String}
     * @param tableName {String} The name of the table to use for Metroid tracking.
     * @param readThroughput {Number}
     * @param writeThroughput {Number}
     * @param cb {function(Error), Interface} Executed when the Metroid system has been initialized, or an error occurs.
     */
    initialize: function(awsAccessKey, awsSecretKey, tableName, readThroughput, writeThroughput, cb) {
        var dynamoHelper = new DynamoHelper(awsAccessKey, awsSecretKey, tableName, readThroughput, writeThroughput);
        dynamoHelper.initialize(function(err) {
            if (err) {
                return cb(err);
            }

            var tracker = new Tracker(tableName, dynamoHelper);
            var retriever = new Retriever(tableName, dynamoHelper);

            var client = new Interface(tracker, retriever);
            cb(null, client);
        });
    },


    /**
     * The blueprint for a single Metroid object.
     */
    Metroid: Metroid

};