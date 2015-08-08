/**
 * Metroid.js
 *
 * A standard template for a track-able Metric
 *
 * Created by kylewbanks on 15-08-08.
 */

/**
 * Metroid Constructor
 * @param userId {Number}
 * @param type {Metric.Type}
 * @constructor
 */
function Metroid(userId, type) {
    this.userId = userId;
    this.type = type;

    this.date = new Date();
    this.attributes = {};
}

/**
 * @instanceMethods
 */
Metroid.prototype = {

    /**
     * Sets an attribute on this Metroid instance.
     *
     * @param attributeName {String}
     * @param attributeValue {Object} - A String or Number
     */
    setAttribute: function(attributeName, attributeValue) {
        this.attributes[attributeName] = attributeValue;
    },

    /**
     * Returns a DynamoDB JSON representation of this Metric
     * @return {Object}
     */
    toDynamoJSON: function() {
        var $this = this;

        // Create the standard template
        var JSON = {
            UserId: {
                N: $this.userId.toString()
            },
            Timestamp: {
                N: $this.date.getTime().toString()
            },
            Type: {
                N: $this.type.toString()
            }
        };

        // Add any additional attributes
        var attributeKeys = Object.keys($this.attributes);
        for (var i = 0; i < attributeKeys.length; i++) {
            var key = attributeKeys[i],
                value = $this.attributes[key];

            var type = null;
            if (typeof value === 'number') {
                type = "N";
            } else if (typeof value === 'string') {
                type = "S";
            }

            JSON[key] = {};
            JSON[key][type] = value.toString();
        }

        return JSON;
    },

    /**
     * @override
     */
    toString: function() {
        return JSON.stringify(this.toDynamoJSON());
    }

};

/**
 * Returns a Metric object from DynamoDB formatted JSON
 * @param dynamoJSON {Object}
 * @return {Metroid}
 */
Metroid.fromDynamoJSON = function(dynamoJSON) {
    var attributeKeys = Object.keys(dynamoJSON);

    var userId = null,
        timestamp = null,
        type = null,
        attributes = {};

    for (var i = 0; i < attributeKeys.length; i++) {
        var key = attributeKeys[i],
            value = dynamoJSON[key];

        if (key === 'UserId') {
            userId = parseInt(value.N);
        } else if (key === 'Timestamp') {
            timestamp = parseInt(value.N);
        } else if (key === 'Type') {
            type = parseInt(value.N);
        } else {

            if (value.N) {
                attributes[key] = parseInt(value.N);
            } else if (value.S) {
                attributeKeys[key] = value.S;
            }

        }
    }

    var metric = new Metroid(userId, type);
    metric.date = new Date(timestamp);
    metric.attributes = attributes;

    return metric;
};

/**
 * @public
 * @type {Metric}
 */
module.exports = Metroid;