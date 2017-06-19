// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Convert an utterances.txt file from Amazon Echo land into one importable into API.AI
// Basically it autogenerates the intents and entities from a simple text file.
//
// Usage:
//
// Create a basic API.AI application.
// Download it all as a zip file.
// Unzip that zip file into a directory.
// Generate entities and intents via this.
// node convert-utterances.js path/to/utterances.txt template-file /path/to/intents/directory /path/to/entities/directory

'use strict';

// Return a string representing the data part of an API.AI intent by
// using the parsed version of the intent and converting to API.AI format.
//
// Roughly this takes the text part and leaves it unchanged and the parameters
// get changed into @ParamType:ParamName.
// Currently it does not work with more that one of ParamType in the same utterance.
function makeApiAiUserSays(parsedIntent) {
	var userSaysText = "";
	var parameterNumber = 0;
	for (let token of parsedIntent) {
		if (token.type === "text") {
			userSaysText = userSaysText.concat(token.value);
		} else if (token.type === "param") {
			userSaysText = userSaysText.concat("@" + token.value + ":" + token.value);
		}
	}

	return { text: userSaysText };
}

// Return the supporting data structure that gets used to output a template.
//
// It looks like this:
//
// var intents2 = [ {
//   name:"foo",
// 	userSays: [ { text:"hi" }, { text: "guy" } ],
//   action: "foo",
//    parameters: [ "p1", "p2" ]
// }, {
//  name:"foo",
//		userSays: [ { text:"hi2" }, { text: "guy3" } ],
//    action: "foo",
//    parameters: [ "p1", "p2" ]
//}	]
function makeApiAiData(intents) {
	var apiAiIntents = [];
	var entities = {};
	for (var intentName in intents) {
		var intent = intents[intentName];
		
		// Uses associative array to deduplicate parameters
		var parameters = {}
		
		var userSays = [];
		for (let intentInstance of intent) {
			userSays.push(makeApiAiUserSays(intentInstance.parsedIntent));
			
			for (let parameter of intentInstance.parameters) {
				parameters[parameter] = parameter;
				entities[parameter] = parameter;
  		}
		}
		apiAiIntents.push({
			name: intentName,
			userSays: userSays,
			action: intentName,
			parameters: Object.keys(parameters)
		});
	}

	return {intents: apiAiIntents, entities: entities};
}

// Write text to new file at filePath.
function writeTextToFile(text, filePath) {
	var fs = require('fs');
	fs.writeFile(filePath, text, function(err) {
		if (err) {
			return console.log(err);
		}				
	}); 
}

// Parse the utterances.
var fs = require('fs');
var file = fs.readFileSync(process.argv[2], "utf8");
var parser = require('./utterance-parser-grammar.js')
var intents = parser.parse(file);

// Grab and compile the template.
var doT = require('dot')
doT.templateSettings.strip = false;

// Output the intents.
var intentsTemplateFile = fs.readFileSync(process.argv[3], "utf8");
var intentsTemplateFunction = doT.template(intentsTemplateFile);
var apiAiData = makeApiAiData(intents);

for (let apiAiIntent of apiAiData.intents) {
	var intentsContents = intentsTemplateFunction({"intent": apiAiIntent});		
	writeTextToFile(intentsContents, process.argv[5] + "/" + apiAiIntent.name + ".json");
}

// Output the entities.
var entitiesTemplateFile = fs.readFileSync(process.argv[4], "utf8");
var entitiesTemplateFunction = doT.template(entitiesTemplateFile);

for (let entity of Object.keys(apiAiData.entities)) {
	var entitiesContents = entitiesTemplateFunction({"entity": entity});
	writeTextToFile(entitiesContents, process.argv[6] + "/" + entity + ".json");
}
