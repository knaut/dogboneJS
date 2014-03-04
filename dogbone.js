// dogbone
// like backbone, but not
// simply model-view framework for client-side template loading, rendering, and data fetching
// namespaces: dogbone, dog, bone

// helpers & constructors
dogbone = dog = bone = {
	debug: false,
	session: {},
	helpers: {
		squareBrackets: function() {
			_.templateSettings = {
				interpolate: /\[\[\/(.+?)\]\]/g,
				escape: /\[\[\-(.+?)\]\]/g,
				evaluate: /\[\[(.+?)\]\]/g
			}
		},

		spinner: function( options ) {

			var defaults = {
				elem: '<div></div>',
				lines: 13, // The number of lines to draw
				length: 20, // The length of each line
				width: 2, // The line thickness
				radius: 30, // The radius of the inner circle
				corners: 0, // Corner roundness (0..1)
				rotate: 90, // The rotation offset
				direction: 1, // 1: clockwise, -1: counterclockwise
				color: '#555', // #rgb or #rrggbb or array of colors
				speed: 1, // Rounds per second
				trail: 100, // Afterglow percentage
				shadow: false, // Whether to render a shadow
				hwaccel: false, // Whether to use hardware acceleration
				className: 'vc-spinner', // The CSS class to assign to the spinner
				zIndex: 2e9, // The z-index (defaults to 2000000000)
				top: 'auto', // Top position relative to parent in px
				left: 'auto' // Left position relative to parent in px
			};

			for (var prop in options) {
				if (defaults.hasOwnProperty(prop)) {
					defaults[prop] = options[prop];
				}
			}

			// enclose spinner in a wrapper
			var $wrap = $('<div class="vc-spinner-wrap"></div>');

			// local instance
			var spinner = new Spinner( defaults ).spin( $(defaults.elem)[0] );	// hand it a raw DOM elem
			
			// append local instance's elem to wrapper
			$wrap.append( spinner.el );

			// replace instance's elem with the wrapper
			spinner.el = $wrap[0];

			return spinner;
		},

		extend: function(protoProps, staticProps) {
			// from backbone.js, line 1531

			var parent = this;
			var child;
			// The constructor function for the new subclass is either defined by you
			// (the "constructor" property in your `extend` definition), or defaulted
			// by us to simply call the parent's constructor.
			if (protoProps && _.has(protoProps, 'constructor')) {
				child = protoProps.constructor;
			} else {
				child = function(){ return parent.apply(this, arguments); };
			}
			// Add static properties to the constructor function, if supplied.
			_.extend(child, parent, staticProps);
			// Set the prototype chain to inherit from `parent`, without calling
			// `parent`'s constructor function.
			var Surrogate = function(){ this.constructor = child; };
			Surrogate.prototype = parent.prototype;
			child.prototype = new Surrogate;
			// Add prototype properties (instance properties) to the subclass,
			// if supplied.
			if (protoProps) _.extend(child.prototype, protoProps);
			// Set a convenience property in case the parent's prototype is needed
			// later.
			child.__super__ = parent.prototype;
			return child;
		},

		pubsub: function( object ) {
			// simple pubsub system
			// https://gist.github.com/fatihacet/1290216

			object['events'] = {};
			(function(q) {
				var topics = {}, subUid = -1;

				// watch for an event
				q.watch = function(topic, func) {
					if (!topics[topic]) {
						topics[topic] = [];
					}
					var token = (++subUid).toString();
					topics[topic].push({
						token: token,
						func: func
					});
					return token;
				};
			 
				// fire an event
				q.fire = function(topic, args) {
					if (!topics[topic]) {
						return false;
					}
					setTimeout(function() {
						var subscribers = topics[topic],
							len = subscribers ? subscribers.length : 0;
			 
						while (len--) {
							subscribers[len].func(topic, args);
						}
					}, 0);
					return true;
			 
				};
			 
				// stop watching
				q.stopWatching = function(token) {
					for (var m in topics) {
						if (topics[m]) {
							for (var i = 0, j = topics[m].length; i < j; i++) {
								if (topics[m][i].token === token) {
									topics[m].splice(i, 1);
									return token;
								}
							}
						}
					}
					return false;
				};
			}(object['events']));
		}
	},

	Widget: function( options ) {
		var defaults = {
			view: dogbone.View,
			model: dogbone.Model
		}

		for (var prop in options) {
			if (defaults.hasOwnProperty(prop)) {
				defaults[prop] = options[prop];
			} else {
				this[prop] = options[prop];
			}
		}

		this.model = defaults.model;
		this.view = defaults.view;
	},

	Model: function( options ) {
		// model holds and manipulates data

		var defaults = {
			parseKey: null,
			data: null,
			items: null,

			view: dogbone.View,

			apis: {},
			state: {
				currSrc: null
			},
			qParams: {
				format: 'json'
			}
		}

		for (var prop in options) {
			if (defaults.hasOwnProperty(prop)) {
				defaults[prop] = options[prop];
			} else {
				this[prop] = options[prop];
			}
		}

		this.parseKey = defaults.parseKey; // arbitrary key to parse JSON at
		this.data = defaults.data; 	// saved JSON
		
		this.items = defaults.items; 	// saved data items (convenience)
		this.view = defaults.view;			// view reference

		// pubsub variables
		this.topics = {};
		this.subUid = -1;

		this.apis = defaults.apis;
		this.state = defaults.state;
		this.qParams = defaults.qParams;

	},

	View: function( options ) {
		// view renders templates and binds events

		var defaults = {
			name: 'view',
			templateName: 'view',
			templateSrc: null,
			template: null,
			stylesSrc: '/media/css/theme-styles/',

			model: dogbone.Model,
			$el: $( this.selector ),
			events: {}

		}

		for (var prop in options) {
			if (defaults.hasOwnProperty(prop)) {
				defaults[prop] = options[prop];
			} else {
				this[prop] = options[prop];
			}
		}

		this.name = defaults.name;
		this.templateName = defaults.templateName;
		this.templateSrc = defaults.templateSrc;
		this.template = defaults.template;
		this.stylesSrc = defaults.stylesSrc;

		this.model = defaults.model;
		this.$el = $( defaults.selector );
		this.events = defaults.events;

		// pubsub variables
		this.topics = {};
		this.subUid = -1;

		// boolean for checking whether events were bound
		// is set with bindEvents() and unset with unbindEvents()
		this.eventsBound = false;
	}
};

