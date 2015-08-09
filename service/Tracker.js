/**
 * tracker.js
 *
 * Manages the pushing of Metroids into Dynamo.
 *
 * Created by kylewbanks on 15-08-09.
 */

/**
 * Constructs a Tracker.
 * @param tableName {String}
 * @param dynamoHelper {DynamoHelper}
 * @param options {Object}
 * @constructor
 */
function Tracker(tableName, dynamoHelper, options) {
    this.tableName = tableName;
    this.dynamoHelper = dynamoHelper;
    this.options = options;

    this.batch = [];

    this.batchWriteInterval = 1000;
    this.batchWriteMaxSize = 25;
    if (options.write) {
        this.batchWriteInterval = options.write.batchInterval ? options.write.batchInterval : this.batchWriteInterval;
        this.batchWriteMaxSize = options.write.batchSize ? options.write.batchSize : this.batchWriteMaxSize;
    }

    this.writeMetroidBatch = _writeMetroidBatch;
    this.writeMetroidBatchAfterDelay = _writeMetroidBatchAfterDelay;
}

/**
 * @private
 */

/**
 * Writes the Metroids in the current batch to DynamoDB.
 * DynamoDB can only handle so many items per batch, so this method paginates the writes.
 *
 * If the entire batch is written, the method will re-queue itself for a future time, based on Configuration.
 * Otherwise, it will recursively call itself until the batch is empty.
 *
 */
function _writeMetroidBatch() {
    var $this = this;

    if ($this.batch.length == 0) {
        $this.writeMetroidBatchAfterDelay($this.batchWriteInterval);
        return;
    }

    // Determine which items to write
    var itemsToWrite = [];
    $this.batch.forEach(function(metroid, index) {
        if (index < $this.batchWriteMaxSize) {
            itemsToWrite.push({
                PutRequest: {
                    Item: metroid.toDynamoJSON()
                }
            })
        }
    });

    var params = {};
    params[$this.tableName] = itemsToWrite;
    $this.dynamoHelper.getClient().batchWriteItem({
        RequestItems: params
    }, function(err, res) {
        if (err) {
            console.error("Failed to track Metroid Batch due to: %s", err);
            console.error(err.stack);
            console.error($this.batch);
        } else {
            console.log("%s Metroids tracked successfully.", params[$this.tableName].length);
        }

        if ($this.batch.length > $this.batchWriteMaxSize) {
            $this.batch = $this.batch.splice($this.batchWriteMaxSize, $this.batch.length);
            $this.writeMetroidBatch();
        } else {
            $this.batch = [];
            $this.writeMetroidBatchAfterDelay($this.batchWriteInterval);
        }
    });
}

/**
 * Performs a batch write to the Metroid table after the specified delay (in ms)
 * @param ms {Number}
 */
function _writeMetroidBatchAfterDelay(ms) {
    var $this = this;
    setTimeout($this.writeMetroidBatch, ms);
}

/**
 * @instanceMethods
 */
Tracker.prototype = {

    /**
     * Stores a Metroid which can be later retrieved.
     * @param metroid {Metroid}
     */
    track: function(metroid) {
        var $this = this;
        $this.batch.push(metroid);
    }

};


/**
 * @public
 * @type {Tracker}
 */
module.exports = Tracker;