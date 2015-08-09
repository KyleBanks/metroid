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

    this.createTableIfDoesntExist = _createTableIfDoesntExist;
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
                    writeThroughput = dynamoOpts.writeThrouput;
                }
            }
            tableDefinition.ProvisionedThroughput.ReadCapacityUnits = readThroughput;
            tableDefinition.ProvisionedThroughput.WriteCapacityUnits = writeThroughput;

            $this.dynamoClient.createTable(tableDefinition, cb);
            return;
        }

        cb(err);
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
    }

};

/**
 * @public
 * @type {DynamoHelper}
 */
module.exports = DynamoHelper;