# socket-documentation

## server-in

### userInfo

#### auth
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

