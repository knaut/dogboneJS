dogboneJS
=========

Made for Vidcaster.

An oversimplified Model-View library for client-side template fetching and rendering. Inspired by BackboneJS.

# Models
Simple models are constructed with methods for fetching and storing remote data.

# Views
Views are simple objects that store a fetched template, and then render that template with it's associated model's data using Underscore.js's _.template() function.

Declare an events object to bind to elements found within the View's root element.

# Widgets
WIP. Deploy a simple widget with assocated model and view(s). Initialize the widget to initialize its model/views and "make it go".

Designed to be dead-simple, declarative, fire-and-forget.

Dependancies:
Underscore.js
jQuery