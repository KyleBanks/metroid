/**
 * Interface.js
 *
 * Combines the multiple public services into one Interface.
 *
 * Created by kylewbanks on 15-08-09.
 */

/**
 * Constructs the Interface.
 *
 * @param tracker {Tracker}
 * @param retriever {Retriever}
 * @param dynamoHelper {DynamoHelper}
 * @constructor
 */
function Interface(tracker, retriever, dynamoHelper) {
    // Tracker
    this.track = tracker.track.bind(tracker);

    // Retriever
    this.retrieve = retriever.retrieve.bind(retriever);
    this.retrieveMostRecentForUser = retriever.retrieveMostRecentForUser.bind(retriever);

    this.destroy = dynamoHelper.destroy.bind(dynamoHelper);
}

/**
 * @public
 * @type {Interface}
 */
module.exports = Interface;