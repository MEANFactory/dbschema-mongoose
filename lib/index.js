var path  = require('path'),
    obj   = require('./objects'),
    utils = require('./utils');

var _;

module.exports = {
  Worker : Worker
};

function Worker(parser, outputDirectory, overwrite) {
  _ = parser._;
  this.parser = parser;
  this.output = outputDirectory;

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

  parser.databases.forEach(function(db){
    db.schemas.forEach(function(schema){
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

  this.save = function(overwrite){
    _schemas.forEach(function(item){
      item.save(outputDirectory, overwrite);
    });
    var names = getNames(parser.databases);
    if (!writeIndex(outputDirectory, names)){
      console.log('Failed to write index for: %s', outputDirectory);
      process.exit(1);
    }
    var dir;
    parser.databases.forEach(function(db){
      names = getNames(db.schemas);
      dir   = path.join(outputDirectory, utils.properties.parse(db.name));
      if (!writeIndex(dir, names)){
        console.log('Failed to write index for: %s', dir);
        process.exit(1);
      }

      db.schemas.forEach(function(s){
        var items = [];
        s.tables.forEach(function(t){
          var schema = _schemas.find(function(item){
            return (item.table === t);
          });
          if (schema) { items.push(schema); }
        });
        names = getNames(items);
        dir = path.join(
          outputDirectory,
          utils.properties.parse(db.name),
          utils.properties.parse(s.name)
        );
        if (!writeIndex(dir, names, true)) {
          console.log('Failed to write index for: %s', dir);
          process.exit(1);
        }
      });

    });
  }
}

function writeIndex(dir, names, forModel){
  var lines = getIndexLines(names, forModel);
  var file  = path.join(dir, 'index.js');
  return _.files.write(lines, file, true);
}
function getIndexLines(names, forModel){
  var lines = [];
  var eol = '';
  lines.push('module.exports = {');
  for (var i = 0; i < names.length; i += 1) {
    eol = (i === (names.length - 1)) ? '' : ',';
    var fName = utils.properties.parse(names[i]);
    var pName = forModel ? utils.properties.toModel(names[i]) : _.strings.toCamelCase(names[i]);
    lines.push('    ' + pName + ' : require(\'./' + fName + '\')' + eol);
  }
  lines.push('};');
  return lines;
}
function getNames(items){
  var result = [];
  [].concat(items).forEach(function(item){
    if (result.indexOf(item.name) < 0) { result.push(item.name); }
  });
  return result;
}
