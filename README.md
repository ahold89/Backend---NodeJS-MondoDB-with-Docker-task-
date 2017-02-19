#Readme


##Requirements

**No-Docker**: MongoDB v3.4.2, NodeJS v6.2.2. MongoDB server must be running in order to run Server.js. Make sure you've got npm installed all requirements/dependencies from 'package.json' and those on top of the 'Server.js' file.

**Docker**: Docker Version 1.13.1


##Instructions

**Without Docker**: Go to terminal and type in a new tab: 'mongod'.
Open a new tab, change directory to project's root directory and type: 'node Server.js'. If you encounter problems, make sure that mongoDB ip is set to 'localhost' in 'Server.js' file.

**With Docker**: Go to terminal, in a new tab, change to project's root directory, and type: 'docker-compose -p asher up', this will run both docker-containers (mongoDB, nodejs), will be running - in order to check this, under a new tab, type: 'docker ps', this will display the containers running and their info.
If you encounter problems, make sure that mongoDB ip in 'Server.js' file is set to 'DB_1_PORT_27017_TCP_ADDR' (can be found when running 'docker exec {asher_web_1 container id} env')



###REST APIs

Body schema for creating/updating costumer:

```json
{"id": "[A number string with length 1-9]",
 "name":"[First char is a letter, the rest are either letters or space chars (up to 30 chars)]",
 "email": "ahold89@gmail.com",
 "address": "Propes 3 ramatgan",
 "credit_card_tokens":["An array"]
}
```
In order to fetch costumer by ID: 'GET /costumers?id={id number}'.

In order to delete costumer by ID: 'DELETE /costumers?id={id number}'.

In order to create costumer: 'POST /costumers'.

In order to update costumer: 'PATCH /costumers'.
