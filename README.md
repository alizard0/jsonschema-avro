# jsonschema-avro

[![npm](https://img.shields.io/npm/v/jsonschema-avro.svg)](https://www.npmjs.com/package/jsonschema-avro)
[![Build Status](https://travis-ci.org/thedumbterminal/jsonschema-avro.svg?branch=master)](https://travis-ci.org/thedumbterminal/jsonschema-avro)

Converts JSON-schema definitions into Avro definitions.

## Install

    // clone repo and inside the repo do, to install the module locally
    npm install
    // inside your node project do, which will fetch the local version
    npm install jsonschema-avro

## Extra features
1. Supports optional records and arrays
2. Avoid records with the same name

## Example
    // inside a file called, converter.js
    const jsonSchemaAvro = require('jsonschema-avro')
    var fs = require('fs')
    var path = process.cwd()
    var buffer = fs.readFileSync(path + "/" + process.argv[2])
    const inJson = JSON.parse(buffer.toString())
    const avro = jsonSchemaAvro.convert(inJson, process.argv[3], process.argv[4])
    console.log(JSON.stringify(avro))
    
    // create a file schema.json with your json-schema
    touch schema.json
    
    // usage
    node converter.js schema.json "com.example.avro.MyAvro" "MyAvro" > avro.json
