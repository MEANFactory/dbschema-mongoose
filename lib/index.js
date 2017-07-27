var path  = require('path'),
    obj   = require('./objects'),
    utils = require('./utils');

var _;
var toModelName = utils.properties.toModel;
var toPropertyName = utils.properties.parse;

module.exports = {
  Worker : Worker
};

function Worker(parser, options) {
  _ = parser._;
  this.parser = parser;
  this.options = options;

  var _schemas = [];
  this.schemas = _schemas;
  var getSchema = function(name){
    return _schemas.find(function(item){
      return (item.fullName.toLowerCase() === name.toLowerCase());
    });
  };
  this.schema = getSchema;
  this.nextName = function(name){
    if (!getSchema(name)) { return name; }
    var count = 1;
    while (getSchema(name + '_' + count)) {
      count++;
    }
    return name + '_' + count;
  };

  var parent = this;

  parser.databases.filter(function(db){
    return (!_.strings.isValid(options.database) || options.database === db.name);
  }).forEach(function(db){
    db.schemas.filter(function(schema){
      return (!_.strings.isValid(options.schema) || options.schema === schema.name);
    }).forEach(function(schema){
      schema.tables.forEach(function(table){
        var item = new obj.Schema(parent, table);
        if (item) { _schemas.push(item); }
      });
      schema.views.forEach(function(view){
        var item = new obj.Schema(parent, view);
        if (item) { _schemas.push(item); }
      });
    });
  });

  this.save = function(){
    _schemas.forEach(function(item){
      item.save();
    });
    writeIndexFiles(parent);
  };
}

function writeIndexFiles(worker){
    var ops = worker.options;
    // var _   = worker.parser._;

    if (!ops.index) { return; }

    var eol;
    var file;

    var rootLines = [];
    rootLines.push('module.exports = {');

    var dbs = worker.parser.databases.filter(function(db){
        return (!_.strings.isValid(ops.database) || db.name === ops.database);
    });
    var lastDb = (dbs.length > 0) ? dbs[dbs.length - 1] : undefined;

    dbs.forEach(function(db){

        eol = (lastDb === db) ? '' : ',';
        rootLines.push('    ' + toPropertyName(db.name) + ': require(\'./' + db.name + '\')' + eol);

        var dbLines = [];
        dbLines.push('module.exports = {');

        var schemas = db.schemas.filter(function(schema){
            return (!_.strings.isValid(ops.schema) || schema.name === ops.schema);
        });
        var lastSchema = (schemas.length > 0) ? schemas[schemas.length - 1] : undefined;

        schemas.forEach(function(schema){

            eol = (lastSchema === schema) ? '' : ',';
            dbLines.push('    ' + toPropertyName(schema.name) + ': require(\'./' + schema.name + '\')' + eol);

            var schemaLines = [];
            schemaLines.push('module.exports = {');

            var items = [].concat(schema.tables, schema.views);
            var lastItem = (items.length > 0) ? items[items.length - 1] : undefined;

            items.forEach(function(item){
                eol = (lastItem === item) ? '' : ',';
                schemaLines.push('    ' + toModelName(item.name) + ': require(\'./' + item.name + '\')' + eol);
            });

            schemaLines.push('};');

            if (ops.reduce && _.strings.isValid(ops.database) && _.strings.isValid(ops.schema)) {
                file = path.join(ops.output, 'index.js');
            }
            else if (ops.reduce && _.strings.isValid(ops.database)) {
                file = path.join(ops.output, toPropertyName(schema.name), 'index.js');
            }
            else {
                file = path.join(ops.output, toPropertyName(db.name), toPropertyName(schema.name), 'index.js');
            }

            _.files.write(schemaLines, file, true);
        });

        dbLines.push('};');

        if (ops.reduce && _.strings.isValid(ops.database) && _.strings.isValid(ops.schema)) {
            // Do nothing
        }
        else if (ops.reduce && _.strings.isValid(ops.database)) {
            file = path.join(ops.output, 'index.js');
        }
        else {
            file = path.join(ops.output, toPropertyName(db.name), 'index.js');
        }

        _.files.write(dbLines, file, false);
    });

    rootLines.push('};');


    if (ops.reduce && _.strings.isValid(ops.database) && _.strings.isValid(ops.schema)) {
        // Do nothing
    }
    else if (ops.reduce && _.strings.isValid(ops.database)) {
        // Do nothing
    }
    else {
        file = path.join(ops.output, 'index.js');
    }

    _.files.write(rootLines, file, false);
}