// Widget
dogbone.Widget.prototype = {
	setRefs: function() {
		// give each view/model a reference to each other
		this.view.model = this.model;
		this.model.view = this.view;
	},
	init: function( obj ) {
		if (bone.debug) console.log('Widget: ' + this.view.name + ' init');

		// set model/view refs
		this.setRefs();

		// accept any initializer args
		if (obj) {
			if (obj.hasOwnProperty('model')) {
				for (var prop in obj.view) {
					this.model[prop] = obj.model[prop];
				}
			}				
			if (obj.hasOwnProperty('view')) {
				for (var prop in obj.view) {
					this.view[prop] = obj.view[prop];
				}
			}
		}
		this.model.init();
		this.view.init();
	}
}

// Model
// events: modelinit, modelfetchsuccess, modelfetcherror, modelstatechange
dogbone.Model.prototype = {
	init: function() {
		this.fetch();
		this.fire('modelinit');
	},

	// vanilla fetch function
	// sets a src api to draw from based on the store api's key
	// collects current qParams, or ones provided based on key
	fetch: function( srcKey, qParams ) {
		var thisModel = this;
		var fetchUrl = qParams ? (this.setSrc( srcKey ) + this.returnQueryParams( qParams )) : this.setSrc( srcKey );

		if (bone.debug) console.log('Model: fetch: ' + fetchUrl);
	
		$.ajax({
			url: fetchUrl,
			method: 'GET',
			success: function(res) {
				if (bone.debug) console.log('Model: fetch successful');

				thisModel.data = res;
				thisModel.fire('modelfetchsuccess');
			},
			error: function(res) {
				if (bone.debug) console.log('Model: Error: fetch unsuccessful');
				if (bone.debug) console.log(res);

				thisModel.fire('modelfetcherror');
			}
		});
	},

	setSrc: function( apiKey ) {
		if (this.apis[apiKey] && this.apis[apiKey] !== undefined) {
			this.state.currSrc = this.apis[apiKey];
			return this.state.currSrc;
		} else {
			if (bone.debug) console.log('Model: Error: No api with key of "' + apiKey + '" found; aborting.');
			return '';
		}
	},

	// refactor
	// parse is supposed to take response object and make sense
	// of its parts
	parse: function( data, string ) {
		var thisModel = this;
		switch (true) {
			case _.isArray(data):
				var val = [];								
				$.each(data, function(key, val) {
					if (key == string) {
						val.push(val);
					} else {										
						$.each(val, function(key, val) {
							if (val == string) {
							} else {
								thisModel.parse(val, string);
							}
						});
					}
				});
			break;
			case _.isObject(data):
				if (data.hasOwnProperty(string)) {
					thisModel.items = data[string];
				} else {
					$.each(data, function(key, val) {
						if (key == string) {
						} else {
							$.each(val, function(key, val) {
								if ( val == string ) {
								} else {
									thisModel.parse(val, string);
								}
							});
						}
					});
				}
			break;
		}
	},

	// building, getting, setting query parameters
	// build a query param ('string=datum')
	queryParam: function( string, datum ) {
		if ( (string == null || string == undefined) || (datum == null || datum == undefined) ) {
			if (bone.debug) console.log('Model: Error: Please provide a string and datum to generate a query parameter');
		} else {
			var qParam = string + '=' + datum;
			return qParam;
		}
	},

	// return a long list of query params with ? and & where appropriate
	// specify params by array with keys, key name, or keyword 'all'
	returnQueryParams: function( qParams ) {
		var thisModel = this;
		var params = '?';
		var inc = 0;
		if (!qParams) {
			// no args, cycle through all qParams by default
			_.each( this.qParams, function(val, key) {
				inc++;
				if (inc <= 1) {
					params += thisModel.getParam( key );
				} else {
					params += '&' + thisModel.getParam( key );
				}
			});
		} else {
			// expect array of args
			if (_.isArray(qParams)) {
				for (var i = 0; i < qParams.length; i++) {
					if (this.qParams.hasOwnProperty(qParams[i])) {
						inc++;
						if (inc <= 1) {
							params += thisModel.getParam( qParams[i] )
						} else {
							params += '&' + thisModel.getParam( qParams[i] );
						}
					} else {
						if (bone.debug) console.log('Model: Warning: key "' + qParams[i] + '" not found.');
					}
				}
			// expect 'all' string, which adds all avail query params
			} else if (qParams === 'all') {
				_.each( this.qParams, function(val, key) {
					inc++;
					if (inc <= 1) {
						params += thisModel.getParam( key );
					} else {
						params += '&' + thisModel.getParam( key );
					}
				});
			// expect a string that matches a query param's key
			} else if (_.isString(qParams)) {
				if (this.qParams.hasOwnProperty(qParams)) {
					inc++;
					if (inc <= 1) {
						params += thisModel.getParam( qParams );
					} else {
						params += '&' + thisModel.getParam( qParams );
					}
				}
			// sometimes we want all properties except some, so we have a disclude option
			} else if (_.isObject(qParams)) {
				if (qParams.hasOwnProperty('disclude')) {

					// check first if disclude is a string
					if (_.isString( qParams['disclude'] ) ) {

						_.each( this.qParams, function(val, key) {
							inc++;
							if (key !== qParams['disclude']) {
								if (inc <= 1) {
									params += thisModel.getParam( key );
								} else {
									params += '&' + thisModel.getParam( key );
								}
							}
						});

					// what if we want to disclude an array of properties?
					} else if ( _.isArray( qParams['disclude'] ) ) {

						var newQParams = _.omit( this.qParams, qParams['disclude'])

						_.each( newQParams, function(val, key) {
							inc++;
							if (inc <= 1) {
								params += thisModel.getParam( key );
							} else {
								params += '&' + thisModel.getParam( key );
							}
						});
					}
				}
			}
		}
		return params;
	},

	// set qParam on qParam object
	setParam: function( key, val ) {
		this.qParams[key] = val;
	},

	// retrieve qParam based on key
	getParam: function(key) {
		if (this.qParams.hasOwnProperty(key)) {
			return this.queryParam( key, this.qParams[key] )
		} else {
			if (bone.debug) console.log('Model: Error: query parameter "' + key + '" not found; aborting.');
			return '';
		}
	},

	// state object stores data about the model's current state
	// set a key/val state pair on the state object
	setState: function( state, val ) {
		if (_.isString(state)) {			
			this.state[state] = val;

		} else if (_.isObject(state)) {
			var thisModel = this;
			_.each(state, function(val, key) {
				if (thisModel.state.hasOwnProperty(key)) {
					thisModel.state[key] = val;

				} else {
					if (bone.debug) console.log('Model: Error: unable to set state "' + state + '"; no such property. Aborting.');
					return '';
				}
			});
		}
	},

	// get a state pair by key
	getState: function( key ) {
		// get any relevant state based on key and export them as qparams
		var thisModel = this;
		if (this.state.hasOwnProperty(key)) {
			return this.state[key];
		}
	},

	// pubsub methods
	// watch for an event
	watch: function(topic, func) {
		if (!this.topics[topic]) {
			this.topics[topic] = [];
		}
		var token = (++this.subUid).toString();
		this.topics[topic].push({
			token: token,
			func: func
		});
		return token;
	},

	// fire an event
	fire: function(topic, args) {
		if (!this.topics[topic]) {
			return false;
		}
		var self = this;
		setTimeout(function() {
			var subscribers = self.topics[topic],
				len = subscribers ? subscribers.length : 0;			 
			while (len--) {
				subscribers[len].func(topic, args);
			}
		}, 0);
		return true;			 
	},

	// stop watching
	stopWatching: function(token) {
		for (var m in this.topics) {
			if (this.topics[m]) {
				for (var i = 0, j = this.topics[m].length; i < j; i++) {
					if (this.topics[m][i].token === token) {
						this.topics[m].splice(i, 1);
						return token;
					}
				}
			}
		}
		return false;
	},

}

