# WeatherRoutingFrontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.8.

## Weather API

The first question I wanted to research; was what API I was going to use to get the weather information I needed to make the application. As this was a routing application, this meant that any length of travel could be performed by the user, therefore, a highly detailed forecast for the entire journey would be required. I needed valid weather information for both polarized versions of travels, one being a bicycle journey taking multiple hours and spanning a large distance with the other having accurate and consistent enough weather information for a short walk spanning a small distance.
I have assumed that smaller journeys, either by bike or pedestrian, would be the main use of this application. A larger percentage of the population are going to care less if it rains whilst they are driving as they are protected from the rain, in contrast to when they are cycling or walking as they are unprotected from the rain, causing negative emotions[1].
Rain is a major part in this application as the incentive of avoiding or minimising it would be the main selling point of this product. That is why I had to inform myself on how this information is recovered[2]. This information is provided from the MET office which is the United Kingdom’s national weather service. This page tells me how rain is received. Knowing this information, I looked for how I could acquire this information[3,4].“We are required to provide flood warning and water resource assessment at a much higher resolution than the Met Office rain gauge network is currently capable of. For this purpose we run our own network of automatic rain gauges across England, which are maintained by local Hydrometry teams”.
This tells me that this API provided by the Environment Agency branch of the government is more accurate than the information provided by the MET office. Therefore, I should take this into account when deciding which data provider to go with.
MET office provides a now unsupported API service called “Datapoint”[5]. This API would provide map layers, charts and data. The only services of use would be the 3-hourly and the hourly site-specific forecast. This would also give me the use of a “National and regional text forecast” service. I chose to not use this as I believe that I could generate this myself with more accurate data as this data was set to a large region, which in turn would not provide information precise enough for my application. 
As I saw that this was an unsupported service, I didn’t want to use this in my application. An unsupported service could close at any time and any bugs that appear are extremely unlikely to be solved, the performance of the service would also likely be slow and only get slower as time passes. Because of this, I looked for and found the new service provided by the met office, this was called “Met Office Weather DataHub”[6]. This had the same 3-hourly and hourly service provided by Datapoint.
There was information I was unsure about from the API. Nowhere was it described what the “Significant Weather Code” was, I also wanted to know the service resolution (the size of the area where the same weather information would be returned for different latitude and longitude values). I got the answer back for this[7]. The first part was a link to the page I was currently on, I was able to find the information in the FAQ page mentioned. The second part confirmed that the results were not that accurate as large areas would be covered by the same weather information. During this time, I spent some time experimenting with the hourly spot data[8]. I wanted more precise data than what this service could provide, this is due to the fact that shorter journeys would be covered by the same weather information and also that the information was, most frequently, hourly. Which again, is not useful when performing smaller routes. 
Another API I found was called “Openweathermap”[9].The only service available would be 3-hourly data which is not suitable for this application. I would also have access to “Weather Maps 1.0”[10] which provides maps with visual overlays of different weather information. There is documentation on how to integrate it with Google Maps JavaScript API but all the links point to pages that no longer exist. The maps should be kept in mind if I want to show the weather information more visually to the user.
I continued to search for API alternatives to see if there were any that would provide more accurate data. I then found a weather data provider called “Darksky”[11]. This provides minutely data and data that is more accurate to the latitude and longitude values provided. These two points will make it so the user will have more feedback on a journey they will take, especially if it is a short journey.

## Map GUI
This will be a large part of this project. There are several features I need from a library.
●	I need to project a route on the map.
●	I need to place markers on the map.
●	I need a map to scale in size and converge on a location when needed, this will be used to follow the user on the journey.
●	The map needs to be clickable and have an event system in place to allow me to perform advanced actions. Such as retrieving the latitude and longitude values of where I have clicked on the map.
I started by looking at a map provider called “OpenStreetMap”[12]. This however is too detailed for this routing usage as focuses more on documenting every inch of the planet rather than focusing on a clean routing interface.
I also looked into google maps[13]. This seems to be the best option for me as its very well documented. It covers all the features mentioned above and has good support from the staff but also online. It also has better Angular support. The pricing is $7 per 1000 requests which is something I need to keep in mind. As its JavaScript and I am making an Angular frontend I looked into any services that could help make the API easier to use. I initially found this “Angular Google Maps (AGM)”[14] but was unhappy with the empty “guide” section and bad documentation. This gave the impression that it was a bad library. It was also quite restrictive by forcing the use of specialist components whilst also not covering all the features provided by the JavaScript API. I wanted to stay far away from this library. I would much prefer a typescript conversion of the JavaScript code; this would give me the freedom to use the google maps JavaScript API whilst having code easily isolated into Angular components. @types/googlemaps[15] solves this problem. This is a highly downloaded package that contains type definitions for Google Maps JavaScript API. this allowed me to code in typescript rather than JavaScript which made coding in Angular incredibly easier.

