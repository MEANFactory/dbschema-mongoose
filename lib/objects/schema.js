var Field       = require('./field'),
    SchemaIndex = require('./schema-index'),
    _           = require('../utils'),
    path        = require('path');

var AUDIT_FIELDS  = ['_v', '_d', '_m'];

module.exports = Schema;

function Schema(worker, table){
    var strings = worker.parser._.strings;

  this.worker = worker;
  this.table  = table;
  this.fullName = worker.nextName([
    _.properties.parse(table.schema.database.name),
    _.properties.parse(table.schema.name),
    _.properties.parse(table.name)
  ].join('.'));
  this.name   = this.fullName.split('.')[2];

  var me = this;

  var _fields = [];
  this.fields = _fields;
  var _indices = [];
  this.indices = _indices;

  table.columns.forEach(function(column){
    var item = new Field(me, column);
    _fields.push(item);
  });
  table.indices.forEach(function(idx){
    var item = new SchemaIndex(me, idx);
    _indices.push(item);
  });

  var getLines = function(){
    var lines = [];
    lines.push('var _        = require(\'mf-utils-node\'),');
    lines.push('    mongoose = require(\'mongoose\');');
    lines.push('');
    lines.push('var schema = new mongoose.Schema({');
    var eol = '';
    for (var i = 0; i < _fields.length; i += 1) {
      eol = (_fields[i] === _fields[_fields.length - 1]) ? '' : ',';
      lines.push('    ' + _fields[i].getLine() + eol);
    }
    lines.push('});');
    lines.push('');

    eol = '';
    var idxs = _indices.filter(function(item){
      return (item.fields.length > 0 && !item.index.isPrimary);
    })
    for (var i = 0; i < idxs.length; i += 1) {

      lines.push('schema.index({');

      var prefixLength = 0;
      idxs[i].fields.forEach(function(f){
        if (f.fieldName.length > prefixLength) { prefixLength = f.fieldName.length; }
      });

      for (var f = 0; f < idxs[i].fields.length; f += 1) {
        eol = (idxs[i].fields[f] === idxs[i].fields[f][idxs[i].fields.length - 1]) ? '' : ',';
        lines.push('    ' + pad(idxs[i].fields[f].fieldName, prefixLength) + ' : true' + eol);
      }

      lines.push('}, { unique : ' + idxs[i].index.isUnique + ' });');
    }

    if (idxs.length > 0) {
      lines.push('');
    }

    lines.push('var model = mongoose.model(\'' + _.properties.toModel(table.name) + '\', schema)');
    lines.push('');
    lines.push('module.exports = model;');
    return lines;
  }
  this.getLines = getLines;
  this.save = function() {

    var options = me.worker.options;

    var folder;
    if (options.reduce && strings.isValid(options.database) && strings.isValid(options.schema)) {
        folder = options.output;
    }
    else if (options.reduce && strings.isValid(options.database)) {
        folder = path.join(options.output, _.properties.parse(table.schema.name));
    }
    else {
        folder = path.join(options.output, _.properties.parse(table.schema.database.name), _.properties.parse(table.schema.name));
    }

    if (!worker.parser._.folders.create(folder)){
      console.log('Failed to create output folder: %s', folder);
      process.exit(1);
    }
    var file = path.join(
      folder,
      _.properties.parse(table.name) + '.js'
    );
    if (!worker.parser._.files.write(getLines(), file, options.overwrite)) {
      console.log('Failed to create output file: %s', file);
      process.exit(1);
    }
  }
}

function pad(value, length) {
  while (value.length < length) {
    value += ' ';
  }
  return value;
}

