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