## Routing
As this is an application where the user will follow a route, I need to visually display this.
Google maps provides a direction API[16]. The pricing is $5 per 1000 requests or $10 per 1000 requests if an “advanced” request is called. As my map GUI is also provided by google, this price would also funnel into the price I have to pay to send requests to the Google Maps JavaScript API. This would make it so the $200 I receive “free” from Google would be taken up much quicker. This service could be used, however, to save money, it would be best to use another provider, so the free number of requests are based on two different measurements, therefore giving me more requests to send out before paying.
Google maps provides the ability to draw polylines, with this, as long as I can retrieve latitude and longitude values. I can update the map GUI to display the route. To get these values I can use “TomTom”[17]. For a route this gives me a latitude and longitude coordinate for each “bend” in the road. Meaning when I draw a polyline this will stay on the road. This allows me to have 1000 requests per day for free which I don’t fear hitting. This API also has many request parameters such as mode of transport, locations that need to be visited, traffic, hilliness etc. Although most won’t be used this allows more flexibility, especially the mode of transport parameter. This I because I can choose between pedestrian, bike and car, allowing for more optimal routes to be generated e.g. a bicyclist can through shortcuts that a car can’t.
Originally, I was planning to perform the route generation myself. I quickly realised that this would not be possible. For this to work I would need a map of England and have every intersection mapped and noded to allow for route generation. Whilst I was planning this, I found this research paper to show which algorithm would be best used to generate the route[18]. This based algorithms on a Dijkstra’s rank. This introduced me to “Highway Hierarchies”[19], the hierarchical nature to give fast, largely spanning roads a higher priority to help reduce the number of nodes needing visiting. Bi-directional search[20] meaning to have two searches “simultaneously forward from the source and backwards from the target”. Finally, the last notable part was Heuristics[21] which are rules that help with the computation of the route. This documentation gave a better round understanding of the problems of route creation and brought me to the fact that manually creating the route would be impossible.
At the start of the investigation I looked into GPS spoofing to see how my application could be affected. I found a good journal on this[22]. This mentions how to mock a pseudorandom noise code with other data to identify where a signal was originating from. I also learnt that this code is unencrypted to civilians and quite easy to spoof [23] “These satellites actually broadcast two sets of PRN codes: one for civilians and one for the U.S. military. Civilian PRN codes are unencrypted and published in a public database”. This does not need to be a secure app as nothing serious is happening. No-one would bother spoofing individual people and the only thing that would be affected was the user's location. Something that could be easily spotted if wrong. I won’t be putting extra layers in. I will have my website accessible through https to help with the protection of data[24].

## GDPR (General Data Protection Regulation)

If a new feature is added that saves data, my application could hold personal information, such as frequent locations that someone visits, a user’s home or workplace if special markers are introduced etc. This data needs to be GDPR compliant. Part of this is making sure that any kind of personal data is secured by an adequate level[25]. “The GDPR prohibits the transfer of data to countries that don’t have an adequate level of data protection and establishes a procedure for determining formally if a country provides that level of protection… So while the GDPR applies to controllers of data based in the EU, it also extends to controllers and processors of data not based in the EU that handle data generated as a consequence of providing goods or services to citizens of the EU or as a result of a monitoring and follow-up of their behavior”. This shows that the data I store must be secured to EU standards. This, for example, means that I could not use a US based data storage service as they “do not have what the EU considers to be an adequate level of data protection, nor do they provide the appropriate level of protection of guarantees for international transfers of data from Europe.”
I will not need to perform this, however, as this application is for personal use only. This means I am exempt from following GDPR as stated in Article 2(2c) of the GDPR statement[26]. I will design to hold personal data securely though, to allow myself in the future, if I so chose, to make this a service that people could use. If this happens then GDPR would affect my website, even if it was provided for free.

## Clean Coding

If a new feature is added that saves data, my application could hold personal information, such as frequent locations that someone visits, a user’s home or workplace if special markers are introduced etc. This data needs to be GDPR compliant. Part of this is making sure that any kind of personal data is secured by an adequate level[25]. “The GDPR prohibits the transfer of data to countries that don’t have an adequate level of data protection and establishes a procedure for determining formally if a country provides that level of protection… So while the GDPR applies to controllers of data based in the EU, it also extends to controllers and processors of data not based in the EU that handle data generated as a consequence of providing goods or services to citizens of the EU or as a result of a monitoring and follow-up of their behavior”. This shows that the data I store must be secured to EU standards. This, for example, means that I could not use a US based data storage service as they “do not have what the EU considers to be an adequate level of data protection, nor do they provide the appropriate level of protection of guarantees for international transfers of data from Europe.”
I will not need to perform this, however, as this application is for personal use only. This means I am exempt from following GDPR as stated in Article 2(2c) of the GDPR statement[26]. I will design to hold personal data securely though, to allow myself in the future, if I so chose, to make this a service that people could use. If this happens then GDPR would affect my website, even if it was provided for free.

