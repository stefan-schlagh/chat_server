# socket-documentation

## server-in

### userInfo

#### info
Gets emitted by the client after the connection is established. 
When it is called, this user gets initialized.
The user object will then be stored in the connection callback on the server

When all chats and the first messages are loaded, these get emitted to the client. [see all chats](#all-chats)

#### parameters
````json
{
    "uid": "the id of the user",
    "username": "the name of the user"
}
````

### change chat

#### info
This event occurs when the user changes the chat. The currentChat attribute in the user object gets changed, 
which is important when it comes to messages

#### parameters
````json
{
    "type": "type of the chat",
    "id": "id of the chat"
}
````

### chat message

#### info
This event occurs when the user sends a new message. 
The message is saved in the database and sent via the socket to all users of the current chat who are online.

#### parameters
````javascript
message = "the received message";
callback = "see callback"
````

#### callback
Immediately after the message is saved in the database, the messageId of it is requested. 
This information is then transmitted to the client by the callback


### join chat

#### info
not yet implemented

#### parameters
````
not yet implemented
````


### leave chat

#### info
not yet implemented
#### parameters
````
not yet implemented
````

### load messages

#### info
This event gets emitted by the client when messages should be loaded. When the messages are loaded,
they get emitted back to the server. [see messages](#messages)

#### parameters
````json
{
    "lastMsgId":"the message id of the last message the client has",
    "num":"how many messages should be loaded",
    "chatType":"the type of the chat where the message should be loaded",
    "chatId":"the id of the chat where the message should be loaded"
}
````

### started typing

#### info
Gets emitted when the user starts typing. This information is then emitted to all online members in the 
current chat of the user. [see started typing](#started-typing_c)

#### parameters
````
none
````


### stopped typing

#### info
Gets emitted when the user stops typing. This information is then emitted to all online members in the 
current chat of the user. [see stopped typing](#stopped-typing_c)

#### parameters
````
none
````

### getUsers-noChat

#### info 
Users, who have no chat with the requesting user get sent back

####parameters
````json
{
    "search": "the specified search",
    "limit": "how many users should be selected"
}
````

### disconnect

#### info
Gets emitted when the client is disconnected. The information of the user gets saved in the database and deleted.


## client-in

### all Chats

#### info
Gets emitted by the server, when all chats and first messages are loaded. This info is then used to initialize the UI.

#### parameters
````json
[
  {
    "type": "type of the chat",
    "id": "id of the chat",
    "chatName": "chat name",
    "members": [
      {
        "uid": "id of the user",
        "username": "username",
        "isOnline": "is the user online"
      },
      {
        "uid": "id of the user",
        "username": "username",
        "isOnline": "is the user online"
      }
    ],
    "firstMessage": {
      "uid": "the uid from the author",
      "mid": "the message id",
      "date": "the date when the message was written",
      "content": "the content of the message"
    }      
  },
  {
    "type": "type of the chat",
    "id": "id of the chat",
    "chatName": "chat name",
    "members": [],
    "firstMessage": {}
  } 
]
````

### messages

#### info
Gets emitted by the server when the requested messages are loaded.

#### parameters
````json
{
  "chatType": "type of the chat",
  "chatId": "id of the chat",
  "status": "status",
  "messages": [
    {
      "uid": "the uid from the author",
      "mid": "the message id",
      "date": "the date when the message was written",
      "content": "the content of the message"
    },
    {
      "uid": "the uid from the author",
      "mid": "the message id",
      "date": "the date when the message was written",
      "content": "the content of the message"
    }
  ]
}
````

##### status
* success
⋅⋅* Everything ok 
* reached top
⋅⋅* the number requested could not be delivered, because the client has already all messages
* error
⋅⋅* an error occurred

### chat message

#### info
When a message got sent by another user.

#### parameters
````json
{
  "type": "type of the chat",
  "id": "id of the chat",
  "uid":"id of the user"
}
````

### started typing_c

#### info
gets emitted by the server when a member of a chat starts typing.

#### parameters
````json
{
    "type": "type of the chat",
    "id": "id of the chat",
    "uid":"id of the user"
}
````

### stopped typing_c

#### info
gets emitted by the server when a member of a chat stops typing.

#### parameters
````json
{
    "type": "type of the chat",
    "id": "id of the chat",
    "uid":"id of the user",
    "mid": "the message id",
    "content": "the content of the message"
}
````

### users noChat

#### info
the users with no chat get returned. response to [getUsers-noChat](#getusers-nochat)

#### parameters
````json

````

### disconnect

#### info
Gets emitted if the socket disconnects. An alert to reload the page is shown

