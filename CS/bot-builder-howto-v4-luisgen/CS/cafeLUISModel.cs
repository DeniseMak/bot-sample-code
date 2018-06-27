// <auto-generated>
// Code generated by LUISGen Assets\LU\models\LUIS\cafeLUISModel.json -cs ContosoCafeBot.cafeLUISModel -o c:\repos\build2018demo\ContosoCafeBot_LUIS
// Tool github: https://github.com/microsoft/botbuilder-tools
// Changes may cause incorrect behavior and will be lost if the code is
// regenerated.
// </auto-generated>
using Newtonsoft.Json;
using System.Collections.Generic;
namespace ContosoCafeBot
{
    public class cafeLUISModel: Microsoft.Bot.Builder.IRecognizerConvert
    {
        public string Text;
        public string AlteredText;
        public enum Intent {
            Book_Table, 
            Greeting, 
            None, 
            Who_are_you_intent
        };
        public Dictionary<Intent, Microsoft.Bot.Builder.Ai.LUIS.IntentData> Intents;

        public class _Entities
        {
            // Simple entities
            public string[] partySize;

            // Built-in entities
            public Microsoft.Bot.Builder.Ai.LUIS.DateTimeSpec[] datetime;
            public double[] number;

            // Lists
            public string[][] cafeLocation;

            // Instance
            public class _Instance
            {
                public Microsoft.Bot.Builder.Ai.LUIS.InstanceData[] partySize;
                public Microsoft.Bot.Builder.Ai.LUIS.InstanceData[] datetime;
                public Microsoft.Bot.Builder.Ai.LUIS.InstanceData[] number;
                public Microsoft.Bot.Builder.Ai.LUIS.InstanceData[] cafeLocation;
            }
            [JsonProperty("$instance")]
            public _Instance _instance;
        }
        public _Entities Entities;

        [JsonExtensionData(ReadData = true, WriteData = true)]
        public IDictionary<string, object> Properties {get; set; }

        public void Convert(dynamic result)
        {
            var app = JsonConvert.DeserializeObject<cafeLUISModel>(JsonConvert.SerializeObject(result));
            Text = app.Text;
            AlteredText = app.AlteredText;
            Intents = app.Intents;
            Entities = app.Entities;
            Properties = app.Properties;
        }

        public (Intent intent, double score) TopIntent()
        {
            Intent maxIntent = Intent.None;
            var max = 0.0;
            foreach (var entry in Intents)
            {
                if (entry.Value.Score > max)
                {
                    maxIntent = entry.Key;
                    max = entry.Value.Score;
                }
            }
            return (maxIntent, max);
        }
    }
}
