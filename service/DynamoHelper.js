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
 * @param awsAccessKey {String}
 * @param awsSecretKey {String}
 * @param tableName {String}
 * @param readThroughput {Number}
 * @param writeThroughput {Number}
 * @constructor
 */
function DynamoHelper(awsAccessKey, awsSecretKey, tableName, readThroughput, writeThroughput) {
    this.awsAccessKey = awsAccessKey;
    this.awsSecretKey = awsSecretKey;
    this.tableName = tableName;
    this.readThroughput = readThroughput;
    this.writeThroughput = writeThroughput;

    AWS.config.update({
        accessKeyId: this.awsAccessKey,
        secretAccessKey: this.awsSecretKey
    });

    this.dynamoClient = new AWS.DynamoDB({
        apiVersion: '2012-08-10'
    });

    this.createTableIfNotExists = _createTableIfNotExists;
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
function _createTableIfNotExists(cb) {
    var $this = this;

    $this.dynamoClient.describeTable({ TableName: $this.tableName }, function(err) {
        if (err && err.code === "ResourceNotFoundException") {
            // Table doesn't exist, let's create it.
            console.log("Creating DynamoDB Table: %s...", $this.tableName);

            var tableDefinition = MetroidTableDefinition;
            tableDefinition.TableName = $this.tableName;
            tableDefinition.ProvisionedThroughput.ReadCapacityUnits = $this.readThroughput;
            tableDefinition.ProvisionedThroughput.WriteCapacityUnits = $this.writeThroughput;

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
        _createTableIfNotExists(cb);
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