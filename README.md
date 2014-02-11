Itinerary
=========

Lightweight routing forked from [Backbone](https://github.com/jashkenas/backbone),
decoupled, and (soon to be) enhanced.

The initial goals:

* **Independent** - minimal dependencies - jQuery and Backbone not required
* **Portable** - able to be used with a variety of other libraries
* **Extensible** - easy to add on additional functionality
* **Tested** - well tested with Mocha and Chai
* **Mobile** - works well with major mobile platforms
* **Unencumbered** - IE9+, no compatibility shims

Running the tests
-----------------

If you don't have it installed already, install the grunt cli package globally:

    $ npm install -g gulp

Install project dependencies:

    $ npm install

Run the grunt 'test' task:

    $ gulp test
