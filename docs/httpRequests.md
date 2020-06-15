# http-requests

## auth

### POST /auth/login

#### params-in
application/json
````json
{
  "username": "",
  "password": ""
}
````

#### params-return
application/json
````json
{
  "success": "was login successful?",
  "username": "error message for the username",
  "password": "error message for password"
}
````

### POST /auth/register

#### params-in
application/json
````json
{
  "username": "",
  "password": ""
}
````

#### params-return
application/json
````json
{
  "success": "was register successful?",
  "password": "error message for password"
}
````

### GET /auth/logout

#### params-out
````json
{
  "success": "was logout successful?"
}
````

## chats

### GET /chats

returns all chats of the requesting user

#### params-out
````json
[
  {
    "type": "type of the chat",
    "id": "id of the chat",
    "chatName": "chat name",
    "members": [
      {
        "uid": "id of the user",
        "username": "username"
      },
      {
        "uid": "id of the user",
        "username": "username"
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

## group

### GET /group/all/:uid

returns all groups of a specific user

#### params-in
````json
{
  
}
````

#### params-out
````json
{
  
}
````

### GET /group/public

returns all public groups

#### params-out
````json
{
  
}
````

### PUT /group/

a new group will be created 

#### params-in
````json
{
  "data": {
    "name": "the name of the chat",
    "description": "the description of the chat",
    "isPublic": "is the chat public?"
  },
  "users": [
    {
      "uid": "the id of the user",
      "username": "the username",
      "isAdmin": "is the user admin in this chat" 
    },
    {
      "uid": "the id of the user",
      "username": "the username",
      "isAdmin": "is the user admin in this chat" 
    }
  ]
}
````

#### params-out
````json
{
  
}
````

### GET /group/:gcid

the info of the groupChat with this id will be returned

#### params-out
````json
{
  
}
````

### DELETE /group/:gcid

a group chat will be deleted

#### params-in
````json
{
  
}
````

#### params-out
````json
{
  
}
````

## message

### GET

### POST /load/message

messages are loaded 

#### params-in
````json
{
    "lastMsgId":"the message id of the last message the client has",
    "num":"how many messages should be loaded",
    "chatType":"the type of the chat where the message should be loaded",
    "chatId":"the id of the chat where the message should be loaded"
}
````
#### params-out
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


### PUT /message

a new message is sent to the server

#### params-in
````json
{
    "msg": "the message"
}
````
#### params-out
````json
{
    "mid": "the id of the new message"
}
````

## user

### POST /user/

all users are returned

#### params-in
````json
{
  "search": "searchValue for users",
  "limit": "how many users should be selected",
  "start": "from what index should be started" 
}
````

#### params-out
````json
[
  {
      "uid": "the id of the user",
      "username": "the username"
  },
  {
      "uid": "the id of the user",
      "username": "the username"
  }
]
````

### POST /user/noChat

only the users who have no chat with the logged in user will be returned

#### params-in
````json
{
  "search": "searchValue for users",
  "limit": "how many users should be selected",
  "start": "from what index should be started" 
}
````

#### params-out
````json
[
  {
      "uid": "the id of the user",
      "username": "the username"
  },
  {
      "uid": "the id of the user",
      "username": "the username"
  }
]
````

### GET /user/self

the userInfo of the logged in user will be returned

#### params-out
````json
{
  "uid": "the id of the user",
  "username": "the username"
}
````

### GET /user/:uid

the info of a specific user is returned

#### params-out
````json
{
  "username": "the username of the requested user",
  "blocked": "is the user blocked?",
  "userExists": "does the requested user exists?"
}
````

### PUT /user/chat

a new normalChat is created

### params-in
````json
{
    "uid": "the id of the user who should be added",
    "username": "the username of the user who should be added",
    "message": "the message that should be added to the chat"
}
````

### params-out
````json
{
    "ncid": "the id of the new chat",
    "mid": "the id of the first message in the chat",
    "online": "is the other user online"
}
````
