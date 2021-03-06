"use strict";
/**
 * Bot Connector - Direct Line API - v3.0
 * Direct Line 3.0  ===============      The Direct Line API is a simple REST API for connecting directly to a single bot. This API is intended for developers  writing their own client applications, web chat controls, mobile apps, or service-to-service applications that will  talk to their bot.    Within the Direct Line API, you will find:    * An **authentication mechanism** using standard secret/token patterns  * The ability to **send** messages from your client to your bot via an HTTP POST message  * The ability to **receive** messages by **WebSocket** stream, if you choose  * The ability to **receive** messages by **polling HTTP GET**, if you choose  * A stable **schema**, even if your bot changes its protocol version    Direct Line 1.1 and 3.0 are both available and supported. This document describes Direct Line 3.0. For information  on Direct Line 1.1, visit the [Direct Line 1.1 reference documentation](/en-us/restapi/directline/).    # Authentication: Secrets and Tokens    Direct Line allows you to authenticate all calls with either a secret (retrieved from the Direct Line channel  configuration page) or a token (which you may get at runtime by converting your secret).    A Direct Line **secret** is a master key that can access any conversation, and create tokens. Secrets do not expire.    A Direct Line **token** is a key for a single conversation. It expires but can be refreshed.    If you're writing a service-to-service application, using the secret may be simplest. If you're writing an application  where the client runs in a web browser or mobile app, you may want to exchange your secret for a token, which only  works for a single conversation and will expire unless refreshed. You choose which security model works best for you.    Your secret or token is communicated in the ```Authorization``` header of every call, with the Bearer scheme.  Example below.    ```  -- connect to directline.botframework.com --  POST /v3/directline/conversations/abc123/activities HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0  [other HTTP headers, omitted]  ```    You may notice that your Direct Line client credentials are different from your bot's credentials. This is  intentional, and it allows you to revise your keys independently and lets you share client tokens without  disclosing your bot's password.     ## Exchanging a secret for a token    This operation is optional. Use this step if you want to prevent clients from accessing conversations they aren't  participating in.    To exchange a secret for a token, POST to /v3/directline/tokens/generate with your secret in the auth header  and no HTTP body.    ```  -- connect to directline.botframework.com --  POST /v3/directline/tokens/generate HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0  [other headers]    -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"conversationId\": \"abc123\",    \"token\": \"RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0y8qbOF5xPGfiCpg4Fv0y8qqbOF5x8qbOF5xn\",    \"expires_in\": 1800  }  ```    If successful, the response is a token suitable for one conversation. The token expires in the seconds  indicated in the ```expires_in``` field (30 minutes in the example above) and must be refreshed before then to  remain useful.    This call is similar to ```/v3/directline/conversations```. The difference is that the call to  ```/v3/directline/tokens/generate``` does not start the conversation, does not contact the bot, and does not  create a streaming WebSocket URL.  * Call ```/v3/directline/conversations``` if you will distribute the token to client(s) and want them to     initiate the conversation.  * Call ```/v3/directline/conversations``` if you intend to start the conversation immediately.      ## Refreshing a token    A token may be refreshed an unlimited number of times unless it is expired.    To refresh a token, POST to /v3/directline/tokens/refresh. This method is valid only for unexpired tokens.    ```  -- connect to directline.botframework.com --  POST /v3/directline/tokens/refresh HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0y8qbOF5xPGfiCpg4Fv0y8qqbOF5x8qbOF5xn  [other headers]    -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"conversationId\": \"abc123\",    \"token\": \"RCurR_XV9ZA.cwA.BKA.y8qbOF5xPGfiCpg4Fv0y8qqbOF5x8qbOF5xniaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0\",    \"expires_in\": 1800  }  ```       # REST calls for a Direct Line conversation    Direct Line conversations are explicitly opened by clients and may run as long as the bot and client participate  (and have valid credentials). While the conversation is open, the bot and client may both send messages. More than  one client may connect to a given conversation and each client may participate on behalf of multiple users.    ## Starting a conversation    Clients begin by explicitly starting a conversation. If successful, the Direct Line service replies with a  JSON object containing a conversation ID, a token, and a WebSocket URL that may be used later.    ```  -- connect to directline.botframework.com --  POST /v3/directline/conversations HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0y8qbOF5xPGfiCpg4Fv0y8qqbOF5x8qbOF5xn  [other headers]    -- response from directline.botframework.com --  HTTP/1.1 201 Created  [other headers]    {    \"conversationId\": \"abc123\",    \"token\": \"RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0y8qbOF5xPGfiCpg4Fv0y8qqbOF5x8qbOF5xn\",    \"expires_in\": 1800,    \"streamUrl\": \"https://directline.botframework.com/v3/directline/conversations/abc123/stream?t=RCurR_XV9ZA.cwA...\"  }  ```    If the conversation was started, an HTTP 201 status code is returned. HTTP 201 is the code that clients  will receive under most circumstances, as the typical use case is for a client to start a new conversation.  Under certain conditions -- specifically, when the client has a token scoped to a single conversation AND  when that conversation was started with a prior call to this URL -- this method will return HTTP 200 to signify  the request was acceptable but that no conversation was created (as it already existed).    You have 60 seconds to connect to the WebSocket URL. If the connection cannot be established during this time,  use the reconnect method below to generate a new stream URL.    This call is similar to ```/v3/directline/tokens/generate```. The difference is that the call to  ```/v3/directline/conversations``` starts the conversation, contacts the bot, and creates a streaming WebSocket  URL, none of which occur when generating a token.  * Call ```/v3/directline/conversations``` if you will distribute the token to client(s) and want them to    initiate the conversation.  * Call ```/v3/directline/conversations``` if you intend to start the conversation immediately.    ## Reconnecting to a conversation    If a client is using the WebSocket interface to receive messages but loses its connection, it may need to reconnect.  Reconnecting requires generating a new WebSocket stream URL, and this can be accomplished by sending a GET request  to the ```/v3/directline/conversations/{id}``` endpoint.    The ```watermark``` parameter is optional. If supplied, the conversation replays from the watermark,  guaranteeing no messages are lost. If ```watermark``` is omitted, only messages received after the reconnection  call (```GET /v3/directline/conversations/abc123```) are replayed.    ```  -- connect to directline.botframework.com --  GET /v3/directline/conversations/abc123?watermark=0000a-42 HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0y8qbOF5xPGfiCpg4Fv0y8qqbOF5x8qbOF5xn  [other headers]    -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"conversationId\": \"abc123\",    \"token\": \"RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0y8qbOF5xPGfiCpg4Fv0y8qqbOF5x8qbOF5xn\",    \"streamUrl\": \"https://directline.botframework.com/v3/directline/conversations/abc123/stream?watermark=000a-4&t=RCurR_XV9ZA.cwA...\"  }  ```    You have 60 seconds to connect to the WebSocket stream URL. If the connection cannot be established during this  time, issue another reconnect request to get an updated stream URL.    ## Sending an Activity to the bot    Using the Direct Line 3.0 protocol, clients and bots may exchange many different Bot Framework v3 Activites,  including Message Activities, Typing Activities, and custom activities that the bot supports.    To send any one of these activities to the bot,    1. the client formulates the Activity according to the Activity schema (see below)  2. the client issues a POST message to ```/v3/directline/conversations/{id}/activities```  3. the service returns when the activity was delivered to the bot, with an HTTP status code reflecting the     bot's status code. If the POST was successful, the service returns a JSON payload containing the ID of the     Activity that was sent.    Example follows.    ```  -- connect to directline.botframework.com --  POST /v3/directline/conversations/abc123/activities HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0  [other headers]    {    \"type\": \"message\",    \"from\": {      \"id\": \"user1\"    },    \"text\": \"hello\"  }    -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"id\": \"0001\"  }  ```    The client's Activity is available in the message retrieval path (either polling GET or WebSocket) and is not  returned inline.    The total time to POST a message to a Direct Line conversation is:    * Transit time to the Direct Line service,  * Internal processing time within Direct Line (typically less than 120ms)  * Transit time to the bot  * Processing time within the bot  * Transit time for HTTP responses to travel back to the client.    If the bot generates an error, that error will trigger an HTTP 502 error (\"Bad Gateway\") in  the ```POST /v3/directline/conversations/{id}/activities``` call.    ### Sending one or more attachments by URL    Clients may optionally send attachments, such as images or documents. If the client already has a URL for the  attachment, the simplest way to send it is to include the URL in the ```contentUrl``` field of an Activity  attachment object. This applies to HTTP, HTTPS, and ```data:``` URIs.    ### Sending a single attachment by upload    Often, clients have an image or document on a device but no URL that can be included in the activity.    To upload an attachment, POST a single attachment to  the ```/v3/directline/conversations/{conversationId}/upload``` endpoint. The ```Content-Type```  and ```Content-Disposition``` headers control the attachment's type and filename, respectively.    A user ID is required. Supply the ID of the user sending the attachment as a ```userId``` parameter in the URL.    If uploading a single attachment, a message activity is sent to the bot when the upload completes.    On completion, the service returns the ID of the activity that was sent.    ```  -- connect to directline.botframework.com --  POST /v3/directline/conversations/abc123/upload?userId=user1 HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0  Content-Type: image/jpeg  Content-Disposition: name=\"file\"; filename=\"badjokeeel.jpg\"  [other headers]    [JPEG content]    -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"id\": \"0003\"  }  ```    ### Sending multiple attachments by upload    If uploading multiple attachments, use ```multipart/form-data``` as the content type and include each  attachment as a separate part. Each attachment's type and filename may be included in the ```Content-Type```  and ```Content-Disposition``` headers in each part.    An activity may be included by adding a part with content type of ```application/vnd.microsoft.activity```.  Other parts in the payload are attached to this activity before it is sent. If an Activity is not included,  an empty Activity is created as a wrapper for the attachments.    ```  -- connect to directline.botframework.com --  POST /v3/directline/conversations/abc123/upload?userId=user1 HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0  Content-Type: multipart/form-data; boundary=----DD4E5147-E865-4652-B662-F223701A8A89  [other headers]    ----DD4E5147-E865-4652-B662-F223701A8A89  Content-Type: image/jpeg  Content-Disposition: form-data; name=\"file\"; filename=\"badjokeeel.jpg\"  [other headers]    [JPEG content]    ----DD4E5147-E865-4652-B662-F223701A8A89  Content-Type: application/vnd.microsoft.activity  [other headers]    {    \"type\": \"message\",    \"from\": {      \"id\": \"user1\"    },    \"text\": \"Hey I just IM'd you\\n\\nand this is crazy\\n\\nbut here's my webhook\\n\\nso POST me maybe\"  }    ----DD4E5147-E865-4652-B662-F223701A8A89            -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"id\": \"0004\"  }  ```    ## Receiving Activities from the bot    Direct Line 3.0 clients may choose from two different mechanisms for retrieving messages:    1. A **streaming WebSocket**, which pushes messages efficiently to clients.  2. A **polling GET** interface, which is available for clients unable to use WebSockets or for clients     retrieving the conversation history.    **Not all activities are available via the polling GET interface.** A table of activity availability follows.    |Activity type|Availability|  |-------------|--------|  |Message|Polling GET and WebSocket|  |Typing|WebSocket only|  |ConversationUpdate|Not sent/received via client|  |ContactRelationUpdate|Not supported in Direct Line|  |EndOfConversation|Polling GET and WebSocket|  |All other activity types|Polling GET and WebSocket|    ### Receiving Activities by WebSocket    To connect via WebSocket, a client uses the StreamUrl when starting a conversation. The stream URL is  preauthorized and does NOT require an Authorization header containing the client's secret or token.    ```  -- connect to wss://directline.botframework.com --  GET /v3/directline/conversations/abc123/stream?t=RCurR_XV9ZA.cwA...\" HTTP/1.1  Upgrade: websocket  Connection: upgrade  [other headers]    -- response from directline.botframework.com --  HTTP/1.1 101 Switching Protocols  [other headers]  ```    The Direct Line service sends the following messages:    * An **ActivitySet**, which contains one or more activities and a watermark (described below)  * An empty message, which the Direct Line service uses to ensure the connection is still valid  * Additional types, to be defined later. These types are identified by the properties in the JSON root.    ActivitySets contain messages sent by the bot and by all users. Example ActivitySet:    ```  {    \"activities\": [{      \"type\": \"message\",      \"channelId\": \"directline\",      \"conversation\": {        \"id\": \"abc123\"      },      \"id\": \"abc123|0000\",      \"from\": {        \"id\": \"user1\"      },      \"text\": \"hello\"    }],    \"watermark\": \"0000a-42\"  }  ```    Clients should keep track of the \"watermark\" value from each ActivitySet so they can use it on reconnect.  **Note** that a ```null``` or missing watermark should be ignored and should not overwrite a prior watermark  in the client.    Clients should ignore empty messages.    Clients may send their own empty messages to verify connectivity. The Direct Line service will ignore these.    The service may forcibly close the connection under certain conditions. If the client has not received an  EndOfConversation activity, it may reconnect by issuing a GET request to the conversation endpoint to get a  new stream URL (see above).    The WebSocket stream contains live updates and very recent messages (since the call to get the WebSocket call  was issued) but it does not include messages sent prior to the most recent POST  to ```/v3/directline/conversations/{id}```. To retrieve messages sent earlier in the conversation, use the  GET mechanism below.    ### Receiving Activities by GET    The GET mechanism is useful for clients who are unable to use the WebSocket, or for clients wishing to retrieve  the conversation history.    To retrieve messages, issue a GET call to the conversation endpoint. Optionally supply a watermark, indicating  the most recent message seen. The watermark field accompanies all GET/WebSocket messages as a property in the  ActivitySet.    ```  -- connect to directline.botframework.com --  GET /v3/directline/conversations/abc123/activities?watermark=0001a-94 HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0  [other headers]    -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"activities\": [{      \"type\": \"message\",      \"channelId\": \"directline\",      \"conversation\": {        \"id\": \"abc123\"      },      \"id\": \"abc123|0000\",      \"from\": {        \"id\": \"user1\"      },      \"text\": \"hello\"    }, {      \"type\": \"message\",      \"channelId\": \"directline\",      \"conversation\": {        \"id\": \"abc123\"      },      \"id\": \"abc123|0001\",      \"from\": {        \"id\": \"bot1\"      },      \"text\": \"Nice to see you, user1!\"    }],    \"watermark\": \"0001a-95\"  }  ```    Clients should page through the available activities by advancing the ```watermark``` value until no activities  are returned.      ### Timing considerations     Most clients wish to retain a complete message history. Even though Direct Line is a multi-part protocol with  potential timing gaps, the protocol and service is designed to make it easy to build a reliable client.    1. The ```watermark``` field sent in the WebSocket stream and GET response is reliable. You will not miss     messages as long as you replay the watermark verbatim.  2. When starting a conversation and connecting to the WebSocket stream, any Activities sent after the POST but     before the socket is opened are replayed before new messages.  3. When refreshing history by GET call while connected to the WebSocket, Activities may be duplicated across both     channels. Keeping a list of all known Activity IDs will allow you to reject duplicate messages should they occur.    Clients using the polling GET interface should choose a polling interval that matches their intended use.    * Service-to-service applications often use a polling interval of 5s or 10s.  * Client-facing applications often use a polling interval of 1s, and fire an additional request ~300ms after    every message the client sends to rapidly pick up a bot's response. This 300ms delay should be adjusted    based on the bot's speed and transit time.    ## Ending a conversation    Either a client or a bot may signal the end of a DirectLine conversation. This operation halts communication  and prevents the bot and the client from sending messages. Messages may still be retrieved via the GET mechanism.  Sending this messages is as simple as POSTing an EndOfConversation activity.    ```  -- connect to directline.botframework.com --  POST /v3/directline/conversations/abc123/activities HTTP/1.1  Authorization: Bearer RCurR_XV9ZA.cwA.BKA.iaJrC8xpy8qbOF5xnR2vtCX7CZj0LdjAPGfiCpg4Fv0  [other headers]    {    \"type\": \"endOfConversation\",    \"from\": {      \"id\": \"user1\"    }  }    -- response from directline.botframework.com --  HTTP/1.1 200 OK  [other headers]    {    \"id\": \"0004\"  }  ```    ## REST API errors    HTTP calls to the Direct Line service follow standard HTTP error conventions:    * 2xx status codes indicate success. (Direct Line 3.0 uses 200 and 201.)  * 4xx status codes indicate an error in your request.    * 401 indicates a missing or malformed Authorization header (or URL token, in calls where a token parameter      is allowed).    * 403 indicates an unauthorized client.      * If calling with a valid but expired token, the ```code``` field is set to ```TokenExpired```.    * 404 indicates a missing path, site, conversation, etc.  * 5xx status codes indicate a service-side error.    * 500 indicates an error inside the Direct Line service.    * 502 indicates an error was returned by the bot. **This is a common error code.**  * 101 is used in the WebSocket connection path, although this is likely handled by your WebSocket client.    When an error message is returned, error detail may be present in a JSON response. Look for an ```error```  property with ```code``` and ```message``` fields.    ```  -- connect to directline.botframework.com --  POST /v3/directline/conversations/abc123/activities HTTP/1.1  [detail omitted]    -- response from directline.botframework.com --  HTTP/1.1 502 Bad Gateway  [other headers]    {    \"error\": {      \"code\": \"BotRejectedActivity\",      \"message\": \"Failed to send activity: bot returned an error\"    }  }  ```    The contents of the ```message``` field may change. The HTTP status code and values in the ```code```  property are stable.    # Schema    The Direct Line 3.0 schema is identical to the Bot Framework v3 schema.    When a bot sends an Activity to a client through Direct Line:    * attachment cards are preserved,  * URLs for uploaded attachments are hidden with a private link, and  * the ```channelData``` property is preserved without modification.    When a client sends an Activity to a bot through Direct Line:    * the ```type``` property contains the kind of activity you are sending (typically ```message```),  * the ```from``` property must be populated with a user ID, chosen by your client,  * attachments may contain URLs to existing resources or URLs uploaded through the Direct Line attachment    endpoint, and  * the ```channelData``` property is preserved without modification.    Clients and bots may send Activities of any type, including Message Activities, Typing Activities, and  custom Activity types.    Clients may send a single Activity at a time.    ```  {    \"type\": \"message\",    \"channelId\": \"directline\",    \"from\": {      \"id\": \"user1\"    },    \"text\": \"hello\"  }  ```    Clients receive multiple Activities as part of an ActivitySet. The ActivitySet has an array of activities  and a watermark field.    ```  {    \"activities\": [{      \"type\": \"message\",      \"channelId\": \"directline\",      \"conversation\": {        \"id\": \"abc123\"      },      \"id\": \"abc123|0000\",      \"from\": {        \"id\": \"user1\"      },      \"text\": \"hello\"    }],    \"watermark\": \"0000a-42\"  }  ```    # Libraries for the Direct Line API    The Direct Line API is designed to be coded directly, but the Bot Framework includes libraries and controls that  help you to embed Direct-Line-powered bots into your application.    * The [Bot Framework Web Chat control](https://github.com/Microsoft/BotFramework-WebChat) is an easy way to embed    the Direct Line protocol into a webpage.  * [Direct Line Nuget package](https://www.nuget.org/packages/Microsoft.Bot.Connector.DirectLine) with libraries for    .Net 4.5, UWP, and .Net Standard.  * [DirectLineJs](https://github.com/Microsoft/BotFramework-DirectLineJs), also available on    [NPM](https://www.npmjs.com/package/botframework-directlinejs)  * You may generate your own from the [Direct Line Swagger file](swagger.json)    Our [BotBuilder-Samples GitHub repo](https://github.com/Microsoft/BotBuilder-Samples) also contains samples for    [C#](https://github.com/Microsoft/BotBuilder-Samples/tree/master/CSharp/core-DirectLine) and    [JavaScript](https://github.com/Microsoft/BotBuilder-Samples/tree/master/Node/core-DirectLine).
 *
 * OpenAPI spec version: v3
 * Contact: botframework@microsoft.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const localVarRequest = require("request");
const Promise = require("bluebird");
let defaultBasePath = 'https://directline.botframework.com';
// ===============================================
// This file is autogenerated - Please do not edit
// ===============================================
/* tslint:disable:no-unused-variable */
let primitives = [
    "string",
    "boolean",
    "double",
    "integer",
    "long",
    "float",
    "number",
    "any"
];
class ObjectSerializer {
    static findCorrectType(data, expectedType) {
        if (data == undefined) {
            return expectedType;
        }
        else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        }
        else if (expectedType === "Date") {
            return expectedType;
        }
        else {
            if (enumsMap[expectedType]) {
                return expectedType;
            }
            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }
            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            }
            else {
                if (data[discriminatorProperty]) {
                    return data[discriminatorProperty]; // use the type given in the discriminator
                }
                else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }
    static serialize(data, type) {
        if (data == undefined) {
            return data;
        }
        else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        }
        else if (type.lastIndexOf("Array<", 0) === 0) {
            let subType = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData = [];
            for (let index in data) {
                let date = data[index];
                transformedData.push(ObjectSerializer.serialize(date, subType));
            }
            return transformedData;
        }
        else if (type === "Date") {
            return data.toString();
        }
        else {
            if (enumsMap[type]) {
                return data;
            }
            if (!typeMap[type]) {
                return data;
            }
            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance = {};
            for (let index in attributeTypes) {
                let attributeType = attributeTypes[index];
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type);
            }
            return instance;
        }
    }
    static deserialize(data, type) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        }
        else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        }
        else if (type.lastIndexOf("Array<", 0) === 0) {
            let subType = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData = [];
            for (let index in data) {
                let date = data[index];
                transformedData.push(ObjectSerializer.deserialize(date, subType));
            }
            return transformedData;
        }
        else if (type === "Date") {
            return new Date(data);
        }
        else {
            if (enumsMap[type]) {
                return data;
            }
            if (!typeMap[type]) {
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let index in attributeTypes) {
                let attributeType = attributeTypes[index];
                instance[attributeType.name] = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type);
            }
            return instance;
        }
    }
}
/**
* An Activity is the basic communication type for the Bot Framework 3.0 protocol
*/
class Activity {
    static getAttributeTypeMap() {
        return Activity.attributeTypeMap;
    }
}
Activity.discriminator = undefined;
Activity.attributeTypeMap = [
    {
        "name": "type",
        "baseName": "type",
        "type": "string"
    },
    {
        "name": "id",
        "baseName": "id",
        "type": "string"
    },
    {
        "name": "timestamp",
        "baseName": "timestamp",
        "type": "Date"
    },
    {
        "name": "localTimestamp",
        "baseName": "localTimestamp",
        "type": "Date"
    },
    {
        "name": "serviceUrl",
        "baseName": "serviceUrl",
        "type": "string"
    },
    {
        "name": "channelId",
        "baseName": "channelId",
        "type": "string"
    },
    {
        "name": "from",
        "baseName": "from",
        "type": "ChannelAccount"
    },
    {
        "name": "conversation",
        "baseName": "conversation",
        "type": "ConversationAccount"
    },
    {
        "name": "recipient",
        "baseName": "recipient",
        "type": "ChannelAccount"
    },
    {
        "name": "textFormat",
        "baseName": "textFormat",
        "type": "string"
    },
    {
        "name": "attachmentLayout",
        "baseName": "attachmentLayout",
        "type": "string"
    },
    {
        "name": "membersAdded",
        "baseName": "membersAdded",
        "type": "Array<ChannelAccount>"
    },
    {
        "name": "membersRemoved",
        "baseName": "membersRemoved",
        "type": "Array<ChannelAccount>"
    },
    {
        "name": "topicName",
        "baseName": "topicName",
        "type": "string"
    },
    {
        "name": "historyDisclosed",
        "baseName": "historyDisclosed",
        "type": "boolean"
    },
    {
        "name": "locale",
        "baseName": "locale",
        "type": "string"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "speak",
        "baseName": "speak",
        "type": "string"
    },
    {
        "name": "inputHint",
        "baseName": "inputHint",
        "type": "string"
    },
    {
        "name": "summary",
        "baseName": "summary",
        "type": "string"
    },
    {
        "name": "suggestedActions",
        "baseName": "suggestedActions",
        "type": "SuggestedActions"
    },
    {
        "name": "attachments",
        "baseName": "attachments",
        "type": "Array<Attachment>"
    },
    {
        "name": "entities",
        "baseName": "entities",
        "type": "Array<Entity>"
    },
    {
        "name": "channelData",
        "baseName": "channelData",
        "type": "ModelObject"
    },
    {
        "name": "action",
        "baseName": "action",
        "type": "string"
    },
    {
        "name": "replyToId",
        "baseName": "replyToId",
        "type": "string"
    },
    {
        "name": "value",
        "baseName": "value",
        "type": "ModelObject"
    },
    {
        "name": "name",
        "baseName": "name",
        "type": "string"
    },
    {
        "name": "relatesTo",
        "baseName": "relatesTo",
        "type": "ConversationReference"
    },
    {
        "name": "code",
        "baseName": "code",
        "type": "string"
    }
];
exports.Activity = Activity;
/**
* A collection of activities
*/
class ActivitySet {
    static getAttributeTypeMap() {
        return ActivitySet.attributeTypeMap;
    }
}
ActivitySet.discriminator = undefined;
ActivitySet.attributeTypeMap = [
    {
        "name": "activities",
        "baseName": "activities",
        "type": "Array<Activity>"
    },
    {
        "name": "watermark",
        "baseName": "watermark",
        "type": "string"
    }
];
exports.ActivitySet = ActivitySet;
/**
* An animation card (Ex: gif or short video clip)
*/
class AnimationCard {
    static getAttributeTypeMap() {
        return AnimationCard.attributeTypeMap;
    }
}
AnimationCard.discriminator = undefined;
AnimationCard.attributeTypeMap = [
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "subtitle",
        "baseName": "subtitle",
        "type": "string"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "image",
        "baseName": "image",
        "type": "ThumbnailUrl"
    },
    {
        "name": "media",
        "baseName": "media",
        "type": "Array<MediaUrl>"
    },
    {
        "name": "buttons",
        "baseName": "buttons",
        "type": "Array<CardAction>"
    },
    {
        "name": "shareable",
        "baseName": "shareable",
        "type": "boolean"
    },
    {
        "name": "autoloop",
        "baseName": "autoloop",
        "type": "boolean"
    },
    {
        "name": "autostart",
        "baseName": "autostart",
        "type": "boolean"
    }
];
exports.AnimationCard = AnimationCard;
/**
* An attachment within an activity
*/
class Attachment {
    static getAttributeTypeMap() {
        return Attachment.attributeTypeMap;
    }
}
Attachment.discriminator = undefined;
Attachment.attributeTypeMap = [
    {
        "name": "contentType",
        "baseName": "contentType",
        "type": "string"
    },
    {
        "name": "contentUrl",
        "baseName": "contentUrl",
        "type": "string"
    },
    {
        "name": "content",
        "baseName": "content",
        "type": "ModelObject"
    },
    {
        "name": "name",
        "baseName": "name",
        "type": "string"
    },
    {
        "name": "thumbnailUrl",
        "baseName": "thumbnailUrl",
        "type": "string"
    }
];
exports.Attachment = Attachment;
/**
* A audio card
*/
class AudioCard {
    static getAttributeTypeMap() {
        return AudioCard.attributeTypeMap;
    }
}
AudioCard.discriminator = undefined;
AudioCard.attributeTypeMap = [
    {
        "name": "aspect",
        "baseName": "aspect",
        "type": "string"
    },
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "subtitle",
        "baseName": "subtitle",
        "type": "string"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "image",
        "baseName": "image",
        "type": "ThumbnailUrl"
    },
    {
        "name": "media",
        "baseName": "media",
        "type": "Array<MediaUrl>"
    },
    {
        "name": "buttons",
        "baseName": "buttons",
        "type": "Array<CardAction>"
    },
    {
        "name": "shareable",
        "baseName": "shareable",
        "type": "boolean"
    },
    {
        "name": "autoloop",
        "baseName": "autoloop",
        "type": "boolean"
    },
    {
        "name": "autostart",
        "baseName": "autostart",
        "type": "boolean"
    }
];
exports.AudioCard = AudioCard;
/**
* An action on a card
*/
class CardAction {
    static getAttributeTypeMap() {
        return CardAction.attributeTypeMap;
    }
}
CardAction.discriminator = undefined;
CardAction.attributeTypeMap = [
    {
        "name": "type",
        "baseName": "type",
        "type": "string"
    },
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "image",
        "baseName": "image",
        "type": "string"
    },
    {
        "name": "value",
        "baseName": "value",
        "type": "ModelObject"
    }
];
exports.CardAction = CardAction;
/**
* An image on a card
*/
class CardImage {
    static getAttributeTypeMap() {
        return CardImage.attributeTypeMap;
    }
}
CardImage.discriminator = undefined;
CardImage.attributeTypeMap = [
    {
        "name": "url",
        "baseName": "url",
        "type": "string"
    },
    {
        "name": "alt",
        "baseName": "alt",
        "type": "string"
    },
    {
        "name": "tap",
        "baseName": "tap",
        "type": "CardAction"
    }
];
exports.CardImage = CardImage;
/**
* Channel account information needed to route a message
*/
class ChannelAccount {
    static getAttributeTypeMap() {
        return ChannelAccount.attributeTypeMap;
    }
}
ChannelAccount.discriminator = undefined;
ChannelAccount.attributeTypeMap = [
    {
        "name": "id",
        "baseName": "id",
        "type": "string"
    },
    {
        "name": "name",
        "baseName": "name",
        "type": "string"
    }
];
exports.ChannelAccount = ChannelAccount;
/**
* An object representing a conversation or a conversation token
*/
class Conversation {
    static getAttributeTypeMap() {
        return Conversation.attributeTypeMap;
    }
}
Conversation.discriminator = undefined;
Conversation.attributeTypeMap = [
    {
        "name": "conversationId",
        "baseName": "conversationId",
        "type": "string"
    },
    {
        "name": "token",
        "baseName": "token",
        "type": "string"
    },
    {
        "name": "expiresIn",
        "baseName": "expires_in",
        "type": "number"
    },
    {
        "name": "streamUrl",
        "baseName": "streamUrl",
        "type": "string"
    },
    {
        "name": "referenceGrammarId",
        "baseName": "referenceGrammarId",
        "type": "string"
    },
    {
        "name": "eTag",
        "baseName": "eTag",
        "type": "string"
    }
];
exports.Conversation = Conversation;
/**
* Channel account information for a conversation
*/
class ConversationAccount {
    static getAttributeTypeMap() {
        return ConversationAccount.attributeTypeMap;
    }
}
ConversationAccount.discriminator = undefined;
ConversationAccount.attributeTypeMap = [
    {
        "name": "isGroup",
        "baseName": "isGroup",
        "type": "boolean"
    },
    {
        "name": "id",
        "baseName": "id",
        "type": "string"
    },
    {
        "name": "name",
        "baseName": "name",
        "type": "string"
    }
];
exports.ConversationAccount = ConversationAccount;
/**
* An object relating to a particular point in a conversation
*/
class ConversationReference {
    static getAttributeTypeMap() {
        return ConversationReference.attributeTypeMap;
    }
}
ConversationReference.discriminator = undefined;
ConversationReference.attributeTypeMap = [
    {
        "name": "activityId",
        "baseName": "activityId",
        "type": "string"
    },
    {
        "name": "user",
        "baseName": "user",
        "type": "ChannelAccount"
    },
    {
        "name": "bot",
        "baseName": "bot",
        "type": "ChannelAccount"
    },
    {
        "name": "conversation",
        "baseName": "conversation",
        "type": "ConversationAccount"
    },
    {
        "name": "channelId",
        "baseName": "channelId",
        "type": "string"
    },
    {
        "name": "serviceUrl",
        "baseName": "serviceUrl",
        "type": "string"
    }
];
exports.ConversationReference = ConversationReference;
/**
* Object of schema.org types
*/
class Entity {
    static getAttributeTypeMap() {
        return Entity.attributeTypeMap;
    }
}
Entity.discriminator = undefined;
Entity.attributeTypeMap = [
    {
        "name": "type",
        "baseName": "type",
        "type": "string"
    }
];
exports.Entity = Entity;
/**
* An HTTP API response
*/
class ErrorResponse {
    static getAttributeTypeMap() {
        return ErrorResponse.attributeTypeMap;
    }
}
ErrorResponse.discriminator = undefined;
ErrorResponse.attributeTypeMap = [
    {
        "name": "error",
        "baseName": "error",
        "type": "Error"
    }
];
exports.ErrorResponse = ErrorResponse;
/**
* Set of key-value pairs. Advantage of this section is that key and value properties will be               rendered with default style information with some delimiter between them. So there is no need for developer to specify style information.
*/
class Fact {
    static getAttributeTypeMap() {
        return Fact.attributeTypeMap;
    }
}
Fact.discriminator = undefined;
Fact.attributeTypeMap = [
    {
        "name": "key",
        "baseName": "key",
        "type": "string"
    },
    {
        "name": "value",
        "baseName": "value",
        "type": "string"
    }
];
exports.Fact = Fact;
/**
* GeoCoordinates (entity type: \"https://schema.org/GeoCoordinates\")
*/
class GeoCoordinates {
    static getAttributeTypeMap() {
        return GeoCoordinates.attributeTypeMap;
    }
}
GeoCoordinates.discriminator = undefined;
GeoCoordinates.attributeTypeMap = [
    {
        "name": "elevation",
        "baseName": "elevation",
        "type": "number"
    },
    {
        "name": "latitude",
        "baseName": "latitude",
        "type": "number"
    },
    {
        "name": "longitude",
        "baseName": "longitude",
        "type": "number"
    },
    {
        "name": "type",
        "baseName": "type",
        "type": "string"
    },
    {
        "name": "name",
        "baseName": "name",
        "type": "string"
    }
];
exports.GeoCoordinates = GeoCoordinates;
/**
* A Hero card (card with a single, large image)
*/
class HeroCard {
    static getAttributeTypeMap() {
        return HeroCard.attributeTypeMap;
    }
}
HeroCard.discriminator = undefined;
HeroCard.attributeTypeMap = [
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "subtitle",
        "baseName": "subtitle",
        "type": "string"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "images",
        "baseName": "images",
        "type": "Array<CardImage>"
    },
    {
        "name": "buttons",
        "baseName": "buttons",
        "type": "Array<CardAction>"
    },
    {
        "name": "tap",
        "baseName": "tap",
        "type": "CardAction"
    }
];
exports.HeroCard = HeroCard;
/**
* MediaUrl data
*/
class MediaUrl {
    static getAttributeTypeMap() {
        return MediaUrl.attributeTypeMap;
    }
}
MediaUrl.discriminator = undefined;
MediaUrl.attributeTypeMap = [
    {
        "name": "url",
        "baseName": "url",
        "type": "string"
    },
    {
        "name": "profile",
        "baseName": "profile",
        "type": "string"
    }
];
exports.MediaUrl = MediaUrl;
/**
* Mention information (entity type: \"mention\")
*/
class Mention {
    static getAttributeTypeMap() {
        return Mention.attributeTypeMap;
    }
}
Mention.discriminator = undefined;
Mention.attributeTypeMap = [
    {
        "name": "mentioned",
        "baseName": "mentioned",
        "type": "ChannelAccount"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "type",
        "baseName": "type",
        "type": "string"
    }
];
exports.Mention = Mention;
/**
* Object representing error information
*/
class ModelError {
    static getAttributeTypeMap() {
        return ModelError.attributeTypeMap;
    }
}
ModelError.discriminator = undefined;
ModelError.attributeTypeMap = [
    {
        "name": "code",
        "baseName": "code",
        "type": "string"
    },
    {
        "name": "message",
        "baseName": "message",
        "type": "string"
    }
];
exports.ModelError = ModelError;
class ModelObject {
    static getAttributeTypeMap() {
        return ModelObject.attributeTypeMap;
    }
}
ModelObject.discriminator = undefined;
ModelObject.attributeTypeMap = [];
exports.ModelObject = ModelObject;
/**
* Place (entity type: \"https://schema.org/Place\")
*/
class Place {
    static getAttributeTypeMap() {
        return Place.attributeTypeMap;
    }
}
Place.discriminator = undefined;
Place.attributeTypeMap = [
    {
        "name": "address",
        "baseName": "address",
        "type": "ModelObject"
    },
    {
        "name": "geo",
        "baseName": "geo",
        "type": "ModelObject"
    },
    {
        "name": "hasMap",
        "baseName": "hasMap",
        "type": "ModelObject"
    },
    {
        "name": "type",
        "baseName": "type",
        "type": "string"
    },
    {
        "name": "name",
        "baseName": "name",
        "type": "string"
    }
];
exports.Place = Place;
/**
* A receipt card
*/
class ReceiptCard {
    static getAttributeTypeMap() {
        return ReceiptCard.attributeTypeMap;
    }
}
ReceiptCard.discriminator = undefined;
ReceiptCard.attributeTypeMap = [
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "items",
        "baseName": "items",
        "type": "Array<ReceiptItem>"
    },
    {
        "name": "facts",
        "baseName": "facts",
        "type": "Array<Fact>"
    },
    {
        "name": "tap",
        "baseName": "tap",
        "type": "CardAction"
    },
    {
        "name": "total",
        "baseName": "total",
        "type": "string"
    },
    {
        "name": "tax",
        "baseName": "tax",
        "type": "string"
    },
    {
        "name": "vat",
        "baseName": "vat",
        "type": "string"
    },
    {
        "name": "buttons",
        "baseName": "buttons",
        "type": "Array<CardAction>"
    }
];
exports.ReceiptCard = ReceiptCard;
/**
* An item on a receipt card
*/
class ReceiptItem {
    static getAttributeTypeMap() {
        return ReceiptItem.attributeTypeMap;
    }
}
ReceiptItem.discriminator = undefined;
ReceiptItem.attributeTypeMap = [
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "subtitle",
        "baseName": "subtitle",
        "type": "string"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "image",
        "baseName": "image",
        "type": "CardImage"
    },
    {
        "name": "price",
        "baseName": "price",
        "type": "string"
    },
    {
        "name": "quantity",
        "baseName": "quantity",
        "type": "string"
    },
    {
        "name": "tap",
        "baseName": "tap",
        "type": "CardAction"
    }
];
exports.ReceiptItem = ReceiptItem;
/**
* A response containing a resource ID
*/
class ResourceResponse {
    static getAttributeTypeMap() {
        return ResourceResponse.attributeTypeMap;
    }
}
ResourceResponse.discriminator = undefined;
ResourceResponse.attributeTypeMap = [
    {
        "name": "id",
        "baseName": "id",
        "type": "string"
    }
];
exports.ResourceResponse = ResourceResponse;
/**
* A card representing a request to sign in
*/
class SigninCard {
    static getAttributeTypeMap() {
        return SigninCard.attributeTypeMap;
    }
}
SigninCard.discriminator = undefined;
SigninCard.attributeTypeMap = [
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "buttons",
        "baseName": "buttons",
        "type": "Array<CardAction>"
    }
];
exports.SigninCard = SigninCard;
/**
* SuggestedActions that can be performed
*/
class SuggestedActions {
    static getAttributeTypeMap() {
        return SuggestedActions.attributeTypeMap;
    }
}
SuggestedActions.discriminator = undefined;
SuggestedActions.attributeTypeMap = [
    {
        "name": "to",
        "baseName": "to",
        "type": "Array<string>"
    },
    {
        "name": "actions",
        "baseName": "actions",
        "type": "Array<CardAction>"
    }
];
exports.SuggestedActions = SuggestedActions;
/**
* Thing (entity type: \"https://schema.org/Thing\")
*/
class Thing {
    static getAttributeTypeMap() {
        return Thing.attributeTypeMap;
    }
}
Thing.discriminator = undefined;
Thing.attributeTypeMap = [
    {
        "name": "type",
        "baseName": "type",
        "type": "string"
    },
    {
        "name": "name",
        "baseName": "name",
        "type": "string"
    }
];
exports.Thing = Thing;
/**
* A thumbnail card (card with a single, small thumbnail image)
*/
class ThumbnailCard {
    static getAttributeTypeMap() {
        return ThumbnailCard.attributeTypeMap;
    }
}
ThumbnailCard.discriminator = undefined;
ThumbnailCard.attributeTypeMap = [
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "subtitle",
        "baseName": "subtitle",
        "type": "string"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "images",
        "baseName": "images",
        "type": "Array<CardImage>"
    },
    {
        "name": "buttons",
        "baseName": "buttons",
        "type": "Array<CardAction>"
    },
    {
        "name": "tap",
        "baseName": "tap",
        "type": "CardAction"
    }
];
exports.ThumbnailCard = ThumbnailCard;
/**
* Object describing a media thumbnail
*/
class ThumbnailUrl {
    static getAttributeTypeMap() {
        return ThumbnailUrl.attributeTypeMap;
    }
}
ThumbnailUrl.discriminator = undefined;
ThumbnailUrl.attributeTypeMap = [
    {
        "name": "url",
        "baseName": "url",
        "type": "string"
    },
    {
        "name": "alt",
        "baseName": "alt",
        "type": "string"
    }
];
exports.ThumbnailUrl = ThumbnailUrl;
/**
* Parameters for creating a token
*/
class TokenParameters {
    static getAttributeTypeMap() {
        return TokenParameters.attributeTypeMap;
    }
}
TokenParameters.discriminator = undefined;
TokenParameters.attributeTypeMap = [
    {
        "name": "user",
        "baseName": "user",
        "type": "ChannelAccount"
    },
    {
        "name": "eTag",
        "baseName": "eTag",
        "type": "string"
    }
];
exports.TokenParameters = TokenParameters;
/**
* A video card
*/
class VideoCard {
    static getAttributeTypeMap() {
        return VideoCard.attributeTypeMap;
    }
}
VideoCard.discriminator = undefined;
VideoCard.attributeTypeMap = [
    {
        "name": "aspect",
        "baseName": "aspect",
        "type": "string"
    },
    {
        "name": "title",
        "baseName": "title",
        "type": "string"
    },
    {
        "name": "subtitle",
        "baseName": "subtitle",
        "type": "string"
    },
    {
        "name": "text",
        "baseName": "text",
        "type": "string"
    },
    {
        "name": "image",
        "baseName": "image",
        "type": "ThumbnailUrl"
    },
    {
        "name": "media",
        "baseName": "media",
        "type": "Array<MediaUrl>"
    },
    {
        "name": "buttons",
        "baseName": "buttons",
        "type": "Array<CardAction>"
    },
    {
        "name": "shareable",
        "baseName": "shareable",
        "type": "boolean"
    },
    {
        "name": "autoloop",
        "baseName": "autoloop",
        "type": "boolean"
    },
    {
        "name": "autostart",
        "baseName": "autostart",
        "type": "boolean"
    }
];
exports.VideoCard = VideoCard;
let enumsMap = {};
let typeMap = {
    "Activity": Activity,
    "ActivitySet": ActivitySet,
    "AnimationCard": AnimationCard,
    "Attachment": Attachment,
    "AudioCard": AudioCard,
    "CardAction": CardAction,
    "CardImage": CardImage,
    "ChannelAccount": ChannelAccount,
    "Conversation": Conversation,
    "ConversationAccount": ConversationAccount,
    "ConversationReference": ConversationReference,
    "Entity": Entity,
    "ErrorResponse": ErrorResponse,
    "Fact": Fact,
    "GeoCoordinates": GeoCoordinates,
    "HeroCard": HeroCard,
    "MediaUrl": MediaUrl,
    "Mention": Mention,
    "ModelError": ModelError,
    "ModelObject": ModelObject,
    "Place": Place,
    "ReceiptCard": ReceiptCard,
    "ReceiptItem": ReceiptItem,
    "ResourceResponse": ResourceResponse,
    "SigninCard": SigninCard,
    "SuggestedActions": SuggestedActions,
    "Thing": Thing,
    "ThumbnailCard": ThumbnailCard,
    "ThumbnailUrl": ThumbnailUrl,
    "TokenParameters": TokenParameters,
    "VideoCard": VideoCard,
};
class HttpBasicAuth {
    applyToRequest(requestOptions) {
        requestOptions.auth = {
            username: this.username, password: this.password
        };
    }
}
exports.HttpBasicAuth = HttpBasicAuth;
class ApiKeyAuth {
    constructor(location, paramName) {
        this.location = location;
        this.paramName = paramName;
    }
    applyToRequest(requestOptions) {
        if (this.location == "query") {
            requestOptions.qs[this.paramName] = this.apiKey;
        }
        else if (this.location == "header" && requestOptions && requestOptions.headers) {
            requestOptions.headers[this.paramName] = this.apiKey;
        }
    }
}
exports.ApiKeyAuth = ApiKeyAuth;
class OAuth {
    applyToRequest(requestOptions) {
        if (requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }
    }
}
exports.OAuth = OAuth;
class VoidAuth {
    applyToRequest(_) {
        // Do nothing
    }
}
exports.VoidAuth = VoidAuth;
var ConversationsApiApiKeys;
(function (ConversationsApiApiKeys) {
})(ConversationsApiApiKeys = exports.ConversationsApiApiKeys || (exports.ConversationsApiApiKeys = {}));
class ConversationsApi {
    constructor(basePathOrUsername, password, basePath) {
        this._basePath = defaultBasePath;
        this.defaultHeaders = {};
        this._useQuerystring = false;
        this.authentications = {
            'default': new VoidAuth(),
        };
        if (password) {
            if (basePath) {
                this.basePath = basePath;
            }
        }
        else {
            if (basePathOrUsername) {
                this.basePath = basePathOrUsername;
            }
        }
    }
    set useQuerystring(value) {
        this._useQuerystring = value;
    }
    set basePath(basePath) {
        this._basePath = basePath;
    }
    get basePath() {
        return this._basePath;
    }
    setDefaultAuthentication(auth) {
        this.authentications.default = auth;
    }
    setApiKey(key, value) {
        this.authentications[ConversationsApiApiKeys[key]].apiKey = value;
    }
    /**
     *
     * @summary Get activities in this conversation. This method is paged with the 'watermark' parameter.
     * @param conversationId Conversation ID
     * @param watermark (Optional) only returns activities newer than this watermark
     */
    conversationsGetActivities(conversationId, watermark) {
        const localVarPath = this.basePath + '/v3/directline/conversations/{conversationId}/activities'
            .replace('{' + 'conversationId' + '}', encodeURIComponent(String(conversationId)));
        let localVarQueryParameters = {};
        let localVarHeaderParams = Object.assign({}, this.defaultHeaders);
        let localVarFormParams = {};
        // verify required parameter 'conversationId' is not null or undefined
        if (conversationId === null || conversationId === undefined) {
            throw new Error('Required parameter conversationId was null or undefined when calling conversationsGetActivities.');
        }
        if (watermark !== undefined) {
            localVarQueryParameters['watermark'] = ObjectSerializer.serialize(watermark, "string");
        }
        let localVarUseFormData = false;
        let localVarRequestOptions = {
            method: 'GET',
            qs: localVarQueryParameters,
            headers: localVarHeaderParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
        };
        this.authentications.default.applyToRequest(localVarRequestOptions);
        if (Object.keys(localVarFormParams).length) {
            if (localVarUseFormData) {
                localVarRequestOptions.formData = localVarFormParams;
            }
            else {
                localVarRequestOptions.form = localVarFormParams;
            }
        }
        return new Promise((resolve, reject) => {
            localVarRequest(localVarRequestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    body = ObjectSerializer.deserialize(body, "ActivitySet");
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response: response, body: body });
                    }
                    else {
                        reject({ response: response, body: body });
                    }
                }
            });
        });
    }
    /**
     *
     * @summary Send an activity
     * @param conversationId Conversation ID
     * @param activity Activity to send
     */
    conversationsPostActivity(conversationId, activity) {
        const localVarPath = this.basePath + '/v3/directline/conversations/{conversationId}/activities'
            .replace('{' + 'conversationId' + '}', encodeURIComponent(String(conversationId)));
        let localVarQueryParameters = {};
        let localVarHeaderParams = Object.assign({}, this.defaultHeaders);
        let localVarFormParams = {};
        // verify required parameter 'conversationId' is not null or undefined
        if (conversationId === null || conversationId === undefined) {
            throw new Error('Required parameter conversationId was null or undefined when calling conversationsPostActivity.');
        }
        // verify required parameter 'activity' is not null or undefined
        if (activity === null || activity === undefined) {
            throw new Error('Required parameter activity was null or undefined when calling conversationsPostActivity.');
        }
        let localVarUseFormData = false;
        let localVarRequestOptions = {
            method: 'POST',
            qs: localVarQueryParameters,
            headers: localVarHeaderParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
            body: ObjectSerializer.serialize(activity, "Activity")
        };
        this.authentications.default.applyToRequest(localVarRequestOptions);
        if (Object.keys(localVarFormParams).length) {
            if (localVarUseFormData) {
                localVarRequestOptions.formData = localVarFormParams;
            }
            else {
                localVarRequestOptions.form = localVarFormParams;
            }
        }
        return new Promise((resolve, reject) => {
            localVarRequest(localVarRequestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    body = ObjectSerializer.deserialize(body, "ResourceResponse");
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response: response, body: body });
                    }
                    else {
                        reject({ response: response, body: body });
                    }
                }
            });
        });
    }
    /**
     *
     * @summary Get information about an existing conversation
     * @param conversationId
     * @param watermark
     */
    conversationsReconnectToConversation(conversationId, watermark) {
        const localVarPath = this.basePath + '/v3/directline/conversations/{conversationId}'
            .replace('{' + 'conversationId' + '}', encodeURIComponent(String(conversationId)));
        let localVarQueryParameters = {};
        let localVarHeaderParams = Object.assign({}, this.defaultHeaders);
        let localVarFormParams = {};
        // verify required parameter 'conversationId' is not null or undefined
        if (conversationId === null || conversationId === undefined) {
            throw new Error('Required parameter conversationId was null or undefined when calling conversationsReconnectToConversation.');
        }
        if (watermark !== undefined) {
            localVarQueryParameters['watermark'] = ObjectSerializer.serialize(watermark, "string");
        }
        let localVarUseFormData = false;
        let localVarRequestOptions = {
            method: 'GET',
            qs: localVarQueryParameters,
            headers: localVarHeaderParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
        };
        this.authentications.default.applyToRequest(localVarRequestOptions);
        if (Object.keys(localVarFormParams).length) {
            if (localVarUseFormData) {
                localVarRequestOptions.formData = localVarFormParams;
            }
            else {
                localVarRequestOptions.form = localVarFormParams;
            }
        }
        return new Promise((resolve, reject) => {
            localVarRequest(localVarRequestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    body = ObjectSerializer.deserialize(body, "Conversation");
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response: response, body: body });
                    }
                    else {
                        reject({ response: response, body: body });
                    }
                }
            });
        });
    }
    /**
     *
     * @summary Start a new conversation
     */
    conversationsStartConversation() {
        const localVarPath = this.basePath + '/v3/directline/conversations';
        let localVarQueryParameters = {};
        let localVarHeaderParams = Object.assign({}, this.defaultHeaders);
        let localVarFormParams = {};
        let localVarUseFormData = false;
        let localVarRequestOptions = {
            method: 'POST',
            qs: localVarQueryParameters,
            headers: localVarHeaderParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
        };
        this.authentications.default.applyToRequest(localVarRequestOptions);
        if (Object.keys(localVarFormParams).length) {
            if (localVarUseFormData) {
                localVarRequestOptions.formData = localVarFormParams;
            }
            else {
                localVarRequestOptions.form = localVarFormParams;
            }
        }
        return new Promise((resolve, reject) => {
            localVarRequest(localVarRequestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    body = ObjectSerializer.deserialize(body, "Conversation");
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response: response, body: body });
                    }
                    else {
                        reject({ response: response, body: body });
                    }
                }
            });
        });
    }
    /**
     *
     * @summary Upload file(s) and send as attachment(s)
     * @param conversationId
     * @param file
     * @param userId
     */
    conversationsUpload(conversationId, file, userId) {
        const localVarPath = this.basePath + '/v3/directline/conversations/{conversationId}/upload'
            .replace('{' + 'conversationId' + '}', encodeURIComponent(String(conversationId)));
        let localVarQueryParameters = {};
        let localVarHeaderParams = Object.assign({}, this.defaultHeaders);
        let localVarFormParams = {};
        // verify required parameter 'conversationId' is not null or undefined
        if (conversationId === null || conversationId === undefined) {
            throw new Error('Required parameter conversationId was null or undefined when calling conversationsUpload.');
        }
        // verify required parameter 'file' is not null or undefined
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling conversationsUpload.');
        }
        if (userId !== undefined) {
            localVarQueryParameters['userId'] = ObjectSerializer.serialize(userId, "string");
        }
        let localVarUseFormData = false;
        if (file !== undefined) {
            localVarFormParams['file'] = file;
        }
        localVarUseFormData = true;
        let localVarRequestOptions = {
            method: 'POST',
            qs: localVarQueryParameters,
            headers: localVarHeaderParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
        };
        this.authentications.default.applyToRequest(localVarRequestOptions);
        if (Object.keys(localVarFormParams).length) {
            if (localVarUseFormData) {
                localVarRequestOptions.formData = localVarFormParams;
            }
            else {
                localVarRequestOptions.form = localVarFormParams;
            }
        }
        return new Promise((resolve, reject) => {
            localVarRequest(localVarRequestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    body = ObjectSerializer.deserialize(body, "ResourceResponse");
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response: response, body: body });
                    }
                    else {
                        reject({ response: response, body: body });
                    }
                }
            });
        });
    }
}
exports.ConversationsApi = ConversationsApi;
var TokensApiApiKeys;
(function (TokensApiApiKeys) {
})(TokensApiApiKeys = exports.TokensApiApiKeys || (exports.TokensApiApiKeys = {}));
class TokensApi {
    constructor(basePathOrUsername, password, basePath) {
        this._basePath = defaultBasePath;
        this.defaultHeaders = {};
        this._useQuerystring = false;
        this.authentications = {
            'default': new VoidAuth(),
        };
        if (password) {
            if (basePath) {
                this.basePath = basePath;
            }
        }
        else {
            if (basePathOrUsername) {
                this.basePath = basePathOrUsername;
            }
        }
    }
    set useQuerystring(value) {
        this._useQuerystring = value;
    }
    set basePath(basePath) {
        this._basePath = basePath;
    }
    get basePath() {
        return this._basePath;
    }
    setDefaultAuthentication(auth) {
        this.authentications.default = auth;
    }
    setApiKey(key, value) {
        this.authentications[TokensApiApiKeys[key]].apiKey = value;
    }
    /**
     *
     * @summary Generate a token for a new conversation
     * @param tokenParameters
     */
    tokensGenerateTokenForNewConversation(tokenParameters) {
        const localVarPath = this.basePath + '/v3/directline/tokens/generate';
        let localVarQueryParameters = {};
        let localVarHeaderParams = Object.assign({}, this.defaultHeaders);
        let localVarFormParams = {};
        let localVarUseFormData = false;
        let localVarRequestOptions = {
            method: 'POST',
            qs: localVarQueryParameters,
            headers: localVarHeaderParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
            body: ObjectSerializer.serialize(tokenParameters, "TokenParameters")
        };
        this.authentications.default.applyToRequest(localVarRequestOptions);
        if (Object.keys(localVarFormParams).length) {
            if (localVarUseFormData) {
                localVarRequestOptions.formData = localVarFormParams;
            }
            else {
                localVarRequestOptions.form = localVarFormParams;
            }
        }
        return new Promise((resolve, reject) => {
            localVarRequest(localVarRequestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    body = ObjectSerializer.deserialize(body, "Conversation");
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response: response, body: body });
                    }
                    else {
                        reject({ response: response, body: body });
                    }
                }
            });
        });
    }
    /**
     *
     * @summary Refresh a token
     */
    tokensRefreshToken() {
        const localVarPath = this.basePath + '/v3/directline/tokens/refresh';
        let localVarQueryParameters = {};
        let localVarHeaderParams = Object.assign({}, this.defaultHeaders);
        let localVarFormParams = {};
        let localVarUseFormData = false;
        let localVarRequestOptions = {
            method: 'POST',
            qs: localVarQueryParameters,
            headers: localVarHeaderParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
        };
        this.authentications.default.applyToRequest(localVarRequestOptions);
        if (Object.keys(localVarFormParams).length) {
            if (localVarUseFormData) {
                localVarRequestOptions.formData = localVarFormParams;
            }
            else {
                localVarRequestOptions.form = localVarFormParams;
            }
        }
        return new Promise((resolve, reject) => {
            localVarRequest(localVarRequestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    body = ObjectSerializer.deserialize(body, "Conversation");
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response: response, body: body });
                    }
                    else {
                        reject({ response: response, body: body });
                    }
                }
            });
        });
    }
}
exports.TokensApi = TokensApi;
//# sourceMappingURL=DirectLineClientV3.0.js.map