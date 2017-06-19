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

{
  var intents = {}
  var currentParsedIntent = [];
  var currentParameters = [];
}

Intents 
  = (Intent+[ \t\r\n]*)+ {
    return intents;
  }
  
Intent
  = intentName:IntentName [ \t]+ all:((UtteranceText/UtteranceParameter)+)[\r\n] {
    if (!intents[intentName]) {
      intents[intentName] = [];
    }
      
    // "all" is technically an array of tuples (arrays of length 2), so we have to merge them all twice.
    var flattenedAll =  [].concat.apply([], all).join("")
    intents[intentName].push({ 
      name: intentName, 
      text: flattenedAll,
      parsedIntent: currentParsedIntent,
      parameters: currentParameters 
    });
    
    // Reset the parameters we are tracking for the next intent.
    currentParameters = [];
    currentParsedIntent = [];
  }

IntentName "intent-name"
  = [a-zA-Z0-9]+ {
    return text();
  }

UtteranceText "utterance-text"
  = [a-zA-Z \-'\t]+ {
    currentParsedIntent.push({type: "text", value: text()});
    return text();
  }
  
UtteranceParameter "utterance-parameter"
  = [\{]parameterName:ParameterName[\}] {
    currentParameters.push(parameterName);
    currentParsedIntent.push({type: "param", value: parameterName});
    return text();
  }

ParameterName "parameter-name"
  = [a-zA-Z0-9]+ {
    return text();
  }
  