## Website Usability

The usability of a website is very important. Not only is it important to keep users from being frustrated and leaving the website. But, more importantly, that people with disabilities can also use the website[28]. 

## Graphing

I want to add graphing to my application to show data more visually to the user. I have found a library called “Chart.js”[29] that provides, with many other useful graphs, a multiple data line graph I was hoping for. “ng2-charts”[30] will be used on top of this to allow for easier use of the library in my Angular frontend, compared to having to write JavaScript.

## References

References:
[1] John M. Grohol, Psy.D, Can Weather Affect Your Mood https://psychcentral.com/blog/can-weather-affect-your-mood/
[2] Met Office, How We Measure Rainfall https://www.metoffice.gov.uk/weather/guides/observations/how-we-measure-rainfall
[3] Sam Everitt, Just launched: Near-real-time Rainfall API https://defradigital.blog.gov.uk/2017/02/10/just-launched-near-real-time-rainfall-api/
[4] Environment Agency, Environment Agency Rainfall API https://environment.data.gov.uk/flood-monitoring/doc/rainfall
[5] Met Office, DataPoint Products https://www.metoffice.gov.uk/services/data/datapoint/datapoint-products
[6] Met Office, Met Office Weather DataHub https://metoffice.apiconnect.ibmcloud.com/metoffice/production/
[7] Met Office Developer Support, Significant Weather Code + Data Precision https://metoffice.apiconnect.ibmcloud.com/metoffice/production/node/641
[8] Met Office, Global Hourly Spot Data 1.0.0 https://metoffice.apiconnect.ibmcloud.com/metoffice/production/node/175
[9] OpenWeatherMap, OpenWeatherMap API https://openweathermap.org/api
[10] OpenWeatherMap, Weather Maps 1.0 https://openweathermap.org/api/weathermaps
[11] Dark Sky, Dark Sky API https://darksky.net/dev/docs
[12] OpenStreetMap, OpenStreetMap API https://wiki.openstreetmap.org/wiki/API
[13] Google Maps, Maps JavaScript API https://developers.google.com/maps/documentation/javascript/tutorial
[14] angular-maps, Angular 2+ Google Maps https://angular-maps.com/
[15] npmjs, @types/googlemaps https://www.npmjs.com/package/@types/googlemaps
[16] Google Maps, Directions API https://developers.google.com/maps/documentation/directions/start
[17] TomTom, Routing API https://developer.tomtom.com/content/routing-api-explorer
[18] Peter Sanders and Dominik Schultes, Engineering Fast Route Planning Algorithms p.33 http://algo2.iti.kit.edu/documents/routeplanning/weaOverview.pdf
[19] Peter Sanders and Dominik Schultes, Engineering Fast Route Planning Algorithms p.26 http://algo2.iti.kit.edu/documents/routeplanning/weaOverview.pdf
[20] Peter Sanders and Dominik Schultes, Engineering Fast Route Planning Algorithms p.24 http://algo2.iti.kit.edu/documents/routeplanning/weaOverview.pdf
[21] Peter Sanders and Dominik Schultes, Engineering Fast Route Planning Algorithms p.25 http://algo2.iti.kit.edu/documents/routeplanning/weaOverview.pdf
[22] Mark L. Psiaki and Todd E. Humphreys, Protecting GPS From Spoofers Is Critical to the Future of Navigation https://spectrum.ieee.org/telecom/security/protecting-gps-from-spoofers-is-critical-to-the-future-of-navigation
[23] Mark L. Psiaki and Todd E. Humphreys, Protecting GPS From Spoofers Is Critical to the Future of Navigation para.17 https://spectrum.ieee.org/telecom/security/protecting-gps-from-spoofers-is-critical-to-the-future-of-navigation
[24] Google Support, Secure Your Site With HTTPS https://support.google.com/webmasters/answer/6073543?hl=en
[25] Rosa Maria Garcia Sanz, Your Guide to the GDPR para.5-6 https://spectrum.ieee.org/telecom/internet/your-guide-to-the-gdpr
[26] Intersoft Consulting, Material scope Article 2(2c)  https://gdpr-info.eu/art-2-gdpr/
[27] Robert C. Martin, Clean Code: A Handbook of Agile Software Craftsmanship http://ptgmedia.pearsoncmg.com/images/9780132350884/samplepages/9780132350884.pdf
[28] Jay Dolmage, Disability Studies Pedagogy, Usability and Universal Design http://www.dsq-sds.org/article/view/627/804
[29] Github, Chart.js https://github.com/chartjs/Chart.js
[30] Github, ng-charts https://github.com/valor-software/ng2-charts


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
