# socket-documentation

## server-in

### userInfo

#### auth
Gets emitted by the client after the connection is established. 
When it is called, this user gets initialized.
The user object will then be stored in the connection callback on the server

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

### disconnect

#### info
Gets emitted when the client is disconnected. The information of the user gets saved in the database and deleted.


## client-in

### chat message

#### info
When a message got sent by another user.

#### parameters
````json
{
  "chat": {
     "type": "type of the chat",
     "id": "id of the chat"
  },
  "uid":"id of the user",
  "mid": "the id of the message",
  "type": "the type of the chat",
  "content": "see content"
}
````
[content](#message-content)

### started typing_c

#### info
gets emitted by the server when a member of a chat starts typing.

#### parameters
````json
{
    "chat": {
         "type": "type of the chat",
         "id": "id of the chat"
    },
    "uid":"id of the user"
}
````

### stopped typing_c

#### info
gets emitted by the server when a member of a chat stops typing.

#### parameters
````json
{
    "chat": {
         "type": "type of the chat",
         "id": "id of the chat",
    },
    "uid":"id of the user"
}
````

### new chat

#### info
gets emitted by the server if the user gets added to a new chat

#### parameters
````json
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
}
````

### disconnect

#### info
Gets emitted if the socket disconnects. An alert to reload the page is shown

### message content

if normalMessage:
````json
{
    "text": "the text of the message",
    "mentions": [
        {
            "uid":"the uid of the mentioned user", 
            "textColumn": "hte column in the text where the user is mentioned"
        }
    ],
    "media": []
}
````

if statusMessage:
````json
{
    "type": "the type of the statusMessage",
    "passiveUsers": ["the uids of the passive users mentioned in this statusMessage"]
}
````