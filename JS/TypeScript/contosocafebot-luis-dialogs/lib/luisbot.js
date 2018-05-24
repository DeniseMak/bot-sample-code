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
// homeauto public app
// const appId = 'c6d161a5-e3e5-4982-8726-3ecec9b4ed8d';
// const subscriptionKey = '48dc10cd21d8425bbdf06fb41897f259';
// cafebot 
const appId = "edaadd9b-b632-4733-a25c-5b67271035dd";
const subscriptionKey = "be30825b782843dcbbe520ac5338f567";
// Default is westus
const serviceEndpoint = 'https://westus.api.cognitive.microsoft.com';
const luisRec = new botbuilder_ai_1.LuisRecognizer({
    appId: appId,
    subscriptionKey: subscriptionKey,
    serviceEndpoint: serviceEndpoint
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
                            // Resolve entities returned from LUIS, and save these to state
                            // datetime is an array of type DateTimeSpec {
                            /**
                             * Type of expression.
                             *
                             * @remarks
                             * Example types include:
                             *
                             * - **time**: simple time expression like "3pm".
                             * - **date**: simple date like "july 3rd".
                             * - **datetime**: combination of date and time like "march 23 2pm".
                             * - **timerange**: a range of time like "2pm to 4pm".
                             * - **daterange**: a range of dates like "march 23rd to 24th".
                             * - **datetimerange**: a range of dates and times like "july 3rd 2pm to 5th 4pm".
                             * - **set**: a recurrence like "every monday".
                             */
                            //type: string;
                            /** Timex expressions. */
                            //timex: string[];
                            //}
                            if (typedresult.entities) {
                                console.log(`typedresult.entities exists.`);
                                let datetime = typedresult.entities.datetime;
                                //console.log(datetime.toString());
                                if (datetime) {
                                    console.log(`datetime entity defined of type ${datetime[0].type}.`);
                                    datetime[0].timex.forEach((value, index) => {
                                        console.log(`Timex[${index}]=${value}`);
                                    });
                                    // Use the first date or time found in the utterance
                                    var dtvalue;
                                    if (datetime[0].timex) {
                                        dtvalue = datetime[0].timex[0];
                                        // More information on timex can be found here: http://www.timeml.org/publications/timeMLdocs/timeml_1.2.1.html#timex3                                
                                        // More information on the library which does the recognition can be found here: https://github.com/Microsoft/Recognizers-Text
                                    }
                                    if (datetime[0].type === "datetime") {
                                        var datefound = new Date(dtvalue);
                                        console.log(`Type: ${datetime[0].type}, Date: ${datefound.toDateString()}, Time: ${datefound.toTimeString()}, DateTime: ${datefound.toLocaleString()}`);
                                        console.log(`(locale-specific) Date: ${datefound.toLocaleDateString()}, Time: ${datefound.toLocaleTimeString()}`);
                                        state.date = datefound.toLocaleDateString();
                                        state.time = datefound.toLocaleTimeString();
                                        state.dateTime = datefound.toLocaleString();
                                    }
                                    else if (datetime[0].type === "date") {
                                        var datefound = new Date(dtvalue);
                                        console.log(`Type: ${datetime[0].type}, Date: ${datefound.toDateString()}, Time: ${datefound.toTimeString()}, DateTime: ${datefound.toLocaleString()}`);
                                        console.log(`(locale-specific) Date: ${datefound.toLocaleDateString()}, Time: ${datefound.toLocaleTimeString()}`);
                                        state.date = datefound.toLocaleDateString();
                                    }
                                    else if (datetime[0].type === "time") {
                                        var dateFound = new Date(Date.now());
                                        console.log(`Type = time, today's date=${dateFound.toDateString()}`);
                                        state.date = dateFound.toDateString();
                                        state.time = dtvalue; // formatted like T17:30
                                    }
                                    else {
                                        console.log(`Type ${datetime[0].type} is not yet supported`);
                                    }
                                }
                                let partysize = typedresult.entities.partySize;
                                if (partysize) {
                                    console.log(`partysize entity defined.${partysize}`);
                                    // use first partySize entity that was found in utterance
                                    state.partySize = partysize[0];
                                }
                                let cafelocation = typedresult.entities.cafeLocation;
                                if (cafelocation) {
                                    console.log(`location entity defined.${cafelocation}`);
                                    // use first cafeLocation entity that was found in utterance
                                    state.cafeLocation = cafelocation[0][0];
                                }
                            }
                            yield dc.begin('reserveTable');
                            break;
                        }
                        case Intents.Greeting: {
                            yield context.sendActivity("Top intent is Greeting");
                            break;
                        }
                        case Intents.Who_are_you_intent: {
                            yield context.sendActivity("Top intent is Who_are_you_intent");
                            break;
                        }
                        default: {
                            //await context.sendActivity(`${topIntent} was top intent.`);
                            yield context.sendActivity(`Hi! I'm the reservation bot. Say something like make a reservation."`);
                            yield dc.begin('echo', topIntent);
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
dialogs.add('echo', [
    function (dc, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = conversationState.get(dc.context);
            const count = state.count === undefined ? state.count = 0 : ++state.count;
            yield dc.context.sendActivity(`Intent = ${args}, ${count}: You said "${dc.context.activity.text}"`);
            var msg = `Saved reservation: 
        <br/>Location: ${state.cafeLocation}
        <br/>Date/Time: ${state.dateTime} 
        <br/>Party size: ${state.partySize} 
        <br/>Reservation name: ${state.Name}`; //undef if we didn't copy it     
            yield dc.context.sendActivity(msg);
            yield dc.end();
        });
    }
]);
dialogs.add('textPrompt', new botbuilder_dialogs_1.TextPrompt());
dialogs.add('dateTimePrompt', new botbuilder_dialogs_1.DatetimePrompt());
dialogs.add('reserveTable', [
    function (dc, args, next) {
        return __awaiter(this, void 0, void 0, function* () {
            yield dc.context.sendActivity("Welcome to the reservation service.");
            // This line causes circular JSON error: dc.activeDialog.state = conversationState.get(dc.context);
            var state = conversationState.get(dc.context);
            if (state.date && state.time) {
                if (state.dateTime) {
                    dc.activeDialog.state.dateTime = state.dateTime;
                }
                dc.activeDialog.state.time = state.time;
                dc.activeDialog.state.date = state.date;
                yield next(); //dc.continue();
            }
            else {
                yield dc.prompt('dateTimePrompt', "Please provide a reservation date and time.");
            }
        });
    },
    function (dc, result, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = conversationState.get(dc.context);
            console.log(state.dateTime);
            if (!state.dateTime) {
                dc.activeDialog.state.dateTime = result[0].value;
                // optional
                state.dateTime = result[0].value;
            }
            console.log(state.dateTime);
            // If we don't have party size, ask for it next
            if (!state.partySize) {
                yield dc.prompt('textPrompt', "How many people are in your party?");
            }
            else {
                yield next();
            }
        });
    },
    function (dc, result, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = conversationState.get(dc.context);
            if (!state.partySize) {
                dc.activeDialog.state.partySize = result;
                // optional
                state.partySize = result;
            }
            // Ask for next info
            yield dc.prompt('textPrompt', "Whose name will this be under?");
        });
    },
    function (dc, result) {
        return __awaiter(this, void 0, void 0, function* () {
            //const state = conversationState.get(dc.context);
            dc.activeDialog.state.Name = result;
            // Save data to conversation state
            var state = conversationState.get(dc.context); // conversationState.get(dc.context);
            //optional if we copy this anyway
            state.Name = dc.activeDialog.state.Name;
            // What if comment this out so we don't overwrite global state?
            // state = dc.activeDialog.state;
            // Confirm reservation
            // var msg = `Reservation confirmed. Reservation details: 
            //     <br/>Date/Time: ${dc.activeDialog.state.dateTime} 
            //     <br/>Party size: ${dc.activeDialog.state.partySize} 
            //     <br/>Reservation name: ${dc.activeDialog.state.Name}`;
            var msg = `Reservation confirmed. Reservation details: 
            <br/>Location: ${state.cafeLocation}
            <br/>Date/Time: ${state.dateTime} 
            <br/>Party size: ${state.partySize} 
            <br/>Reservation name: ${state.Name}`; //undef if we didn't copy it        
            yield dc.context.sendActivity(msg);
            yield dc.end();
        });
    }
]);
//# sourceMappingURL=luisbot.js.map