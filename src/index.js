const url = require('url')
const jsonSchemaAvro = module.exports = {}

// Json schema on the left, avro on the right
const typeMapping = {
	'string': 'string',
	'null': 'null',
	'boolean': 'boolean',
	'integer': 'int',
	'number': 'float'
}

const reSymbol = /^[A-Za-z_][A-Za-z0-9_]*$/

const records = new Map()

jsonSchemaAvro._pascalCase = (string) => {
  return `${string}`
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w*)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`
    )
    .replace(new RegExp(/\w/), s => s.toUpperCase());
}

jsonSchemaAvro.convert = (jsonSchema, nameSpace, name) => {
	if(!jsonSchema){
		throw new Error('No schema given')
	}
	const record = {
		namespace: nameSpace,
		name: name,
		type: 'record',
		fields: jsonSchema.properties ? jsonSchemaAvro._convertProperties(jsonSchema.properties, jsonSchema.required) : []
	}
	return record
}

jsonSchemaAvro._generateUniqueRecordNames = (name) => {
	if (records.get(name) === undefined) {
		records.set(name, 1)
		return name
	} else {
		records.set(name, records.get(name) + 1)
		return name + records.get(name)
	}
}

jsonSchemaAvro._isComplex = (schema) => schema.type === 'object'

jsonSchemaAvro._isArray = (schema) => schema.type === 'array'

jsonSchemaAvro._hasEnum = (schema) => Boolean(schema.enum)

jsonSchemaAvro._isRequired = (list, item) => list.includes(item)

jsonSchemaAvro._convertProperties = (schema = {}, required = []) => {
	return Object.keys(schema).map((item) => {
		if(jsonSchemaAvro._isComplex(schema[item])){
			return jsonSchemaAvro._convertComplexProperty(item, schema[item], jsonSchemaAvro._isRequired(required, item))
		}
		else if(jsonSchemaAvro._isArray(schema[item])){
			return jsonSchemaAvro._convertArrayProperty(item, schema[item],)
		}
		else if(jsonSchemaAvro._hasEnum(schema[item])){
			return jsonSchemaAvro._convertEnumProperty(item, schema[item])
		}
		return jsonSchemaAvro._convertProperty(item, schema[item], jsonSchemaAvro._isRequired(required, item))
	})
}

jsonSchemaAvro._convertComplexProperty = (name, contents, required) => {
	if (required) {
		return {
			name,
			type: {
				type: 'record',
				name: jsonSchemaAvro._generateUniqueRecordNames(jsonSchemaAvro._pascalCase(`${name}Record`)),
				fields: jsonSchemaAvro._convertProperties(contents.properties, contents.required)
			}
		}
	} else {
		return {
			name,
			default: null,
			type: [
				"null",
				{
					type: 'record',
					name: jsonSchemaAvro._generateUniqueRecordNames(jsonSchemaAvro._pascalCase(`${name}Record`)),
					fields: jsonSchemaAvro._convertProperties(contents.properties, contents.required)
				}
			]
		}
	}
}

jsonSchemaAvro._convertArrayProperty = (name, contents) => {
	return {
		name,
		type: {
			type: 'array',
			items: jsonSchemaAvro._isComplex(contents.items)
				? {
					type: 'record',
					name: jsonSchemaAvro._generateUniqueRecordNames(jsonSchemaAvro._pascalCase(`${name}Record`)),
					fields: jsonSchemaAvro._convertProperties(contents.items.properties, contents.items.required)
				}
				: jsonSchemaAvro._convertProperty(name, contents.items)
		}
	}
}


jsonSchemaAvro._convertEnumProperty = (name, contents) => {
	const prop = {
		name,
		type: contents.enum.every((symbol) => reSymbol.test(symbol))
			? {
				type: 'enum',
				name: jsonSchemaAvro._pascalCase(`${name}Enum`),
				symbols: contents.enum
			}
			: 'string'
	}
	if(contents.hasOwnProperty('default')){
		prop.default = contents.default
	}
	return prop
}

jsonSchemaAvro._convertProperty = (name, value, isRequired = false) => {
	const prop = {
		name
	}
	let types = []
	if(value.hasOwnProperty('default')){
		//console.log('has a default')
		prop.default = value.default
	}
	else if(!isRequired){
		//console.log('not required and has no default')
		prop.default = null
		types.push('null')
	}
	if(Array.isArray(value.type)){
		types = types.concat(value.type.filter(type => type !== 'null').map(type => typeMapping[type]))
	}
	else{
		types.push(typeMapping[value.type])
	}
	//console.log('types', types)
	//console.log('size', types.length)
	prop.type = types.length > 1 ? types : types.shift()
	
	return prop
}
