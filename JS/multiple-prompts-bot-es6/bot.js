const { DialogSet, TextPrompt, DatetimePrompt, NumberPrompt } = require('botbuilder-dialogs');

function createBotLogic(conversationState) {

    const dialogs = new DialogSet();

    dialogs.add('textPrompt', new TextPrompt());

    dialogs.add('dateTimePrompt', new DatetimePrompt(
        async (context, values) => {
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
                    console.log(`DateTime Validator: time is in the past.`)
                    throw new Error('in the past') 
                }
                //return value; would return the actual date rather than array of resolutions
                return values;
            } catch (err) {
                await context.sendActivity(`Please enter a valid time in the future like "tomorrow at 9am".`);
                return undefined;
            }
        }
    ));
    
    dialogs.add('reserveTable', [
        async function(dc, args, next){
            var typedresult = args; 
    
            // Call a helper function to save the entities in the LUIS result
            // to dialog state
            // await SaveEntities(dc, typedresult);
    
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

    // Create prompt for name with string length validation
    dialogs.add('namePrompt', new TextPrompt(async (context, value) => {
        if (value && value.length < 2) {
            await context.sendActivity('Your name should be at least 2 characters long.');
            return undefined;
        }
        return value.trim();
    }));

    // Create prompt for age with number value validation
    dialogs.add('agePrompt', new NumberPrompt(async (context, value) => {
        if (0 > value || value > 122) {
            await context.sendActivity('Your age should be between 0 and 122.');
            return undefined;
        }
        return value;
    }));

    // Add a dialog that uses both prompts to gather information from the user
    dialogs.add('gatherInfo', [
        async (dialogContext) => {
            await dialogContext.prompt('namePrompt', 'What is your name?');
        },
        async (dialogContext, value) => {
            const state = conversationState.get(dialogContext.context);
            state.name = value;
            await dialogContext.prompt('agePrompt', 'What is your age?');
        },
        async (dialogContext, value) => {
            const state = conversationState.get(dialogContext.context);
            state.age = value;
            await dialogContext.context.sendActivity(`Your name is ${state.name} and your age is ${state.age}`);
            await dialogContext.end();
        }
    ]);

    // This is the activity handler
    return async (context) => {
        const state = conversationState.get(context);
        const dc = dialogs.createContext(context, state);
        const isMessage = context.activity.type === 'message';
        if (!context.responded) {
            await dc.continue();
            if (!context.responded && isMessage) {
                //await dc.begin('gatherInfo');
                await dc.begin('reserveTable')
            }
        }
    }
}

module.exports = createBotLogic;