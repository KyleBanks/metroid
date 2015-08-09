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
     * Gets an attribute that was previously set using `Metroid.setAttribute`
     *
     * @param attributeName {String}
     * @returns {Object} - A String or Number
     */
    getAttribute: function(attributeName) {
        return this.attributes[attributeName];
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
    },

    /**
     * Ensures this Metroid is exactly equal to another, including all attributes.
     * @param other {Metroid}
     * @returns {boolean}
     */
    equals: function(other) {
        var $this = this;

        if ($this.userId != other.userId) {
            return false;
        } else if ($this.type != other.type) {
            return false;
        } else if ($this.date.getTime() != other.date.getTime()) {
            return false;
        } else if (Object.keys($this.attributes).length != Object.keys(other.attributes).length) {
            return false;
        }

        // Ensure the correct attributes were returned
        for (var i = 0; i < Object.keys($this.attributes).length; i++) {
            var attribute = Object.keys($this.attributes)[i];
            var expected = $this.attributes[attribute];
            var actual = other.getAttribute(attribute);

            if (expected != actual) {
                return false;
            }
        }

        return true;
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
            // Custom attributes
            if (value.N) {
                attributes[key] = parseFloat(value.N);
            } else if (value.S) {
                attributes[key] = value.S;
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
 * @type {Metroid}
 */
module.exports = Metroid;