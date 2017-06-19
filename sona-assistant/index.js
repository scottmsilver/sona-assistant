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

'use strict';
var gEchoSonos = require('../third_party/echo-sonos/lambda/src/index.js')
process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;

exports.sonaAssistant = (request, response) => {
  const app = new App({ request, response });
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  // Return an EchoEvent which is what the Echo/AmazonSkill
  // library would create before calling an intent.
  function makeEchoEvent(app) {
    var slots = {}

    // Copy all the parameters in this request to the equivalent in echo land.
    // FIX-ME(scottmsilver): Pretty evil to just dive into internal class details.
    for (var parameterName in app.body_.result.parameters) {
      slots[parameterName] = { value: app.getArgument(parameterName) };
    }

    return {
      session: {
	application: {
	  applicationId: "yourappidhere"
	}
      },
      request: {
	type: "IntentRequest",
	intent: {
	  name: app.getIntent(),
	  slots: slots
	}
      }
    };
  }

  function handleOne(app) {
    var echoEvent = makeEchoEvent(app);
    console.log(JSON.stringify(echoEvent));

    var context = {
      app: app,
      // Called when the intent fails.
      fail: function(e) {
	console.log(e + "failure called");
	this.app.tell("I'm sorry I cannot do that.");
      },
      // Called when the intent succesfully executes. The argument
      // is a speechletResponse. Search the Internet for what it looks like.
      succeed: function(speechletResponse) {
	console.log("success: " + JSON.stringify(speechletResponse));
	if (speechletResponse) {
	  this.app.tell(speechletResponse.response.outputSpeech.text);
	} else {
	  this.app.tell("Ok!");
	}
      }
    };

    gEchoSonos.handler(echoEvent, context);
  }

  process.env['DEBUG'] = '*';

  app.handleRequest(handleOne);
};
