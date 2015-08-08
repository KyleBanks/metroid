# Metroid

A fully managed system for tracking and fetching metrics from AWS DynamoDB. 

## Sample Usage

```node
var metroidClient = require('metroid'),
    Metroid = metroidClient.Metroid;
    

// Initialize the Metroid client.
metroidClient.initialize(AWS_ACCESS_KEY, AWS_SECRET_KEY, 'MyMetroidTableName', READ_THROUGHPUT, WRITE_THROUGHPUT, function(err) {
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

// Retrieve all the Metroids of the specified type within a date range.
metroidClient.retrieve(metroidType, startDate, endDate, function(err, metroids) {
    if (err) throw err;
    
    // Outputs all the Metroids retrieved
    console.log(metroids);
});

```
