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
  "success": "was login successful? | boolean",
  "username": "error message for the username",
  "password": "error message for password",
  "tokens": "jsonwebtoken"
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
  "success": "was register successful? | boolean",
  "username": "error message for the username",
  "password": "error message for password",
  "tokens": "jsonwebtoken"
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
      "type": "the type of the message",
      "content": "see content"
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
[content](#message-content)

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
  "type": "type of the chat",
  "id": "id of the chat",
  "chatName": "chatName",
  "description": "description",
  "public": "is the chat public?",
  "memberSelf": {
      "isAdmin": "is the requesting member admin?"
  },
  "members": [
    {
      "uid": "uid of the member",
      "username": "username of the member",
      "isAdmin": "is the member admin in this chat?",
      "gcmid": "groupchatmemberId"
    },
    {
    }
  ] 
}
````

### DELETE /group/:gcid

a group chat will be deleted
not yet implemented

### PUT /group/:gcid/member/:uid

a new member gets added to the group
requesting user has to be admin

### PUT /group/:gcid/members

new members are added to the group
requesting user has to be admin

#### params-in
````json
{
  "users": [
    {
      "uid": "the id of the user",
      "username": "the username"
    },
    {
      "uid": "the id of the user",
      "username": "the username"
    }
  ]
}
````

### DELETE /group/:gcid/member/:uid

member is removed from the chat
requesting user has to be admin

### POST /group/:gcid/member/:uid/giveAdmin

admin status is added to the member
requesting user has to be admin

### POST /group/:gcid/member/:uid/removeAdmin

admin status is removed from member
requesting user has to be admin

### POST /group/:gcid/join

only for public chats, chat is joined

### joinwithlink

not yet implemented

### POST /group/:gcid/leave

member leaves chat

### POST /group/:gcid/removeAdmin

the requesting user takes the admin rights away himself
requesting user has to be admin

## message

### GET

### POST /message/load

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
  "status": "status",
  "messages": [
    {
      "uid": "the uid from the author",
      "mid": "the message id",
      "date": "the date when the message was written",
      "content": "see content"
    },
    {
      "uid": "the uid from the author",
      "mid": "the message id",
      "date": "the date when the message was written",
      "content": "see content"
    }
  ]
}
````
[content](#message-content)

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
    "type": "the type of the message",
    "content": "see content"
}
````
[content](#message-content)

#### params-out
````json
{
    "mid": "the id of the new message"
}
````

## passwordReset
````java
//TODO
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

### POST /user/notInGroup/:gcid

all users who are not in the specified group are returned

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
  "uidSelf": "uid of the user who did the request",
  "username": "the username of the requested user",
  "blocked": "is the user blocked?",
  "userExists": "does the requested user exists?"
}
````

### PUT /user/chat

a new normalChat is created

#### params-in
````json
{
    "uid": "the id of the user who should be added",
    "username": "the username of the user who should be added",
    "message": {
        "type": "the type of the message",
        "content": "see content"
    }
}
````
[content](#message-content)

#### params-out
````json
{
    "ncid": "the id of the new chat",
    "mid": "the id of the first message in the chat"
}
````

#### message content

if normalMessage:
````json
{
    "text": "the text of the message",
    "mentions": [
        {
            "uid":"the uid of the mentioned user", 
            "textColumn": "the column in the text where the user is mentioned"
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

### POST /user/setEmail

the email is set and a email for verification is sent to the new email

#### params-in
````json
{
    "email": "the new email address"
}
````

### POST /user/verifyEmail

path to verify a new email

#### params-in
#### params-in
````json
{
    "code": "the verification code got by email"
}
````
