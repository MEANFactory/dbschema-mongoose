var _ = require('../utils');

var AUDIT_TYPES   = ['VERSION', 'DELETE', 'MEMBER'];
var AUDIT_FIELDS  = ['_v', '_d', '_m'];
var MAP = {
  mysql: {
    bigint          : { type: 'Number' },
    binary          : { type: 'Mixed' },
    bit             : { type: 'Boolean' },
    blob            : { type: 'String' },
    bool            : { type: 'Boolean' },
    char            : { type: 'String' },
    date            : { type: 'Date' },
    datetime        : { type: 'Date' },
    decimal         : { type: 'Number' },
    double          : { type: 'Number' },
    enum            : { type: 'String' },
    float           : { type: 'Number' },
    int             : { type: 'Number' },
    json            : { type: 'String' },
    long_varbinary  : { type: 'Mixed' },
    long_varchar    : { type: 'String' },
    longblob        : { type: 'String' },
    longtext        : { type: 'String' },
    mediumblob      : { type: 'String' },
    mediumint       : { type: 'Number' },
    mediumtext      : { type: 'String' },
    numeric         : { type: 'Number' },
    real            : { type: 'Number' },
    set             : { type: '' },
    smallint        : { type: 'Number' },
    text            : { type: 'String' },
    time            : { type: 'String',   textType: 'year'  },
    timestamp       : { type: 'Date' },
    tinyblob        : { type: 'String' },
    tinyint         : { type: 'Number' },
    tinytext        : { type: 'String' },
    varbinary       : { type: 'Mixed' },
    varchar         : { type: 'String' },
    year            : { type: 'String',   textType: 'year' }
  }
};

module.exports = Field;

