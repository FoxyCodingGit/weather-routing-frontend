# WeatherRoutingFrontEnd
this is a angular framework appliction that is user facing. Below is information that is more technical so is here in the technical documentation rahter than the report.

## Services
Services are injected into components to abstract away data manipulation; it also isolates the code so it is easier to manage. Service injection makes the program more loosly coupled and allows for easier testing.

In the backend there are four services that i have created, each which are designed to consolidate areas of information:
1. Authentification Service
2. Alert Service
3. Routing Service
4. Weather Service

## Authentification Service
This service encapsulates all communication with external sources regarding authentication and the status of the user login. This service can also be accessed to retrieve information on the currently logged in user to be used in other components.

### Cookie
This service assigns the username and token to the browser cookie. This is local storage that persists on page refresh. This is used to keep a user logged in after page refresh or navigation.

### Get Authorised Headers
This grabs the JWT token from the cookies. This then uses this value to create a HttpHeaders object which is used in the routing service to call the backend that requires authorisation (e.g. to get all user favourited routes).

### Login and Register
This handles the communication with the backend to login or register a user if the input values are valid. As the URL is only different between these two methods, I created unrepeating code by reusing the same code and having the difference in the URL be passes as a parameter in the method. A successful request means that this service also creates a cookie that 

### Logout
This removes the cookie information from the local storage. It also broadcasts that the next user is null so the rest of the program can respond correctly to a user being logged out.

## Alert Service
The alert service contains an alertSubject which can be subscribed to. It then has 3 methods for each of the success, warning, or error. These methods apply next to the subject which in turn emit from the observable. What this means is that any component who has this service injected, can not only set alerts to be constructed, but can also listen to alerts being transmitted, the only component  who actually needs this is the alert component who visually creates the alerts based on anything going through the subscription pipeline.

I am really happy with this solution as it is quite simple and provides a lot of flexibility. The sub scriber observer pattern is a really useful one to get right.

## Routing Service
The Routing service manages all the data and communication with the backend relating to routing.

### Route States
This service holds the Id of the route and also all of the routes being displayed. This value is then called by getter methods to get all routes, a route with a certain identifier, etc.

### Get Favourited Routes
This calls the backend using an authenticated request to get the routes back.

### Database Communication
This defines whether routes should be added to the database (favourited) or removed (deleted or unfavourited)

### User Cookie Expiry
There is code in place to make sure that if a user’s cookie has expired. That the user is logged out and the user is warned of this. This is known by receiving the unarthorised error code whilst the user is logged in (this means they hold credentials that are now out of date).

### Creation of Routes
This is the biggest process performed by this service. This service will first create the route and relating information such as elevation and location names.

It will then go on to associate weather information to this route. Before communication with the weather service the route must first place weather markers. This is done by placing weather markers equidistant apart, it is not as simple as assigning to the leg of a route as the distances between legs are vastly different. Weather markers are assigned to legs that are most equally distanced apart. For this we need to know the distance of a route. To generate distance between two latitude and longitude values I needed to use the Haversine Formula. 

### Haversine Formula
This is a formula that when entered two coordinates each with a latitude and longitude value, it will tell you the distance apart. The haversine Formula works on a sphere, we use the radius of the Earth however we all know that Earth is not a sphere but rather a lumpy oblate spheroid. This means that formula will not produce a 100% accurate result. It depends on where you are on Earth and the elevation of the Earth. I have however performed experiments and what I have found is that the minor changes in elevation and the vaired shape of Earth does not alter the result. This is because these small variations are such a relatively small component, so they make no change to the output. A route distance is defined in meters. The result I get back is always very similar to the true value. This means that this formula is sufficient to use in my program as this level of accuracy is required.

![Equidistance Example 1](readmeImages/EquidistantExample1.png)
![Equidistance Example 2](readmeImages/EquidistantExample2.png)
![Equidistance Example 2](readmeImages/EquidistantExample2.png)

I have also  added functionality that if there are less legs than weather points it uses the number of legs.

![Marker Reduced Number Example](readmeImages/markerReducedNum.png)
(This was when 7 weather points where defined).

... rest of route service ...

## Weather Service
This service is what adds weather information to a route and communicates with the backend with weather relating queries.

### Adding Weather to Route
First, we get the minutely data from the backend. This data is assigned to each weather point we previously stated in the routing service.

The second part is that for each departure, we get the rain intensities and probabilities at this time, for each weather point. We then use these values to get the rain intensities and values at the weather point when the user will be at this point. We do this by working out the distance needed to travel and then divide this of the speed of the user. As we get minutely data for each minute up to an hour, we can find the minute where the user will be predicted to be at this point, and then use this value. 

For example, if the person leaves at a departure time of 15 minutes and I have worked out that it will take 4 minutes to get to the first weather point. I look at the rain values for 19 minutes in. 

Finally, the current weather is added to the object finalising the weather information for the route.

(1)

### Rain Descriptor
This is also where I calculate the rained scripter, based on the rain intensity passed in you will be given a descriptor and colour depicting how intense the rain is.

(2)

... rest of weahter service ...




