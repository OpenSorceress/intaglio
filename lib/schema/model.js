var utils = require('./../utils'),
	_ = require('underscore'),
	AbstractSchema = require('./abstract'),
	Property = require('./property'),
	inflection = require('inflection');
	
module.exports = AbstractSchema.extend({
	_properties: null,

	init: function (name, metadata) {
		// Set the name of the object
		this._setName(name);

		// Store the metadata
		this._metadata = metadata || {};

		this._properties = {};
	},

	addProperty: function (property) {
		utils.assert('`property` must be an instance of Schema.Property', property instanceof Property);
		utils.assert('Property must not already be defined in the model', this._properties[property.getName()] === undefined);
		this._properties[property.getName()] = property;

		return this;
	},

	getProperty: function (name) {
		return this._properties[utils.normalizeName(name, false)];
	},

	getProperties: function () {
		return this._properties;
	},

	getPrimaryKey: function () {
		var keys = [];

		for (var key in this._properties) {
			if (this._properties[key].isPrimaryKey())
				keys.push(this._properties[key]);
		}

		return keys;
	},

	getPropertyNames: function () {
		var names = [];

		for (var key in this._properties) {
			names.push(this._properties[key].getName());
		}

		return names;
	},

	getPluralizedName: function () {
		var parts = inflection.underscore(this.getName()).split('_');

		if (parts.length === 1)
			parts[0] = inflection.pluralize(parts[0]);
		else
			parts[parts.length - 1] = inflection.pluralize(parts[parts.length - 1]);

		return inflection.camelize(parts.join('_'), true);
	},


	getPOJO: function () {
		var schema = {
			name: this.getName(),
			properties: {}
		};

		_.each(this.getProperties(), function (property) {
			schema.properties[property.getName()] = property.getPOJO();
		});

		return schema;
	},

	/**
	 * Translates an object from the repository to one that the ORM can use
	 * @param data
	 * @returns {{}}
	 */
	translateObjectToOrm: function (data) {
		var newObj = {},
			self = this;

		_.each(data, function (value, key) {
			var prop = self.getProperty(key);

			if (prop === undefined)
				return;

			newObj[prop.getName()] = value;
		});

		return newObj;
	},

	/**
	 * Translates an object from the ORM to one the repository can understand
	 * @param data
	 * @returns {{}}
	 */
	translateObjectToRepository: function (data) {
		var newObj = {},
			self = this;

		_.each(data, function (value, key) {
			var prop = self.getProperty(key);

			if (prop === undefined)
				return;

			newObj[prop.getOriginalName()] = value;
		});

		return newObj;
	},

	_setName: function (name) {
		utils.assert('`name` is a required field!', name !== undefined);
		utils.assert('`name` must be a string!', _.isString(name));

		this._name = utils.normalizeName(name);
		this._originalName = name;
	}
});