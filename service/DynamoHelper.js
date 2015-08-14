/**
 * dynamo.js
 *
 * DynamoDB helper methods.
 *
 * Created by kylewbanks on 15-08-08.
 */

/**
 * @imports
 */
var AWS = require('aws-sdk');


/**
 * Constructs a DynamoHelper.
 *
 * @param tableName {String}
 * @param options {Object}
 *
 * @constructor
 */
function DynamoHelper(tableName, options) {
    this.tableName = tableName;
    this.options = options;

    if (options.aws) {
        AWS.config.update(options.aws);
    }

    this.dynamoClient = new AWS.DynamoDB({
        apiVersion: '2012-08-10'
    });

    this.createTableIfDoesntExist = _createTableIfDoesntExist.bind(this);
    this.waitForTableToCreate = _waitForTableToCreate.bind(this);
}

/**
 * @private
 */
var MetroidTableDefinition = {
    TableName: null,
    AttributeDefinitions: [
        {
            AttributeName: 'UserId',
            AttributeType: 'N'
        },
        {
            AttributeName: "Timestamp",
            AttributeType: "N"
        }
    ],
    KeySchema: [
        {
            AttributeName: 'UserId',
            KeyType: 'HASH'
        },
        {
            AttributeName: "Timestamp",
            KeyType: "RANGE"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: null,
        WriteCapacityUnits: null
    }
};

/**
 * Polls DynamoDB for table creation status and executes the callback when the table has successfully created, or an error occurs.
 * @param cb {function(Error)}
 */
function _waitForTableToCreate(cb) {
    var $this = this;

    console.log("Waiting while the Dynamo table is created...");
    var wait = function() {
        $this.dynamoClient.describeTable({ TableName: $this.tableName }, function(err, res) {
            if (err) {
                return cb(err);
            }

            if (res.Table.TableStatus == 'ACTIVE') {
                cb(null);
            } else {
                console.log("Table status still %s", res.Table.TableStatus);
                setTimeout(wait, 3000);
            }
        });
    };
    wait();
}

/**
 * Creates a DynamoDB table if it doesn't exist.
 * @param cb {function(Error)}
 */
function _createTableIfDoesntExist(cb) {
    var $this = this;

    $this.dynamoClient.describeTable({ TableName: $this.tableName }, function(err) {
        if (err && err.code === "ResourceNotFoundException") {
            // Table doesn't exist, let's create it.
            console.log("Creating DynamoDB Table: %s...", $this.tableName);

            var tableDefinition = MetroidTableDefinition;
            tableDefinition.TableName = $this.tableName;

            var readThroughput = 1;
            var writeThroughput = 1;
            if ($this.options.dynamo) {
                var dynamoOpts = $this.options.dynamo;
                if (dynamoOpts.readThroughput) {
                    readThroughput = dynamoOpts.readThroughput;
                }
                if (dynamoOpts.writeThroughput) {
                    writeThroughput = dynamoOpts.writeThroughput;
                }
            }
            tableDefinition.ProvisionedThroughput.ReadCapacityUnits = readThroughput;
            tableDefinition.ProvisionedThroughput.WriteCapacityUnits = writeThroughput;

            $this.dynamoClient.createTable(tableDefinition, function(err) {
                if (err) {
                    return cb(err);
                } else {
                    $this.waitForTableToCreate(cb);
                }
            });
        } else {
            cb(err);
        }
    });
}

/**
 * @instanceMethods
 */
DynamoHelper.prototype = {

    /**
     * Performs any required initialization before DynamoDB can be used, such as ensuring the table exists.
     *
     * @param cb {function(Error)}
     */
    initialize: function(cb) {
        var $this = this;

        $this.createTableIfDoesntExist(cb);
    },

    /**
     * Returns the DynamoDB client.
     *
     * TODO: Should consider refactoring to never have to do this, all calls should come through this helper service.
     *
     * @returns {AWS.DynamoDB}
     */
    getClient: function() {
        var $this = this;

        return $this.dynamoClient;
    },

    /**
     * Destroys the Metroid table. WARNING: All Metroid will be lost!
     * @param cb {function(Error)}
     */
    destroy: function(cb) {
        var $this = this;

        $this.dynamoClient.deleteTable({ TableName: $this.tableName }, cb);
    }

};

/**
 * @public
 * @type {DynamoHelper}
 */
module.exports = DynamoHelper;