function Field(schema, column){
  this.schema    = schema;
  this.column    = column;
  this.name      = column.name;
  this.fieldName = column.isPrimary ? '_id' : column.name;

  this.fullName   = undefined;

  this.alias      = undefined;  // *
  this.def        = undefined;  // *
  this.enum       = undefined;  // String
  this.get        = undefined;  // *
  this.lowercase  = undefined;  // String
  this.max        = undefined;  // Date, Number
  this.match      = undefined;  // String
  this.min        = undefined;  // Date, Number
  this.ref        = undefined;  // *
  this.required   = undefined;  // *
  this.select     = undefined;  // *
  this.set        = undefined;  // *
  this.trim       = undefined;  // String
  this.type       = undefined;  // *
  this.uppercase  = undefined;  // String
  this.validate   = undefined;  // *

  this.auditType  = undefined;
  this.isArray    = undefined;
  this.isAudit    = undefined;
  this.key        = undefined;
  this.name       = undefined;
  this.maxLength  = undefined;
  this.minLength  = undefined;
  this.path       = undefined;
  this.textType   = undefined;

  this.fullName = [
    _.properties.parse(column.table.schema.database.name),
    _.properties.parse(column.table.schema.name),
    _.properties.parse(column.table.name),
    _.properties.parse(column.name),
    ].join('.');

  if (AUDIT_FIELDS.indexOf(this.name) >= 0) {
    this.isAudit    = true;
    this.auditType  = this.isAudit ? AUDIT_TYPES[AUDIT_FIELDS.indexOf(this.name)] : undefined;
    if (this.auditType === 'VERSION' && this.column.type.indexOf('date') === 0) {
        this.def = 'Date.now';
    }
    if (this.auditType === 'DELETE' && this.column.type === 'bool') {
        this.def = 'false';
    }
  }

  if (this.name === '_id') {
    this.key      = 'id';
    this.name     = 'ID';
    this.required = true;
  }
  if (this.name === '_id' && (['varchar', 'char', 'nvarchar', 'nchar'].indexOf(this.column.type) >= 0)) {
    this.lowercase  = true;
    this.trim       = true;
    this.type       = 'String';
  }
  if (this.column.length === 32 && this.name === '_id' && this.type === 'String') {
    this.def        = '_.uuids.init';
    this.lowercase  = true;
    this.trim       = true;
    this.type       = 'String';
    this.maxLength  = 32;
    this.minLength  = 32;
    this.textType   = 'uid';
  }
  if (this.column.length === 36 && this.name === '_id' && this.type === 'String') {
    this.def        = '_.uuids.initGuid';
    this.lowercase  = true;
    this.trim       = true;
    this.type       = 'String';
    this.maxLength  = 36;
    this.minLength  = 36;
    this.textType   = 'guid';
  }
  if (this.name && this.name.endsWith('_id') && this.name.length > 3  && !this.column.isPrimary) {
    this.lowercase  = true;
    this.trim       = true;
    this.type       = 'String';
  }
  if (this.name === 'email' && (['varchar', 'char', 'nvarchar', 'nchar'].indexOf(this.column.type) >= 0)) {
    this.lowercase  = true;
    this.trim       = true;
    this.type       = 'String';
    this.minLength  = 5;
    this.textType   = 'email';
  }


  if (this.column.mandatory) {
    this.required   = true;
  }
  if (typeof this.column.length !== 'undefined' && (['varchar', 'char', 'nvarchar', 'nchar'].indexOf(this.column.type) >= 0)) {
    this.maxLength  = this.column.length;
  }
  var p = this.column.primary;
  if (p && p.table && p.schema && p.schema.name === this.column.table.schema.name) {
    this.ref        = _.properties.toModel(p.table.name);
  }
  if (p && p.table) {
    this.name       = _.properties.toModel(p.table.name) + ' ID';
  }


  var me = this;

  this.getLine = function(){

    var enhance = me.schema.worker.options.enhance;

    applyDefaults(me);

    var parts = [];
    if (me.isArray) {
      parts.push('type: [ ' + me.type + ' ]');
    } else {
      parts.push('type: ' + me.type);
    }

    // this.alias      = undefined;  // *
    if (typeof me.def !== 'undefined') {
      parts.push('default: ' + me.def);
    }
    // this.enum       = undefined;  // String
    // this.get        = undefined;  // *
    if (typeof me.lowercase !== 'undefined') {
      parts.push('lowercase: ' + me.lowercase);
    }
    if (typeof me.max !== 'undefined') {
      parts.push('max: ' + me.max);
    }
    // this.match      = undefined;  // String
    if (typeof me.min !== 'undefined') {
      parts.push('min: ' + me.min);
    }
    if (me.ref) {
      parts.push('ref: \'' + me.ref + '\'');
    }
    if (typeof me.required !== 'undefined') {
      parts.push('required: ' + me.required);
    }
    if (typeof me.select !== 'undefined') {
      parts.push('select: ' + me.select);
    }
    // this.set        = undefined;  // *
    if (typeof me.trim !== 'undefined') {
      parts.push('trim: ' + me.trim);
    }
    if (typeof me.uppercase !== 'undefined') {
      parts.push('uppercase: ' + me.uppercase);
    }
    // this.validate   = undefined;  // *
    if (enhance && me.auditType) {
      parts.push('auditType: \'' + me.auditType + '\'');
    }
    if (enhance && typeof me.isAudit !== 'undefined') {
      parts.push('isAudit: ' + me.isAudit);
    }
    if (enhance && me.key) {
      parts.push('key: \'' + me.key + '\'');
    }
    if (enhance && me.name) {
      parts.push('name: \'' + me.name + '\'');
    }
    if (enhance && typeof me.maxLength !== 'undefined') {
      parts.push('maxLength: ' + me.maxLength);
    }
    if (enhance && typeof me.minLength !== 'undefined') {
      parts.push('minLength: ' + me.minLength);
    }
    if (enhance && me.path) {
      parts.push('path: \'' + me.path + '\'');
    }
    if (enhance && me.textType) {
      parts.push('textType: \'' + me.textType + '\'');
    }

    return me.name + ' : { ' + parts.join(', ') + ' }';
  };

}

function applyDefaults(field){

  var dbType  = field.column.table.schema.database.type.toLowerCase();
  var map     = MAP[dbType];
  if (!map) {
    console.log('Defaults not applied to field: %s', field.name);
    console.log('Unknown database type: %s', dbType);
    return;
  }

  var cType = field.column.type.toLowerCase();
  var def   = map[cType];
  if (!def) {
    console.log('Defaults not applied to field: %s', field.name);
    console.log('Unknown column type: %s', cType);
    return;
  }

  if (!def.type) {
    console.log('Defaults not applied to field: %s', field.name);
    console.log('No translated type for column type: %s', cType);
    return;
  }

  Object.keys(def).forEach(function(key){
    if (typeof field[key] === 'undefined') {
      field[key] = def[key];
    }
  });
}
