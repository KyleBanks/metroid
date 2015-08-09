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
     * @param tableName {String} The name of the table to use for Metroid tracking.
     *
     * @param [options] {Object} Optional configurations.
     *
     * @param [options.aws] {Object} AWS specific options. If supplied, will be passed directly to `AWS.config.update`.
     *            Use this to manually set your access/secret key, change region, etc.
     *            For example: {
     *               accessKeyId: "abcd1234"
     *               secretAccessKey: "1234abcd",
     *               region: "us-east-1"
     *            }
     *
     * @param [options.dynamo] {Object} DynamoDB specific options.
     * @param [options.dynamo.readThroughput] {Number} Desired read throughput on the Dynamo table. Default: 1
     * @param [options.dynamo.writeThroughput] {Number} Desired write throughput on the Dynamo table. Default: 1
     *
     * @param [options.write] {Object} Options related to writing Metroids.
     * @param [options.write.batchInterval] {Number} In milliseconds, how often Metroid batches should be written to Dynamo. Default: 1000
     * @param [options.write.batchSize] {Number} Maximum number of Metroids to write per batch. If exceeded, the remaining Metroids will be written immediately in a new batch. Default: 25
     *
     * @param cb {function(Error), Interface} Executed when the Metroid system has been initialized, or an error occurs.
     */
    initialize: function(tableName, options, cb) {
        if (! options || typeof options == typeof undefined) {
            options = {};
        }

        var dynamoHelper = new DynamoHelper(tableName, options);
        dynamoHelper.initialize(function(err) {
            if (err) {
                return cb(err);
            }

            cb(null, new Interface(
                new Tracker(tableName, dynamoHelper, options),
                new Retriever(tableName, dynamoHelper, options),
                dynamoHelper
            ));
        });
    },


    /**
     * The blueprint for a single Metroid object.
     */
    Metroid: Metroid

};