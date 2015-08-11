/**
 * Retriever.js
 *
 * Handles pulling Metroids out of Dynamo.
 *
 * Created by kylewbanks on 15-08-09.
 */

/**
 * @imports
 */
var Metroid = require('../model/Metroid');

/**
 * Constructs a Retriever.
 * @param tableName {String}
 * @param dynamoHelper {DynamoHelper}
 * @param options {Object}
 * @constructor
 */
function Retriever(tableName, dynamoHelper, options) {
    this.tableName = tableName;
    this.dynamoHelper = dynamoHelper;
    this.options = options;
}

/**
 * @private
 */

/**
 * Retrieves all Metroids of the specified type between a date range.
 *
 * This method is called by the public `Retriever.retrieve()` method, as well as recursively by itself to handle pagination.
 *
 * @param metroidType {Number}
 * @param startDate {Date}
 * @param endDate {Date}
 * @param [lastEvaluatedKey] {Object}
 * @param [loadedMetroids] {Object}
 * @param cb {function(Error, Array)}
 */
function _retrieve(metroidType, startDate, endDate, lastEvaluatedKey, loadedMetroids, cb) {
    var $this = this;

    if (typeof lastEvaluatedKey === 'function') {
        cb = lastEvaluatedKey;
    }

    if (startDate.getTime() > endDate.getTime()) {
        return cb(new Error("The start date provided must be LESS than the end date. [StartDate: " + startDate + ", EndDate: " + endDate + "]"), null);
    }

    var metroids = loadedMetroids || [];
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    var startTime = startDate.getTime(),
        endTime = endDate.getTime();

    var scanParams = {
        TableName: $this.tableName,
        ScanFilter: {
            Type: {
                ComparisonOperator: "EQ",
                AttributeValueList: [
                    {
                        N: metroidType.toString()
                    }
                ]
            },
            Timestamp: {
                ComparisonOperator: "BETWEEN",
                AttributeValueList: [
                    {
                        N: startTime.toString()
                    },
                    {
                        N: endTime.toString()
                    }
                ]
            }
        }
    };

    if (typeof lastEvaluatedKey !== 'function') {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    $this.dynamoHelper.getClient().scan(scanParams, function(err, data) {
        if (err) {
            return cb(err, null);
        }

        metroids = metroids.concat(data.Items);

        // Check if there is more data to load, otherwise return a final response
        if (data.LastEvaluatedKey) {
            _retrieve(metroidType, startDate, endDate, data.LastEvaluatedKey, metroids, cb);
        } else {
            var output = [];
            metroids.forEach(function(metroid) {
                output.push(Metroid.fromDynamoJSON(metroid));
            });
            cb(null, output);
        }
    });
}

/**
 * @instanceMethods
 */
Retriever.prototype = {

    /**
     * Retrieves all Metroids of the specified type between a date range.
     *
     * @param metroidType {Number}
     * @param startDate {Date}
     * @param endDate {Date}
     * @param cb {function(Error, Array)}
     */
    retrieve: function(metroidType, startDate, endDate, cb) {
        _retrieve.call(this, metroidType, startDate, endDate, cb);
    },

    /**
     * Returns the most recent Metroids for a user.
     *
     * @param userId {Number}
     * @param limit {Number}
     * @param cb
     */
    retrieveMostRecentForUser: function(userId, limit, cb) {
        var $this = this;

        $this.dynamoHelper.getClient().query({
            TableName: $this.tableName,
            KeyConditions: {
                UserId: {
                    "AttributeValueList" : [
                        {
                            "N" : userId.toString()
                        }
                    ],
                    "ComparisonOperator" : "EQ"
                }
            },
            Limit: limit,
            ScanIndexForward: false
        }, function(err, res) {
            if (err) {
                return cb(err);
            }

            var output = [];
            res.Items.forEach(function(metroid) {
                output.push(Metroid.fromDynamoJSON(metroid));
            });
            cb(null, output);
        });
    }

};

/**
 * @public
 * @type {Retriever}
 */
module.exports = Retriever;