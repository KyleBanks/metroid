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
 * @constructor
 */
function Interface(tracker, retriever) {
    // Tracker
    this.track = tracker.track;

    // Retriever
    this.retrieve = retriever.retrieve;
    this.retrieveMostRecentForUser = retriever.retrieveMostRecentForUser;
}
