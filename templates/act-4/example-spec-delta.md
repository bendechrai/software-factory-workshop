# Spec Delta

## Purpose

Lets a short link carry an optional expiry date, after which visitors are told the link has expired instead of being redirected.

## ADDED Requirements

### Requirement: A link can be created with an optional expiry
When creating a link the user MAY give an expiry as a whole number of days from now, from 1 to 365. The system SHALL store the expiry as a point in time that many days after creation. A link created with no expiry SHALL have no expiry and SHALL never expire.

#### Scenario: Expiry given in days
- **WHEN** a link is created with an expiry of 30 days
- **THEN** the link is created and its expiry is 30 days after the moment of creation

#### Scenario: No expiry given
- **WHEN** a link is created with the expiry left blank or omitted
- **THEN** the link is created with no expiry

#### Scenario: Expiry out of range
- **WHEN** a link is created with an expiry of 0 days, 366 days, a fraction or text that is not a number
- **THEN** the system rejects the request with an error that says the expiry must be a whole number of days from 1 to 365, and no link is created

### Requirement: Visiting an expired link returns 410 Gone
When the expiry of a link has passed, a visit to its short URL SHALL return status 410 Gone with a plain page that says the link has expired. The visit SHALL NOT be counted as a click. Before the expiry passes, and for a link with no expiry, the visit SHALL redirect as it does today and SHALL count the click.

#### Scenario: Visit after expiry
- **WHEN** a visitor opens a short link whose expiry has passed
- **THEN** the response is 410 Gone, the page says the link has expired, and the click count does not change

#### Scenario: Visit before expiry
- **WHEN** a visitor opens a short link whose expiry has not yet passed
- **THEN** the visitor is redirected to the destination and the click count goes up by one

#### Scenario: Visit a link with no expiry
- **WHEN** a visitor opens a short link that was created without an expiry
- **THEN** the visitor is redirected to the destination and the click count goes up by one

### Requirement: The home page shows expired links as expired
The home page SHALL show an expired link greyed out, with the word Expired in place of its click count. A link that has not expired SHALL show its click count as it does today. An expired link SHALL still be deletable from the home page.

#### Scenario: Expired link in the table
- **WHEN** the home page lists a link whose expiry has passed
- **THEN** that row is greyed out and its clicks cell reads Expired

#### Scenario: Live link in the table
- **WHEN** the home page lists a link whose expiry has not passed or that has no expiry
- **THEN** that row looks as it does today and its clicks cell shows the click count

#### Scenario: Delete an expired link
- **WHEN** the user deletes an expired link from the home page and confirms
- **THEN** the link is removed from the table

### Requirement: The links API reports expiry
Every link the API returns SHALL carry its expiry time, or null when it has none, and a flag that says whether the link has expired at the time of the request.

#### Scenario: List includes expiry state
- **WHEN** a client fetches the list of links
- **THEN** each link carries `expiresAt` (a timestamp or null) and `expired` (true or false)

#### Scenario: Created link reports its expiry
- **WHEN** a client creates a link with an expiry of 7 days
- **THEN** the response carries `expiresAt` 7 days after creation and `expired` false
