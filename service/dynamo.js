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
 * @private
 */
var _dynamoClient = null;

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
 * Initializes the AWS SDK and DynamoDB client.
 * @param accessKey {String}
 * @param secretKey {String}
 * @param cb {function(Error)}
 */
function _initializeDynamoClient(accessKey, secretKey, cb) {
    AWS.config.update({
        accessKeyId: accessKey,
        secretAccessKey: secretKey
    });

    _dynamoClient = new AWS.DynamoDB({
        apiVersion: '2012-08-10'
    });

    cb(null);
}

/**
 * Creates a DynamoDB table if it doesn't exist.
 * @param tableName {String}
 * @param readThroughput {Number}
 * @param writeThroughput {Number}
 * @param cb {function(Error)}
 */
function _createTableIfNotExists(tableName, readThroughput, writeThroughput, cb) {
    _dynamoClient.describeTable({ TableName: tableName }, function(err) {
        if (err && err.code === "ResourceNotFoundException") {
            // Table doesn't exist, let's create it.
            console.log("Creating DynamoDB Table: %s...", tableName);

            var tableDefinition = MetroidTableDefinition;
            tableDefinition.TableName = tableName;
            tableDefinition.ProvisionedThroughput.ReadCapacityUnits = readThroughput;
            tableDefinition.ProvisionedThroughput.WriteCapacityUnits = writeThroughput;

            _dynamoClient.createTable(tableDefinition, cb);
            return;
        }

        cb(err);
    });
}

/**
 * @public
 */
module.exports = {

    /**
     * Initializes the Dynamo helper with the specified AWS credentials.
     * @param awsAccessKey {String}
     * @param awsSecretKey {String}
     * @param tableName {String}
     * @param readThroughput {Number}
     * @param writeThroughput {Number}
     * @param cb {function(Error)}
     */
    init: function(awsAccessKey, awsSecretKey, tableName, readThroughput, writeThroughput, cb) {
        _initializeDynamoClient(awsAccessKey, awsSecretKey, function(err) {
            if (err) {
                return cb(err);
            }

            _createTableIfNotExists(tableName, readThroughput, writeThroughput, cb);
        });
    },

    /**
     * Returns the DynamoDB client.
     *
     * TODO: Should refactor to never have to do this, all calls should come through this helper service.
     *
     * @returns {*}
     */
    getClient: function() {
        return _dynamoClient;
    }


};
