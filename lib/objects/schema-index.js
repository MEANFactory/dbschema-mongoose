module.exports = SchemaIndex;

function SchemaIndex(schema, tableIndex){
  this.schema = schema;
  this.index  = tableIndex;
  this.name   = tableIndex.name;

  var me = this;

  var _fields = [];
  this.fields = _fields;

  tableIndex.columns.forEach(function(column){
    var field = schema.fields.find(function(item){
      return (item.column === column);
    });
    if (field) { _fields.push(field); }
  });
}
