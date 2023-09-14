# Vector
Vector is an online payment system designed with the aim of surpassing the security limitations of current payment circuits that involve the use of physical credit or debit cards.

## Index
- [Concept](#concept)
- [Project Purpose](#project-purpose)
- [Project Design](#project-design)
  - [UML Diagrams](#uml-diagrams)
  - [Patterns](#patterns)
- [Project Setup with Docker](#project-setup-with-docker)
- [Testing with Postman](#testing-with-postman)
- [API Documentation](#api-documentation)

## Concept
Physical credit (or debit) cards were introduced long before the widespread use of smartphones, making them a valuable tool for digital payments in the past, despite significant security limitations. Nowadays, physical cards are still widely used, but the current state of technology, especially considering that almost everyone carries a smartphone in their pocket, doesn't justify their continued use. The same level of payment efficiency can be achieved through alternative means, eliminating the security risks associated with physical cards.

Instances of physical card cloning are unfortunately quite common. Data theft can occur both at tampered physical payment terminals and on untrustworthy or phishing websites. Regrettably, the phishing problem can only be addressed by relying on digital literacy of users, who must differentiate between malicious and genuine sites. Banks are increasingly investing in digital literacy and systems to keep users away from these malicious sites. However, aside from the phishing issue, which Vector doesn't specifically address, data theft through tampered physical payment terminals or untrustworthy online forms can be easily mitigated by changing the payment dynamics, which physical cards inherently involve for their operation. This will become clearer shortly.

Consider what happens when making a cash payment in a store: the seller informs us of the total amount due for the purchase, and then it is up to us to take money from our wallet, pay the seller, and hand over the money (neglecting any potential change). This is undoubtedly the most natural payment process. However, this is not the case with physical cards. When we swipe our card at a payment terminal or enter our card details online, we are essentially handing over our entire wallet to the payment recipient, trusting their honesty to take only the amount they are owed and not store our data for future theft. Analyzing the dynamics of this payment method reveals its inherent unnaturalness. This stems from the use of physical cards themselves, as they are inanimate objects that can only emit the same set of information over time and cannot "reach into a wallet, take the money owed to the seller, and hand it over" but only provide full access to our wallet.

Therefore, the natural payment dynamics require a digital device, such as our computers or, better yet, smartphones, which we always carry with us when we are out and need to make payments. In fact, recently, carrying a physical card has become inconvenient, and people prefer to use its digital version through applications, using NFC. While this doesn't solve the fundamental issue of physical cards described earlier, it adds an additional advantage to a cardless system like Vector. A similar payment method is employed in bank transfers, where each user has an account, and sensitive information is never shared but payments are initiated to recipients. However, this system is not used for small daily payments because it has long processing times, which are incompatible with the requirements of a payment circuit for such transactions. Furthermore, the amount initiated is determined by the sender of the transaction, potentially leading to errors, while the recipient, who usually knows the exact payment amount, is the one who typically provides the product or service for sale.

Vector offers the possibility to create an account easily and quickly. Note that the account creation process is simplified here, similar to registering on any website with an email and password, even without an email confirmation system. In a real-world application, the account creation process should be managed by the responsible bank for the circuit. Users can create transactions when they need to receive money for any sale or service, specifying the amount and purpose of the transaction. Subsequently, a simple transaction identification code is communicated to the payer, for example, via NFC or another method. This allows the payer to review the transaction details and decide whether to confirm the payment. Confirmation is done through digital signatures, and no sensitive data leaves the user's device. This restores the natural and secure payment dynamics described earlier. Additionally, functionalities are provided for transaction control and taxation by a privileged user, defined as an Authority, and the possibility of refunding money from a received transaction, which is a typical situation in product returns.

## Project Purpose
The purpose of Vector is to provide an efficient and scalable service for use as a foundation to build an actual online payment circuit by a bank. The project consists of a Node.js backend web server connected to a PostgreSQL database, both containerized using Docker.

## Project Design

### UML Diagrams
UML diagrams used for project design.

#### Use-cases Diagrams

In the use-cases diagrams are represent the ways in which users at various levels can access the application's resources.
![Use-cases Diagram Users](./figures/use_cases_users.png)

![Use-cases Diagram Transactions](./figures/use_cases_transactions.png)

#### Sequence Diagrams
In the sequence diagrams can be observed which layers of the application are used in series and which in parallel during the calls. These diagrams were made for the application's two most important calls: creating and paying a transaction:

![Sequence Diagram Create Transaction](./figures/sequence_create_transaction.png)

![Sequence Diagram Pay Transaction](./figures/sequence_pay_transaction.png)

**Classes Diagram**
![Classes Diagram](./figures/classes_diagram.png)

### Patterns
Programming patterns used in this project:
- MVVM (Model-View-ViewModel)
- DAO (Data Access Object)
- Singleton
- COR (Chain Of Responsibility)

#### MVVM (Model-View-ViewModel)
This is the architectural pattern used for the project. It allows to separate presentation logic from data. The controller, acting as the ViewModel, processes requests, interacts with data models, and prepares data for responses. Thanks to the separation that this pattern offers, the project is more flexible in making changes to the data persistence methods and the presentation.

#### DAO (Data Access Object)
DAO (Data Access Object) pattern is implemented with Sequelize and Postgres. It simplifies database communication and CRUD operations, defines data models and offers many utilities regarding data validation and associations between database resources.

#### Singleton
This pattern has been used for the controllers, which are used during calls for interacting with the models (MVVM pattern) and by the various middlewares for authentication and checkings. This ensures that there is only one instance for each controller, despite their use occurrs from various points in the application.

#### COR (Chain Of Responsibility)
This behavioral pattern is implemented using middlewares, that ensure authentication, privileges checking and ownership checking, following a sequential logic. Their use is essential to achieve a scalable and secure system for all calls. For example, the middleware used for privilege checking allows to easily provide a list of which levels of users can perform a specific request.

## Project Setup with Docker
The project is easily executable using the docker-compose orchestrator:

1. Install docker and docker-compose

2. Clone this repository

3. Open terminal and navigate to the directory where you cloned the repository

4. Start all services using the command:
    ```bash
    docker-compose up --build
    ```
    For starts after the first, you can omit the --build flag, as the container image is already created in your machine.

5. If everything went right, Vector should be up and running. You can start making calls at the address: `http://localhost:3000`

6. [Optional] Seed the database with example data for Users and Transactions by entering the _web_ container in interactive mode using:

    ```bash
    docker exec -it web bash
    ```
    and then seeding the database with custom npm command:
    ```bash
    npm run seed
    ```

## Testing with Postman
In the repository there is also a Postman collection that can be imported which will give you a list of calls useful for testing all the features of Vector:

1. Install Postman in your system (https://www.postman.com/downloads/)

2. Open Postman and click _Import_

3. Search for _Vector.postman_collection.json_ file, located in the _postman_ folder of the cloned repository

The same calls can be made using other programs, such as _curl_ directly from the terminal, but it is certainly less comfortable than using Postman.

Furthermore, importing the collection on Postman you will also have the Vector Environment, where there are the fields to insert the access tokens of the example users created in the database seeding. It is recommended to log in with all test users (the password is the same), register the token in the environment for every user and start making test calls.

## API Documentation

### Root

**Login**
Log in the user.

Route:
```bash
POST /login
```

Authorization: None

Body: 
```json
{
    "username": "test_user",
    "password": "Test$password123",
}
```

Response: 
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIzOTA0ODQ2OS0xMDMyLTQxZDAtOTlhNS0xOTJlZjE0NjRjNTQiLCJpYXQiOjE2OTQxODUxMjksImV4cCI6MTY5NDI3MTUyOX0.4D4LudLnzMpG-F_WXuKdFI1mkTdt_iJeujWYxC3Hsk8"
}
```

**Get balance** (User)
Get the balance of the logged in user.

Route: 
```bash
GET /balance
```

Authorization: Bearer {token}

Response: 
```json
{
    "balance": 100.00
}
```

**Get balance of a specific user** (Autority, Admin)
Get the balance of a specific user.

Route: 
```bash
GET /balance/{userId}
```

Authorization: Bearer {token}

Response: 
```json
{
    "balance": 100.00
}
```

**Set balance of a specific user** (Admin)
Set the balance of a specific user.

Route: 
```bash
PUT /balance/{userId}
```

Authorization: Bearer {token}

Body: 
```json
{
    "amount": 300.00
}
```

Response: 
```json
{
    "username": "test_user",
    "balance": 300.00
}
```

**Increment balance of a specific user** (Admin)
Increment the balance of a specific user by a certain amount.

Route: 
```bash
PUT /balance/deposit/{userId}
```

Authorization: Bearer {token}

Body: 
```json
{
    "amount": 300.00
}
```

Response: 
```json
{
    "username": "test_user",
    "balance": 400.00
}
```

**Decrement balance of a specific user** (Admin)
Decrement the balance of a specific user by a certain amount.

Route: 
```bash
PUT /balance/withdraw/{userId}
```

Authorization: Bearer {token}

Body: 
```json
{
    "amount": 100.00
}
```

Response: 
```json
{
    "username": "test_user",
    "balance": 300.00
}
```

### Users

**Get user**
Get information of the logged in user.

Route:
```bash
GET /users/
```

Authorization: Bearer {token}

Response:
```json
{
    "username": "test_user",
    "email": "test_user@testmail.com",
    "level": "User"
}
```

**Get a specific user** (Autority, Admin)
Get information of a specific user by username. It also returns user UUID, useful for other privileged operations requiring it.

Route:
```bash
GET /users/{username}
```

Authorization: Bearer {token}

Response:
```json
{
    "username": "test_user",
    "email": "test_user@testmail.com",
    "level": "User",
	"id": "39048469-1032-41d0-99a5-192ef1464c54"
}
```

**Create user**
Create a new user.

Route: 
```bash
POST /users/
```

Authorization: None

Body: 
```json
{
    "username": "test_user",
    "email": "test_user@testmail.com",
    "password": "Test$password123"
}
```

Response: 
```json
{
    "username": "test_user",
    "email": "test_user@testmail.com",
    "level": "User"
}
```

**Create autority** (Admin)
Create a new autority.

Route: 
```bash
POST /users/
```

Authorization: Bearer {token}

Body: 
```json
{
    "username": "test_autority",
    "email": "test_autority@testmail.com",
    "password": "Test$password123"
}
```

Response: 
```json
{
    "username": "test_autority",
    "email": "test_autority@testmail.com",
    "level": "Autority"
}
```

**Update user**
Update information of the logged in user.

Route: 
```bash
PUT /users/
```

Authorization: Bearer {token}

Body: 
```json
{
    "username": "test_user_upd",
    "email": "test_user_upd@testmail.com"
}
```

Response: 
```json
{
    "username": "test_user_upd",
    "email": "test_user_upd@testmail.com",
    "level": "User"
}
```

**Update a specific user** (Admin)
Update information of a specific user.

Route: 
```bash
PUT /users/{userId}
```

Authorization: Bearer {token}

Body: 
```json
{
    "username": "test_user_upd",
    "email": "test_user_upd@testmail.com"
}
```

Response: 
```json
{
    "username": "test_user_upd",
    "email": "test_user_upd@testmail.com",
    "level": "User"
}
```

**Delete user**
Soft-delete the logged in user.

Route:
```bash
DELETE /users/
```

Authorization: Bearer {token}

Response: 
```json
{
    "username": "test_user",
    "email": "test_user@testmail.com",
    "level": "User"
}
```

**Delete a specific user** (Admin)
Soft-delete a specific user.

Route:
```bash
DELETE /users/{userId}
```

Authorization: Bearer {token}

Response: 
```json
{
    "username": "test_user",
    "email": "test_user@testmail.com",
    "level": "User"
}
```

### Transactions

**Get transaction**
Get a specific transaction, in the case of user only its own.

Route:
```bash
GET /transactions/{transactionId}
```

Authorization: Bearer {token}

Response:
```json
{
    "id": "3a8084d8-1777-413e-9c92-793d3db896ef",
    "createdBy": "test_user",
    "amount": 100.00,
    "reason": "Test transaction",
    "createdAt": "Sun Jan 01 2023 10:20:30 GMT+0000 (Coordinated Universal Time)"
}
```

**Get transactions history**
Get the transaction history of the logged in user, including soft-deleted ones.

Route:
```bash
GET /transactions/{timestampFrom}-{timestampTo}
```

Authorization: Bearer {token}

Response:
```json
[
    {
        "id": "3a8084d8-1777-413e-9c92-793d3db896ef",
        "createdBy": "test_user",
        "amount": 100.00,
        "reason": "Test transaction",
        "createdAt": "Sun Jan 01 2023 10:20:30 GMT+0000 (Coordinated Universal Time)"
    },
    {
        "id": "0a7b2924-3737-48f7-94d6-209a995ebc7e",
        "createdBy": "test_user",
        "amount": 200.00,
        "reason": "Test transaction 2",
        "createdAt": "Sun Jan 01 2023 10:21:30 GMT+0000 (Coordinated Universal Time)"
    }
]
```

**Get transactions history of a specific user** (Autority, Admin)
Get the transaction history of a specific user, including soft-deleted ones.

Route:
```bash
GET /transactions/{timestampFrom}-{timestampTo}/{userId}
```

Authorization: Bearer {token}

Response:
```json
[
    {
        "id": "3a8084d8-1777-413e-9c92-793d3db896ef",
        "createdBy": "test_user",
        "amount": 100.00,
        "reason": "Test transaction",
        "createdAt": "Sun Jan 01 2023 10:20:30 GMT+0000 (Coordinated Universal Time)"
    },
    {
        "id": "0a7b2924-3737-48f7-94d6-209a995ebc7e",
        "createdBy": "test_user",
        "amount": 200.00,
        "reason": "Test transaction 2",
        "createdAt": "Sun Jan 01 2023 10:21:30 GMT+0000 (Coordinated Universal Time)"
    }
]
```

**Create transaction**
Create a new transaction, specifying amount and reason.

Route:
```bash
POST /transactions/
```

Authorization: Bearer {token}

Body: 
```json
{
    "amount": 100.00,
    "reason": "Test transaction"
}
```

Response:
```json
{
    "id": "3a8084d8-1777-413e-9c92-793d3db896ef",
    "createdBy": "test_user",
    "amount": 100.00,
    "reason": "Test transaction",
    "createdAt": "Sun Jan 01 2023 10:20:30 GMT+0000 (Coordinated Universal Time)"
}
```

### Events

**Get events by transaction**
Get all the events relating to a specific transaction, in the case of user only its own.

Route:
```bash
GET /events/{transactionId}
```

Authorization: Bearer {token}

Response:
```json
[
    {
    "id": 1,
    "code": "Paid",
    "transactionId": "3a8084d8-1777-413e-9c92-793d3db896ef",
    "user": "test_user2",
    "date": "Sun Jan 01 2023 12:20:30 GMT+0000 (Coordinated Universal Time)"
    },
    {
        "id": 2,
        "code": "Taxed",
        "transactionId": "3a8084d8-1777-413e-9c92-793d3db896ef",
        "user": "test_autority",
        "date": "Sun Jan 01 2023 12:30:30 GMT+0000 (Coordinated Universal Time)"
    },
    {
        "id": 3,
        "code": "Returned",
        "transactionId": "3a8084d8-1777-413e-9c92-793d3db896ef",
        "user": "test_user",
        "date": "Sun Jan 01 2023 12:40:30 GMT+0000 (Coordinated Universal Time)"
    }
]
```

**Pay transaction** (User)
Pay a transaction (records the event and moves the money).

Route:
```bash
POST /events/pay/{transactionId}
```

Authorization: Bearer {token}

Response:
```json
{
    "id": 1,
    "code": "Paid",
    "transactionId": "3a8084d8-1777-413e-9c92-793d3db896ef",
    "user": "test_user2",
    "date": "Sun Jan 01 2023 12:20:30 GMT+0000 (Coordinated Universal Time)"
}
```

**Tax transaction** (Autority, Admin)
Set a transaction as taxed (no further action is actually performed).

Route:
```bash
POST /events/tax/{transactionId}
```

Authorization: Bearer {token}

Response:
```json
{
    "id": 2,
    "code": "Taxed",
    "transactionId": "3a8084d8-1777-413e-9c92-793d3db896ef",
    "user": "test_autority",
    "date": "Sun Jan 01 2023 12:30:30 GMT+0000 (Coordinated Universal Time)"
}
```

**Return transaction** (User, Admin)
Return the money from an already paid transaction to the sender (records the event and moves the money).

Route:
```bash
POST /events/return/{transactionId}
```

Authorization: Bearer {token}

Response:
```json
{
    "id": 3,
    "code": "Returned",
    "transactionId": "3a8084d8-1777-413e-9c92-793d3db896ef",
    "user": "test_user",
    "date": "Sun Jan 01 2023 12:40:30 GMT+0000 (Coordinated Universal Time)"
}
```

**Delete transaction** (User, Admin)
Soft-delete an unpaid transaction, in the case of user only its own.

Route:
```bash
GET /events/delete/{transactionId}
```

Authorization: Bearer {token}

Response:
```json
{
    "id": 4,
    "code": "Deleted",
    "transactionId": "3a8084d8-1777-413e-9c92-793d3db896ef",
    "user": "test_user",
    "date": "Sun Jan 01 2023 12:50:30 GMT+0000 (Coordinated Universal Time)"
}
```
