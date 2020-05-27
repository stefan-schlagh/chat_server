# REST-API

## auth

### POST /login

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

### POST /register

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

### GET /logout

#### params-out
````json
{
  "success": "was logout successful?"
}
````
## group

### GET /all/:uid

returns all groups of a specific user

### GET /public

returns all public groups

### PUT /

a new group will be created 

### GET /:gcid

the info of the groupChat with this id will be returned

### DELETE /:gcid

a group chat will be deleted


## user

### POST /

all users are returned

### POST /noChat

only the users who have no chat with the logged in user will be returned

### GET /self

the userInfo of the logged in user will be returned

### GET /:uid

the info of a specific user is returned