# Metroid

A fully managed system for tracking and fetching metrics (`Metroids`) from AWS DynamoDB. 

## Installation
```
npm install metroid
```

## Sample Usage

```node
var metroidLib = require('metroid'),
    Metroid = metroidLib.Metroid;

// Initialize the Metroid client.
var opts = {};
metroidLib.initialize('MyMetroidTableName', opts, function(err, metroidClient) {
    if (err) throw err;
    console.log("Metroid Client Initialized!");
    
    // Create a Metroid with a user identifier and a type.
    var user = ...; // The user performing an action you want to track
    var metroidType = ...; // Custom defined integer used to refer to a type of Metroid. Ex. NewSubscription=1, AccountDeactivated=2, etc.
    var metroid = new Metroid(user.id, metroidType);
    
    // Add as many custom string/numeric attributes as you like
    metroid.setAttribute('SubscriptionLevel', 'Full');
    metroid.setAttribute('Price', 129.99);
    
    // Track the Metroid
    metroidClient.track(metroid);
});

// ... Later on ...

// Retrieve all the Metroids of a specific type within a date range.
metroidClient.retrieve(metroidType, startDate, endDate, function(err, metroids) {
    if (err) throw err;
    
    // Outputs all the Metroids retrieved
    console.log(metroids);
});

// Retrieve most recent Metroids for a user.
metroidClient.retrieveMostRecentForUser(user.id, LIMIT, function(err, metroids) {
    if (err) throw err;
    
    // Outputs all Metroids retrieved for the user
    console.log(metroids);
});

```

## DynamoDB Table

If the table name provided doesn't exist, it will be created automatically with the correct attributes and keys. It is recommended you allow the module to create the table itself rather than trying to create it yourself. 

If you want to see how the table will be created, see `MetroidTableDefinition` in [DynamoHelper.js](service/DynamoHelper.js).

## Batching

When you call `metroidClient.track(..)`, it's important to know that your Metroid is not written immediately to DynamoDB. Instead, the metroid is added to a batch will be written at a later time. See [Options.write](#write) for more details on how to configure the batch writing.

## Options

There are a number of options that can be provided on initialization to fully customize the Metroid module:

```node
var options = {
    aws: {...},
    dynamo: {...},
    write: {...}
}
```

### aws

The `aws` configuration object provides a direct way to configure the AWS SDK. If set, this object will be provided directly to `AWS.config.update(..)`. You can use this to directly provide your Access/Secret key, set the Region, etc.

By default, `aws` is null and `AWS.config.update` will not be called.

Example:
```
{
    accessKeyId: "abcd1234"
    secretAccessKey: "1234abcd",
    region: "us-east-1"
}
```

### dynamo

The `dynamo` configuration object is used for options when creating the Dynamo table. 

Properties:
- readThroughput *Number* [**Default: 1**]: The read throughput to provision the table with. See [Provisioned Throughput in Amazon DynamoDB](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ProvisionedThroughputIntro.html).
- writeThroughput *Number* [**Default: 1**]: The write throughput to provision the table with. See [Provisioned Throughput in Amazon DynamoDB](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ProvisionedThroughputIntro.html).

Example:
```
{
    readThroughput: 25
    writeThroughput: 100
}
```

### write

The `write` configuration object is used to configure how Metroids are written to Dynamo.

Properties:
- batchInterval *Number* [**Default: 1000**]: In milliseconds, how often Metroid batches should be written to Dynamo
- batchSize *Number* [**Default: 25**]: Maximum number of Metroids to write per batch. If exceeded, the remaining Metroids will be written immediately in a new batch.

Example:
```
{
    batchInterval: 5000
    batchSize: 50
}
```

## Tests

In order to run the tests, ensure you've [globally configured the AWS SDK](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) or modify the [main test script](test/index.js) to include the Access/Secret keys in the `MinimalOptions` object.

Once you have a configured SDK, you can simply run the tests with the following command:

```
npm test
```

It's worth noting that by default this will provision a DynamoDB table with 1 read and 1 write throughput, and immediately delete the table when the tests finish executing. 