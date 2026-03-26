# API documentation

## Requests

### **POST** /api/matchmaker/find-info-from-code

#### **Request**

Body type: JSON

**code** (string): The game code to get info for.

#### **Response**

Body type: JSON

**roomId** (string): The matchmaker room ID for the provided game code. Appears to be a hexadecimal string.
**useRandomNamePicker** (bool): Whether the random name picker should be used.

### **POST** /api/matchmaker/join

#### **Request**

Body type: JSON

**clientType** (string): The name of the client app. For https://gimkit.com/join, this is currently `Gimkit Web Client V3.1`.
**name** (string): The username to join with.
**roomId** (string): The matchmaker room ID.

#### **Response**

Body type: JSON

**source** (string): Purpose unknown. Appears to always be set to `original`, at least on non-2D gamemodes. 
**serverUrl** (string): The base URL for the game server.
**roomId** (string): The ID of the room on the game server. This is *not* the matchmaker room ID.
**intentId**: Purpose unknown. Appears to be a hexadecimal string.

### **POST** /api/users/register/email-info

#### **Request**

Body type: JSON

**email** (string): The email address to get info for.

#### **Response**

Body type: JSON

**accountExists** (bool): Always set to true if the account exists, or false if it doesn't.  
**noPassword** (bool): Unknown, most likely for development purposes.

### **POST** /api/login

#### **Request**

Body type: JSON

**email** (string): The email address to log in with.  
**googleToken** (string): The OAuth2 token, for logging in with a Google account. Always blank if a Gimkit account is used instead of a Google account.  
**password** (string): The plaintext password to log in with.

#### **Response**

Body type: JSON

**informationNeeded** (??? array): Apparently blank?  
**modal** (???): Seems to just be **null**. Maybe it's used for showing announcements?  
**user** (User): The user object.

### **GET** /api/games/summary/me

#### **Response**

Body type: JSON

**games** (Kit array): The kits owned by the current user.
**folders** (??? array): Appears to be unused.

### POST /api/matchmaker/intent/live-game/create

#### **Request**

Body type: JSON

**experienceId** (string): The ID of the gamemode. For classic, this is `618727f95757c900231fb66f`.
**gameId** (string): The ID of the kit to use.
**gameOptions** (depends on the gamemode): The options for the game.
**matchmakerOptions**: The options for the matchmaker.

#### **Response**

Body type: Plaintext

The entire response body is just the intent ID.

## Schemas

### User

**acceptedLatestPolicies** (bool): It is not known what this does, as there doesn't appear to be a modal asking the user to agree to the latest ToS. Seems to always be set to true.  
**accountType** (string): Always set to either `student` or `educator`.  
**areaOfExpertise** (???): Unknown. Probably a string but the only known value is **null**.  
**districtId** (???): Unknown. Probably a string but the only known value is **null**.  
**districtName** (string): The name of the school district. The only known value is **null**.  
**email** (string): The primary email address.  
**firstName** (string): The user's first name.  
**freeTrial** (FreeTrial): Information about the user's Gimkit Pro free trial.  
**gradeLevel** (???): Unknown. Maybe a string but the only known value is **null**.  
**lastName** (string): The user's last name.  
**passwordless** (bool): Used to determine if the account uses a password or not. The purpose is unknown.  
**planStartDate** (number): Unknown, appears to always be 0.  
**schoolID** (???): Unknown. Probably a string but the only known value is **null**.  
**schoolName** (string): The name of the school. The only known value is **null**.  
**seasonTicket** (SeasonTicket): Information about the user's season ticket.  
**token** (string): The user's authentication token.  
**tokenIssued** (number): The unix epoch timestamp (in seconds) for when the authentication token was created.  
**type** (string): The name of the user's plan type. The only known value is `basic.`  
**_id** (string): The internal ID of the user. Appears to be a hexadecimal string.


### FreeTrial

**currentlyOnFreeTrial** (bool): Whether the user's free trial has been activated.  
**extendedFreeTrialCompleted** (bool): Whether the extended free trial has ended.  
**freeTrialCompleted** (bool): Whether the free trial has ended.  
**freeTrialExpiration** (string): The date and time for when the free trial will expire, in RFC3339 format.  
**freeTrialExtended** (bool): Whether the free trial has been extended.

### SeasonTicket

**active** (bool): Whether the season ticket is active.

### Kit

**gif** (string): The image URL. Despite the name, you can also use PNG, JPEG, etc. images.
**isActive** (bool): Unknown, appears to always be `true`.
**source** (string): Unknown, appears to always be `blank`.
**originalSource** (string): The editor it was created in? Appears to always be `v4-editor`.
**privacy** (string): The privacy choice for the kit. Either `public` or `private`.
**isArchived** (bool): Whether the kit has been archived. Appears to always be `false`.
**editCount** (number): The amount of edits made to the kit since it was initially created.
**isCopied** (bool): Whether the kit is a copy of another kit.
**_id** (string): The internal ID of the kit.
**title** (string): The name of the kit.
**creator** (string): The internal ID of the user who created the kit.
**lang** (string): The language of the kit. The only known value is `en`, which is for English.
**subject** (string): The kit subject. When in doubt just set this to `Other`.
**gradeLevel** (string): The grade level of the kit. Set it to null if this doesn't matter.
**createdAt** (string): When the kit was created, in RFC3339 format.
**updatedAt** (string): When the kit was last updated, in RFC3339 format.
**__v** (number): Unknown, appears to always be `0`.

### ClassicOptions

**allowGoogleTranslate** (bool): Used but purpose unknown.
**clapping** (bool): Whether students should be able to press the clap button when the game ends.
**currency** (string): The currency type. For me this is `$`.
**gameGoal** (Goal): The goal of the game.
**language** (string): The language. Just set this to `en` for now.
**modeOptions** (??? object): Unknown, appears to always be `{}`.
**music** (bool): Whether the music should be played.
**startingCash** (number): The initial amount of in-game cash to give to each player.

### Goal

**goal** (string): The goal type, e.g. `time` (in which case the value would be the game duration in minutes)
**value** (number): The goal value.
