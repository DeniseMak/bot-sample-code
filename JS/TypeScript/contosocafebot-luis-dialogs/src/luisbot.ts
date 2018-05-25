import { BotFrameworkAdapter, MemoryStorage, ConversationState, TurnContext, RecognizerResult } from 'botbuilder';
import { DialogSet, TextPrompt, DatetimePrompt } from 'botbuilder-dialogs';
import { LuisRecognizer, InstanceData, IntentData, DateTimeSpec } from 'botbuilder-ai';
import { CafeLUISModel, _Intents, _Entities, _Instance } from './CafeLUISModel';
import * as restify from 'restify';
import { homedir } from 'os';
import { INSPECT_MAX_BYTES } from 'buffer';

const debug = false;

// cafebot 
const appId = "edaadd9b-b632-4733-a25c-5b67271035dd";
const subscriptionKey = "be30825b782843dcbbe520ac5338f567";

// Default is westus
const serviceEndpoint = 'https://westus.api.cognitive.microsoft.com';

const luisRec = new LuisRecognizer({
    appId: appId,
    subscriptionKey: subscriptionKey,
    serviceEndpoint: serviceEndpoint
});

// Enum for convenience
// intent names match CafeLUISModel.ts
enum Intents { 
    Book_Table = "Book_Table",
    Greeting = "Greeting",
    None = "None",
    Who_are_you_intent = "Who_are_you_intent"
};

// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

// Create adapter
const adapter = new BotFrameworkAdapter( { 
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD 
});

// Add conversation state middleware
interface CafeBotConvState {
    dialogStack: any[];
    cafeLocation: string;
    dateTime: string;
    date: string;
    time: string;
    partySize: string;     
    Name: string;  
}
const conversationState = new ConversationState<CafeBotConvState>(new MemoryStorage());
adapter.use(conversationState);

// Create empty dialog set
const dialogs = new DialogSet();

// Listen for incoming requests 
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
    adapter.processActivity(req, res, async (context) => {
        const isMessage = context.activity.type === 'message';

        // Create dialog context 
        const state = conversationState.get(context);
        const dc = dialogs.createContext(context, state);
            
        if (!isMessage) {
            await context.sendActivity(`[${context.activity.type} event detected]`);
        }

        // Check to see if anyone replied. 
        if (!context.responded) {
            await dc.continue();
            // if the dialog didn't send a response
            if (!context.responded && isMessage) {

                
                await luisRec.recognize(context).then(async (res : any) => 
                {    
                    var typedresult = res as CafeLUISModel;                
                    let topIntent = LuisRecognizer.topIntent(res);    
                    switch (topIntent)
                    {
                        case Intents.Book_Table: {
                            await context.sendActivity("Top intent is Book_Table ");                          
                            await dc.begin('reserveTable', typedresult);
                            break;
                        }
                        
                        case Intents.Greeting: {
                            await context.sendActivity("Top intent is Greeting");
                            break;
                        }
    
                        case Intents.Who_are_you_intent: {
                            await context.sendActivity("Top intent is Who_are_you_intent");
                            break;
                        }
                        default: {
                            await dc.begin('default', topIntent);
                            break;
                        }
                    }
    
                }, (err) => {
                    // there was some error
                    console.log(err);
                }
                );                                
            }
        }
    });
});


// Add dialogs
dialogs.add('default', [
    async function (dc, args) {
        const state = conversationState.get(dc.context);
        await dc.context.sendActivity(`Hi! I'm the reservation bot. Say something like make a reservation."`);

        if (debug) {
            await dc.context.sendActivity(`Intent = ${args}, you said "${dc.context.activity.text}"`);
            var msg = `This was the last reservation you made: 
            <br/>Location: ${state.cafeLocation}
            <br/>Date/Time: ${state.dateTime} 
            <br/>Party size: ${state.partySize} 
            <br/>Reservation name: ${state.Name}`;
            await dc.context.sendActivity(msg);
        }
        await dc.end();
    }
]);


dialogs.add('textPrompt', new TextPrompt());
dialogs.add('dateTimePrompt', new DatetimePrompt());
dialogs.add('reserveTable', [
    async function(dc, args, next){
        var typedresult = args as CafeLUISModel;

        // Call a helper function to save the entities in the LUIS result
        // to dialog state
        await SaveEntities(dc, typedresult);

        await dc.context.sendActivity("Welcome to the reservation service.");
        
        if (dc.activeDialog.state.dateTime) {
            await next();     
        }
        else {
            await dc.prompt('dateTimePrompt', "Please provide a reservation date and time.");
        }
    },
    async function(dc, result, next){
        if (!dc.activeDialog.state.dateTime) {
            // Save the dateTimePrompt result to dialog state
            dc.activeDialog.state.dateTime = result[0].value;
        }

        // If we don't have party size, ask for it next
        if (!dc.activeDialog.state.partySize) {
            await dc.prompt('textPrompt', "How many people are in your party?");
        } else {
            await next();
        }
    },
    async function(dc, result, next){
        if (!dc.activeDialog.state.partySize) {
            dc.activeDialog.state.partySize = result;
        }
        // Ask for the reservation name next
        await dc.prompt('textPrompt', "Whose name will this be under?");
    },
    async function(dc, result){
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
            
        await dc.context.sendActivity(msg);
        await dc.end();
    }
]);

// Helper function that saves any entities found in the LUIS result
// to the dialog state
async function SaveEntities( dc, typedresult) {
            // Resolve entities returned from LUIS, and save these to state
            if (typedresult.entities)
            {
                console.log(`typedresult.entities exists.`);
                    let datetime = typedresult.entities.datetime;
                    //console.log(datetime.toString());
                    if (datetime) {
                        console.log(`datetime entity defined of type ${datetime[0].type}.`);
                        datetime[0].timex.forEach( (value, index) => {
                            console.log(`Timex[${index}]=${value}`);
                        })
                        // Use the first date or time found in the utterance
                        var dtvalue;
                        if (datetime[0].timex) {
                            dtvalue = datetime[0].timex[0];
                            // More information on timex can be found here: 
                            // http://www.timeml.org/publications/timeMLdocs/timeml_1.2.1.html#timex3                                
                            // More information on the library which does the recognition can be found here: 
                            // https://github.com/Microsoft/Recognizers-Text                        
                        }                                                
    
                        if (datetime[0].type === "datetime" ) {
                            dc.activeDialog.state.dateTime = dtvalue;
                            if (debug) {
                                var datefound = new Date(dtvalue);
                                console.log(`Type: ${datetime[0].type}, Date: ${datefound.toDateString()}, Time: ${datefound.toTimeString()}, DateTime: ${datefound.toLocaleString()}`);
                                console.log(`(locale-specific) Date: ${datefound.toLocaleDateString()}, Time: ${datefound.toLocaleTimeString()}`);
                                dc.activeDialog.state.date = datefound.toLocaleDateString();
                                dc.activeDialog.state.time = datefound.toLocaleTimeString();
                                dc.activeDialog.state.dateTime = datefound.toLocaleString();
                            }                        
                        } 
                        else  {
                            // TODO: also handle existence of state.date and state.time
                            console.log(`Type ${datetime[0].type} is not yet supported`);
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
}