/**
 * index.js
 *
 * Main test entry-point.
 *
 * Created by kylewbanks on 15-08-09.
 */

/**
 * @imports
 */
var mocha = require('mocha');
var assert = require("assert");

var metroid = require('../index'),
    Metroid = metroid.Metroid;

var AWS = require('aws-sdk');

/**
 * @private
 */

// Construct the minimum options required to run the tests.
// Assumes that the AWS SDK is globally configured.
var MinimalOptions = {
    aws: {
        region: 'us-east-1'
    },

    write: {
        batchInterval: 1000
    }
};

// Create a unique table name for each test
var TableName = 'MetroidTestTable'+(new Date().getTime());
console.log("Executing test cases with Table: %s", TableName);

// Some sample data that we'll use for the tests.
var ExampleUser = {
    id: 123
};
var MetroidTypes = {
    Login: 1,
    Logout: 2
};

describe('Metroid test cases', function() {
    var _client = null;

    /**
     * Initialize the Metroid client.
     * @param done
     */
    it('should initialize successfully', function(done) {
        this.timeout(1200000); // Allow ample time for the DynamoDB table to create (2 mins).

        metroid.initialize(TableName, MinimalOptions, function(err, client) {
            assert.equal(err, null, '`initialize` threw an error:' + err);
            assert.notEqual(client, null, 'Metroid client was null.');

            _client = client;

            done();
        });
    });

    /**
     * Track some Metroids.
     * @param done
     */
    var trackedMetroid = null;
    it("should track a simple Metroid", function(done) {
        this.timeout(MinimalOptions.write.batchInterval * 3);

        var metroid = new Metroid(ExampleUser.id, MetroidTypes.Login);

        var sampleAttributes = {
            SubscriptionLevel: 'Full',
            Price: 129.99
        };
        for (var i = 0; i < Object.keys(sampleAttributes).length; i++) {
            metroid.setAttribute(Object.keys(sampleAttributes)[i], sampleAttributes[Object.keys(sampleAttributes)[i]]);
        }
        trackedMetroid = metroid;

        _client.track(metroid);

        // Wait for the batch to write, and give a buffer for latency
        setTimeout(done, MinimalOptions.write.batchInterval * 2);
    });

    /**
     * Fetch the Metroids by type.
     * @param done
     */
    it('should return 1 Login Metroid when retrieving by type and valid date range', function(done) {
        var endDate = new Date();
        var startDate = new Date(endDate.getTime() - MinimalOptions.write.batchInterval * 5); // Give a buffer for Dynamo/latency/etc.

        _client.retrieve(MetroidTypes.Login, startDate, new Date(), function(err, metroids) {
            assert.equal(err, null, '`retrieve` threw an error: ' + err);
            assert.equal(metroids.length, 1, "Wrong number of Metroids returned: " + metroids.length);
            assert.equal(metroids[0].equals(trackedMetroid), true, "Retrieved Metroid does NOT equal the tracked Metroid: " + metroids[0].toString() + " != " + trackedMetroid.toString())

            done();
        });
    });

    /**
     * Fetch the Metroids by User
     * @param done
     */
    it('should return 1 Metroid for the legitimate User ID', function(done) {
        _client.retrieveMostRecentForUser(ExampleUser.id, 10, function(err, metroids) {
            assert.equal(err, null, '`retrieveMostRecentForUser` threw an error: ' + err);
            assert.equal(metroids.length, 1, "Wrong number of Metroids returned: " + metroids.length);
            assert.equal(metroids[0].equals(trackedMetroid), true, "Retrieved Metroid does NOT equal the tracked Metroid: " + metroids[0].toString() + " != " + trackedMetroid.toString());

            done();
        });

    });

    /**
     * Destroys the DynamoDB table and deletes all data created by the test.
     * @param done
     */
    it('should destroy gracefully', function(done) {
        _client.destroy(function(err) {
            assert.equal(err, null, '`destroy` threw an error: ' + err);

            done();
        });
    });
});