// View
// events: viewinit, viewrender, viewfetchtemplatesuccess
dogbone.View.prototype = {
	init: function( opts ) {

		if (opts) {
			for (prop in options) {
				if (this.hasOwnProperty(opt)) {
					this[prop] = opts[prop];
				}
			}
		}

		this.setEl();

		this.spinner = bone.helpers.spinner({
			radius: 15,
			length: 15,
		});

		this.fire('viewinit');
		
		// bind internal events
		var thisView = this;
		this.watch('viewfetchtemplatesuccess', function() {
			thisView.render();
		});

		this.watch('viewshowspinner', function() {
			thisView.showSpinner();
		});

		this.watch('viewhidespinner', function() {
			thisView.hideSpinner();
		});
	},

	setEl: function() {
		this.selector = '[data-view="' + this.name + '"]';
		this.$el = $( this.selector );
		this.fetchTemplate();
	},

	// for setting templates after initializing
	// useful for switching templates arbitrarily
	setTemplate: function( name ) {
		this.$el.attr('data-view', name);
		this.name = name;
		this.setEl();
	},

	fetchTemplate: function( src ) {
		if (!src) {
			var src = this.templateSrc + this.templateName + '-templ.html';
		}

		var thisView = this;

		$.ajax({
			url: src,
			method: 'GET',
			dataType: 'html',
			success: function( res ) {
				thisView.template = res;
				thisView.fire('viewfetchtemplatesuccess');
			},
			error: function( res ) {
				if (bone.debug) console.log('View: Error: Bad response while fetching template: ' + src);
				if (bone.debug) console.log(res);
			}
		});
	},

	render: function( template ) {
		// gets called when model retrieves data
		if ( !template ) {
			var template = this.template;
		}

		var compileTemplate = _.template( template, this.model.data );
		
		this.$el.append( compileTemplate );

		this.bindEvents();

		this.fire('viewrender');
	},

	bindEvents: function() {
		var thisView = this;
		// bind events according to events hash
		_.each( this.events, function(val, index) {
			thisView.$el.find( index ).bind('click', function(e) {
				thisView[val](e); 	// selects the fn name and fires it, passing in the event
			});						
		});
	},

	unbindEvents: function() {
		var thisView = this;
		// unbind events according to events hash
		// useful if the template needs to re-render and re-set events
		_.each( this.events, function(val, index) {
			thisView.$el.find( index ).unbind('click', function(e) {
				thisView[val](e); 	// selects the fn name and fires it, passing in the event
			});						
		});
	},

	// spinner methods
	showSpinner: function() {
		this.$el.append( this.spinner.el );
		var thisView = this;
		setTimeout(function() {
			$( thisView.spinner.el ).addClass('active');	
		}, 1)
	},

	hideSpinner: function() {
		$( this.spinner.el ).removeClass('active');
		var thisView = this;
		setTimeout(function() {
			$( thisView.spinner.el ).remove();
		}, 1000);
	},

	// load styles asyncronously
	fetchStyles: function() {
		var src = this.stylesSrc + this.name + '.css';
		var thisView = this;

		$.ajax({
			url: src,
			method: 'GET',
			dataType: 'html',
			success: function(res) {
				if (bone.debug) console.log('View: styles fetched');

				thisView.styles = res;

				thisView.$el.append('<style data-view-styles="' + thisView.name + '">' + res + '</style>' );
			},
			error: function(res) {
				if (bone.debug) console.log('View: Error styles not fetched');
				if (bone.debug) console.log(res);
			}
		});
	},

	// pubsub methods
	// watch for an event
	watch: function(topic, func) {
		if (!this.topics[topic]) {
			this.topics[topic] = [];
		}
		var token = (++this.subUid).toString();
		this.topics[topic].push({
			token: token,
			func: func
		});
		return token;
	},

	// fire an event
	fire: function(topic, args) {
		if (!this.topics[topic]) {
			return false;
		}
		var self = this;
		setTimeout(function() {
			var subscribers = self.topics[topic],
				len = subscribers ? subscribers.length : 0;			 
			while (len--) {
				subscribers[len].func(topic, args);
			}
		}, 0);
		return true;			 
	},

	// stop watching
	stopWatching: function(token) {
		for (var m in this.topics) {
			if (this.topics[m]) {
				for (var i = 0, j = this.topics[m].length; i < j; i++) {
					if (this.topics[m][i].token === token) {
						this.topics[m].splice(i, 1);
						return token;
					}
				}
			}
		}
		return false;
	},
}

// assign extend helper to constructors to achieve backbone-like pattern
dogbone.Model.extend = dogbone.View.extend = dogbone.helpers.extend;
