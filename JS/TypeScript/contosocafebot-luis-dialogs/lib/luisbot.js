"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const botbuilder_ai_1 = require("botbuilder-ai");
const restify = require("restify");
/*
import * as Recognizers from '@microsoft/recognizers-text-date-time';
import * as DatatypesDateTime from '@microsoft/recognizers-text-data-types-timex-expression'
*/
const DEBUG = false;
const Resolver = require('@microsoft/recognizers-text-data-types-timex-expression').default.resolver;
const Creator = require('@microsoft/recognizers-text-data-types-timex-expression').default.creator;
const TimexProperty = require('@microsoft/recognizers-text-data-types-timex-expression').default.TimexProperty;
// This App ID is for the cafebot public LUIS app
const appId = process.env.LUIS_APP_ID; //"edaadd9b-b632-4733-a25c-5b67271035dd";
console.log(`process.env.LUIS_APP_ID=${process.env.LUIS_APP_ID}`);
const subscriptionKey = process.env.LUIS_SUBSCRIPTION_KEY; //"be30825b782843dcbbe520ac5338f567";
console.log(`process.env.LUIS_SUBSCRIPTION_KEY=${process.env.LUIS_SUBSCRIPTION_KEY}`);
// Default is westus
const serviceEndpoint = 'https://westus.api.cognitive.microsoft.com';
const luisRec = new botbuilder_ai_1.LuisRecognizer({
    appId: appId,
    subscriptionKey: subscriptionKey,
    serviceEndpoint: serviceEndpoint,
    options: {
        // Edit this to be the bot's time offset from UTC in minutes
        timezoneOffset: -480,
        verbose: true
    }
});
// Enum for convenience
// intent names match CafeLUISModel.ts
var Intents;
(function (Intents) {
    Intents["Book_Table"] = "Book_Table";
    Intents["Greeting"] = "Greeting";
    Intents["None"] = "None";
    Intents["Who_are_you_intent"] = "Who_are_you_intent";
})(Intents || (Intents = {}));
;
// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});
// Create adapter
const adapter = new botbuilder_1.BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const conversationState = new botbuilder_1.ConversationState(new botbuilder_1.MemoryStorage());
adapter.use(conversationState);
// Create empty dialog set
const dialogs = new botbuilder_dialogs_1.DialogSet();
// Listen for incoming requests 
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
    adapter.processActivity(req, res, (context) => __awaiter(this, void 0, void 0, function* () {
        const isMessage = context.activity.type === 'message';
        // Create dialog context 
        const state = conversationState.get(context);
        const dc = dialogs.createContext(context, state);
        if (!isMessage) {
            yield context.sendActivity(`[${context.activity.type} event detected]`);
        }
        // Check to see if anyone replied. 
        if (!context.responded) {
            yield dc.continue();
            // if the dialog didn't send a response
            if (!context.responded && isMessage) {
                yield luisRec.recognize(context).then((res) => __awaiter(this, void 0, void 0, function* () {
                    var typedresult = res;
                    let topIntent = botbuilder_ai_1.LuisRecognizer.topIntent(res);
                    switch (topIntent) {
                        case Intents.Book_Table: {
                            yield context.sendActivity("Top intent is Book_Table ");
                            yield dc.begin('reserveTable', typedresult);
                            break;
                        }
                        case Intents.Greeting: {
                            yield context.sendActivity("Top intent is Greeting");
                            if (DEBUG) {
                                const today = new Date(2017, 8, 26, 15, 30, 0);
                                var testTimex1 = TimexProperty.fromDateTime(today);
                                var textTime = testTimex1.toString();
                                yield context.sendActivity(`Top intent is Greeting and an arbitrary time is: ${textTime}`);
                                var testTimexResolution = Resolver.evaluate(['1984-01-03T18:30:45'], [Creator.wednesday]); // 1984-01-03T18:30:45
                                var testTimexResolution2 = Resolver.evaluate(['2018-06-05T15'], [Creator.today()]);
                                var testTimexResolution3 = Resolver.evaluate(['2018-06-08T15'], []);
                                var testTimexResolution4 = Resolver.evaluate(['2018-06-08T15'], [Creator.afternoon]);
                                console.log(`resolutions:${testTimexResolution},${testTimexResolution2}, ${testTimexResolution3}, ${testTimexResolution4}`);
                                if (testTimexResolution.values) {
                                    console.log(`Found resolution values: length=${testTimexResolution.values.length}`);
                                }
                            }
                            break;
                        }
                        case Intents.Who_are_you_intent: {
                            yield context.sendActivity("Top intent is Who_are_you_intent");
                            break;
                        }
                        default: {
                            yield dc.begin('default', topIntent);
                            break;
                        }
                    }
                }), (err) => {
                    // there was some error
                    console.log(err);
                });
            }
        }
    }));
});
// Add dialogs
dialogs.add('default', [
    function (dc, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = conversationState.get(dc.context);
            yield dc.context.sendActivity(`Hi! I'm the Contoso Cafe reservation bot. Say something like make a reservation."`);
            yield dc.end();
        });
    }
]);
dialogs.add('textPrompt', new botbuilder_dialogs_1.TextPrompt());
//dialogs.add('dateTimePrompt', new DatetimePrompt());
dialogs.add('dateTimePrompt', new botbuilder_dialogs_1.DatetimePrompt((context, values) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (values.length <= 0) {
            console.log(`Length of values array in prompt validator was 0`);
            throw new Error('Length of values array in prompt validator <= 0');
        }
        if (values[0].type !== 'datetime') {
            console.log(`unsupported type ${values[0].type}. expected: datetime.`);
            throw new Error(`unsupported type ${values[0].type}. expected: datetime.`);
        }
        /***** TODO: Pass values to timex resolver and return the candidates that remain after constraints **** */
        const value = new Date(values[0].value);
        if (value.getTime() < new Date().getTime()) {
            console.log(`DateTime Validator: time is in the past.`);
            throw new Error('in the past');
        }
        //return value; would return the actual date rather than array of resolutions
        return values;
    }
    catch (err) {
        yield context.sendActivity(`Please enter a valid time in the future like "tomorrow at 9am".`);
        return undefined;
    }
})));
dialogs.add('reserveTable', [
    function (dc, args, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var typedresult = args;
            // Call a helper function to save the entities in the LUIS result
            // to dialog state
            yield SaveEntities(dc, typedresult);
            yield dc.context.sendActivity("Welcome to the reservation service.");
            if (dc.activeDialog.state.dateTime) {
                yield next();
            }
            else {
                yield dc.prompt('dateTimePrompt', "Please provide a reservation date and time.");
            }
        });
    },
    function (dc, result, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!dc.activeDialog.state.dateTime) {
                // Save the dateTimePrompt result to dialog state
                dc.activeDialog.state.dateTime = result[0].value;
            }
            // If we don't have party size, ask for it next
            if (!dc.activeDialog.state.partySize) {
                yield dc.prompt('textPrompt', "How many people are in your party?");
            }
            else {
                yield next();
            }
        });
    },
    function (dc, result, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!dc.activeDialog.state.partySize) {
                dc.activeDialog.state.partySize = result;
            }
            // Ask for the reservation name next
            yield dc.prompt('textPrompt', "Whose name will this be under?");
        });
    },
    function (dc, result) {
        return __awaiter(this, void 0, void 0, function* () {
            dc.activeDialog.state.Name = result;
            // Save data to conversation state
            var state = conversationState.get(dc.context);
            // Copy the dialog state to the conversation state
            state = dc.activeDialog.state;
            // TODO: Add in <br/>Location: ${state.cafeLocation}
            var msg = `Reservation confirmed. Reservation details:             
            <br/>Date/Time: ${state.dateTime} 
            <br/>Party size: ${state.partySize} 
            <br/>Reservation name: ${state.Name}`;
            yield dc.context.sendActivity(msg);
            yield dc.end();
        });
    }
]);
// Helper function that saves any entities found in the LUIS result
// to the dialog state
function SaveEntities(dc, typedresult) {
    return __awaiter(this, void 0, void 0, function* () {
        // Resolve entities returned from LUIS, and save these to state
        if (typedresult.entities) {
            console.log(`typedresult.entities exists.`);
            let datetime = typedresult.entities.datetime;
            //console.log(datetime.toString());
            if (datetime) {
                // datetime[0] is the first date or time found in the utterance
                console.log(`datetime entity defined of type ${datetime[0].type}, with ${datetime[0].timex.length} values.`);
                datetime[0].timex.forEach((value, index) => {
                    console.log(`Timex[${index}]=${value}`);
                });
                // the first date or time resolution of datetime[0]
                var timexValue;
                // the array of all resolutions of datetime[0]
                var timexValues;
                if (datetime[0].timex) {
                    timexValue = datetime[0].timex[0];
                    timexValues = datetime[0].timex;
                    // More information on timex can be found here: 
                    // http://www.timeml.org/publications/timeMLdocs/timeml_1.2.1.html#timex3                                
                    // More information on the library which does the recognition can be found here: 
                    // https://github.com/Microsoft/Recognizers-Text
                    // try to see if recognizers library can parse a timex
                    /*
                    const results = Recognizers.recognizeDateTime(timexValue, dc.context.activity.locale);
                    const values =
                        results.length > 0 && results[0].resolution ? results[0].resolution.values : undefined;
                    var dtValue;
                    var dtResult;
                    if (values) {
                        dtResult = values[0]
                        dtValue = values[0].value;
                    } */
                    if (datetime[0].type === "datetime") {
                        var resolution = Resolver.evaluate(
                        // array of timex values to resolve. There may be more than one resolution, i.e. ambiguous "today at 6" can be AM or PM.
                        timexValues, 
                        /***** TODO: add more constraints **/
                        // Creator.evening constrains this to times between 4pm and 8pm
                        [Creator.evening]);
                        //[]); // no constraints
                        // TODO: what if there's still more than one resolution after constraint resolution
                        /***** TODO: toNaturalLanguage throws if resolution[0] undef */
                        if (resolution[0]) {
                            console.log(`resolution: ${resolution}, resolution.length = ${resolution.length},resolution[0].toNaturalLanguage(): ${resolution[0].toNaturalLanguage(new Date())},resolution.toString(): ${resolution.toString()}.`);
                            dc.activeDialog.state.dateTime = resolution[0].toNaturalLanguage(new Date()); //resolution.toString();
                        }
                        else {
                            // time didn't satisfy constraint.
                            dc.activeDialog.state.dateTime = null; //timexValue;
                        }
                        /*if (dtValue && dtResult.type === "datetime") {
                            dc.activeDialog.state.dateTime = dtValue;
                        } else {
                            // use original timex format if recognizers couldn't parse a datetime
                            dc.activeDialog.state.dateTime = timexValue;
                        }*/
                    }
                    else if (datetime[0].type === "datetimerange") {
                        // treat ranges as the reservation start and end?
                        // treat tomorrow morning (2018-06-07TMO) works, prints out morning
                        // (2018-06-07T09,2018-06-07T17,PT8H) doesn't resolve with no constraints - WHY?
                        var resolution = Resolver.evaluate([timexValue], // array of timex values to resolve
                        []); // no constraints
                        console.log(`resolution: ${resolution}, resolution.toString(): ${resolution.toString()}.`);
                        dc.activeDialog.state.dateTime = resolution.toString();
                    }
                    else {
                        // TODO: also handle existence of state.date and state.time
                        console.log(`Type ${datetime[0].type} is not yet supported. Provide both the date and the time.`);
                    }
                }
            }
            let partysize = typedresult.entities.partySize;
            if (partysize) {
                console.log(`partysize entity defined.${partysize}`);
                // use first partySize entity that was found in utterance
                dc.activeDialog.state.partySize = partysize[0];
            }
            let cafelocation = typedresult.entities.cafeLocation;
            if (cafelocation) {
                console.log(`location entity defined.${cafelocation}`);
                // use first cafeLocation entity that was found in utterance
                dc.activeDialog.state.cafeLocation = cafelocation[0][0];
            }
        }
    });
}
//# sourceMappingURL=luisbot.js.map