# AerisWeather Demo
Demo of the AerisWeather API

## The Mission
- Create the interactive map module that satsifies all functional requirements by the client listed
above.
- Include any nice-to-have features and additions you find relevant or interesting and wish to include.
- Choose any mapping library you wish, but be able to explain why you chose that one over others.
- Present and visualize the data and associated UI in a meaningful, clean and user-friendly way. You
don't have to be a designer, but we expect an effort in making it look good and presentable.
- Use any libraries or tooling you wish as long as you can explain why you chose them. Remember,
you're creating a simple module/library for clients to use and not an application, so be wary of the
final weight of your built files and any dependencies you include.
- Your implementation should be easy to install, run and test locally.

## My Implementation
I decided to approach this problem by creating a Web Component for the map. This is my first attempt at creating a Web Component so I know as a fact that I didn't follow absolute best practices. The reason I decided to use a Web Component was so that it could be easily imported and incorporated into an existing JS app, regardless of the framework. a Web Component is also very lightweight. The shadow dom also ensures little to no collision with existing codebases. 

I also decided to use Leaflet as the mapping framework inside my Web Component because it is a very lightweight mapping library compared to other options like the Esri JS API. We did not need to do any extraordinarily heavy lifting.

## How to install and use
In order to use the web component, take a look at the index.html as a usage example.

All you should have to do is include two script tags:
- Leaflet API: `<script src="https://unpkg.com/leaflet@1.9.2/dist/leaflet.js" integrity="sha256-o9N1jGDZrf5tS+Ft4gbIK7mYMipq9lqpVJ91xHSyKhg=" crossorigin=""></script>`. 
- AerisWeather Map Component: `<script src="aerisweather-map.js"></script>`

And then all you should have to do is create a component with the tag of `aerisweather-map`

The `aerisweather-map` tag has a collection of input parameters:
- client_id: the AerisWeather client ID
- client_secret: The AerisWeather client secret
- p: refer to the supported parameter `p` at https://www.aerisweather.com/support/docs/api/reference/endpoints/stormreports/
- radius: refer to the supported parameter `radius` at https://www.aerisweather.com/support/docs/api/reference/endpoints/stormreports/
- past_hours: must be one of the following options: 6, 12, 24, 48, or 168. If you fail to use one of those options, it will default to 6
- filter: refer to the supported parameter `filter` at https://www.aerisweather.com/support/docs/api/reference/endpoints/stormreports/
- facility_endpoints: a comma separated list of GeoJSON endpoints to use as your facility points
- api_root: The api root to use for your storm reports. The recommended value is `https://api.aerisapi.com/stormreports/within`, but you could use other supported actions at https://www.aerisweather.com/support/docs/api/reference/endpoints/stormreports/

In order to control the marker style of the storm reports and your facilities, you must include 2 child svg elements inside your `aerisweather-map` component. The id for your storm report svg must be `storm-report-svg` and the id for your facility svg must be `facility-svg`. Otherwise, default markers will be used.

You're ready to see your weather reports!
