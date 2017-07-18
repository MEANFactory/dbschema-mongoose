var Field       = require('./field'),
    SchemaIndex = require('./schema-index'),
    _           = require('../utils'),
    path        = require('path');

var AUDIT_FIELDS  = ['_v', '_d', '_m'];

module.exports = Schema;

function Schema(worker, table){
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
    lines.push('var mongoose = require(\'mongoose\');');
    lines.push('');
    lines.push('var schema = new mongoose.Schema({');
    var eol = '';
    for (var i = 0; i < _fields.length; i += 1) {
      eol = (_fields[i] === _fields[_fields.length - 1]) ? '' : ',';
      lines.push('    ' + _fields[i].getLine() + eol);
    }
    lines.push('};');
    lines.push('');

    eol = '';
    var idxs = _indices.filter(function(item){
      return (item.fields.length > 0 && !item.index.isPrimary);
    })
    for (var i = 0; i < idxs.length; i += 1) {

      lines.push('schema.index({');

      for (var f = 0; f < idxs[i].fields.length; f += 1) {
        eol = (idxs[i].fields[f] === idxs[i].fields[f][idxs[i].fields.length - 1]) ? '' : ',';
        lines.push('    ' + idxs[i].fields[f].shortName + eol);
      }

      lines.push('}, { unique: ' + idxs[i].index.isUnique + ' });');
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
  this.save = function(folderPath, overwrite) {
    var folder = path.join(
      folderPath,
      _.properties.parse(table.schema.database.name),
      _.properties.parse(table.schema.name)
    );
    if (!worker.parser._.folders.create(folder)){
      console.log('Failed to create output folder: %s', folder);
      process.exit(1);
    }
    var file = path.join(
      folderPath,
      _.properties.parse(table.schema.database.name),
      _.properties.parse(table.schema.name),
      _.properties.parse(table.name) + '.js'
    );
    if (!worker.parser._.files.write(getLines(), file, overwrite)) {
      console.log('Failed to create output file: %s', file);
      process.exit(1);
    }
  }
}
