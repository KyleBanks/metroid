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
var dynamo_service = require('./service/dynamo');

/**
 * @private
 */
var _batch = [];
var _tableName = null;
var _batchWriteInterval = 1000;

/**
 * Retrieves all Metroids of the specified type between a date range.
 *
 * @param metroidType {Number}
 * @param startDate {Date}
 * @param endDate {Date}
 * @param [lastEvaluatedKey] {Object}
 * @param [loadedMetroids] {Object}
 * @param cb {function(Error, Array)}
 */
function _retrieve(metroidType, startDate, endDate, lastEvaluatedKey, loadedMetroids, cb) {
    if (typeof lastEvaluatedKey === 'function') {
        cb = lastEvaluatedKey;
    }

    if (startDate.getTime() > endDate.getTime()) {
        return cb(new Error("The start date provided must be LESS than the end date."), null);
    }

    var metroids = loadedMetroids || [];
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    var startTime = startDate.getTime(),
        endTime = endDate.getTime();

    var scanParams = {
        TableName: _tableName,
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

    dynamo_service.getClient().scan(scanParams, function(err, data) {
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
 * Writes the Metroids in the current batch to DynamoDB.
 * DynamoDB can only handle so many items per batch, so this method paginates the writes.
 *
 * If the entire batch is written, the method will re-queue itself for a future time, based on Configuration.
 * Otherwise, it will recursively call itself until the batch is empty.
 *
 * @private
 */
function _writeMetroidBatch() {
    if (_batch.length == 0) {
        _writeMetroidBatchAfterDelay(_batchWriteInterval);
        return;
    }
    var MAX_BATCH_SIZE = 25;

    // Determine which items to write
    var itemsToWrite = [];
    _batch.forEach(function(metroid, index) {
        if (index < MAX_BATCH_SIZE) {
            itemsToWrite.push({
                PutRequest: {
                    Item: metroid.toDynamoJSON()
                }
            })
        }
    });

    var params = {};
    params[_tableName] = itemsToWrite;
    dynamo_service.getClient().batchWriteItem({
        RequestItems: params
    }, function(err, res) {
        if (err) {
            console.error("Failed to track Metroid Batch due to: %s", err);
            console.error(err.stack);
            console.error(_batch);
        } else {
            console.log("%s Metroids tracked successfully.", params[_tableName].length);
        }

        if (_batch.length > MAX_BATCH_SIZE) {
            _batch = _batch.splice(MAX_BATCH_SIZE, _batch.length);
            _writeMetroidBatch();
        } else {
            _batch = [];
            _writeMetroidBatchAfterDelay(_batchWriteInterval);
        }
    });
}

/**
 * Performs a batch write to the Metroid table after the specified delay (in ms)
 * @param ms {Number}
 * @private
 */
function _writeMetroidBatchAfterDelay(ms) {
    setTimeout(_writeMetroidBatch, ms);
}
_writeMetroidBatch();

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
     * @param cb {function(Error)} Executed when the Metroid system has been initialized, or an error occurs.
     */
    initialize: function(awsAccessKey, awsSecretKey, tableName, readThroughput, writeThroughput, cb) {
        _tableName = tableName;
        dynamo_service.init(awsAccessKey, awsSecretKey, tableName, readThroughput, writeThroughput, cb);
    },

    /**
     * Stores a Metroid which can be later retrieved.
     * @param metroid {Metroid}
     */
    track: function(metroid) {
        _batch.push(metroid);
    },

    /**
     * Retrieves all Metroids of the specified type between a date range.
     *
     * @param metroidType {Number}
     * @param startDate {Date}
     * @param endDate {Date}
     * @param cb {function(Error, Array)}
     */
    retrieve: function(metroidType, startDate, endDate, cb) {
        _retrieve(metroidType, startDate, endDate, cb);
    },

    /**
     * Returns the most recent Metroids for a user.
     * @param userId {Number}
     * @param limit {Number}
     * @param cb
     */
    getMostRecentForUser: function(userId, limit, cb) {
        _dynamoDB.query({
            TableName: _tableName,
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